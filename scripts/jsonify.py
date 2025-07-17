#!/usr/bin/env python3
"""Convert a JSON file to a single-line JSON string for environment variables."""

import json
import sys
from pathlib import Path

def jsonify_file(filename):
    """Read a JSON file and output it as a single-line JSON string."""
    
    json_file = Path(filename)
    
    if not json_file.exists():
        print(f"❌ File not found: {filename}")
        return False
    
    try:
        # Read and parse the JSON file
        with open(json_file, 'r') as f:
            data = json.load(f)
        
        # Convert to single-line JSON string (compact format)
        json_string = json.dumps(data, separators=(',', ':'))
        
        print("✅ JSON file successfully converted!")
        print(f"File: {filename}")
        print(f"Length: {len(json_string)} characters")
        print("\n--- COPY THE LINE BELOW FOR YOUR .env FILE ---")
        print(json_string)
        print("--- END ---\n")
        
        return True
        
    except json.JSONDecodeError as e:
        print(f"❌ Invalid JSON in file {filename}: {e}")
        return False
    except Exception as e:
        print(f"❌ Error reading file {filename}: {e}")
        return False

def main():
    """Main function to handle command line arguments."""
    if len(sys.argv) != 2:
        print("Usage: python jsonify.py <json_file>")
        print("Example: python jsonify.py service_account.json")
        sys.exit(1)
    
    filename = sys.argv[1]
    success = jsonify_file(filename)
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
