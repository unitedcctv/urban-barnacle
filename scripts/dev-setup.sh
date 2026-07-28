#!/bin/bash

set -e

if ! docker info > /dev/null 2>&1; then
    echo "Docker is not running. Please start Docker first."
    exit 1
fi

if [ ! -d "backend/.venv" ]; then
    (cd backend && uv sync)
fi

if [ ! -d "frontend/node_modules" ]; then
    (cd frontend && npm install)
fi

if [ ! -f ".env" ] && [ -f ".env.example" ]; then
    cp .env.example .env
fi

echo "Development environment setup complete."
