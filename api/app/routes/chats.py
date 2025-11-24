from fastapi import APIRouter, HTTPException
from typing import List
from datetime import datetime
from bson import ObjectId
from ..models import ChatCreate, Message
from ..database import get_chats_collection
from pymongo import ReturnDocument

router = APIRouter()

@router.post("/start")
async def start_chat(chat_data: ChatCreate):
    chats_collection = get_chats_collection()
    
    # Check if chat already exists for this report
    existing_chat = await chats_collection.find_one({"reportId": chat_data.reportId})
    if existing_chat:
        return {"chatId": str(existing_chat["_id"]), "message": "Chat already exists"}
    
    # Create new chat
    chat_doc = {
        "reportId": chat_data.reportId,
        "participants": [],
        "messages": [],
        "lastMessage": "Chat started",
        "lastMessageTime": datetime.utcnow(),
        "createdAt": datetime.utcnow()
    }
    
    result = await chats_collection.insert_one(chat_doc)
    
    return {"chatId": str(result.inserted_id)}

@router.post("/send")
async def send_message(chatId: str, senderId: str, text: str):
    chats_collection = get_chats_collection()
    
    message = {
        "senderId": senderId,
        "text": text,
        "timestamp": datetime.utcnow(),
        "read": False
    }
    
    result = await chats_collection.find_one_and_update(
        {"_id": ObjectId(chatId)},
        {
            "$push": {"messages": message},
            "$set": {
                "lastMessage": text,
                "lastMessageTime": datetime.utcnow()
            }
        },
        return_document=ReturnDocument.AFTER
    )
    
    if not result:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    return {"status": "success"}

@router.get("/{chat_id}/messages")
async def get_messages(chat_id: str):
    chats_collection = get_chats_collection()
    
    try:
        chat = await chats_collection.find_one({"_id": ObjectId(chat_id)})
        if not chat:
            raise HTTPException(status_code=404, detail="Chat not found")
        
        return chat.get("messages", [])
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid chat ID")

@router.get("/list")
async def get_all_chats():
    chats_collection = get_chats_collection()
    
    cursor = chats_collection.find().sort("lastMessageTime", -1)
    chats = []
    
    async for chat in cursor:
        chat["id"] = str(chat["_id"])
        del chat["_id"]
        # Remove full messages array from list view
        chat["messageCount"] = len(chat.get("messages", []))
        if "messages" in chat:
            del chat["messages"]
        chats.append(chat)
    
    return chats
