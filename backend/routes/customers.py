from fastapi import APIRouter, HTTPException, Depends
from bson import ObjectId
from database import get_db
from models.customer import CustomerCreate, CustomerUpdate, CustomerOut
from middleware.auth import get_current_user
from typing import List

router = APIRouter(prefix="/customers", tags=["customers"])


def doc_to_out(doc: dict) -> CustomerOut:
    return CustomerOut(id=str(doc["_id"]), **{k: v for k, v in doc.items() if k != "_id"})


@router.get("", response_model=List[CustomerOut])
async def get_customers(current_user=Depends(get_current_user)):
    db = get_db()
    customers = await db.customers.find().to_list(1000)
    return [doc_to_out(c) for c in customers]


@router.post("", response_model=CustomerOut)
async def create_customer(data: CustomerCreate, current_user=Depends(get_current_user)):
    db = get_db()
    doc = data.model_dump()
    result = await db.customers.insert_one(doc)
    doc["_id"] = result.inserted_id
    return doc_to_out(doc)


@router.put("/{customer_id}", response_model=CustomerOut)
async def update_customer(customer_id: str, data: CustomerUpdate, current_user=Depends(get_current_user)):
    db = get_db()
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    await db.customers.update_one({"_id": ObjectId(customer_id)}, {"$set": update_data})
    doc = await db.customers.find_one({"_id": ObjectId(customer_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Customer not found")
    return doc_to_out(doc)


@router.delete("/{customer_id}")
async def delete_customer(customer_id: str, current_user=Depends(get_current_user)):
    db = get_db()
    result = await db.customers.delete_one({"_id": ObjectId(customer_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Customer not found")
    return {"message": "Deleted successfully"}
