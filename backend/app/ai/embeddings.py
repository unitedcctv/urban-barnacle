"""Chunking the business plan and storing embeddings in PostgreSQL/pgvector."""
from __future__ import annotations

import textwrap
from pathlib import Path

import openai
import psycopg

from app.ai.settings import settings as ai_settings

openai.api_key = ai_settings.OPENAI_API_KEY

EMBED_MODEL = "text-embedding-3-small"
CHUNK_CHARS = 1200  # ~ 512 tokens


def rebuild_chunks(txt_path: Path) -> None:
    """Truncate `chunks` table then embed & insert fresh rows."""
    txt = txt_path.read_text()

    with psycopg.connect(ai_settings.DATABASE_URL) as conn, conn.cursor() as cur:
        cur.execute("TRUNCATE TABLE chunks;")

        for para in textwrap.wrap(txt, CHUNK_CHARS):
            resp = openai.embeddings.create(model=EMBED_MODEL, input=para)
            vec = resp.data[0].embedding
            cur.execute(
                "INSERT INTO chunks(chunk, vec) VALUES (%s, %s)",
                (para, vec),
            )
        conn.commit()
