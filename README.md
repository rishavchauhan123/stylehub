# StyleHub — Full-Stack Business Management System

A modern clothing store management system with separate frontend (React + Vite) and backend (Python FastAPI + MongoDB) architectures.

## Architecture

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Python FastAPI + MongoDB + JWT Authentication
- **Database**: MongoDB (replaces Firebase Firestore)

## Quick Start

### Backend Setup

```bash
cd backend
pip install -r requirements.txt
# Set up environment variables in .env (see .env.example)
python seed.py  # Seeds default admin user
uvicorn main:app --reload --port 8000
```

Test backend: http://localhost:8000/docs (Swagger UI)

### Frontend Setup

```bash
cd frontend
npm install
npm run dev  # Runs on http://localhost:5173
```

### Default Admin Credentials

- **Email**: admin@stylehub.com
- **Password**: admin123

## Features

- User authentication with JWT
- Inventory management
- Sales and purchase tracking
- Customer management
- Expense tracking
- Reports and analytics
- User role management (Admin/Manager/Staff)

## API Endpoints

- `POST /auth/login` - User login
- `GET /auth/me` - Get current user profile
- `PUT /auth/me` - Update profile/password
- `GET/POST /products` - CRUD products
- `GET/POST /sales` - CRUD sales
- `GET/POST /purchases` - CRUD purchases
- `GET/POST /customers` - CRUD customers
- `GET/POST /expenses` - CRUD expenses
- `GET/POST /users` - CRUD users (admin only)

## Development

- Backend runs on port 8000
- Frontend runs on port 5173 with proxy to backend
- MongoDB connection required
