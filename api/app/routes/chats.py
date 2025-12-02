from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from datetime import datetime
from bson import ObjectId
from pydantic import BaseModel
from ..models import ChatCreate, Message
from ..database import get_chats_collection, get_reports_collection, get_users_collection
from ..auth import get_current_active_user
from pymongo import ReturnDocument

router = APIRouter()

class SendMessageRequest(BaseModel):
    chatId: str
    text: str

@router.post("/start")
async def start_chat(
    chat_data: ChatCreate,
    current_user: dict = Depends(get_current_active_user)
):
    chats_collection = get_chats_collection()
    reports_collection = get_reports_collection()
    
    # Get report info
    report = await reports_collection.find_one({"_id": ObjectId(chat_data.reportId)}) if ObjectId.is_valid(chat_data.reportId) else None
    
    # Check if chat already exists for this report
    existing_chat = await chats_collection.find_one({"reportId": chat_data.reportId})
    if existing_chat:
        return {
            "chatId": str(existing_chat["_id"]),
            "message": "Chat already exists"
        }
    
    user_id = str(current_user.get("_id", ""))
    user_name = current_user.get("name", current_user.get("email", "Unknown"))
    
    # Create new chat
    chat_doc = {
        "reportId": chat_data.reportId,
        "reportReference": report.get("referenceNumber") if report else None,
        "reportCategory": report.get("category") if report else None,
        "citizenId": report.get("userId") if report else user_id,
        "participants": [user_id],
        "messages": [{
            "senderId": "system",
            "senderName": "System",
            "text": f"Chat started by {user_name}",
            "timestamp": datetime.utcnow(),
            "read": False
        }],
        "lastMessage": "Chat started",
        "lastMessageTime": datetime.utcnow(),
        "createdAt": datetime.utcnow(),
        "status": "active"
    }
    
    result = await chats_collection.insert_one(chat_doc)
    
    return {"chatId": str(result.inserted_id)}

@router.post("/send")
async def send_message(
    message_data: SendMessageRequest,
    current_user: dict = Depends(get_current_active_user)
):
    chats_collection = get_chats_collection()
    
    user_id = str(current_user.get("_id", ""))
    user_name = current_user.get("name", current_user.get("email", "Unknown"))
    user_role = current_user.get("role", "citizen")
    
    message = {
        "senderId": user_id,
        "senderName": user_name,
        "senderRole": user_role,
        "text": message_data.text,
        "timestamp": datetime.utcnow(),
        "read": False
    }
    
    result = await chats_collection.find_one_and_update(
        {"_id": ObjectId(message_data.chatId)},
        {
            "$push": {"messages": message},
            "$addToSet": {"participants": user_id},
            "$set": {
                "lastMessage": message_data.text,
                "lastMessageTime": datetime.utcnow()
            }
        },
        return_document=ReturnDocument.AFTER
    )
    
    if not result:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    return {"status": "success", "message": message}

@router.get("/{chat_id}/messages")
async def get_messages(
    chat_id: str,
    current_user: dict = Depends(get_current_active_user)
):
    chats_collection = get_chats_collection()
    
    try:
        chat = await chats_collection.find_one({"_id": ObjectId(chat_id)})
        if not chat:
            raise HTTPException(status_code=404, detail="Chat not found")
        
        # Mark messages as read for this user
        user_id = str(current_user.get("_id", ""))
        await chats_collection.update_one(
            {"_id": ObjectId(chat_id)},
            {"$set": {"messages.$[elem].read": True}},
            array_filters=[{"elem.senderId": {"$ne": user_id}}]
        )
        
        return {
            "messages": chat.get("messages", []),
            "reportReference": chat.get("reportReference"),
            "reportCategory": chat.get("reportCategory")
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/list")
async def get_all_chats(current_user: dict = Depends(get_current_active_user)):
    chats_collection = get_chats_collection()
    
    user_id = str(current_user.get("_id", ""))
    user_role = current_user.get("role", "citizen")
    
    # Citizens only see their own chats, police/admin see all
    query = {}
    if user_role == "citizen":
        query["$or"] = [
            {"citizenId": user_id},
            {"participants": user_id}
        ]
    
    cursor = chats_collection.find(query).sort("lastMessageTime", -1)
    chats = []
    
    async for chat in cursor:
        chat["id"] = str(chat["_id"])
        del chat["_id"]
        
        # Count unread messages for this user
        unread_count = sum(
            1 for msg in chat.get("messages", [])
            if not msg.get("read") and msg.get("senderId") != user_id
        )
        chat["unreadCount"] = unread_count
        chat["messageCount"] = len(chat.get("messages", []))
        
        # Remove full messages array from list view
        if "messages" in chat:
            del chat["messages"]
        chats.append(chat)
    
    return chats

@router.put("/{chat_id}/close")
async def close_chat(
    chat_id: str,
    current_user: dict = Depends(get_current_active_user)
):
    """Close a chat (police/admin only)"""
    if current_user.get("role") not in ["police", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    chats_collection = get_chats_collection()
    
    result = await chats_collection.update_one(
        {"_id": ObjectId(chat_id)},
        {"$set": {"status": "closed", "closedAt": datetime.utcnow()}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    return {"message": "Chat closed successfully"}
