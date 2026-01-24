#!/bin/sh
set -e

echo "Starting app..."

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Run migrations
echo "Applying database migrations..."
npx prisma migrate deploy

# Start app
echo "Starting application..."
node dist/server.js
