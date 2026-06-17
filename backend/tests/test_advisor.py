import pytest
from datetime import date, datetime
from app.core.auth import get_password_hash, verify_password, create_access_token, decode_access_token
from app.core.crypto import cipher
from app.services.agent import (
    categorize_transactions_node,
    analyze_expenses_node,
    plan_budget_node,
    optimize_savings_node,
    recommend_investments_node,
    track_goals_node,
    compile_report_node,
    finance_agent
)

# ----------------- SECURITY & CRYPTO TESTS -----------------

def test_encryption_decryption():
    secret_text = "Coffee at Starbucks - $12.50"
    encrypted = cipher.encrypt(secret_text)
    
    assert encrypted != secret_text
    assert len(encrypted) > 20
    
    decrypted = cipher.decrypt(encrypted)
    assert decrypted == secret_text

def test_password_hashing():
    plain = "SuperSecurePassword123!"
    hashed = get_password_hash(plain)
    
    assert hashed != plain
    assert verify_password(plain, hashed) is True
    assert verify_password("wrongpassword", hashed) is False

def test_jwt_tokens():
    email = "test@example.com"
    token = create_access_token(subject=email)
    
    assert isinstance(token, str)
    decoded_email = decode_access_token(token)
    assert decoded_email == email


# ----------------- LANGGRAPH WORKFLOW NODE TESTS -----------------

def test_categorize_node():
    mock_state = {
        "messages": [],
        "user_profile": {},
        "transactions": [
            {"amount": 1200.0, "description": "Apartment Rent payment", "category": "", "type": ""},
            {"amount": 4.50, "description": "Starbucks Espresso", "category": "", "type": ""},
            {"amount": 4500.0, "description": "Bi-Weekly Salary paycheck", "category": "", "type": ""},
            {"amount": 14.99, "description": "Netflix Subscription", "category": "uncategorized", "type": "expense"},
        ],
        "budgets": [],
        "goals": [],
        "analysis": {},
        "recommendations": {},
        "current_node": ""
    }
    
    res = categorize_transactions_node(mock_state)
    txs = res["transactions"]
    
    # Assert correct category matching
    assert txs[0]["category"] == "Housing"
    assert txs[0]["type"] == "expense"
    assert txs[1]["category"] == "Dining Out"
    assert txs[2]["category"] == "Income"
    assert txs[2]["type"] == "income"
    assert txs[3]["category"] == "Subscriptions"

def test_expense_analysis_node():
    mock_state = {
        "user_profile": {"annual_income": 60000.0},
        "transactions": [
            {"amount": 1000.0, "description": "Rent", "category": "Housing", "type": "expense", "date": "2026-06-01"},
            {"amount": 200.0, "description": "Food", "category": "Groceries", "type": "expense", "date": "2026-06-02"},
            {"amount": 3000.0, "description": "Paycheck", "category": "Income", "type": "income", "date": "2026-06-15"},
        ],
        "analysis": {}
    }
    
    res = analyze_expenses_node(mock_state)
    exp = res["analysis"]["expenses"]
    
    assert exp["total_income"] == 3000.0
    assert exp["total_expenses"] == 1200.0
    assert exp["net_savings"] == 1800.0
    assert exp["savings_rate"] == 60.0  # (1800/3000) * 100
    assert exp["category_breakdown"]["Housing"] == 1000.0
    assert exp["category_breakdown"]["Groceries"] == 200.0

def test_budget_planning_node():
    mock_state = {
        "transactions": [],
        "budgets": [
            {"category": "Dining Out", "limit_amount": 100.0, "spent_amount": 0.0}
        ],
        "analysis": {
            "expenses": {
                "total_income": 3000.0,
                "total_expenses": 1200.0,
                "category_breakdown": {
                    "Dining Out": 120.0,
                    "Housing": 800.0
                }
            }
        }
    }
    
    res = plan_budget_node(mock_state)
    bdg = res["analysis"]["budget"]
    
    # Assert budget overrun alerts
    assert len(bdg["budget_alerts"]) == 1
    assert "exceeded" in bdg["budget_alerts"][0]

def test_savings_optimization_node():
    mock_state = {
        "transactions": [
            {"amount": 15.0, "description": "Netflix", "category": "Subscriptions", "type": "expense"},
            {"amount": 120.0, "description": "Spotify", "category": "Subscriptions", "type": "expense"}
        ],
        "analysis": {
            "expenses": {
                "total_income": 3000.0,
                "total_expenses": 1200.0,
                "category_breakdown": {
                    "Subscriptions": 135.0
                }
            }
        }
    }
    
    res = optimize_savings_node(mock_state)
    sav = res["analysis"]["savings"]
    
    assert sav["total_subscription_spend"] == 135.0
    assert sav["target_emergency_fund"] == 1200.0 * 6.0
    assert len(sav["savings_optimization_tips"]) > 0

def test_recommend_investments_node():
    mock_state = {
        "user_profile": {
            "age": 30,
            "risk_tolerance": "High",
            "investment_experience": "Basic"
        },
        "analysis": {}
    }
    
    res = recommend_investments_node(mock_state)
    inv = res["analysis"]["investments"]
    
    assert inv["equity_ratio"] == 95  # 110 - 30 = 80, +15 for High risk = 95
    assert "Cryptocurrencies & Commodities" in inv["suggested_allocation"]

def test_track_goals_node():
    mock_state = {
        "goals": [
            {
                "name": "Vacation Fund",
                "target_amount": 5000.0,
                "current_amount": 1000.0,
                # Set a far target date for stable delta
                "target_date": "2027-06-17" 
            }
        ],
        "analysis": {
            "expenses": {
                "net_savings": 500.0
            }
        }
    }
    
    res = track_goals_node(mock_state)
    gls = res["analysis"]["goals"]["goal_reports"]
    
    assert len(gls) == 1
    assert gls[0]["name"] == "Vacation Fund"
    assert gls[0]["needed"] == 4000.0
    # Vacation fund needs ~333/mo ($4k/12mo). Net savings is $500/mo.
    assert gls[0]["status"] == "On Track"

def test_compile_report_node():
    mock_state = {
        "user_profile": {"age": 30, "risk_tolerance": "Medium"},
        "transactions": [],
        "budgets": [],
        "goals": [],
        "analysis": {
            "expenses": {
                "total_income": 4000.0,
                "total_expenses": 2000.0,
                "net_savings": 2000.0,
                "savings_rate": 50.0,
                "category_breakdown": {"Housing": 1000.0}
            },
            "budget": {
                "ideal_50_30_20": {},
                "actual_50_30_20": {},
                "budget_alerts": []
            },
            "savings": {
                "total_subscription_spend": 15.0,
                "target_emergency_fund": 12000.0,
                "savings_optimization_tips": []
            },
            "investments": {
                "equity_ratio": 80,
                "suggested_allocation": {},
                "etf_portfolio": []
            },
            "goals": {
                "goal_reports": []
            }
        },
        "recommendations": {},
        "current_node": ""
    }
    
    res = compile_report_node(mock_state)
    report = res["recommendations"]["markdown_report"]
    
    assert "# 💎 Personal Wealth Advisory Report" in report
    assert "Monthly Income" in report
    assert "$4,000.00" in report


# ----------------- END-TO-END LANGGRAPH INVOCATION TEST -----------------

def test_full_langgraph_agent():
    mock_state = {
        "messages": [],
        "user_profile": {"age": 25, "risk_tolerance": "Low"},
        "transactions": [
            {"amount": 1500.0, "description": "Mortgage Payment", "category": "Other", "type": "expense", "date": "2026-06-01"},
            {"amount": 150.0, "description": "Weekly Groceries", "category": "", "type": "expense", "date": "2026-06-03"},
            {"amount": 5000.0, "description": "Paycheck", "category": "", "type": "income", "date": "2026-06-15"}
        ],
        "budgets": [
            {"category": "Groceries", "limit_amount": 100.0, "spent_amount": 0.0}
        ],
        "goals": [
            {"name": "Downpayment", "target_amount": 30000.0, "current_amount": 10000.0, "target_date": "2027-06-17"}
        ],
        "analysis": {},
        "recommendations": {},
        "current_node": ""
    }
    
    final_state = finance_agent.invoke(mock_state)
    
    # Validate final state modifications
    assert "expenses" in final_state["analysis"]
    assert "budget" in final_state["analysis"]
    assert "savings" in final_state["analysis"]
    assert "investments" in final_state["analysis"]
    assert "goals" in final_state["analysis"]
    assert "markdown_report" in final_state["recommendations"]


# ----------------- FastAPI ROUTE / API ENDPOINT TESTS -----------------

def test_auth_routes(client):
    # Register
    reg_res = client.post(
        "/api/auth/register",
        json={"email": "client@example.com", "password": "supersecretpassword"}
    )
    assert reg_res.status_code == 201
    assert reg_res.json()["email"] == "client@example.com"
    
    # Login
    login_res = client.post(
        "/api/auth/login",
        data={"username": "client@example.com", "password": "supersecretpassword"}
    )
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    assert token is not None
    
    # Profile update
    headers = {"Authorization": f"Bearer {token}"}
    prof_res = client.post(
        "/api/profile",
        json={"annual_income": 95000.0, "risk_tolerance": "High", "investment_experience": "Advanced", "age": 28},
        headers=headers
    )
    assert prof_res.status_code == 200
    assert prof_res.json()["annual_income"] == 95000.0
    
    # Add transaction
    tx_res = client.post(
        "/api/transactions",
        json={"amount": 45.50, "category": "Dining Out", "date": "2026-06-10", "type": "expense", "description": "Sushi Dinner"},
        headers=headers
    )
    assert tx_res.status_code == 200
    assert tx_res.json()["description"] == "Sushi Dinner"
    
    # Budget setup
    bdg_res = client.post(
        "/api/budgets",
        json={"category": "Dining Out", "limit_amount": 200.0},
        headers=headers
    )
    assert bdg_res.status_code == 200
    assert bdg_res.json()["limit_amount"] == 200.0
    
    # Advisor Compile API (LangGraph trigger)
    adv_res = client.post("/api/advisor/compile", headers=headers)
    assert adv_res.status_code == 200
    assert "report" in adv_res.json()["reply"].lower()
    
    # Advisor Chat API
    chat_res = client.post(
        "/api/advisor/chat",
        json={"message": "What is my current savings velocity?", "history": []},
        headers=headers
    )
    assert chat_res.status_code == 200
    assert len(chat_res.json()["reply"]) > 0
