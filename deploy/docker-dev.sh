#!/bin/bash

# Development environment setup script

echo "🚀 Starting development environment..."

# Start development services
docker-compose up app-dev

echo "✅ Development environment started at http://localhost:8080"