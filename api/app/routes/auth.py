from fastapi import APIRouter, HTTPException, status
from datetime import timedelta
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
    
    # Create user
    user_dict = user_data.model_dump()
    user_dict["password_hash"] = get_password_hash(user_data.password)
    del user_dict["password"]
    user_dict["role"] = "citizen"
    user_dict["verified"] = False
    user_dict["blocked"] = False
    
    from datetime import datetime
    user_dict["created_at"] = datetime.utcnow()
    
    result = await users_collection.insert_one(user_dict)
    user_dict["_id"] = result.inserted_id
    
    # Create token
    access_token = create_access_token(
        data={"sub": str(result.inserted_id)},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    return Token(
        access_token=access_token,
        user={"id": str(result.inserted_id), "email": user_data.email, "name": user_data.name},
        role="citizen"
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
