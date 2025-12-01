#!/bin/bash

# Support Ticket Manager - Management Script
# This script automates Docker operations (build, start, stop, clean, etc.)

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Functions
print_step() {
    echo -e "${BLUE}▶ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Check if .env exists
if [ ! -f .env ]; then
    print_warning ".env file not found. Creating from .env.example..."
    if [ -f .env.example ]; then
        cp .env.example .env
        print_success ".env file created. Please update JWT_SECRET and other values if needed."
    else
        print_error ".env.example not found. Please create .env manually."
        exit 1
    fi
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker Desktop and try again."
    exit 1
fi

print_success "Docker is running"

# Parse command line arguments
COMMAND=${1:-"start"}

case $COMMAND in
    "start"|"up")
        print_step "Building Docker images..."
        docker compose build
        
        print_step "Starting services (migrations run automatically)..."
        docker compose up -d
        
        print_step "Waiting for services to be ready..."
        sleep 10
        
        print_step "Seeding database with test data..."
        docker compose exec -T api npm run seed || print_warning "Seed failed or already seeded. Continuing..."
        
        print_success "All services are running!"
        echo ""
        echo "Access the app:"
        echo "  Frontend: http://localhost:3000"
        echo "  API:      http://localhost:3001"
        echo ""
        echo "View logs: docker compose logs -f"
        echo "Stop:      docker compose down"
        ;;
    
    "build")
        print_step "Building Docker images..."
        docker compose build
        print_success "Build complete!"
        ;;
    
    "up")
        print_step "Starting services..."
        docker compose up -d
        print_success "Services started!"
        ;;
    
    "down"|"stop")
        print_step "Stopping services..."
        docker compose down
        print_success "Services stopped!"
        ;;
    
    "down-clean")
        print_step "Stopping services and removing volumes..."
        docker compose down -v
        print_success "Services stopped and volumes removed!"
        ;;
    
    "restart")
        print_step "Restarting services..."
        docker compose restart
        print_success "Services restarted!"
        ;;
    
    "logs")
        SERVICE=${2:-""}
        if [ -z "$SERVICE" ]; then
            docker compose logs -f
        else
            docker compose logs -f "$SERVICE"
        fi
        ;;
    
    "seed")
        print_step "Seeding database..."
        docker compose exec api npm run seed
        print_success "Database seeded!"
        ;;
    
    "migrate")
        print_step "Running migrations..."
        docker compose exec api npm run db:migrate
        print_success "Migrations complete!"
        ;;
    
    "reset")
        print_warning "This will DROP ALL TABLES and re-run migrations!"
        read -p "Are you sure? (yes/no): " confirm
        if [ "$confirm" = "yes" ]; then
            print_step "Resetting database..."
            docker compose exec api npm run db:reset
            print_success "Database reset complete!"
        else
            print_warning "Reset cancelled."
        fi
        ;;
    
    "clean")
        print_warning "This will stop and remove all containers, networks, volumes, and build cache!"
        read -p "Are you sure? (yes/no): " confirm
        if [ "$confirm" = "yes" ]; then
            print_step "Stopping and removing containers, networks, and volumes..."
            docker compose down -v --remove-orphans
            
            print_step "Removing build cache..."
            docker builder prune -f
            
            print_step "Removing unused images..."
            docker image prune -f
            
            print_success "Cleanup complete!"
        else
            print_warning "Cleanup cancelled."
        fi
        ;;
    
    "clean-cache")
        print_step "Cleaning Docker build cache..."
        docker builder prune -f
        print_success "Build cache cleaned!"
        ;;
    
    "clean-all")
        print_warning "This will remove EVERYTHING: containers, volumes, images, build cache, and networks!"
        read -p "Are you sure? Type 'yes' to confirm: " confirm
        if [ "$confirm" = "yes" ]; then
            print_step "Stopping and removing everything..."
            docker compose down -v --remove-orphans
            
            print_step "Removing all unused Docker resources..."
            docker system prune -a -f --volumes
            
            print_success "Complete cleanup finished!"
        else
            print_warning "Cleanup cancelled."
        fi
        ;;
    
    "status"|"ps")
        docker compose ps
        ;;
    
    "help"|"--help"|"-h")
        echo "Support Ticket Manager - Startup Script"
        echo ""
        echo "Usage: ./manage.sh [command]"
        echo ""
        echo "Commands:"
        echo "  start, up    Build, start services, and seed (default)"
        echo "  build        Build Docker images only"
        echo "  up           Start services only"
        echo "  down, stop   Stop services"
        echo "  down-clean   Stop services and remove volumes"
        echo "  restart      Restart services"
        echo "  logs [name]  Show logs (optionally for specific service)"
        echo "  seed         Seed database with test data"
        echo "  migrate      Run database migrations manually"
        echo "  reset        Drop all tables and re-run migrations"
        echo "  clean        Stop, remove containers/volumes, and clean build cache"
        echo "  clean-cache  Clean Docker build cache only"
        echo "  clean-all    Remove EVERYTHING (containers, volumes, images, cache)"
        echo "  status, ps   Show service status"
        echo "  help         Show this help message"
        echo ""
        echo "Examples:"
        echo "  ./manage.sh           # Full setup (build + up + seed)"
        echo "  ./manage.sh logs      # Show all logs"
        echo "  ./manage.sh logs api  # Show API logs only"
        echo "  ./manage.sh seed      # Seed database"
        ;;
    
    *)
        print_error "Unknown command: $COMMAND"
        echo "Run './manage.sh help' for usage information."
        exit 1
        ;;
esac
