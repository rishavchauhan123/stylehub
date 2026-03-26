from pydantic import BaseModel
from typing import List, Optional


class SaleItem(BaseModel):
    productId: str
    name: str
    quantity: int
    price: float
    cost: float


class SaleBase(BaseModel):
    invoiceNumber: str
    customerId: Optional[str] = None
    customerName: Optional[str] = None
    items: List[SaleItem]
    total: float
    profit: float
    paymentMethod: str  # Cash | Card | UPI


class SaleCreate(SaleBase):
    pass


class SaleOut(SaleBase):
    id: str
    createdAt: str

    class Config:
        from_attributes = True
