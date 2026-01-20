#!/bin/sh
# Docker startup script for Refund-Med development

set -e

echo "🔄 Waiting for database to be ready..."
sleep 3

echo "📦 Installing dependencies..."
npm install

echo "📦 Syncing database schema..."
npx prisma db push --skip-generate

echo "🚀 Starting development server..."
exec npm run dev
