from fastapi import APIRouter, HTTPException, status, Depends
import jwt
import bcrypt
from datetime import datetime, timedelta
from bson import ObjectId
from database import get_db
from models.user import LoginRequest, TokenResponse, UserOut, UserUpdate
from middleware.auth import get_current_user
from dotenv import load_dotenv
import os

load_dotenv()

JWT_SECRET = os.getenv("JWT_SECRET", "fallback-secret")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRE_HOURS = int(os.getenv("JWT_EXPIRE_HOURS", "24"))

router = APIRouter(prefix="/auth", tags=["auth"])


def create_token(user_id: str) -> str:
    expire = datetime.utcnow() + timedelta(hours=JWT_EXPIRE_HOURS)
    payload = {"sub": user_id, "exp": expire}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def user_to_out(user: dict) -> UserOut:
    return UserOut(
        id=str(user["_id"]),
        email=user["email"],
        displayName=user["displayName"],
        role=user["role"],
        phone=user.get("phone"),
        status=user.get("status", "Active"),
        lastLoginAt=user.get("lastLoginAt"),
        createdAt=user["createdAt"],
    )


@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest):
    db = get_db()
    user = await db.users.find_one({"email": data.email.lower().strip()})
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    password_valid = bcrypt.checkpw(data.password.encode(), user["passwordHash"].encode())
    if not password_valid:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    if user.get("status") == "Inactive":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is inactive. Contact admin.")

    # Update last login
    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"lastLoginAt": datetime.utcnow().isoformat(), "status": "Active"}},
    )
    user["lastLoginAt"] = datetime.utcnow().isoformat()

    token = create_token(str(user["_id"]))
    return TokenResponse(access_token=token, user=user_to_out(user))


@router.get("/me", response_model=UserOut)
async def get_me(current_user=Depends(get_current_user)):
    return UserOut(
        id=str(current_user["_id"]),
        email=current_user["email"],
        displayName=current_user["displayName"],
        role=current_user["role"],
        phone=current_user.get("phone"),
        status=current_user.get("status", "Active"),
        lastLoginAt=current_user.get("lastLoginAt"),
        createdAt=current_user["createdAt"],
    )


@router.put("/me", response_model=UserOut)
async def update_me(data: UserUpdate, current_user=Depends(get_current_user)):
    db = get_db()
    update_data = {}
    if data.displayName is not None:
        update_data["displayName"] = data.displayName
    if data.phone is not None:
        update_data["phone"] = data.phone
    if data.password is not None:
        password_hash = bcrypt.hashpw(data.password.encode(), bcrypt.gensalt()).decode()
        update_data["passwordHash"] = password_hash
    if update_data:
        await db.users.update_one({"_id": current_user["_id"]}, {"$set": update_data})
        current_user.update(update_data)
    return user_to_out(current_user)
