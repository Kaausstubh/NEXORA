from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.entities import User, Conversation, Message
from app.schemas.all_schemas import ChatMessageCreate, ChatMessageOut, ConversationOut
from app.api.deps import get_current_user
from app.agents.career_agent import career_agent_runner

router = APIRouter(prefix="/agent", tags=["AI Career Agent"])

@router.post("/chat", response_model=ChatMessageOut)
def chat_with_agent(
    payload: ChatMessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not payload.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    res = career_agent_runner.chat(
        db=db,
        user_id=current_user.id,
        message=payload.message.strip(),
        conversation_id=payload.conversation_id
    )

    return ChatMessageOut(
        id=res["message_id"],
        role=res["role"],
        content=res["content"],
        tool_calls=res["tool_calls"],
        created_at=res["created_at"]
    )

@router.get("/conversations", response_model=List[ConversationOut])
def list_conversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    convs = db.query(Conversation).filter(Conversation.user_id == current_user.id).order_by(Conversation.updated_at.desc()).all()
    out = []
    for c in convs:
        out.append(ConversationOut(
            id=c.id,
            title=c.title,
            created_at=c.created_at,
            updated_at=c.updated_at,
            messages=[
                ChatMessageOut(
                    id=m.id,
                    role=m.role,
                    content=m.content,
                    tool_calls=m.tool_calls,
                    created_at=m.created_at
                ) for m in c.messages
            ]
        ))
    return out

@router.get("/conversations/{conversation_id}", response_model=ConversationOut)
def get_conversation(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    conv = db.query(Conversation).filter(Conversation.id == conversation_id, Conversation.user_id == current_user.id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found.")

    return ConversationOut(
        id=conv.id,
        title=conv.title,
        created_at=conv.created_at,
        updated_at=conv.updated_at,
        messages=[
            ChatMessageOut(
                id=m.id,
                role=m.role,
                content=m.content,
                tool_calls=m.tool_calls,
                created_at=m.created_at
            ) for m in conv.messages
        ]
    )
