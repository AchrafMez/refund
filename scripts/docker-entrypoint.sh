#!/bin/sh
set -e

# Run migrations
echo "Running database migrations..."
if ! node node_modules/prisma/build/index.js migrate deploy; then
  echo "ERROR: Migrations failed"
  exit 1
fi

# Fix upload permissions
mkdir -p /app/public/uploads
chmod -R 775 /app/public/uploads || true

echo "Starting server..."
exec node dist/server.js
