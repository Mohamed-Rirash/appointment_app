#! /usr/bin/env bash

set -e
set -x

# Let the DB start (waits for database to be ready)
python app/backend_pre_start.py

# Run database migrations
echo "Running database migrations..."
alembic upgrade head

# Create initial data in DB (superuser, roles, etc.)
echo "Creating initial data..."
python app/initial_data.py

echo "Prestart script completed successfully!"
