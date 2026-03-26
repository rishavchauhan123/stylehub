"""
Seed script — creates default admin and sample data in MongoDB.
Run once: python seed.py
"""
import asyncio
import bcrypt
from datetime import datetime, timedelta
import random
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "stylehub")
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@stylehub.com")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin123")


async def seed():
    client = AsyncIOMotorClient(MONGO_URI)
    db = client[DB_NAME]

    # ── Admin User ────────────────────────────────────────────────────────────
    existing = await db.users.find_one({"email": ADMIN_EMAIL})
    if not existing:
        password_hash = bcrypt.hashpw(ADMIN_PASSWORD.encode(), bcrypt.gensalt()).decode()
        await db.users.insert_one({
            "email": ADMIN_EMAIL,
            "displayName": "Admin",
            "role": "admin",
            "phone": "+91-9876543210",
            "status": "Active",
            "passwordHash": password_hash,
            "createdAt": datetime.utcnow().isoformat(),
            "lastLoginAt": None,
        })
        print(f"✅ Admin user created: {ADMIN_EMAIL} / {ADMIN_PASSWORD}")
    else:
        print(f"ℹ️  Admin user already exists: {ADMIN_EMAIL}")

    # ── Sample Products ───────────────────────────────────────────────────────
    if await db.products.count_documents({}) == 0:
        products = [
            {"sku": "MEN-001", "name": "Classic White Shirt", "category": "Men", "costPrice": 450, "sellingPrice": 999, "stock": 45, "lowStockThreshold": 10, "variants": [{"size": "M", "color": "White"}, {"size": "L", "color": "White"}], "createdAt": datetime.utcnow().isoformat()},
            {"sku": "MEN-002", "name": "Slim Fit Chinos", "category": "Men", "costPrice": 600, "sellingPrice": 1299, "stock": 30, "lowStockThreshold": 8, "variants": [{"size": "32", "color": "Beige"}, {"size": "34", "color": "Navy"}], "createdAt": datetime.utcnow().isoformat()},
            {"sku": "WOM-001", "name": "Floral Summer Dress", "category": "Women", "costPrice": 700, "sellingPrice": 1599, "stock": 25, "lowStockThreshold": 5, "variants": [{"size": "S", "color": "Pink"}, {"size": "M", "color": "Blue"}], "createdAt": datetime.utcnow().isoformat()},
            {"sku": "WOM-002", "name": "High-Waist Jeans", "category": "Women", "costPrice": 800, "sellingPrice": 1799, "stock": 8, "lowStockThreshold": 10, "variants": [{"size": "28", "color": "Blue"}, {"size": "30", "color": "Black"}], "createdAt": datetime.utcnow().isoformat()},
            {"sku": "ACC-001", "name": "Leather Handbag", "category": "Accessories", "costPrice": 1200, "sellingPrice": 2499, "stock": 15, "lowStockThreshold": 5, "variants": [{"size": "One Size", "color": "Brown"}], "createdAt": datetime.utcnow().isoformat()},
            {"sku": "ACC-002", "name": "Silk Scarf", "category": "Accessories", "costPrice": 250, "sellingPrice": 599, "stock": 3, "lowStockThreshold": 5, "variants": [{"size": "One Size", "color": "Red"}], "createdAt": datetime.utcnow().isoformat()},
        ]
        await db.products.insert_many(products)
        print(f"✅ Inserted {len(products)} sample products")

    # ── Sample Customers ──────────────────────────────────────────────────────
    if await db.customers.count_documents({}) == 0:
        customers = [
            {"name": "Priya Sharma", "phone": "9812345678", "email": "priya@example.com", "totalSpent": 5600, "lastPurchaseAt": (datetime.utcnow() - timedelta(days=3)).isoformat()},
            {"name": "Rahul Verma", "phone": "9823456789", "email": "rahul@example.com", "totalSpent": 3200, "lastPurchaseAt": (datetime.utcnow() - timedelta(days=10)).isoformat()},
            {"name": "Ananya Singh", "phone": "9834567890", "email": None, "totalSpent": 8900, "lastPurchaseAt": (datetime.utcnow() - timedelta(days=1)).isoformat()},
            {"name": "Karan Mehta", "phone": "9845678901", "email": "karan@example.com", "totalSpent": 1500, "lastPurchaseAt": (datetime.utcnow() - timedelta(days=20)).isoformat()},
        ]
        await db.customers.insert_many(customers)
        print(f"✅ Inserted {len(customers)} sample customers")

    # ── Sample Expenses ───────────────────────────────────────────────────────
    if await db.expenses.count_documents({}) == 0:
        expenses = [
            {"category": "Rent", "amount": 25000, "description": "Monthly shop rent", "date": (datetime.utcnow() - timedelta(days=5)).strftime("%Y-%m-%d")},
            {"category": "Utilities", "amount": 3500, "description": "Electricity bill", "date": (datetime.utcnow() - timedelta(days=8)).strftime("%Y-%m-%d")},
            {"category": "Salary", "amount": 18000, "description": "Staff salary - March", "date": (datetime.utcnow() - timedelta(days=2)).strftime("%Y-%m-%d")},
            {"category": "Marketing", "amount": 5000, "description": "Instagram ads campaign", "date": (datetime.utcnow() - timedelta(days=15)).strftime("%Y-%m-%d")},
        ]
        await db.expenses.insert_many(expenses)
        print(f"✅ Inserted {len(expenses)} sample expenses")

    print("\n🎉 Seed complete! Start the server: uvicorn main:app --reload --port 8000")
    client.close()


if __name__ == "__main__":
    asyncio.run(seed())
