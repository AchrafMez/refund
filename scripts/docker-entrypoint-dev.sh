#!/bin/sh
set -e

# Install deps if needed
if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Generate Client
npx prisma generate

# Sync schema
echo "Syncing database..."
npx prisma db push

echo "Starting dev server..."
exec npm run dev
