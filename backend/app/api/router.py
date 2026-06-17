import csv
from io import StringIO
from datetime import datetime, date
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.auth import get_password_hash, verify_password, create_access_token
from app.api.deps import get_current_user
from app.models import User, Profile, Transaction, Budget, Goal
from app.schemas import (
    UserCreate, UserResponse, Token,
    ProfileCreate, ProfileResponse,
    TransactionCreate, TransactionResponse,
    BudgetCreate, BudgetResponse, BudgetUpdate,
    GoalCreate, GoalResponse, GoalUpdate,
    ChatRequest, ChatResponse
)
from app.services.agent import finance_agent

router = APIRouter()

# ----------------- AUTH ENDPOINTS -----------------

@router.post("/auth/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user_in.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    hashed_password = get_password_hash(user_in.password)
    user = User(email=user_in.email, hashed_password=hashed_password)
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Auto-initialize an empty profile
    profile = Profile(user_id=user.id)
    db.add(profile)
    db.commit()
    
    return user

@router.post("/auth/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(subject=user.email)
    return {"access_token": access_token, "token_type": "bearer"}


# ----------------- PROFILE ENDPOINTS -----------------

@router.get("/profile", response_model=ProfileResponse)
def get_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not current_user.profile:
        profile = Profile(user_id=current_user.id)
        db.add(profile)
        db.commit()
        db.refresh(profile)
        return profile
    return current_user.profile

@router.post("/profile", response_model=ProfileResponse)
def update_profile(profile_in: ProfileCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = current_user.profile
    if not profile:
        profile = Profile(user_id=current_user.id)
        db.add(profile)
        
    profile.annual_income = profile_in.annual_income
    profile.risk_tolerance = profile_in.risk_tolerance
    profile.investment_experience = profile_in.investment_experience
    profile.age = profile_in.age
    
    db.commit()
    db.refresh(profile)
    return profile


# ----------------- TRANSACTION ENDPOINTS -----------------

@router.get("/transactions", response_model=List[TransactionResponse])
def get_transactions(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    txs = db.query(Transaction).filter(Transaction.user_id == current_user.id).order_by(Transaction.date.desc()).all()
    # Pydantic 2 validation helper
    return [TransactionResponse.model_validate(t) for t in txs]

@router.post("/transactions", response_model=TransactionResponse)
def create_transaction(tx_in: TransactionCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    tx = Transaction(
        user_id=current_user.id,
        amount=tx_in.amount,
        category=tx_in.category,
        date=tx_in.date,
        type=tx_in.type
    )
    # Triggers encryption setter property
    tx.description = tx_in.description
    
    db.add(tx)
    db.commit()
    db.refresh(tx)
    return TransactionResponse.model_validate(tx)

@router.post("/transactions/upload", response_model=Dict[str, Any])
async def upload_transactions_csv(file: UploadFile = File(...), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Invalid file format. Please upload a CSV file.")
        
    content = await file.read()
    decoded = content.decode("utf-8")
    csv_reader = csv.DictReader(StringIO(decoded))
    
    imported_count = 0
    errors = []
    
    for row in csv_reader:
        try:
            # Expected headers: amount, category, date (YYYY-MM-DD), type (income/expense), description
            amount = float(row.get("amount", 0.0))
            category = row.get("category", "Other").strip()
            date_str = row.get("date", "").strip()
            tx_type = row.get("type", "expense").lower().strip()
            description = row.get("description", "Imported transaction").strip()
            
            tx_date = datetime.strptime(date_str, "%Y-%m-%d").date() if date_str else date.today()
            
            tx = Transaction(
                user_id=current_user.id,
                amount=amount,
                category=category,
                date=tx_date,
                type=tx_type
            )
            tx.description = description
            db.add(tx)
            imported_count += 1
        except Exception as e:
            errors.append(f"Row error: {str(e)}")
            
    if imported_count > 0:
        db.commit()
        
    return {"status": "success", "imported": imported_count, "errors": errors}

@router.delete("/transactions/{tx_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_transaction(tx_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    tx = db.query(Transaction).filter(Transaction.id == tx_id, Transaction.user_id == current_user.id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    db.delete(tx)
    db.commit()
    return None


# ----------------- BUDGET ENDPOINTS -----------------

@router.get("/budgets", response_model=List[BudgetResponse])
def get_budgets(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Budget).filter(Budget.user_id == current_user.id).all()

@router.post("/budgets", response_model=BudgetResponse)
def create_budget(budget_in: BudgetCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Check if budget for category already exists
    existing = db.query(Budget).filter(Budget.user_id == current_user.id, Budget.category == budget_in.category).first()
    if existing:
        existing.limit_amount = budget_in.limit_amount
        db.commit()
        db.refresh(existing)
        return existing
        
    budget = Budget(
        user_id=current_user.id,
        category=budget_in.category,
        limit_amount=budget_in.limit_amount,
        spent_amount=budget_in.spent_amount,
        period=budget_in.period
    )
    db.add(budget)
    db.commit()
    db.refresh(budget)
    return budget

@router.put("/budgets/{budget_id}", response_model=BudgetResponse)
def update_budget(budget_id: int, budget_in: BudgetUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    budget = db.query(Budget).filter(Budget.id == budget_id, Budget.user_id == current_user.id).first()
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")
        
    if budget_in.limit_amount is not None:
        budget.limit_amount = budget_in.limit_amount
    if budget_in.spent_amount is not None:
        budget.spent_amount = budget_in.spent_amount
        
    db.commit()
    db.refresh(budget)
    return budget

@router.delete("/budgets/{budget_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_budget(budget_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    budget = db.query(Budget).filter(Budget.id == budget_id, Budget.user_id == current_user.id).first()
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")
    db.delete(budget)
    db.commit()
    return None


# ----------------- GOAL ENDPOINTS -----------------

@router.get("/goals", response_model=List[GoalResponse])
def get_goals(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Goal).filter(Goal.user_id == current_user.id).all()

@router.post("/goals", response_model=GoalResponse)
def create_goal(goal_in: GoalCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    goal = Goal(
        user_id=current_user.id,
        name=goal_in.name,
        target_amount=goal_in.target_amount,
        current_amount=goal_in.current_amount,
        target_date=goal_in.target_date
    )
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return goal

@router.put("/goals/{goal_id}", response_model=GoalResponse)
def update_goal(goal_id: int, goal_in: GoalUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    goal = db.query(Goal).filter(Goal.id == goal_id, Goal.user_id == current_user.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
        
    if goal_in.current_amount is not None:
        goal.current_amount = goal_in.current_amount
    if goal_in.target_amount is not None:
        goal.target_amount = goal_in.target_amount
    if goal_in.target_date is not None:
        goal.target_date = goal_in.target_date
        
    db.commit()
    db.refresh(goal)
    return goal

@router.delete("/goals/{goal_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_goal(goal_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    goal = db.query(Goal).filter(Goal.id == goal_id, Goal.user_id == current_user.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    db.delete(goal)
    db.commit()
    return None


# ----------------- LANGGRAPH AI ADVISOR ENDPOINTS -----------------

def prepare_agent_state(current_user: User, db: Session) -> Dict[str, Any]:
    profile_data = {
        "annual_income": current_user.profile.annual_income if current_user.profile else 0.0,
        "risk_tolerance": current_user.profile.risk_tolerance if current_user.profile else "Medium",
        "investment_experience": current_user.profile.investment_experience if current_user.profile else "None",
        "age": current_user.profile.age if current_user.profile else 30
    }
    
    txs = db.query(Transaction).filter(Transaction.user_id == current_user.id).all()
    transactions_data = [
        {
            "id": t.id,
            "amount": t.amount,
            "category": t.category,
            "date": t.date.isoformat(),
            "type": t.type,
            "description": t.description
        }
        for t in txs
    ]
    
    bdgs = db.query(Budget).filter(Budget.user_id == current_user.id).all()
    budgets_data = [
        {
            "id": b.id,
            "category": b.category,
            "limit_amount": b.limit_amount,
            "spent_amount": b.spent_amount,
            "period": b.period
        }
        for b in bdgs
    ]
    
    gls = db.query(Goal).filter(Goal.user_id == current_user.id).all()
    goals_data = [
        {
            "id": g.id,
            "name": g.name,
            "target_amount": g.target_amount,
            "current_amount": g.current_amount,
            "target_date": g.target_date.isoformat()
        }
        for g in gls
    ]
    
    return {
        "messages": [],
        "user_profile": profile_data,
        "transactions": transactions_data,
        "budgets": budgets_data,
        "goals": goals_data,
        "analysis": {},
        "recommendations": {},
        "current_node": ""
    }

@router.post("/advisor/compile", response_model=ChatResponse)
def compile_advisory_report(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Prepare inputs for LangGraph
    initial_state = prepare_agent_state(current_user, db)
    
    # Run the compiled LangGraph workflow state machine
    try:
        final_state = finance_agent.invoke(initial_state)
        report = final_state.get("recommendations", {}).get("markdown_report", "No report compiled.")
        
        # Optional: Sync calculated budget spent amounts back to DB
        # This shows direct synergy between AI categorizer / analyzer and the DB budget model
        exp_analysis = final_state.get("analysis", {}).get("expenses", {})
        cat_breakdown = exp_analysis.get("category_breakdown", {})
        
        for b in db.query(Budget).filter(Budget.user_id == current_user.id).all():
            if b.category in cat_breakdown:
                b.spent_amount = cat_breakdown[b.category]
        db.commit()
        
        return ChatResponse(
            reply=report,
            state_updates={
                "expenses": exp_analysis,
                "budgets": final_state.get("analysis", {}).get("budget", {}),
                "savings": final_state.get("analysis", {}).get("savings", {}),
                "investments": final_state.get("analysis", {}).get("investments", {}),
                "goals": final_state.get("analysis", {}).get("goals", {})
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Agent failed: {str(e)}")

@router.post("/advisor/chat", response_model=ChatResponse)
def chat_with_advisor(chat_req: ChatRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    initial_state = prepare_agent_state(current_user, db)
    
    # Format message history to show conversational awareness
    history_str = ""
    for msg in chat_req.history[-5:]: # Lookback window of 5 messages
        history_str += f"{msg.sender.upper()}: {msg.text}\n"
    
    user_query = chat_req.message
    
    # Trigger AI Graph compilation to have context, and then answer specifically the user's chat query
    try:
        final_state = finance_agent.invoke(initial_state)
        
        # Determine specific context depending on what user asked
        reply = ""
        query_lower = user_query.lower()
        
        if "invest" in query_lower or "portfolio" in query_lower or "asset" in query_lower:
            inv = final_state.get("analysis", {}).get("investments", {})
            alloc_desc = ", ".join([f"{k}: {v}%" for k, v in inv.get("suggested_allocation", {}).items()])
            reply = f"Based on your risk tolerance ({initial_state['user_profile']['risk_tolerance']}) and age ({initial_state['user_profile']['age']}), I recommend an asset allocation of **{alloc_desc}**.\n\nYou can use low-cost ETFs like VOO (Core Stock Market), VXUS (International Equity), and BND (Total Bond Market) as building blocks."
        
        elif "budget" in query_lower or "50/30/20" in query_lower or "spending" in query_lower:
            bdg = final_state.get("analysis", {}).get("budget", {})
            actual = bdg.get("actual_50_30_20", {})
            ideal = bdg.get("ideal_50_30_20", {})
            reply = f"Here is how your actual spending aligns with the standard 50/30/20 framework:\n\n" \
                    f"- **Needs**: You spent ${actual.get('Needs', 0.0):,.2f} vs an ideal cap of ${ideal.get('Needs (50%)', 0.0):,.2f}.\n" \
                    f"- **Wants**: You spent ${actual.get('Wants', 0.0):,.2f} vs an ideal cap of ${ideal.get('Wants (30%)', 0.0):,.2f}.\n" \
                    f"- **Savings**: You saved ${actual.get('Savings & Debt', 0.0):,.2f} vs an ideal allocation of ${ideal.get('Savings & Debt (20%)', 0.0):,.2f}."
            if bdg.get("budget_alerts"):
                reply += "\n\n⚠️ Alerts:\n" + "\n".join([f"- {a}" for a in bdg["budget_alerts"]])
                
        elif "savings" in query_lower or "optimize" in query_lower or "subscriptions" in query_lower:
            sv = final_state.get("analysis", {}).get("savings", {})
            tips = sv.get("savings_optimization_tips", [])
            reply = f"Here is how we can optimize your savings:\n\n"
            if tips:
                reply += "\n".join([f"- {t}" for t in tips])
            else:
                reply += "Your current savings rate looks excellent. To optimize further, consider shifting idle cash into a High-Yield Savings Account (HYSA) yielding >4% APY."
            reply += f"\n\nBased on your expenses, you should target an emergency reserve of **${sv.get('target_emergency_fund', 0.0):,.2f}** (covering 6 months of living expenses)."
            
        elif "goal" in query_lower or "track" in query_lower:
            gl = final_state.get("analysis", {}).get("goals", {})
            reports = gl.get("goal_reports", [])
            if reports:
                reply = "Here is the status of your financial goals:\n\n"
                for r in reports:
                    reply += f"- **{r['name']}**: Target ${r['target']:,.2f} (Current: ${r['current']:,.2f}). Requires **${r['required_monthly_savings']:,.2f}/mo**. Status: **{r['status']}**.\n"
            else:
                reply = "You don't have any goals active. Please define a financial target in your Goal Tracker dashboard!"
                
        else:
            # General fallback reply summarizing overall health
            exp = final_state.get("analysis", {}).get("expenses", {})
            reply = f"Hello! I am your AI Wealth Advisor. I've analyzed your monthly cashflow: you have an income of **${exp.get('total_income', 0.0):,.2f}**, expenses of **${exp.get('total_expenses', 0.0):,.2f}**, leaving a net savings surplus of **${exp.get('net_savings', 0.0):,.2f}** (Savings Rate: **{exp.get('savings_rate', 0.0):.1f}%**).\n\nFeel free to ask me questions about your *budgets*, *investment recommendations*, *savings optimization*, or *goals tracker*."
            
        return ChatResponse(
            reply=reply,
            state_updates=None
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Agent failed: {str(e)}")
