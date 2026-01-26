#!/bin/sh
set -e

echo "Starting Production Environment..."

# Run migrations
echo "Applying database migrations..."
npx prisma migrate deploy

# Start app
echo "Starting application..."
exec node dist/server.js
