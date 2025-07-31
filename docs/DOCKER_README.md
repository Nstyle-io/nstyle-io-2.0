# Docker Environment Setup

This project includes comprehensive Docker configurations for development, testing, and production deployment with improved security, monitoring, and ease of use.

## Quick Start

### Automated Setup (Recommended)
```bash
# Make setup script executable
chmod +x deploy/docker-setup.sh

# Development environment
./deploy/docker-setup.sh dev

# Production environment
./deploy/docker-setup.sh prod

# Run tests
./deploy/docker-setup.sh test

# View logs
./deploy/docker-setup.sh logs dev

# Cleanup
./deploy/docker-setup.sh cleanup
```

### Manual Setup

#### Development Environment
```bash
# Using npm scripts (recommended)
npm run docker:dev

# Or using docker-compose directly
cd deploy
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

**Services Available:**
- Frontend: http://localhost:8080
- Supabase DB: localhost:54322
- Supabase Auth API: http://localhost:9999
- Supabase REST API: http://localhost:3000
- Storage API: http://localhost:5000
- Mail Server UI: http://localhost:9000

#### Production Environment
```bash
# Using npm scripts (recommended)
npm run docker:prod

# With monitoring
npm run docker:prod:monitoring

# Or using docker-compose directly
cd deploy
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

**Services Available:**
- Application: http://localhost (port 80)
- Grafana Monitoring: http://localhost:3001
- Prometheus Metrics: http://localhost:9090

#### Testing Environment
```bash
# Run tests once
npm run docker:test

# Run tests in watch mode
npm run docker:test:watch
```

## Architecture Overview

### Development Stack
- **Frontend Dev Server**: Hot-reload React app with Vite
- **Full Supabase Stack**: Database, Auth, REST API, Storage, Image Processing
- **Mail Server**: Inbucket for email testing
- **Health Checks**: All services monitored

### Production Stack
- **Frontend**: Multi-stage optimized build with Nginx
- **Load Balancer**: Nginx proxy with SSL support
- **Caching**: Redis for sessions and caching
- **Monitoring**: Prometheus + Grafana + Loki stack
- **Security**: Non-root users, security headers, rate limiting

## Available npm Scripts

```bash
# Development
npm run docker:dev              # Start dev environment
npm run docker:dev:detached     # Start dev environment in background

# Production
npm run docker:prod             # Start production environment
npm run docker:prod:monitoring  # Start production with monitoring

# Testing
npm run docker:test             # Run tests once
npm run docker:test:watch       # Run tests in watch mode

# Management
npm run docker:down             # Stop all services
npm run docker:down:volumes     # Stop all services and remove volumes
npm run docker:logs:dev         # Show development logs
npm run docker:logs:prod        # Show production logs

# Building
npm run docker:build:frontend   # Build frontend image
npm run docker:build:dev        # Build development image

# Cleanup
npm run docker:clean            # Clean unused Docker resources
npm run docker:clean:all        # Clean all Docker resources
```

## Docker Architecture

### Multi-Stage Builds
All Dockerfiles use multi-stage builds for optimization:
- **Dependencies stage**: Install and cache dependencies
- **Builder stage**: Build the application
- **Production stage**: Minimal runtime image

### Security Features
- Non-root users in all containers
- Security headers in Nginx
- Rate limiting and DDoS protection
- Secrets management ready
- Network isolation

### Health Checks
All services include comprehensive health checks:
- HTTP endpoint monitoring
- Database connection checks
- Service availability verification
- Startup time optimization

## Environment Configurations

### Development
- Hot reload enabled with file watching
- Full Supabase local stack
- Debug logging enabled
- Development-friendly configurations

### Production
- Optimized builds with asset compression
- Load balancing and high availability
- Monitoring and alerting
- Security hardening
- SSL/TLS ready

## Monitoring and Observability

### Metrics (Prometheus)
- Application performance metrics
- Infrastructure monitoring
- Custom business metrics
- Alerting rules

### Visualization (Grafana)
- Real-time dashboards
- Historical data analysis
- Custom alerts and notifications
- Performance insights

### Logging (Loki + Promtail)
- Centralized log aggregation
- Structured logging
- Log correlation
- Search and filtering

## Volume Management

### Development Volumes
- Source code mounting for hot reload
- Node modules caching
- Database persistence

### Production Volumes
- Data persistence only
- No source code mounting
- Optimized for performance

## Networking

### Development Network
- Bridge network with custom subnet
- Service discovery by name
- Internal communication only

### Production Network
- Secure networking with isolation
- Load balancer entry point
- Internal service mesh

## Troubleshooting

### Common Issues

#### Port Conflicts
```bash
# Check what's using the port
lsof -i :8080

# Or modify port mappings in docker-compose files
```

#### Build Issues
```bash
# Clear build cache
npm run docker:clean

# Rebuild without cache
docker-compose build --no-cache
```

#### Volume Issues
```bash
# Reset all volumes
npm run docker:down:volumes

# Clean up everything
npm run docker:clean:all
```

#### Permission Issues
```bash
# Fix script permissions
chmod +x deploy/*.sh

# Check Docker permissions
docker run hello-world
```

### Debugging

#### View Logs
```bash
# All services
npm run docker:logs:dev

# Specific service
docker-compose -f deploy/docker-compose.yml -f deploy/docker-compose.dev.yml logs -f frontend-dev
```

#### Shell into Container
```bash
# Development container
docker-compose -f deploy/docker-compose.yml -f deploy/docker-compose.dev.yml exec frontend-dev sh

# Production container
docker-compose -f deploy/docker-compose.yml -f deploy/docker-compose.prod.yml exec frontend-prod sh
```

#### Check Service Health
```bash
# Check all container status
docker-compose ps

# Check specific service health
docker inspect --format='{{.State.Health.Status}}' container_name
```

## Production Deployment

### Prerequisites
1. Docker and Docker Compose installed
2. Environment variables configured
3. SSL certificates (for HTTPS)
4. Domain name configured

### Deployment Steps
1. **Build and deploy:**
   ```bash
   npm run docker:prod:monitoring
   ```

2. **Configure SSL (optional):**
   - Place certificates in `deploy/ssl/`
   - Update nginx configuration

3. **Set up monitoring:**
   - Access Grafana at http://your-domain:3001
   - Import dashboards from `deploy/grafana/`

4. **Configure alerts:**
   - Set up Prometheus alerting rules
   - Configure notification channels

### Environment Variables
Create a `.env.production` file:
```env
NODE_ENV=production
REDIS_PASSWORD=secure_password
GRAFANA_PASSWORD=secure_grafana_password
# Add other production secrets
```

## Security Considerations

- Use secrets management for production
- Regular security updates
- Monitor for vulnerabilities
- Implement backup strategies
- Use HTTPS in production
- Regular security audits

## Performance Optimization

- Multi-stage builds reduce image size
- Layer caching improves build times
- Resource limits prevent resource exhaustion
- Health checks ensure reliability
- Load balancing improves availability