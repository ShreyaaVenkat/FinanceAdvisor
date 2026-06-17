import os
from typing import Dict, Any, List, TypedDict
from datetime import datetime
from langgraph.graph import StateGraph, END

# Define LangGraph workflow state
class FinanceState(TypedDict):
    messages: List[Dict[str, Any]]
    user_profile: Dict[str, Any]
    transactions: List[Dict[str, Any]]
    budgets: List[Dict[str, Any]]
    goals: List[Dict[str, Any]]
    analysis: Dict[str, Any]
    recommendations: Dict[str, Any]
    current_node: str

# Helper to run categorization rules on transactions
def categorize_transactions_node(state: FinanceState) -> Dict[str, Any]:
    transactions = state.get("transactions", [])
    categorized = []
    
    # Categorization keywords
    keywords = {
        "rent": "Housing",
        "mortgage": "Housing",
        "apartment": "Housing",
        "landlord": "Housing",
        "grocery": "Groceries",
        "supermarket": "Groceries",
        "walmart": "Groceries",
        "costco": "Groceries",
        "kroger": "Groceries",
        "starbucks": "Dining Out",
        "restaurant": "Dining Out",
        "mcdonald": "Dining Out",
        "cafe": "Dining Out",
        "uber": "Transport",
        "lyft": "Transport",
        "gas": "Transport",
        "shell": "Transport",
        "chevron": "Transport",
        "netflix": "Subscriptions",
        "spotify": "Subscriptions",
        "hulu": "Subscriptions",
        "amazon prime": "Subscriptions",
        "gym": "Subscriptions",
        "salary": "Income",
        "paycheck": "Income",
        "dividend": "Income",
        "bonus": "Income"
    }

    for tx in transactions:
        tx_copy = dict(tx)
        desc = tx_copy.get("description", "").lower()
        amount = tx_copy.get("amount", 0.0)
        
        # Determine type based on amount sign or type field
        tx_type = tx_copy.get("type", "")
        if not tx_type:
            tx_type = "income" if "salary" in desc or "dividend" in desc or "bonus" in desc else "expense"
            tx_copy["type"] = tx_type

        # Guess category if not set or generic
        category = tx_copy.get("category", "")
        if not category or category.lower() in ["other", "uncategorized", "unknown", ""]:
            matched = False
            for kw, cat in keywords.items():
                if kw in desc:
                    tx_copy["category"] = cat
                    matched = True
                    break
            if not matched:
                tx_copy["category"] = "Dining Out" if tx_type == "expense" and amount < 30 else "Shopping" if tx_type == "expense" else "Income"
        
        categorized.append(tx_copy)
        
    analysis = state.get("analysis", {})
    analysis["categorized_count"] = len(categorized)
    
    return {
        "transactions": categorized,
        "analysis": analysis,
        "current_node": "categorize_transactions"
    }

# Node to analyze spending burn rate, category totals, etc.
def analyze_expenses_node(state: FinanceState) -> Dict[str, Any]:
    transactions = state.get("transactions", [])
    profile = state.get("user_profile", {})
    
    total_income = 0.0
    total_expenses = 0.0
    category_totals = {}
    
    for tx in transactions:
        amount = float(tx.get("amount", 0.0))
        tx_type = tx.get("type", "expense").lower()
        category = tx.get("category", "Other")
        
        if tx_type == "income":
            total_income += amount
        else:
            total_expenses += amount
            category_totals[category] = category_totals.get(category, 0.0) + amount

    # Fallback to annual income profile if transaction income is empty
    if total_income == 0.0 and profile.get("annual_income", 0.0) > 0:
        total_income = float(profile["annual_income"]) / 12.0
        
    net_savings = total_income - total_expenses
    savings_rate = (net_savings / total_income * 100.0) if total_income > 0 else 0.0
    
    # Identify high expenses or anomalies (> 10% of monthly income)
    anomalies = []
    limit = total_income * 0.10 if total_income > 0 else 500.0
    for tx in transactions:
        amount = float(tx.get("amount", 0.0))
        tx_type = tx.get("type", "expense").lower()
        if tx_type == "expense" and amount > limit:
            anomalies.append({
                "description": tx.get("description", ""),
                "amount": amount,
                "category": tx.get("category", ""),
                "date": str(tx.get("date", ""))
            })
            
    analysis = state.get("analysis", {})
    analysis["expenses"] = {
        "total_income": total_income,
        "total_expenses": total_expenses,
        "net_savings": net_savings,
        "savings_rate": savings_rate,
        "category_breakdown": category_totals,
        "anomalies": anomalies
    }
    
    return {
        "analysis": analysis,
        "current_node": "analyze_expenses"
    }

# Node to structure custom budget allocations and checks
def plan_budget_node(state: FinanceState) -> Dict[str, Any]:
    analysis = state.get("analysis", {})
    exp_analysis = analysis.get("expenses", {})
    income = exp_analysis.get("total_income", 0.0)
    category_breakdown = exp_analysis.get("category_breakdown", {})
    budgets = state.get("budgets", [])
    
    # 50/30/20 Rule recommendation
    ideal_50_30_20 = {
        "Needs (50%)": income * 0.50,
        "Wants (30%)": income * 0.30,
        "Savings & Debt (20%)": income * 0.20
    }
    
    # Group actual spending into 50/30/20 buckets
    needs_categories = ["Housing", "Groceries", "Transport", "Utilities", "Insurance"]
    wants_categories = ["Dining Out", "Shopping", "Subscriptions", "Entertainment", "Travel"]
    
    actual_needs = sum(category_breakdown.get(cat, 0.0) for cat in needs_categories)
    actual_wants = sum(category_breakdown.get(cat, 0.0) for cat in wants_categories)
    actual_savings = max(0.0, income - (actual_needs + actual_wants))
    
    actual_50_30_20 = {
        "Needs": actual_needs,
        "Wants": actual_wants,
        "Savings & Debt": actual_savings
    }
    
    # Verify user set budgets vs actual spending
    budget_alerts = []
    for b in budgets:
        cat = b.get("category", "")
        limit = float(b.get("limit_amount", 0.0))
        spent = category_breakdown.get(cat, 0.0)
        
        # Check percentage spent
        pct = (spent / limit * 100.0) if limit > 0 else 0.0
        status = "Normal"
        if pct >= 100.0:
            status = "Over Budget"
            budget_alerts.append(f"CRITICAL: You have exceeded your budget for {cat} by ${spent - limit:.2f}!")
        elif pct >= 80.0:
            status = "Warning"
            budget_alerts.append(f"WARNING: You have used {pct:.1f}% of your budget for {cat}.")
            
    analysis["budget"] = {
        "ideal_50_30_20": ideal_50_30_20,
        "actual_50_30_20": actual_50_30_20,
        "budget_alerts": budget_alerts
    }
    
    return {
        "analysis": analysis,
        "current_node": "plan_budget"
    }

# Node to spot leakages and optimization metrics
def optimize_savings_node(state: FinanceState) -> Dict[str, Any]:
    transactions = state.get("transactions", [])
    analysis = state.get("analysis", {})
    exp_analysis = analysis.get("expenses", {})
    income = exp_analysis.get("total_income", 0.0)
    
    # 1. Identify subscriptions
    subscriptions = []
    for tx in transactions:
        category = tx.get("category", "")
        if category == "Subscriptions":
            subscriptions.append({
                "description": tx.get("description", ""),
                "amount": float(tx.get("amount", 0.0))
            })
            
    total_subscriptions = sum(s["amount"] for s in subscriptions)
    
    # 2. Emergency Fund analysis (assume ideal is 6x monthly expenses)
    monthly_expenses = exp_analysis.get("total_expenses", 0.0)
    target_emergency_fund = monthly_expenses * 6.0
    
    # 3. Recommendations
    tips = []
    if total_subscriptions > 100:
        tips.append(f"Cancel unused subscriptions: You spend ${total_subscriptions:.2f}/mo on subscriptions. Canceling half could save you ${total_subscriptions * 6:.2f} in 12 months.")
    
    dining_out_spend = exp_analysis.get("category_breakdown", {}).get("Dining Out", 0.0)
    if dining_out_spend > income * 0.15:
        tips.append(f"Reduce Dining Out: You spend ${dining_out_spend:.2f} monthly on dining. Preparing meals at home could easily save 30% (${dining_out_spend * 0.3:.2f}/mo).")
        
    analysis["savings"] = {
        "subscriptions": subscriptions,
        "total_subscription_spend": total_subscriptions,
        "target_emergency_fund": target_emergency_fund,
        "savings_optimization_tips": tips
    }
    
    return {
        "analysis": analysis,
        "current_node": "optimize_savings"
    }

# Node to recommend asset allocation and ETFs
def recommend_investments_node(state: FinanceState) -> Dict[str, Any]:
    profile = state.get("user_profile", {})
    risk = profile.get("risk_tolerance", "Medium").lower()
    exp = profile.get("investment_experience", "None").lower()
    age = int(profile.get("age", 30))
    
    # Standard 110 - age rule for equity allocation
    equity_target = max(10, min(95, 110 - age))
    
    # Adjust equity based on risk tolerance
    if risk == "low":
        equity_target = max(10, equity_target - 20)
        allocation = {
            "Equities (Broad Market Index)": equity_target,
            "Fixed Income (Bonds/T-Bills)": 100 - equity_target - 10,
            "Cash / High-Yield Savings": 10
        }
    elif risk == "high":
        equity_target = min(95, equity_target + 15)
        allocation = {
            "Equities (Growth/Global Index)": equity_target,
            "Fixed Income (Corporate Bonds)": max(0, 100 - equity_target - 10),
            "Cryptocurrencies & Commodities": 10
        }
    else:  # Medium
        allocation = {
            "Equities (Core Index VTI/VOO)": equity_target,
            "Fixed Income (BND/Treasury)": 100 - equity_target - 5,
            "Cash / HYSA": 5
        }
        
    # Standard ETF recommendations
    etf_recommendations = [
        {"name": "VOO / VTI", "type": "US Equity Index", "expense_ratio": "0.03%", "description": "Core stock market exposure"},
        {"name": "VXUS", "type": "International Equity Index", "expense_ratio": "0.07%", "description": "Global diversification"},
        {"name": "BND", "type": "Total Bond Market", "expense_ratio": "0.03%", "description": "Fixed income safety"},
        {"name": "SGOV", "type": "0-3 Month Treasury ETF", "expense_ratio": "0.05%", "description": "Ultra-safe short-term yield"}
    ]
    
    analysis = state.get("analysis", {})
    analysis["investments"] = {
        "suggested_allocation": allocation,
        "equity_ratio": equity_target,
        "etf_portfolio": etf_recommendations
    }
    
    return {
        "analysis": analysis,
        "current_node": "recommend_investments"
    }

# Node to track goal progress and calculate savings velocity
def track_goals_node(state: FinanceState) -> Dict[str, Any]:
    goals = state.get("goals", [])
    analysis = state.get("analysis", {})
    exp_analysis = analysis.get("expenses", {})
    monthly_net_savings = exp_analysis.get("net_savings", 0.0)
    
    goal_reports = []
    for g in goals:
        name = g.get("name", "")
        target = float(g.get("target_amount", 0.0))
        current = float(g.get("current_amount", 0.0))
        target_date_str = str(g.get("target_date", ""))
        
        needed = max(0.0, target - current)
        
        # Calculate months remaining
        months_remaining = 12.0
        try:
            target_date = datetime.strptime(target_date_str, "%Y-%m-%d").date()
            today = datetime.now().date()
            delta_days = (target_date - today).days
            months_remaining = max(1.0, delta_days / 30.4)
        except Exception:
            pass
            
        required_monthly = needed / months_remaining if months_remaining > 0 else needed
        
        # Determine status
        is_on_track = monthly_net_savings >= required_monthly
        status = "On Track" if is_on_track else "At Risk"
        if needed == 0:
            status = "Completed"
            
        goal_reports.append({
            "name": name,
            "target": target,
            "current": current,
            "needed": needed,
            "months_remaining": round(months_remaining, 1),
            "required_monthly_savings": round(required_monthly, 2),
            "status": status
        })
        
    analysis["goals"] = {
        "goal_reports": goal_reports,
        "net_savings_capacity": monthly_net_savings
    }
    
    return {
        "analysis": analysis,
        "current_node": "track_goals"
    }

# Node to compile all insights into a premium Markdown advice document
def compile_report_node(state: FinanceState) -> Dict[str, Any]:
    analysis = state.get("analysis", {})
    profile = state.get("user_profile", {})
    
    # Extract data parts
    expenses = analysis.get("expenses", {})
    budget = analysis.get("budget", {})
    savings = analysis.get("savings", {})
    investments = analysis.get("investments", {})
    goals = analysis.get("goals", {})
    
    # Generate Beautiful Premium Markdown
    report = f"""# 💎 Personal Wealth Advisory Report
*Prepared on: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}*

---

## 📊 1. Monthly Cashflow & Burn Rate
We analyzed your income and recent expenses. Here is your current profile:

| Metric | Amount | Description |
| :--- | :--- | :--- |
| **Monthly Income** | **${expenses.get('total_income', 0.0):,.2f}** | Total baseline monthly inflows |
| **Monthly Expenses** | **${expenses.get('total_expenses', 0.0):,.2f}** | Total monthly outflows |
| **Net Monthly Savings** | **${expenses.get('net_savings', 0.0):,.2f}** | Inflow minus Outflow |
| **Savings Rate** | **{expenses.get('savings_rate', 0.0):.1f}%** | Target is generally > 20% |

"""

    # Add warning alert for low savings
    if expenses.get('savings_rate', 0.0) < 10.0:
        report += f"""
> [!WARNING]
> Your current savings rate is **{expenses.get('savings_rate', 0.0):.1f}%**, which is below the recommended 10-20% threshold. We have flagged optimization opportunities below.
"""
    elif expenses.get('savings_rate', 0.0) >= 20.0:
        report += f"""
> [!NOTE]
> Excellent! Your savings rate of **{expenses.get('savings_rate', 0.0):.1f}%** exceeds the target benchmark. You have strong capital to deploy toward goals.
"""

    # Spending category breakdown
    report += "\n### Spending by Category:\n"
    for cat, val in expenses.get('category_breakdown', {}).items():
        report += f"- **{cat}**: ${val:,.2f}\n"
        
    if expenses.get("anomalies"):
        report += "\n#### ⚠️ Large Outflows Detected:\n"
        for anom in expenses["anomalies"]:
            report += f"- **${anom['amount']:,.2f}** spent on *{anom['description']}* ({anom['category']}) on {anom['date']}\n"

    # Budget allocation
    report += f"""
---

## 📝 2. Budget Structure & Rules (50/30/20)
Comparing your spending categories to the classical 50/30/20 framework:
- **Needs (50% Target)**: Spent **${budget.get('actual_50_30_20', {}).get('Needs', 0.0):,.2f}** (Ideal limit: ${budget.get('ideal_50_30_20', {}).get('Needs (50%)', 0.0):,.2f})
- **Wants (30% Target)**: Spent **${budget.get('actual_50_30_20', {}).get('Wants', 0.0):,.2f}** (Ideal limit: ${budget.get('ideal_50_30_20', {}).get('Wants (30%)', 0.0):,.2f})
- **Savings (20% Target)**: Retained **${budget.get('actual_50_30_20', {}).get('Savings & Debt', 0.0):,.2f}** (Ideal allocation: ${budget.get('ideal_50_30_20', {}).get('Savings & Debt (20%)', 0.0):,.2f})
"""

    if budget.get("budget_alerts"):
        report += "\n### 🚨 Budget Overruns & Alerts:\n"
        for alert in budget["budget_alerts"]:
            report += f"- {alert}\n"

    # Savings Optimization
    report += f"""
---

## ⚡ 3. Savings Optimization Opportunities
- **Subscriptions Analysis**: You spend a total of **${savings.get('total_subscription_spend', 0.0):,.2f}** monthly on recurring subscription packages.
- **Emergency Reserve Target**: Based on your bills, your target 6-month emergency reserve is **${savings.get('target_emergency_fund', 0.0):,.2f}**. Keep this in a High-Yield Savings Account (HYSA).

### Recommended Actions:
"""
    for tip in savings.get("savings_optimization_tips", []):
        report += f"- {tip}\n"
    if not savings.get("savings_optimization_tips"):
        report += "- Your spending is clean! Maintain current habits and focus on compounding.\n"

    # Investments
    report += f"""
---

## 📈 4. Personalized Investment Recommendations
Based on your age (**{profile.get('age', 30)}**) and **{profile.get('risk_tolerance', 'Medium')}** risk tolerance, we recommend a **{investments.get('equity_ratio', 60)}% Equity** balanced allocation model:
"""

    for asset, pct in investments.get("suggested_allocation", {}).items():
        report += f"- **{asset}**: {pct}%\n"

    report += "\n### Recommended ETF Building Blocks:\n"
    for etf in investments.get("etf_portfolio", []):
        report += f"- **{etf['name']}** (*{etf['type']}*): Expense Ratio: {etf['expense_ratio']}. {etf['description']}\n"

    # Goals
    report += """
---

## 🎯 5. Goal Projections & Velocity Tracking
"""
    if goals.get("goal_reports"):
        report += "\n| Goal | Target Amount | Current | Remaining | Months Left | Required Monthly | Status |\n"
        report += "| :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n"
        for r in goals["goal_reports"]:
            report += f"| {r['name']} | ${r['target']:,.2f} | ${r['current']:,.2f} | ${r['needed']:,.2f} | {r['months_remaining']} | ${r['required_monthly_savings']:,.2f} | **{r['status']}** |\n"
    else:
        report += "\n*No financial goals configured yet. Add goals in the dashboard to enable predictive velocity tracking.*"

    report += f"""
---

### 💡 Advisor Summary Note
To accomplish all goals, you require a total monthly savings velocity of **${sum(g['required_monthly_savings'] for g in goals.get('goal_reports', [])):,.2f}**. 
Your current net monthly savings capability is **${expenses.get('net_savings', 0.0):,.2f}**. 
"""

    if expenses.get('net_savings', 0.0) < sum(g['required_monthly_savings'] for g in goals.get('goal_reports', [])):
        report += "\n> [!CAUTION]\n> **Action Required**: Your current net savings capacity is insufficient to meet all target timelines. Consider extending goal dates or trimming discretionary 'Wants' spending."
    else:
        report += "\n> [!TIP]\n> **Status Clear**: Your current cashflow surplus comfortably covers your goal trajectory requirements. Reinvest any excess surplus in the core ETFs suggested above."

    return {
        "recommendations": {
            "markdown_report": report.strip(),
            "compiled_at": datetime.now().isoformat()
        },
        "current_node": "compile_report"
    }

# Build State Machine
workflow = StateGraph(FinanceState)

# Add Nodes
workflow.add_node("categorize_transactions", categorize_transactions_node)
workflow.add_node("analyze_expenses", analyze_expenses_node)
workflow.add_node("plan_budget", plan_budget_node)
workflow.add_node("optimize_savings", optimize_savings_node)
workflow.add_node("recommend_investments", recommend_investments_node)
workflow.add_node("track_goals", track_goals_node)
workflow.add_node("compile_report", compile_report_node)

# Set Entry Point
workflow.set_entry_point("categorize_transactions")

# Define Transitions
workflow.add_edge("categorize_transactions", "analyze_expenses")
workflow.add_edge("analyze_expenses", "plan_budget")
workflow.add_edge("plan_budget", "optimize_savings")
workflow.add_edge("optimize_savings", "recommend_investments")
workflow.add_edge("recommend_investments", "track_goals")
workflow.add_edge("track_goals", "compile_report")
workflow.add_edge("compile_report", END)

# Compile Agent Graph
finance_agent = workflow.compile()
