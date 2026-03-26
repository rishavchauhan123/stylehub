from pydantic import BaseModel
from typing import Optional


class CustomerBase(BaseModel):
    name: str
    phone: str
    email: Optional[str] = None
    totalSpent: float = 0.0
    lastPurchaseAt: Optional[str] = None


class CustomerCreate(CustomerBase):
    pass


class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    totalSpent: Optional[float] = None
    lastPurchaseAt: Optional[str] = None


class CustomerOut(CustomerBase):
    id: str

    class Config:
        from_attributes = True
