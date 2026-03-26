from fastapi import APIRouter, HTTPException, Depends
from bson import ObjectId
from database import get_db
from models.expense import ExpenseCreate, ExpenseUpdate, ExpenseOut
from middleware.auth import get_current_user
from typing import List

router = APIRouter(prefix="/expenses", tags=["expenses"])


def doc_to_out(doc: dict) -> ExpenseOut:
    return ExpenseOut(id=str(doc["_id"]), **{k: v for k, v in doc.items() if k != "_id"})


@router.get("", response_model=List[ExpenseOut])
async def get_expenses(current_user=Depends(get_current_user)):
    db = get_db()
    expenses = await db.expenses.find().sort("date", -1).to_list(1000)
    return [doc_to_out(e) for e in expenses]


@router.post("", response_model=ExpenseOut)
async def create_expense(data: ExpenseCreate, current_user=Depends(get_current_user)):
    db = get_db()
    doc = data.model_dump()
    result = await db.expenses.insert_one(doc)
    doc["_id"] = result.inserted_id
    return doc_to_out(doc)


@router.put("/{expense_id}", response_model=ExpenseOut)
async def update_expense(expense_id: str, data: ExpenseUpdate, current_user=Depends(get_current_user)):
    db = get_db()
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    await db.expenses.update_one({"_id": ObjectId(expense_id)}, {"$set": update_data})
    doc = await db.expenses.find_one({"_id": ObjectId(expense_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Expense not found")
    return doc_to_out(doc)


@router.delete("/{expense_id}")
async def delete_expense(expense_id: str, current_user=Depends(get_current_user)):
    db = get_db()
    result = await db.expenses.delete_one({"_id": ObjectId(expense_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Expense not found")
    return {"message": "Deleted successfully"}
