from pydantic import BaseModel
from typing import List, Optional


class ProductVariant(BaseModel):
    size: str
    color: str


class ProductBase(BaseModel):
    sku: str
    name: str
    category: str  # Men | Women | Accessories
    costPrice: float
    sellingPrice: float
    stock: int
    lowStockThreshold: int = 10
    variants: List[ProductVariant] = []


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    sku: Optional[str] = None
    name: Optional[str] = None
    category: Optional[str] = None
    costPrice: Optional[float] = None
    sellingPrice: Optional[float] = None
    stock: Optional[int] = None
    lowStockThreshold: Optional[int] = None
    variants: Optional[List[ProductVariant]] = None


class ProductOut(ProductBase):
    id: str
    createdAt: str

    class Config:
        from_attributes = True
