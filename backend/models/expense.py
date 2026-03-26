from pydantic import BaseModel
from typing import Optional


class ExpenseBase(BaseModel):
    category: str
    amount: float
    description: str
    date: str


class ExpenseCreate(ExpenseBase):
    pass


class ExpenseUpdate(BaseModel):
    category: Optional[str] = None
    amount: Optional[float] = None
    description: Optional[str] = None
    date: Optional[str] = None


class ExpenseOut(ExpenseBase):
    id: str

    class Config:
        from_attributes = True
