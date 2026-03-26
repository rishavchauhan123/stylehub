from fastapi import APIRouter, HTTPException, Depends
from bson import ObjectId
from datetime import datetime
from database import get_db
from models.sale import SaleCreate, SaleOut
from middleware.auth import get_current_user
from typing import List

router = APIRouter(prefix="/sales", tags=["sales"])


def doc_to_out(doc: dict) -> SaleOut:
    return SaleOut(id=str(doc["_id"]), **{k: v for k, v in doc.items() if k != "_id"})


@router.get("", response_model=List[SaleOut])
async def get_sales(current_user=Depends(get_current_user)):
    db = get_db()
    sales = await db.sales.find().sort("createdAt", -1).to_list(1000)
    return [doc_to_out(s) for s in sales]


@router.post("", response_model=SaleOut)
async def create_sale(data: SaleCreate, current_user=Depends(get_current_user)):
    db = get_db()
    doc = data.model_dump()
    doc["createdAt"] = datetime.utcnow().isoformat()
    result = await db.sales.insert_one(doc)
    doc["_id"] = result.inserted_id
    # Update product stock
    for item in data.items:
        await db.products.update_one(
            {"_id": ObjectId(item.productId)},
            {"$inc": {"stock": -item.quantity}},
        )
    return doc_to_out(doc)


@router.delete("/{sale_id}")
async def delete_sale(sale_id: str, current_user=Depends(get_current_user)):
    db = get_db()
    result = await db.sales.delete_one({"_id": ObjectId(sale_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Sale not found")
    return {"message": "Deleted successfully"}
