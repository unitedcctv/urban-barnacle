#! /usr/bin/env bash

set -e
set -x

# Let the DB start
python app/backend_pre_start.py

# Create tables (bypassing Alembic for now)
python app/create_tables.py

# Create initial data in DB
python app/initial_data.py
