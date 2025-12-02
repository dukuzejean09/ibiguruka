# Start Backend from GHCR
# This script pulls pre-built images from GitHub Container Registry and runs only the backend services

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  NeighborWatch - Backend Startup (GHCR)"
Write-Host "========================================`n" -ForegroundColor Cyan

# Check if Docker is running
Write-Host "🔍 Checking Docker..." -ForegroundColor Cyan
$dockerRunning = docker ps 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
    exit 1
}
Write-Host "✅ Docker is running`n" -ForegroundColor Green

# Check if GitHub Actions has built the images
Write-Host "ℹ️  Note: This requires images to be built by GitHub Actions" -ForegroundColor Yellow
Write-Host "   Check status at: https://github.com/dukuzejean09/ibiguruka/actions`n" -ForegroundColor Yellow

# Pull latest images from GHCR
Write-Host "📥 Pulling latest images from GitHub Container Registry..." -ForegroundColor Cyan
docker pull ghcr.io/dukuzejean09/neighborwatch-api:latest
docker pull ghcr.io/dukuzejean09/neighborwatch-clustering:latest

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n❌ Failed to pull images from GHCR." -ForegroundColor Red
    Write-Host "   Please wait for GitHub Actions to complete building images." -ForegroundColor Yellow
    Write-Host "   Or run with: docker-compose up -d --build (builds locally)`n" -ForegroundColor Yellow
    exit 1
}

# Start backend services
Write-Host "`n🚀 Starting backend services..." -ForegroundColor Cyan
docker-compose -f docker-compose.ghcr.yml up -d mongodb api clustering

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Backend services started successfully!`n" -ForegroundColor Green
    
    Start-Sleep -Seconds 5
    
    # Initialize database
    Write-Host "🔧 Initializing database with admin user..." -ForegroundColor Cyan
    docker cp create_admin.js neighborwatch-mongodb:/tmp/create_admin.js
    docker exec neighborwatch-mongodb mongosh /tmp/create_admin.js
    
    Write-Host "`n📊 Container Status:" -ForegroundColor Cyan
    docker-compose -f docker-compose.ghcr.yml ps
    
    Write-Host "`n🌐 Backend Services:" -ForegroundColor Green
    Write-Host "   API:       http://localhost:8000" -ForegroundColor White
    Write-Host "   API Docs:  http://localhost:8000/docs" -ForegroundColor White
    Write-Host "   MongoDB:   localhost:27017" -ForegroundColor White
    
    Write-Host "`n👤 Default Admin:" -ForegroundColor Yellow
    Write-Host "   Email:     admin@neighborwatch.rw" -ForegroundColor White
    Write-Host "   Password:  Admin123" -ForegroundColor White
    
    Write-Host "`n🎉 Backend is ready! Frontend at: https://ibiguruka.vercel.app`n" -ForegroundColor Green
    
} else {
    Write-Host "`n❌ Failed to start backend services.`n" -ForegroundColor Red
    exit 1
}
