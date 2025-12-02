from pydantic import BaseModel, EmailStr, Field, field_validator
from pydantic_core import core_schema
from typing import Optional, List, Any
from datetime import datetime
from bson import ObjectId

class PyObjectId(str):
    @classmethod
    def __get_pydantic_core_schema__(cls, _source_type: Any, _handler):
        return core_schema.json_or_python_schema(
            json_schema=core_schema.str_schema(),
            python_schema=core_schema.union_schema([
                core_schema.is_instance_schema(ObjectId),
                core_schema.chain_schema([
                    core_schema.str_schema(),
                    core_schema.no_info_plain_validator_function(cls.validate),
                ])
            ]),
            serialization=core_schema.plain_serializer_function_ser_schema(
                lambda x: str(x)
            ),
        )

    @classmethod
    def validate(cls, v):
        if isinstance(v, ObjectId):
            return v
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return ObjectId(v)

# User Models
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    phone: Optional[str] = None
    name: Optional[str] = None
    full_name: Optional[str] = None
    badge_number: Optional[str] = None
    requested_role: Optional[str] = None  # For police registration requests

class UserLogin(BaseModel):
    email: str
    password: str

class User(BaseModel):
    model_config = {"populate_by_name": True, "arbitrary_types_allowed": True}
    
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    email: str
    phone: Optional[str] = None
    name: Optional[str] = None
    full_name: Optional[str] = None
    badge_number: Optional[str] = None
    role: str = "citizen"
    requested_role: Optional[str] = None
    role_approved: bool = False
    verified: bool = False
    blocked: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

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
    model_config = {"populate_by_name": True, "arbitrary_types_allowed": True}
    
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

# Cluster Models
class Cluster(BaseModel):
    model_config = {"populate_by_name": True, "arbitrary_types_allowed": True}
    
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    cluster_id: int
    center: Location
    radius: float
    points: List[str]  # Report IDs
    riskLevel: str = "medium"
    timestamp: datetime = Field(default_factory=datetime.utcnow)

# Chat Models
class Message(BaseModel):
    senderId: str
    text: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    read: bool = False

class ChatCreate(BaseModel):
    reportId: str

class Chat(BaseModel):
    model_config = {"populate_by_name": True, "arbitrary_types_allowed": True}
    
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    reportId: str
    participants: List[str] = []
    lastMessage: str = ""
    lastMessageTime: datetime = Field(default_factory=datetime.utcnow)
    createdAt: datetime = Field(default_factory=datetime.utcnow)

# Alert Models
class AlertCreate(BaseModel):
    message: str
    area: dict  # {center: {lat, lng}, radius: float}

class Alert(BaseModel):
    model_config = {"populate_by_name": True, "arbitrary_types_allowed": True}
    
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    message: str
    area: dict
    senderId: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

# Token Models
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict
    role: str
