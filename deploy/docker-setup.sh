#!/bin/bash

# Docker Setup Script for Nstyle Project
# This script helps set up the Docker environment for development or production

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if Docker is installed and running
check_docker() {
    print_status "Checking Docker installation..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        print_error "Docker is not running. Please start Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    print_success "Docker and Docker Compose are installed and running."
}

# Function to setup development environment
setup_dev() {
    print_status "Setting up development environment..."
    
    # Create necessary directories
    mkdir -p ../frontend/node_modules
    
    # Pull required images
    print_status "Pulling required Docker images..."
    docker-compose -f docker-compose.yml -f docker-compose.dev.yml pull
    
    # Build custom images
    print_status "Building custom images..."
    docker-compose -f docker-compose.yml -f docker-compose.dev.yml build
    
    # Start services
    print_status "Starting development services..."
    docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
    
    print_success "Development environment is ready!"
    print_status "Frontend available at: http://localhost:8080"
    print_status "Supabase DB available at: localhost:54322"
    print_status "Supabase Auth API available at: http://localhost:9999"
    print_status "Mail server UI available at: http://localhost:9000"
}

# Function to setup production environment
setup_prod() {
    print_status "Setting up production environment..."
    
    # Build production images
    print_status "Building production images..."
    docker-compose -f docker-compose.yml -f docker-compose.prod.yml build
    
    # Start services
    print_status "Starting production services..."
    docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
    
    print_success "Production environment is ready!"
    print_status "Application available at: http://localhost"
    print_status "Monitoring available at: http://localhost:3001 (Grafana)"
    print_status "Prometheus available at: http://localhost:9090"
}

# Function to run tests
run_tests() {
    print_status "Running tests in Docker container..."
    docker-compose -f docker-compose.yml --profile testing run --rm test-runner
    print_success "Tests completed!"
}

# Function to clean up Docker resources
cleanup() {
    print_status "Cleaning up Docker resources..."
    
    # Stop all containers
    docker-compose -f docker-compose.yml -f docker-compose.dev.yml -f docker-compose.prod.yml down -v
    
    # Remove unused images and volumes
    docker system prune -f
    docker volume prune -f
    
    print_success "Cleanup completed!"
}

# Function to show logs
show_logs() {
    local env=$1
    if [ "$env" = "dev" ]; then
        docker-compose -f docker-compose.yml -f docker-compose.dev.yml logs -f
    elif [ "$env" = "prod" ]; then
        docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs -f
    else
        print_error "Please specify environment: dev or prod"
        exit 1
    fi
}

# Function to show help
show_help() {
    echo "Docker Setup Script for Nstyle Project"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  dev           Set up development environment"
    echo "  prod          Set up production environment"
    echo "  test          Run tests"
    echo "  logs [env]    Show logs (env: dev or prod)"
    echo "  cleanup       Clean up Docker resources"
    echo "  help          Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 dev        # Start development environment"
    echo "  $0 prod       # Start production environment"
    echo "  $0 logs dev   # Show development logs"
    echo "  $0 cleanup    # Clean up resources"
}

# Main script logic
main() {
    check_docker
    
    case "$1" in
        "dev")
            setup_dev
            ;;
        "prod")
            setup_prod
            ;;
        "test")
            run_tests
            ;;
        "logs")
            show_logs "$2"
            ;;
        "cleanup")
            cleanup
            ;;
        "help"|"--help"|"-h"|"")
            show_help
            ;;
        *)
            print_error "Unknown command: $1"
            show_help
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"