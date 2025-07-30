#!/bin/bash

# Test environment setup script

echo "🧪 Running tests in Docker..."

# Run tests
docker-compose --profile testing run --rm test-runner

echo "✅ Tests completed"