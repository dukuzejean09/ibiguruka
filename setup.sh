#!/bin/bash

# NeighborWatch Connect - Setup and Run Script
# Bash script for Linux/Mac

echo "========================================"
echo "  NeighborWatch Connect - Setup"
echo "  Community Safety Platform"
echo "========================================"
echo ""

# Check if Docker is installed
echo "Checking prerequisites..."
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed!"
    echo "Please install Docker from: https://docs.docker.com/get-docker/"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed!"
    exit 1
fi

echo "✅ Docker is installed"
echo ""

# Check if environment files exist
if [ ! -f "api/.env" ]; then
    echo "Setting up environment files..."
    cp api/.env.example api/.env
    echo "✅ Created api/.env"
    echo "⚠️  Please update SECRET_KEY in api/.env before production!"
fi

if [ ! -f "frontend/.env" ]; then
    cp frontend/.env.example frontend/.env
    echo "✅ Created frontend/.env"
fi

echo ""
echo "Building Docker containers..."
echo "This may take a few minutes..."
echo ""

docker-compose build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo ""
echo "✅ Build successful!"
echo ""
echo "Starting services..."

docker-compose up -d

if [ $? -ne 0 ]; then
    echo "❌ Failed to start services!"
    exit 1
fi

echo ""
echo "✅ All services started!"
echo ""

# Wait for services to be ready
echo "Waiting for services to be ready..."
sleep 5

echo ""
echo "========================================"
echo "  🎉 NeighborWatch Connect is Ready!"
echo "========================================"
echo ""
echo "Access the application:"
echo "  📱 Frontend:    http://localhost:3000"
echo "  🔧 API:         http://localhost:8000"
echo "  📚 API Docs:    http://localhost:8000/docs"
echo "  🗄️  MongoDB:     mongodb://localhost:27017"
echo ""
echo "Next steps:"
echo "  1. Open http://localhost:3000 in your browser"
echo "  2. Create admin user (see QUICKSTART.md)"
echo "  3. Test the application"
echo ""
echo "Useful commands:"
echo "  View logs:           docker-compose logs -f"
echo "  Stop services:       docker-compose stop"
echo "  Restart services:    docker-compose restart"
echo "  Remove everything:   docker-compose down -v"
echo ""
echo "For help, see:"
echo "  📖 README.md"
echo "  🚀 QUICKSTART.md"
echo "  📦 INSTALLATION.md"
echo ""
echo "========================================"
echo ""

# Ask if user wants to view logs
read -p "Would you like to view the logs? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    docker-compose logs -f
fi
