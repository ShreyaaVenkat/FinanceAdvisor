from pydantic import BaseModel, EmailStr, Field
from datetime import date, datetime
from typing import Optional, List, Dict, Any

# Auth Schemas
class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, description="Password must be at least 6 characters")

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# Profile Schemas
class ProfileCreate(BaseModel):
    annual_income: float = Field(0.0, ge=0)
    risk_tolerance: str = Field("Medium", pattern="^(Low|Medium|High)$")
    investment_experience: str = Field("None", pattern="^(None|Basic|Advanced)$")
    age: int = Field(30, ge=18, le=120)

class ProfileResponse(BaseModel):
    id: int
    user_id: int
    annual_income: float
    risk_tolerance: str
    investment_experience: str
    age: int

    class Config:
        from_attributes = True

# Transaction Schemas
class TransactionCreate(BaseModel):
    amount: float = Field(..., gt=0)
    category: str = Field(..., min_length=1)
    date: date
    type: str = Field(..., pattern="^(income|expense)$")
    description: str = Field(..., min_length=1)

class TransactionResponse(BaseModel):
    id: int
    user_id: int
    amount: float
    category: str
    date: date
    type: str
    description: str

    class Config:
        from_attributes = True
        
    @classmethod
    def model_validate(cls, obj, **kwargs):
        # Handle properties like description custom getter
        data = {
            "id": obj.id,
            "user_id": obj.user_id,
            "amount": obj.amount,
            "category": obj.category,
            "date": obj.date,
            "type": obj.type,
            "description": obj.description  # Calls decrypt property
        }
        return cls(**data)

# Budget Schemas
class BudgetCreate(BaseModel):
    category: str = Field(..., min_length=1)
    limit_amount: float = Field(..., gt=0)
    spent_amount: float = Field(0.0, ge=0)
    period: str = Field("monthly")

class BudgetUpdate(BaseModel):
    limit_amount: Optional[float] = Field(None, gt=0)
    spent_amount: Optional[float] = Field(None, ge=0)

class BudgetResponse(BaseModel):
    id: int
    user_id: int
    category: str
    limit_amount: float
    spent_amount: float
    period: str

    class Config:
        from_attributes = True

# Goal Schemas
class GoalCreate(BaseModel):
    name: str = Field(..., min_length=1)
    target_amount: float = Field(..., gt=0)
    current_amount: float = Field(0.0, ge=0)
    target_date: date

class GoalUpdate(BaseModel):
    current_amount: Optional[float] = Field(None, ge=0)
    target_amount: Optional[float] = Field(None, gt=0)
    target_date: Optional[date] = None

class GoalResponse(BaseModel):
    id: int
    user_id: int
    name: str
    target_amount: float
    current_amount: float
    target_date: date

    class Config:
        from_attributes = True

# Chat Schemas
class ChatMessage(BaseModel):
    sender: str  # "user" or "ai"
    text: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class ChatRequest(BaseModel):
    message: str
    history: List[ChatMessage] = []

class ChatResponse(BaseModel):
    reply: str
    state_updates: Optional[Dict[str, Any]] = None
