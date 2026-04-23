"""
Personal Finance Tracker - AI/ML Microservice
FastAPI service exposing analytics endpoints used by the Node.js backend.
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import LabelEncoder
import re

app = FastAPI(title="Finance Tracker AI Service", version="1.0.0")


# ─── Models ────────────────────────────────────────────────────────────────────

class Transaction(BaseModel):
    description: str
    amount: float
    category: Optional[str] = None

class TransactionList(BaseModel):
    transactions: List[Transaction]

class AnomalyRequest(BaseModel):
    amounts: List[float]
    category: str

class TrendRequest(BaseModel):
    monthly_data: List[dict]  # [{month: "2024-01", income: 3000, expense: 2000}]

class GoalRequest(BaseModel):
    target_amount: float
    current_amount: float
    monthly_savings: float


# ─── Category Keywords ─────────────────────────────────────────────────────────

CATEGORY_KEYWORDS = {
    "Food & Dining": ["food", "restaurant", "cafe", "coffee", "pizza", "burger", "grocery", "supermarket", "dining", "eat", "lunch", "dinner", "breakfast", "swiggy", "zomato", "uber eats"],
    "Transportation": ["uber", "ola", "taxi", "bus", "metro", "fuel", "petrol", "diesel", "parking", "transport", "lyft", "train", "flight", "airline"],
    "Housing": ["rent", "mortgage", "maintenance", "electricity", "water", "gas", "internet", "wifi", "lease"],
    "Healthcare": ["doctor", "hospital", "pharmacy", "medicine", "health", "clinic", "medical", "dental", "insurance"],
    "Entertainment": ["netflix", "spotify", "movie", "cinema", "game", "amazon prime", "disney", "subscription", "concert", "theatre"],
    "Shopping": ["amazon", "flipkart", "shopping", "clothes", "shoes", "electronics", "mall", "store"],
    "Education": ["school", "college", "university", "course", "book", "tuition", "fees", "udemy", "coursera"],
    "Travel": ["hotel", "airbnb", "vacation", "holiday", "tour", "travel", "booking"],
    "Salary": ["salary", "payroll", "wages", "income", "stipend"],
    "Freelance": ["freelance", "consulting", "contract", "project", "client payment"],
}


def categorize_description(description: str) -> str:
    """TF-IDF style keyword matching for transaction categorization."""
    desc_lower = description.lower()
    scores = {}
    for category, keywords in CATEGORY_KEYWORDS.items():
        score = sum(1 for kw in keywords if kw in desc_lower)
        if score > 0:
            scores[category] = score
    return max(scores, key=scores.get) if scores else "Other"


# ─── Routes ────────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "service": "finance-ai"}


@app.post("/categorize")
def categorize(req: TransactionList):
    """Auto-categorize transaction descriptions."""
    results = []
    for tx in req.transactions:
        if tx.category and tx.category != "Other":
            results.append({"description": tx.description, "category": tx.category, "auto": False})
        else:
            predicted = categorize_description(tx.description)
            results.append({"description": tx.description, "category": predicted, "auto": True})
    return {"results": results}


@app.post("/anomalies")
def detect_anomalies(req: AnomalyRequest):
    """Isolation Forest + Z-score anomaly detection."""
    if len(req.amounts) < 5:
        return {"anomalies": [], "message": "Not enough data (need >= 5 transactions)"}

    amounts = np.array(req.amounts).reshape(-1, 1)

    # Z-score method
    mean = np.mean(amounts)
    std = np.std(amounts)
    z_scores = np.abs((amounts - mean) / std) if std > 0 else np.zeros_like(amounts)

    # Isolation Forest
    iso = IsolationForest(contamination=0.1, random_state=42)
    iso.fit(amounts)
    iso_labels = iso.predict(amounts)  # -1 = anomaly

    anomaly_flags = []
    for i, amount in enumerate(req.amounts):
        z = float(z_scores[i][0])
        is_anomaly = z > 2.5 or iso_labels[i] == -1
        anomaly_flags.append({
            "amount": amount,
            "z_score": round(z, 3),
            "is_anomaly": is_anomaly,
            "iso_flag": bool(iso_labels[i] == -1),
            "category": req.category,
            "mean": round(float(mean), 2),
            "std": round(float(std), 2),
        })

    return {"anomalies": anomaly_flags, "category": req.category}


@app.post("/trend")
def analyze_trend(req: TrendRequest):
    """Linear regression trend analysis on monthly expense data."""
    if len(req.monthly_data) < 2:
        return {"trend": "insufficient_data"}

    expenses = [d.get("expense", 0) for d in req.monthly_data]
    x = np.arange(len(expenses))
    y = np.array(expenses)

    # Linear regression (numpy polyfit)
    coeffs = np.polyfit(x, y, 1)
    slope = coeffs[0]
    intercept = coeffs[1]

    next_month_pred = slope * len(expenses) + intercept

    trend_label = "increasing" if slope > 50 else "decreasing" if slope < -50 else "stable"

    return {
        "slope": round(slope, 2),
        "trend": trend_label,
        "predicted_next_month": round(max(next_month_pred, 0), 2),
        "data_points": len(expenses),
    }


@app.post("/goal-prediction")
def predict_goal(req: GoalRequest):
    """Linear extrapolation for goal completion date prediction."""
    remaining = req.target_amount - req.current_amount
    if req.monthly_savings <= 0:
        return {"months_needed": None, "message": "No monthly savings data available"}

    months_needed = remaining / req.monthly_savings
    return {
        "months_needed": round(months_needed, 1),
        "suggested_contribution": round(req.monthly_savings, 2),
        "remaining": round(remaining, 2),
    }


@app.post("/saving-tips")
def generate_tips(data: dict):
    """Rule-based saving recommendations."""
    categories = data.get("top_categories", [])
    tips = []
    rules = {
        "Food & Dining": ("Consider meal prepping to reduce dining out costs.", 0.20),
        "Entertainment": ("Review your subscriptions and cancel unused ones.", 0.30),
        "Shopping": ("Try a 24-hour rule before non-essential purchases.", 0.15),
        "Transportation": ("Consider carpooling or public transit alternatives.", 0.15),
    }
    for cat in categories:
        name = cat.get("category", "")
        amount = cat.get("total", 0)
        if name in rules:
            tip, rate = rules[name]
            tips.append({"category": name, "suggestion": tip, "potential_saving": round(amount * rate, 2)})
        else:
            tips.append({"category": name, "suggestion": f"Track your {name} spending more closely.", "potential_saving": round(amount * 0.10, 2)})
    return {"tips": tips}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
