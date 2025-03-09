#!/bin/bash

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
sleep 10

# Check if the users table already exists
USER_TABLE_EXISTS=$(psql $DATABASE_URL -t -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users');")

if [[ $USER_TABLE_EXISTS == *"t"* ]]; then
  echo "Database already initialized, skipping schema creation..."
else
  # Run the schema SQL file
  echo "Initializing database schema..."
  psql $DATABASE_URL -f src/config/schema.sql
  echo "Database initialization completed."
fi 