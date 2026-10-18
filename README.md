# ⚡ GYMHQ — Commercial Gym Management SaaS

A high-performance, full-stack gym management SaaS platform built for gym owners, managers, and front-desk staff. Designed with a dark charcoal/navy aesthetic and electric-green accents, with database persistence, validation, and real-time operational workflows.

---

## 🚀 Key Features

- **⚡ Live Gym Overview (Dashboard)**
  - Real-time KPI metric cards (Active athletes, Today's floor attendance, Monthly collections, Dues & expired count).
  - Quick-action shortcuts (Instant Check-In, Enroll Athlete, Record Payment, View Reports).
  - Renewal alerts (Memberships expiring in 30 days or lapsed) with 1-click renewal action.
  - Recent payment receipts & floor scan logs.
- **👥 Athlete & Member Management**
  - Full CRUD operations with phone uniqueness enforcement.
  - Plan customization (Monthly, Quarterly, Semi-Annual, Annual).
  - Soft deactivation and reactivation.
  - Non-destructive membership renewal preserving all historical financial records.
  - Detailed member dossier drawer showing past attendances and payment ledgers.
- **🏃 Front-Desk Floor Attendance**
  - Rapid 1-click check-in station with real-time floor capacity counter.
  - Enforced unique daily check-in constraint (`UQ(member_id, attendance_date)`).
  - Filterable check-in log with date-range picker and athlete search.
- **💳 Financials & Billing Ledgers**
  - Clear distinction between **Payment Date** (when money was physically collected) and **Fee Month** (which calendar month the fee applies to).
  - Support for partial payments, multiple installments, and multi-channel receipts (UPI, Card, Cash, Bank Wire).
  - Monthly cashflow collection totals.
- **📊 Reports & CSV Data Export**
  - **Monthly Fees & Dues**: Detailed breakdown of expected fee vs paid credits per member, with uncollected balances.
  - **Expiry & Renewals**: Lookahead window (7, 15, 30, 60, 90 days) with direct renewal flow.
  - **Attendance Log**: Scan activity analytics.
  - **Payment Collection Breakdown**: Channel percentage distribution.
  - **One-click CSV Exports** for all reports.

- **🇮🇳 Tailored for Indian Gyms**
  - All financials and reports in Indian Rupees (`₹` / INR) with `en-IN` number formatting.
  - Standard Indian pricing tier presets: Monthly (₹1,500), Quarterly (₹4,000), Semi-Annual (₹7,500), Annual (₹14,000).
  - Indian member contact schema supporting `+91` phone numbers.
  - **⚡ UPI & Instant QR Scan** payment channel support.
  - 1-Click WhatsApp dues reminder messages with custom Rupee balance copy.

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite 6, React Router 7, Vanilla CSS (Design System Tokens) |
| **Backend** | Python FastAPI, Pydantic v2, Uvicorn |
| **Database** | PostgreSQL, SQLAlchemy 2.0 (Modern ORM), psycopg 3 driver |
| **Testing** | Pytest, TestClient |
| **Docs** | Interactive OpenAPI / Swagger UI at `/docs` |

---

## 📋 Quick Start Guide

### 1. Prerequisites
- **PostgreSQL** running locally on port 5432 with database `gym_management`.
- **Python 3.10+**
- **Node.js 18+** & npm

### 2. Backend Setup & Database Seeding

```bash
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Seed the database with admin user and sample data
python3 seed_db.py
```

### 3. Running Backend Server

```bash
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
API Documentation will be available at [http://localhost:8000/docs](http://localhost:8000/docs).

### 4. Running Frontend Server

```bash
cd frontend

# Install npm dependencies (if not done)
npm install

# Start Vite dev server
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---


---

## 🧪 Running Automated Tests

Run the backend test suite:

```bash
cd backend
python3 -m pytest tests/test_api.py -v
```

All 9 test cases will validate health check, auth, member CRUD, attendance uniqueness, payments, dashboard metrics, and CSV export.

---

## 📐 Project Structure

```
GYMHQ/
├── backend/
│   ├── app/
│   │   ├── auth/          # JWT tokens & bcrypt password hashing
│   │   ├── models/        # SQLAlchemy 2.0 ORM models (User, Member, Attendance, Payment)
│   │   ├── routers/       # API routers (auth, members, attendance, payments, dashboard, reports)
│   │   ├── schemas/       # Pydantic v2 validation schemas
│   │   ├── config.py      # App settings & environment loader
│   │   ├── database.py    # Database engine & session management
│   │   └── main.py        # FastAPI app initialization & CORS
│   ├── tests/             # Pytest test suite
│   ├── seed_db.py         # Seed script with realistic demo data
│   ├── requirements.txt   # Backend dependencies
│   └── .env               # Environment configuration
├── frontend/
│   ├── src/
│   │   ├── components/    # Layout, Sidebar, Header, Modal, ProtectedRoute
│   │   ├── context/       # AuthContext, ToastContext
│   │   ├── pages/         # Dashboard, Members, Attendance, Payments, Reports, Login
│   │   ├── services/      # Axios/fetch API client wrapper
│   │   ├── index.css      # GYMHQ Design System (CSS tokens, dark mode)
│   │   ├── App.jsx        # Route definitions
│   │   └── main.jsx       # Client entry point
│   ├── package.json
│   └── vite.config.js     # Vite configuration with /api reverse proxy
└── README.md
```
