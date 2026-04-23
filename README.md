# 💰 Personal Finance Tracker — AI-Powered MERN Stack App

A full-featured personal finance management web application built with the MERN stack (MongoDB, Express, React, Node.js) with an optional Python AI microservice.

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js, Recharts, React Router v6 |
| Backend | Node.js, Express.js, REST API |
| Database | MongoDB with Mongoose ODM |
| Auth | JWT + bcrypt + HTTP-only cookies |
| Security | Helmet, CORS, rate limiting, mongo-sanitize |
| AI Service | Python FastAPI (optional microservice) |
| Logging | Winston + Morgan |

---

## 📁 Project Structure

```
personal-finance-tracker/
├── backend/               # Node.js + Express API
│   ├── controllers/       # Business logic
│   ├── middleware/        # Auth, audit middleware
│   ├── models/            # Mongoose schemas
│   ├── routes/            # API route definitions
│   ├── utils/             # Logger, email service
│   └── server.js          # App entry point
├── frontend/              # React application
│   └── src/
│       ├── components/    # Reusable UI components
│       ├── context/       # React context (Auth)
│       ├── pages/         # Route-level pages
│       └── utils/         # API client, formatters
├── ai-service/            # Python FastAPI microservice (optional)
│   ├── main.py
│   └── requirements.txt
└── README.md
```

---

## ⚙️ Setup & Installation

### Prerequisites
- Node.js >= 18
- MongoDB (local or Atlas)
- Python 3.10+ (for AI service, optional)

### 1. Clone and install

```bash
# Install all dependencies
npm run install:all
```

### 2. Configure environment

```bash
cd backend
cp .env.example .env
# Edit .env with your MongoDB URI, JWT secrets, and email credentials
```

### 3. Run development servers

```bash
# From project root — starts both backend (port 5000) and frontend (port 3000)
npm run dev
```

### 4. (Optional) Start AI microservice

```bash
cd ai-service
pip install -r requirements.txt
python main.py
# Runs on http://localhost:8000
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |
| GET  | `/api/transactions` | List transactions (paginated, filterable) |
| POST | `/api/transactions` | Create transaction |
| POST | `/api/transactions/import-csv` | Bulk import via CSV |
| GET  | `/api/budgets` | List budgets |
| GET  | `/api/budgets/summary` | Budget vs actual summary |
| GET  | `/api/goals` | List goals |
| POST | `/api/goals/:id/contribute` | Add contribution to goal |
| GET  | `/api/analytics/summary` | Monthly income/expense summary |
| GET  | `/api/analytics/monthly-trends` | 6-month trend data |
| GET  | `/api/analytics/category-breakdown` | Spending by category |
| GET  | `/api/analytics/anomalies` | Z-score anomaly detection |
| GET  | `/api/analytics/saving-tips` | AI-generated saving recommendations |
| GET  | `/api/notifications` | User notifications |
| GET  | `/api/audit/my-activity` | User activity log |

---

## 📊 Features

- ✅ JWT authentication with HTTP-only cookies
- ✅ Transaction CRUD with CSV import
- ✅ Monthly budget planning with real-time alerts
- ✅ Financial goal tracking with milestone notifications
- ✅ AI-powered spending analytics (Z-score anomaly detection)
- ✅ 6-month trend charts and category breakdown
- ✅ Role-based access control (admin/user)
- ✅ Tamper-proof audit logs with SHA-256 checksums
- ✅ Rate limiting, NoSQL injection protection, CORS
- ✅ Email notifications via Nodemailer
- ✅ Responsive dashboard (mobile-friendly)

---

## 🔒 Security Features (OWASP Top 10 Compliance)

- **A01 Broken Access Control** → JWT + role-based middleware
- **A02 Cryptographic Failures** → bcrypt (12 rounds), HTTPS enforcement
- **A03 Injection** → express-validator + mongo-sanitize
- **A04 Insecure Design** → Rate limiting, input size limits
- **A05 Security Misconfiguration** → Helmet.js headers
- **A07 Auth Failures** → HTTP-only cookies, refresh tokens, OTP reset
- **A09 Logging** → Winston structured logs + tamper-proof audit trail

---

## 📋 CSV Import Format

```csv
type,amount,category,date,description,paymentMode,notes
expense,45.50,Food & Dining,2024-01-15,Lunch at cafe,card,
income,3000,Salary,2024-01-01,Monthly salary,bank_transfer,
```

---

## 🤝 Team Structure (per SRS)

| Role | Focus |
|------|-------|
| FSD 1 | Backend APIs, Database, Auth |
| FSD 2 | Frontend UI, Dashboard |
| AI/ML | Analytics, NLP categorization |
| Cybersecurity | Auth security, audit logs |
