from fastapi import APIRouter, HTTPException, status
from datetime import timedelta, datetime
from typing import Optional
from pydantic import BaseModel
from ..models import UserCreate, UserLogin, Token, User
from ..database import get_users_collection
from ..auth import get_password_hash, verify_password, create_access_token
from ..config import settings

router = APIRouter()


class PortalLogin(BaseModel):
    email: str
    password: str
    portal: Optional[str] = None  # "citizen", "police", "admin"


class PoliceRegister(BaseModel):
    email: str
    password: str
    full_name: str
    phone: str
    badge_number: str


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
        "role": "citizen",  # Default role for citizen registration
        "verified": False,
        "blocked": False,
        "role_approved": True,  # Citizens are auto-approved
        "created_at": datetime.utcnow()
    }
    
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


@router.post("/register/police", response_model=Token)
async def register_police(user_data: PoliceRegister):
    """Register as a police officer - role is set to police immediately"""
    users_collection = get_users_collection()
    
    # Check if user exists
    existing_user = await users_collection.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create police user document
    user_dict = {
        "email": user_data.email,
        "password_hash": get_password_hash(user_data.password),
        "phone": user_data.phone,
        "name": user_data.full_name,
        "full_name": user_data.full_name,
        "role": "police",  # Set role to police directly
        "badge_number": user_data.badge_number,
        "verified": True,
        "blocked": False,
        "role_approved": True,  # Police approved on registration
        "created_at": datetime.utcnow()
    }
    
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
            "name": user_data.full_name,
            "phone": user_data.phone,
            "badge_number": user_data.badge_number
        },
        role="police"
    )


@router.post("/login", response_model=Token)
async def login(credentials: UserLogin):
    """General login - returns user with their actual role"""
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


@router.post("/login/citizen", response_model=Token)
async def login_citizen(credentials: UserLogin):
    """Login for citizen portal - only allows citizens"""
    users_collection = get_users_collection()
    
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
    
    user_role = user.get("role", "citizen")
    
    # Only allow citizens to login via citizen portal
    if user_role != "citizen":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied. You are registered as {user_role}. Please use the {user_role} portal to login."
        )
    
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
        role="citizen"
    )


@router.post("/login/police", response_model=Token)
async def login_police(credentials: UserLogin):
    """Login for police portal - only allows police officers"""
    users_collection = get_users_collection()
    
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
    
    user_role = user.get("role", "citizen")
    
    # Only allow police to login via police portal
    if user_role != "police":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied. You are registered as {user_role}. Please use the {user_role} portal to login."
        )
    
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
            "phone": user.get("phone"),
            "badge_number": user.get("badge_number")
        },
        role="police"
    )


@router.post("/login/admin", response_model=Token)
async def login_admin(credentials: UserLogin):
    """Login for admin portal - only allows admins"""
    users_collection = get_users_collection()
    
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
    
    user_role = user.get("role", "citizen")
    
    # Only allow admin to login via admin portal
    if user_role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied. Admin credentials required. You are registered as {user_role}."
        )
    
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
        role="admin"
    )


@router.post("/verify")
async def verify_user(code: str):
    # Placeholder for email/phone verification
    return {"message": "Verification successful"}

@router.get("/user")
async def get_current_user_info():
    return {"message": "User info endpoint"}
