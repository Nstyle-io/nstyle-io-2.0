# Docker Environment Setup

This project includes comprehensive Docker configurations for development, testing, and production deployment.

## Quick Start

### Development Environment
```bash
# Start development server
chmod +x scripts/docker-dev.sh
./scripts/docker-dev.sh

# Or manually:
docker-compose up app-dev
```
Access at: http://localhost:8080

### Production Environment
```bash
# Start production build
chmod +x scripts/docker-prod.sh
./scripts/docker-prod.sh

# Or manually:
docker-compose --profile production up --build app-prod
```
Access at: http://localhost:3000

### Testing Environment
```bash
# Run tests
chmod +x scripts/docker-test.sh
./scripts/docker-test.sh

# Or manually:
docker-compose --profile testing run --rm test-runner
```

### Local Backend (Supabase)
```bash
# Start local Supabase services
chmod +x scripts/docker-local-backend.sh
./scripts/docker-local-backend.sh

# Or manually:
docker-compose --profile local-backend up -d supabase-db supabase-api
```

## Available Services

### Frontend Services
- **app-dev**: Development server with hot reload
- **app-prod**: Production-optimized build with Nginx

### Backend Services (Local Development)
- **supabase-db**: PostgreSQL database (localhost:54322)
- **supabase-api**: Authentication API (localhost:9999)

### Testing
- **test-runner**: Isolated testing environment

## Docker Profiles

Use profiles to run specific service combinations:

```bash
# Development only
docker-compose up app-dev

# Production only
docker-compose --profile production up app-prod

# Local backend only
docker-compose --profile local-backend up supabase-db supabase-api

# Testing only
docker-compose --profile testing run test-runner

# Everything (not recommended)
docker-compose --profile production --profile local-backend --profile testing up
```

## Environment Variables

### Development
- Hot reload enabled
- Development build
- Port 8080

### Production
- Optimized build
- Nginx serving static files
- Port 3000
- Gzip compression enabled
- Security headers

### Local Backend
- PostgreSQL on port 54322
- Supabase Auth API on port 9999
- Test-friendly configurations

## Volumes

- **Development**: Source code mounted for hot reload
- **Production**: No volumes (fully containerized)
- **Database**: Persistent volume for local Supabase data

## Health Checks

All services include health checks for monitoring:
- Frontend: HTTP endpoint checks
- Database: Connection checks
- API: Service availability checks

## Commands Reference

```bash
# Build specific service
docker-compose build app-dev

# View logs
docker-compose logs -f app-dev

# Stop all services
docker-compose down

# Remove volumes (reset database)
docker-compose down -v

# Clean up everything
docker-compose down -v --rmi all

# Shell into container
docker-compose exec app-dev sh
```

## Production Deployment

For production deployment:

1. Build the production image:
```bash
docker build -t nail-app:latest .
```

2. Run with environment variables:
```bash
docker run -p 80:80 \
  -e NODE_ENV=production \
  nail-app:latest
```

3. Or use the production compose:
```bash
docker-compose --profile production up -d
```

## Troubleshooting

### Port Conflicts
If ports are in use, modify the port mappings in `docker-compose.yml`

### Permission Issues
Make scripts executable:
```bash
chmod +x scripts/*.sh
```

### Volume Issues
Reset volumes if data is corrupted:
```bash
docker-compose down -v
docker system prune -f
```

### Build Issues
Clear build cache:
```bash
docker-compose build --no-cache
```

## Security Notes

- Production image runs as non-root user
- Nginx security headers configured
- Local backend uses test credentials (change for production)
- Environment secrets should be managed externally in production