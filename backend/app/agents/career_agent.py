from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.entities import Conversation, Message
from app.agents.graph import career_agent_graph

class CareerAgentRunner:
    def chat(self, db: Session, user_id: str, message: str, conversation_id: Optional[str] = None) -> Dict[str, Any]:
        # Retrieve or create conversation
        if conversation_id:
            conv = db.query(Conversation).filter(Conversation.id == conversation_id, Conversation.user_id == user_id).first()
        else:
            conv = None

        if not conv:
            conv = Conversation(
                user_id=user_id,
                title=message[:40] + ("..." if len(message) > 40 else "")
            )
            db.add(conv)
            db.commit()
            db.refresh(conv)

        # Save user message
        user_msg = Message(
            conversation_id=conv.id,
            role="user",
            content=message
        )
        db.add(user_msg)
        db.commit()

        # Execute LangGraph Agent
        initial_state = {
            "db": db,
            "user_id": user_id,
            "user_input": message,
            "candidate_profile": None,
            "intent": "",
            "tool_calls": [],
            "tool_results": [],
            "final_response": ""
        }

        result = career_agent_graph.invoke(initial_state)
        response_text = result.get("final_response", "I've analyzed your career profile and opportunities.")
        tool_calls_data = result.get("tool_calls", [])

        # Save assistant message
        assistant_msg = Message(
            conversation_id=conv.id,
            role="assistant",
            content=response_text,
            tool_calls=tool_calls_data
        )
        db.add(assistant_msg)
        db.commit()
        db.refresh(assistant_msg)

        return {
            "conversation_id": conv.id,
            "message_id": assistant_msg.id,
            "role": "assistant",
            "content": response_text,
            "tool_calls": tool_calls_data,
            "created_at": assistant_msg.created_at
        }

career_agent_runner = CareerAgentRunner()
