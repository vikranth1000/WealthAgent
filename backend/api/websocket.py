"""WebSocket endpoint for streaming chat: /ws/chat/{client_id}.

Message protocol (PRD §6):
    → Client sends:  { "message": "...", "persona": "..." }
    ← Server sends:
      { "type": "agent_start", "agent": "portfolio_analyzer" }
      { "type": "chunk", "content": "..." }
      { "type": "agent_start", "agent": "comms" }
      { "type": "chunk", "content": "..." }
      { "type": "done", "report": { ... } }
      { "type": "error", "content": "..." }
"""

from __future__ import annotations

import json
import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy import select

from agents.orchestrator import run_orchestrator_streaming
from data.database import AsyncSessionLocal
from data.models import ChatMessage, Client

logger = logging.getLogger(__name__)

ws_router = APIRouter()


async def _get_chat_history(client_id: str, limit: int = 20) -> list[dict]:
    """Load recent chat history for context.

    Args:
        client_id: The client UUID.
        limit: Max number of recent messages to include.

    Returns:
        List of {role, content} dicts ordered oldest-first.
    """
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(ChatMessage)
            .where(ChatMessage.client_id == client_id)
            .order_by(ChatMessage.timestamp.desc())
            .limit(limit)
        )
        messages = result.scalars().all()

    # Reverse to chronological order
    return [
        {"role": m.role, "content": m.content}
        for m in reversed(messages)
    ]


async def _save_message(
    client_id: str,
    role: str,
    content: str,
    agent: str | None = None,
) -> None:
    """Persist a chat message to the database.

    Args:
        client_id: The client UUID.
        role: Message role (user/assistant/system).
        content: Message text.
        agent: Which agent produced this message (nullable).
    """
    async with AsyncSessionLocal() as session:
        msg = ChatMessage(
            client_id=client_id,
            role=role,
            content=content,
            agent=agent,
        )
        session.add(msg)
        await session.commit()


async def _validate_client(client_id: str) -> bool:
    """Check if a client exists in the database.

    Args:
        client_id: The client UUID to check.

    Returns:
        True if the client exists, False otherwise.
    """
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(Client.id).where(Client.id == client_id)
        )
        return result.scalar_one_or_none() is not None


@ws_router.websocket("/ws/chat/{client_id}")
async def websocket_chat(websocket: WebSocket, client_id: str) -> None:
    """WebSocket endpoint for streaming agent chat.

    Accepts a connection, then loops receiving messages and streaming
    orchestrator responses back to the client.

    Args:
        websocket: The FastAPI WebSocket connection.
        client_id: UUID of the client (from URL path).
    """
    await websocket.accept()
    logger.info("ws: client connected — client_id=%s", client_id)

    # Validate client exists
    if not await _validate_client(client_id):
        await websocket.send_json({
            "type": "error",
            "content": f"Client {client_id} not found",
        })
        await websocket.close(code=4004)
        return

    try:
        while True:
            # Receive message from client
            raw = await websocket.receive_text()
            try:
                data = json.loads(raw)
                message = data.get("message", "").strip()
                persona = data.get("persona", "").strip()
            except (json.JSONDecodeError, AttributeError):
                await websocket.send_json({
                    "type": "error",
                    "content": "Invalid message format. Expected: {\"message\": \"...\", \"persona\": \"...\"}",
                })
                continue

            if not message:
                await websocket.send_json({
                    "type": "error",
                    "content": "Empty message",
                })
                continue

            if not persona:
                persona = "young_professional"  # safe default

            logger.info(
                "ws: received message — client=%s persona=%s msg=%r",
                client_id, persona, message[:80],
            )

            # Save user message
            await _save_message(client_id, "user", message)

            # Load chat history for context
            chat_history = await _get_chat_history(client_id)

            # Stream orchestrator response
            full_response = ""
            final_agent = None

            async for event_type, event_data in run_orchestrator_streaming(
                client_id=client_id,
                query=message,
                persona=persona,
                chat_history=chat_history,
            ):
                if event_type == "agent_start":
                    await websocket.send_json({
                        "type": "agent_start",
                        "agent": event_data,
                    })

                elif event_type == "chunk":
                    full_response += event_data
                    await websocket.send_json({
                        "type": "chunk",
                        "content": event_data,
                    })

                elif event_type == "done":
                    final_state = event_data
                    report = final_state.get("client_report")
                    final_agent = final_state.get("current_agent")

                    await websocket.send_json({
                        "type": "done",
                        "report": report,
                    })

                elif event_type == "error":
                    await websocket.send_json({
                        "type": "error",
                        "content": event_data,
                    })

            # Save assistant response
            if full_response:
                await _save_message(
                    client_id, "assistant", full_response, agent=final_agent
                )

    except WebSocketDisconnect:
        logger.info("ws: client disconnected — client_id=%s", client_id)
    except Exception as exc:
        logger.error("ws: unexpected error for client %s: %s", client_id, exc)
        try:
            await websocket.send_json({
                "type": "error",
                "content": "Internal server error",
            })
        except Exception:
            pass
