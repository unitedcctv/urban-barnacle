"""AI chat endpoint using pgvector similarity search."""
from __future__ import annotations
import os
from typing import AsyncGenerator

import openai
import psycopg
from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse

from app.ai.settings import settings as ai_settings

router = APIRouter(prefix="/ai", tags=["ai"])
openai.api_key = os.getenv("OPENAI_API_KEY")


def _top_context(q: str, k: int = 4) -> str:
    q_vec = (
        openai.embeddings.create(model="text-embedding-3-small", input=q)[
            "data"
        ][0]["embedding"]
    )
    with psycopg.connect(ai_settings.DATABASE_URL) as conn:
        rows = conn.execute(
            "SELECT chunk FROM chunks ORDER BY vec <#> %s LIMIT %s", (q_vec, k)
        ).fetchall()
    return "\n\n".join(r[0] for r in rows)


@router.post("/chat")
async def chat(request: Request):
    body = await request.json()
    query: str = body["message"]
    context = _top_context(query)

    stream = openai.chat.completions.create(
        model="gpt-4o-mini",
        stream=True,
        messages=[
            {
                "role": "system",
                "content": "Answer ONLY from the business-plan. If unsure, say you don’t know.",
            },
            {"role": "user", "content": f"{query}\n\nContext:\n{context}"},
        ],
    )

    async def gen() -> AsyncGenerator[bytes, None]:
        for chunk in stream:
            content = chunk.choices[0].delta.content or ""
            if content:
                yield content.encode()

    return StreamingResponse(gen(), media_type="text/plain")
