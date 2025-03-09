#!/bin/bash

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
sleep 10

# Run the schema SQL file
echo "Initializing database schema..."
psql $DATABASE_URL -f src/config/schema.sql

echo "Database initialization completed." 