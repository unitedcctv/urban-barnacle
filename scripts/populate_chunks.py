#!/usr/bin/env python3
"""Manual script to populate the chunks table with business plan data."""

import sys
import os
sys.path.append('backend')

from backend.app.ai.drive_sync import export_doc, rebuild_chunks

def main():
    """Export document and rebuild chunks table."""
    print("Exporting business plan document...")
    try:
        doc_path = export_doc()
        print(f"Document exported to: {doc_path}")
        
        print("Rebuilding chunks table...")
        rebuild_chunks(doc_path)
        print("Chunks table populated successfully!")
        
    except Exception as e:
        print(f"Error: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
