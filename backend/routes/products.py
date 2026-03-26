from fastapi import APIRouter, HTTPException, Depends
from bson import ObjectId
from datetime import datetime
from database import get_db
from models.product import ProductCreate, ProductUpdate, ProductOut
from middleware.auth import get_current_user
from typing import List

router = APIRouter(prefix="/products", tags=["products"])


def doc_to_out(doc: dict) -> ProductOut:
    return ProductOut(id=str(doc["_id"]), **{k: v for k, v in doc.items() if k != "_id"})


@router.get("", response_model=List[ProductOut])
async def get_products(current_user=Depends(get_current_user)):
    db = get_db()
    products = await db.products.find().to_list(1000)
    return [doc_to_out(p) for p in products]


@router.post("", response_model=ProductOut)
async def create_product(data: ProductCreate, current_user=Depends(get_current_user)):
    db = get_db()
    doc = data.model_dump()
    doc["createdAt"] = datetime.utcnow().isoformat()
    result = await db.products.insert_one(doc)
    doc["_id"] = result.inserted_id
    return doc_to_out(doc)


@router.put("/{product_id}", response_model=ProductOut)
async def update_product(product_id: str, data: ProductUpdate, current_user=Depends(get_current_user)):
    db = get_db()
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    await db.products.update_one({"_id": ObjectId(product_id)}, {"$set": update_data})
    doc = await db.products.find_one({"_id": ObjectId(product_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Product not found")
    return doc_to_out(doc)


@router.delete("/{product_id}")
async def delete_product(product_id: str, current_user=Depends(get_current_user)):
    db = get_db()
    result = await db.products.delete_one({"_id": ObjectId(product_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Deleted successfully"}
