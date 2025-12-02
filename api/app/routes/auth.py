from fastapi import APIRouter, HTTPException, status
from datetime import timedelta, datetime
from ..models import UserCreate, UserLogin, Token, User
from ..database import get_users_collection
from ..auth import get_password_hash, verify_password, create_access_token
from ..config import settings

router = APIRouter()

@router.post("/register", response_model=Token)
async def register(user_data: UserCreate):
    users_collection = get_users_collection()
    
    # Check if user exists
    existing_user = await users_collection.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create user document
    user_dict = {
        "email": user_data.email,
        "password_hash": get_password_hash(user_data.password),
        "phone": user_data.phone,
        "name": user_data.name or user_data.full_name,
        "full_name": user_data.full_name,
        "role": "citizen",  # Default role
        "verified": False,
        "blocked": False,
        "role_approved": False,
        "created_at": datetime.utcnow()
    }
    
    # Handle police registration request
    if user_data.requested_role == "police":
        user_dict["requested_role"] = "police"
        user_dict["badge_number"] = user_data.badge_number
        user_dict["role_approved"] = False  # Needs admin approval
    
    result = await users_collection.insert_one(user_dict)
    user_dict["_id"] = result.inserted_id
    
    # Create token
    access_token = create_access_token(
        data={"sub": str(result.inserted_id)},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    return Token(
        access_token=access_token,
        user={
            "id": str(result.inserted_id),
            "email": user_data.email,
            "name": user_data.name or user_data.full_name,
            "phone": user_data.phone
        },
        role=user_dict["role"]
    )

@router.post("/login", response_model=Token)
async def login(credentials: UserLogin):
    users_collection = get_users_collection()
    
    # Find user
    user = await users_collection.find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user.get("password_hash", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    if user.get("blocked"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is blocked"
        )
    
    # Create token
    access_token = create_access_token(
        data={"sub": str(user["_id"])},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    return Token(
        access_token=access_token,
        user={
            "id": str(user["_id"]),
            "email": user["email"],
            "name": user.get("name"),
            "phone": user.get("phone")
        },
        role=user.get("role", "citizen")
    )

@router.post("/verify")
async def verify_user(code: str):
    # Placeholder for email/phone verification
    return {"message": "Verification successful"}

@router.get("/user")
async def get_current_user_info():
    return {"message": "User info endpoint"}
