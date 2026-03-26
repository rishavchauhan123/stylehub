from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from database import connect_db, close_db
from routes import auth, products, sales, purchases, customers, expenses, users


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    yield
    await close_db()


app = FastAPI(
    title="StyleHub API",
    description="Business Management System for Clothing Stores",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(products.router)
app.include_router(sales.router)
app.include_router(purchases.router)
app.include_router(customers.router)
app.include_router(expenses.router)
app.include_router(users.router)


@app.get("/")
async def root():
    return {"message": "StyleHub API v2.0 — MongoDB + FastAPI", "docs": "/docs"}
