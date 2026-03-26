from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


class UserBase(BaseModel):
    email: str
    displayName: str
    role: str = "staff"  # admin | manager | staff
    phone: Optional[str] = None
    status: str = "Active"


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    displayName: Optional[str] = None
    role: Optional[str] = None
    phone: Optional[str] = None
    status: Optional[str] = None
    password: Optional[str] = None


class UserInDB(UserBase):
    id: str
    passwordHash: str
    lastLoginAt: Optional[str] = None
    createdAt: str


class UserOut(UserBase):
    id: str
    lastLoginAt: Optional[str] = None
    createdAt: str

    class Config:
        from_attributes = True


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
