#! /usr/bin/env bash

set -e
set -x

# Let the DB start
python app/backend_pre_start.py

# Run database migrations with Alembic
# If migrations fail against the existing database (e.g. alembic_version
# references a revision no longer in the codebase), rebuild the schema
# from scratch and migrate fresh. WARNING: this wipes all existing data.
if ! alembic upgrade head; then
    echo "WARNING: migrations failed - rebuilding database schema from scratch (all data will be lost)"
    python -c "
from sqlalchemy import text
from app.core.db import engine
with engine.begin() as conn:
    conn.execute(text('DROP SCHEMA public CASCADE'))
    conn.execute(text('CREATE SCHEMA public'))
"
    alembic upgrade head
fi

# Create initial data in DB
python app/initial_data.py
