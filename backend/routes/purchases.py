from fastapi import APIRouter, HTTPException, Depends
from bson import ObjectId
from datetime import datetime
from database import get_db
from models.purchase import PurchaseCreate, PurchaseOut
from middleware.auth import get_current_user
from typing import List

router = APIRouter(prefix="/purchases", tags=["purchases"])


def doc_to_out(doc: dict) -> PurchaseOut:
    return PurchaseOut(id=str(doc["_id"]), **{k: v for k, v in doc.items() if k != "_id"})


@router.get("", response_model=List[PurchaseOut])
async def get_purchases(current_user=Depends(get_current_user)):
    db = get_db()
    purchases = await db.purchases.find().sort("createdAt", -1).to_list(1000)
    return [doc_to_out(p) for p in purchases]


@router.post("", response_model=PurchaseOut)
async def create_purchase(data: PurchaseCreate, current_user=Depends(get_current_user)):
    db = get_db()
    doc = data.model_dump()
    doc["createdAt"] = datetime.utcnow().isoformat()
    result = await db.purchases.insert_one(doc)
    doc["_id"] = result.inserted_id
    # Update product stock
    for item in data.items:
        await db.products.update_one(
            {"_id": ObjectId(item.productId)},
            {"$inc": {"stock": item.quantity}},
        )
    return doc_to_out(doc)


@router.delete("/{purchase_id}")
async def delete_purchase(purchase_id: str, current_user=Depends(get_current_user)):
    db = get_db()
    result = await db.purchases.delete_one({"_id": ObjectId(purchase_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Purchase not found")
    return {"message": "Deleted successfully"}
