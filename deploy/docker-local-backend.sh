#!/bin/bash

# Local backend setup script for development

echo "🗄️ Starting local Supabase backend..."

# Start local Supabase services
docker-compose --profile local-backend up -d supabase-db supabase-api

echo "✅ Local backend started:"
echo "  - Database: localhost:54322"
echo "  - Auth API: localhost:9999"
echo "  - Use these endpoints in your local development"

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

echo "🎉 Local backend is ready for development!"