from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from bson import ObjectId

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return ObjectId(v)

    @classmethod
    def __modify_schema__(cls, field_schema):
        field_schema.update(type="string")

# User Models
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    phone: Optional[str] = None
    name: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str

class User(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    email: str
    phone: Optional[str] = None
    name: Optional[str] = None
    role: str = "citizen"
    verified: bool = False
    blocked: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}

# Report Models
class Location(BaseModel):
    lat: float
    lng: float

class ReportCreate(BaseModel):
    category: str
    description: str
    location: Location
    photoUrl: Optional[str] = None
    userId: Optional[str] = "anonymous"

class Report(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    category: str
    description: str
    location: Location
    photoUrl: Optional[str] = None
    userId: str = "anonymous"
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    status: str = "new"
    credibilityScore: float = 0.0
    flagged: bool = False
    
    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}

# Cluster Models
class Cluster(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    cluster_id: int
    center: Location
    radius: float
    points: List[str]  # Report IDs
    riskLevel: str = "medium"
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}

# Chat Models
class Message(BaseModel):
    senderId: str
    text: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    read: bool = False

class ChatCreate(BaseModel):
    reportId: str

class Chat(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    reportId: str
    participants: List[str] = []
    lastMessage: str = ""
    lastMessageTime: datetime = Field(default_factory=datetime.utcnow)
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}

# Alert Models
class AlertCreate(BaseModel):
    message: str
    area: dict  # {center: {lat, lng}, radius: float}

class Alert(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    message: str
    area: dict
    senderId: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}

# Token Models
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict
    role: str
