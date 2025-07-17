#!/usr/bin/env python3
"""Test script to validate GDRIVE_SERVICE_ACCOUNT_JSON format."""

import json
import os
from pathlib import Path

def test_json_format():
    """Test if the JSON in environment variable is valid."""
    # Load environment variables from .env file
    env_file = Path('.env')
    if env_file.exists():
        with open(env_file, 'r') as f:
            for line in f:
                line = line.strip()
                if line.startswith('GDRIVE_SERVICE_ACCOUNT_JSON='):
                    json_value = line.split('=', 1)[1]
                    
                    print(f"Found JSON value (first 100 chars): {json_value[:100]}...")
                    print(f"JSON value length: {len(json_value)}")
                    
                    try:
                        parsed = json.loads(json_value)
                        print("✅ JSON is valid!")
                        print(f"Service account type: {parsed.get('type')}")
                        print(f"Project ID: {parsed.get('project_id')}")
                        print(f"Client email: {parsed.get('client_email')}")
                        return True
                    except json.JSONDecodeError as e:
                        print(f"❌ JSON parsing error: {e}")
                        print(f"Error at position: {e.pos}")
                        if e.pos < len(json_value):
                            start = max(0, e.pos - 20)
                            end = min(len(json_value), e.pos + 20)
                            print(f"Context around error: ...{json_value[start:end]}...")
                        return False
                    break
    
    print("❌ GDRIVE_SERVICE_ACCOUNT_JSON not found in .env file")
    return False

if __name__ == "__main__":
    success = test_json_format()
    exit(0 if success else 1)
