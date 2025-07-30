#!/bin/bash

# Production environment setup script

echo "🚀 Building and starting production environment..."

# Build and start production services
docker-compose --profile production up --build app-prod

echo "✅ Production environment started at http://localhost:3000"