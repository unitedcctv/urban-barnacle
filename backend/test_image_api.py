#!/usr/bin/env python3
"""
Test script for the new Image API
Demonstrates how to use the UUID-based image handling system
"""

import requests
import uuid
from pathlib import Path

# Configuration
BASE_URL = "http://localhost:8000/api/v1"
# You'll need to update these with valid credentials
EMAIL = "admin@example.com"
PASSWORD = "changethis"

def login(email: str, password: str) -> str:
    """Login and get access token"""
    response = requests.post(
        f"{BASE_URL}/login/access-token",
        data={"username": email, "password": password}
    )
    response.raise_for_status()
    return response.json()["access_token"]

def create_item(token: str, title: str, description: str) -> dict:
    """Create a new item"""
    headers = {"Authorization": f"Bearer {token}"}
    data = {
        "title": title,
        "description": description,
        "is_original": True
    }
    response = requests.post(f"{BASE_URL}/items/", json=data, headers=headers)
    response.raise_for_status()
    return response.json()

def upload_image(token: str, item_id: str, file_path: str) -> dict:
    """Upload an image for an item"""
    headers = {"Authorization": f"Bearer {token}"}
    
    with open(file_path, 'rb') as f:
        files = {'file': (Path(file_path).name, f, 'image/jpeg')}
        response = requests.post(
            f"{BASE_URL}/images/{item_id}",
            files=files,
            headers=headers
        )
    
    response.raise_for_status()
    return response.json()

def get_item_images(token: str, item_id: str) -> dict:
    """Get all images for an item"""
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/images/item/{item_id}", headers=headers)
    response.raise_for_status()
    return response.json()

def get_image(token: str, image_id: str) -> dict:
    """Get image metadata by ID"""
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/images/{image_id}", headers=headers)
    response.raise_for_status()
    return response.json()

def download_image(token: str, image_id: str, output_path: str):
    """Download an image file"""
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/images/download/{image_id}", headers=headers)
    response.raise_for_status()
    
    with open(output_path, 'wb') as f:
        f.write(response.content)
    print(f"Image downloaded to: {output_path}")

def delete_image(token: str, image_id: str) -> dict:
    """Delete an image"""
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.delete(f"{BASE_URL}/images/{image_id}", headers=headers)
    response.raise_for_status()
    return response.json()

def delete_item_images(token: str, item_id: str) -> dict:
    """Delete all images for an item"""
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.delete(f"{BASE_URL}/images/item/{item_id}", headers=headers)
    response.raise_for_status()
    return response.json()

def get_item(token: str, item_id: str) -> dict:
    """Get item with image URLs"""
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/items/{item_id}", headers=headers)
    response.raise_for_status()
    return response.json()

def main():
    """Main test flow"""
    print("=== Image API Test Script ===\n")
    
    # Login
    print("1. Logging in...")
    try:
        token = login(EMAIL, PASSWORD)
        print(f"✓ Logged in successfully\n")
    except Exception as e:
        print(f"✗ Login failed: {e}")
        print("\nPlease update EMAIL and PASSWORD in the script with valid credentials")
        return
    
    # Create an item
    print("2. Creating a test item...")
    try:
        item = create_item(token, "Test Item", "This is a test item for image upload")
        item_id = item["item"]["id"] if "item" in item else item["id"]
        print(f"✓ Created item: {item_id}\n")
    except Exception as e:
        print(f"✗ Failed to create item: {e}")
        return
    
    # Note: You'll need to provide an actual image file for upload
    image_path = "./test_image.jpg"
    
    if Path(image_path).exists():
        # Upload an image
        print("3. Uploading an image...")
        try:
            image_data = upload_image(token, item_id, image_path)
            image_id = image_data["id"]
            print(f"✓ Uploaded image: {image_id}")
            print(f"  - Name: {image_data['name']}")
            print(f"  - Path: {image_data['path']}")
            print(f"  - Created: {image_data['created_at']}\n")
        except Exception as e:
            print(f"✗ Failed to upload image: {e}\n")
            image_id = None
        
        # Get item images
        print("4. Getting all images for item...")
        try:
            images = get_item_images(token, item_id)
            print(f"✓ Found {images['count']} image(s)")
            for img in images['data']:
                print(f"  - {img['id']}: {img['name']}")
            print()
        except Exception as e:
            print(f"✗ Failed to get images: {e}\n")
        
        # Get item with image URLs
        print("5. Getting item with image URLs...")
        try:
            item_with_images = get_item(token, item_id)
            print(f"✓ Item retrieved")
            if "item" in item_with_images:
                item_data = item_with_images["item"]
            else:
                item_data = item_with_images
            
            if "image_urls" in item_data and item_data["image_urls"]:
                print(f"  Image URLs:")
                for url in item_data["image_urls"]:
                    print(f"    - {url}")
            else:
                print("  No image URLs found")
            print()
        except Exception as e:
            print(f"✗ Failed to get item: {e}\n")
        
        if image_id:
            # Get single image
            print("6. Getting single image metadata...")
            try:
                single_image = get_image(token, image_id)
                print(f"✓ Image metadata:")
                print(f"  - ID: {single_image['id']}")
                print(f"  - Name: {single_image['name']}")
                print(f"  - Path: {single_image['path']}\n")
            except Exception as e:
                print(f"✗ Failed to get image: {e}\n")
            
            # Download image
            print("7. Downloading image...")
            try:
                download_image(token, image_id, "./downloaded_image.jpg")
                print()
            except Exception as e:
                print(f"✗ Failed to download image: {e}\n")
            
            # Delete single image
            print("8. Deleting single image...")
            try:
                result = delete_image(token, image_id)
                print(f"✓ {result['message']}\n")
            except Exception as e:
                print(f"✗ Failed to delete image: {e}\n")
    else:
        print(f"3. Skipping image upload - no file found at {image_path}\n")
        print("To test image upload, create a test_image.jpg in the current directory\n")
    
    print("=== Test completed ===")

if __name__ == "__main__":
    main()
