#!/bin/bash

# Exit in case of error
set -e

echo "Setting up persistent volumes for staging deployment..."

# Create the external volume if it doesn't exist
if ! docker volume ls | grep -q "app-db-data"; then
    echo "Creating app-db-data volume..."
    docker volume create app-db-data
    echo "Volume app-db-data created successfully"
else
    echo "Volume app-db-data already exists"
fi

echo "Volume setup complete!"
