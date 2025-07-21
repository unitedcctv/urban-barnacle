#!/usr/bin/env python3
"""Script to populate the chunks table with business plan content from Google Drive."""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.ai.drive_sync import export_doc
from app.ai.embeddings import rebuild_chunks

def main():
    try:
        print("Exporting business plan from Google Drive...")
        doc_path = export_doc()
        print(f"Document exported to: {doc_path}")
        
        print("Rebuilding chunks with embeddings...")
        rebuild_chunks(doc_path)
        print("Done! Chunks table should now be populated.")
        
        # Verify the chunks were created
        import psycopg
        from app.ai.settings import settings as ai_settings
        
        with psycopg.connect(ai_settings.DATABASE_URL) as conn:
            result = conn.execute("SELECT COUNT(*) FROM chunks;").fetchone()
            print(f"Chunks table now contains {result[0]} rows.")
            
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
