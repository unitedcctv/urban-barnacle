#! /usr/bin/env bash

set -e
set -x

# Let the DB start
python app/backend_pre_start.py

# Run database migrations with Alembic
alembic upgrade head

# Create initial data in DB
python app/initial_data.py
