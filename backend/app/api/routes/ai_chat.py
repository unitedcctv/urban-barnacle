"""AI chat endpoint using pgvector similarity search."""
from __future__ import annotations
from typing import AsyncGenerator

import openai
import psycopg
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import StreamingResponse
import logging
from typing import AsyncGenerator

from app.ai.settings import settings as ai_settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/ai", tags=["ai"])
openai.api_key = ai_settings.OPENAI_API_KEY


def _top_context(q: str, k: int = 4) -> str:
    """Retrieve top k relevant chunks from the database using vector similarity."""
    try:
        if not q or not q.strip():
            logger.warning("Empty query provided for context retrieval")
            return "No context available for empty query."
        
        # Create embedding for the query
        response = openai.embeddings.create(model="text-embedding-3-small", input=q)
        q_vec = response.data[0].embedding
        
        # Query database for similar chunks
        with psycopg.connect(ai_settings.DATABASE_URL) as conn:
            rows = conn.execute(
                "SELECT chunk FROM chunks ORDER BY vec <#> %s::vector LIMIT %s", (q_vec, k)
            ).fetchall()
        
        if not rows:
            logger.warning("No chunks found in database - chunks table may be empty")
            return "No relevant context found. Please ensure the business plan content has been populated."
        
        context = "\n\n".join(r[0] for r in rows)
        logger.info(f"Retrieved {len(rows)} chunks for query: {q[:50]}...")
        return context
        
    except Exception as e:
        logger.error(f"Error retrieving context: {str(e)}")
        if "relation \"chunks\" does not exist" in str(e):
            return "Database not properly initialized. Please populate the chunks table first."
        elif "operator does not exist" in str(e):
            return "Vector extension not enabled. Please enable pgvector extension."
        else:
            return f"Error retrieving context: {str(e)}"


@router.post("/chat")
async def chat(request: Request):
    """AI chat endpoint with comprehensive error handling."""
    try:
        # Parse and validate request body
        try:
            body = await request.json()
        except Exception as e:
            logger.error(f"Invalid JSON in request: {str(e)}")
            raise HTTPException(status_code=400, detail="Invalid JSON in request body")
        
        # Validate required fields
        if "message" not in body:
            raise HTTPException(status_code=400, detail="Missing 'message' field in request")
        
        query: str = body["message"]
        if not query or not query.strip():
            raise HTTPException(status_code=400, detail="Message cannot be empty")
        
        if len(query) > 2000:  # Reasonable limit
            raise HTTPException(status_code=400, detail="Message too long (max 2000 characters)")
        
        logger.info(f"Processing chat query: {query[:100]}...")
        
        # Retrieve context with error handling
        context = _top_context(query)
        
        # Check if context retrieval failed
        if context.startswith("Error") or context.startswith("No relevant context") or context.startswith("Database not"):
            # Return error as a non-streaming response for better error handling
            raise HTTPException(status_code=500, detail=context)
        
        # Create OpenAI chat completion stream
        try:
            stream = openai.chat.completions.create(
                model="gpt-4o-mini",
                stream=True,
                messages=[
                    {
                        "role": "system",
                        "content": "Answer ONLY from the business-plan context provided. If the context doesn't contain relevant information, say you don't know. Be helpful and concise.",
                    },
                    {"role": "user", "content": f"{query}\n\nContext:\n{context}"},
                ],
                max_tokens=1000,  # Reasonable limit
                temperature=0.7,
            )
        except Exception as e:
            logger.error(f"OpenAI API error: {str(e)}")
            if "api_key" in str(e).lower():
                raise HTTPException(status_code=500, detail="OpenAI API key not configured properly")
            elif "rate_limit" in str(e).lower():
                raise HTTPException(status_code=429, detail="Rate limit exceeded. Please try again later.")
            else:
                raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")
        
        # Stream response with error handling
        async def gen() -> AsyncGenerator[bytes, None]:
            try:
                for chunk in stream:
                    if chunk.choices and len(chunk.choices) > 0:
                        content = chunk.choices[0].delta.content or ""
                        if content:
                            yield content.encode()
            except Exception as e:
                logger.error(f"Error in streaming response: {str(e)}")
                error_msg = f"\n\n[Error: {str(e)}]"
                yield error_msg.encode()
        
        return StreamingResponse(gen(), media_type="text/plain")
        
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        logger.error(f"Unexpected error in chat endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Unexpected server error: {str(e)}")
