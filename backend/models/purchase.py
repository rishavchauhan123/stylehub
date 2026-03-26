from pydantic import BaseModel
from typing import List, Optional


class PurchaseItem(BaseModel):
    productId: str
    productName: Optional[str] = None
    quantity: int
    cost: float


class PurchaseBase(BaseModel):
    supplierName: str
    items: List[PurchaseItem]
    total: float


class PurchaseCreate(PurchaseBase):
    pass


class PurchaseOut(PurchaseBase):
    id: str
    createdAt: str

    class Config:
        from_attributes = True
