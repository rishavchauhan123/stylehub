from fastapi import APIRouter, HTTPException, Depends
from bson import ObjectId
import bcrypt
from datetime import datetime
from database import get_db
from models.user import UserCreate, UserUpdate, UserOut
from middleware.auth import get_current_user, require_admin
from typing import List

router = APIRouter(prefix="/users", tags=["users"])


def doc_to_out(doc: dict) -> UserOut:
    return UserOut(
        id=str(doc["_id"]),
        email=doc["email"],
        displayName=doc["displayName"],
        role=doc["role"],
        phone=doc.get("phone"),
        status=doc.get("status", "Active"),
        lastLoginAt=doc.get("lastLoginAt"),
        createdAt=doc["createdAt"],
    )


@router.get("", response_model=List[UserOut])
async def get_users(current_user=Depends(require_admin)):
    db = get_db()
    users = await db.users.find().to_list(1000)
    return [doc_to_out(u) for u in users]


@router.post("", response_model=UserOut)
async def create_user(data: UserCreate, current_user=Depends(require_admin)):
    db = get_db()
    existing = await db.users.find_one({"email": data.email.lower().strip()})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    password_hash = bcrypt.hashpw(data.password.encode(), bcrypt.gensalt()).decode()
    doc = {
        "email": data.email.lower().strip(),
        "displayName": data.displayName,
        "role": data.role,
        "phone": data.phone,
        "status": data.status,
        "passwordHash": password_hash,
        "createdAt": datetime.utcnow().isoformat(),
        "lastLoginAt": None,
    }
    result = await db.users.insert_one(doc)
    doc["_id"] = result.inserted_id
    return doc_to_out(doc)


@router.put("/{user_id}", response_model=UserOut)
async def update_user(user_id: str, data: UserUpdate, current_user=Depends(require_admin)):
    db = get_db()
    update_data = {k: v for k, v in data.model_dump().items() if v is not None and k != "password"}
    if data.password:
        update_data["passwordHash"] = bcrypt.hashpw(data.password.encode(), bcrypt.gensalt()).decode()
    await db.users.update_one({"_id": ObjectId(user_id)}, {"$set": update_data})
    doc = await db.users.find_one({"_id": ObjectId(user_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="User not found")
    return doc_to_out(doc)


@router.delete("/{user_id}")
async def delete_user(user_id: str, current_user=Depends(require_admin)):
    db = get_db()
    result = await db.users.delete_one({"_id": ObjectId(user_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "Deleted successfully"}
