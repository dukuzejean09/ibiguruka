# NeighborWatch Connect - Quick Start Script
# This script will start all Docker containers for local development

Write-Host "=" -NoNewline; for($i=0; $i -lt 60; $i++) { Write-Host "=" -NoNewline }; Write-Host ""
Write-Host "  NeighborWatch Connect - Docker Startup"
Write-Host "=" -NoNewline; for($i=0; $i -lt 60; $i++) { Write-Host "=" -NoNewline }; Write-Host "`n"

# Check if Docker is running
Write-Host "🔍 Checking Docker..." -ForegroundColor Cyan
$dockerRunning = docker ps 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
    exit 1
}
Write-Host "✅ Docker is running`n" -ForegroundColor Green

# Stop any running containers
Write-Host "🛑 Stopping existing containers..." -ForegroundColor Cyan
docker-compose down 2>&1 | Out-Null

# Start the containers
Write-Host "🚀 Starting containers..." -ForegroundColor Cyan
Write-Host "   This may take 3-5 minutes on first run (downloading and building images)`n" -ForegroundColor Yellow

docker-compose up -d --build

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Containers started successfully!`n" -ForegroundColor Green
    
    # Wait for services to be ready
    Write-Host "⏳ Waiting for services to initialize..." -ForegroundColor Cyan
    Start-Sleep -Seconds 15
    
    # Check container status
    Write-Host "`n📊 Container Status:" -ForegroundColor Cyan
    docker-compose ps
    
    Write-Host "`n🌐 Access URLs:" -ForegroundColor Green
    Write-Host "   Frontend:  http://localhost:3000" -ForegroundColor White
    Write-Host "   API Docs:  http://localhost:8000/docs" -ForegroundColor White
    Write-Host "   MongoDB:   localhost:27017" -ForegroundColor White
    
    Write-Host "`n👤 Default Admin Credentials:" -ForegroundColor Yellow
    Write-Host "   Email:     admin@neighborwatch.rw" -ForegroundColor White
    Write-Host "   Password:  admin@123A" -ForegroundColor White
    Write-Host "   Login at:  http://localhost:3000/admin-login" -ForegroundColor White
    
    Write-Host "`n📝 Useful Commands:" -ForegroundColor Cyan
    Write-Host "   View logs:        docker-compose logs -f" -ForegroundColor White
    Write-Host "   Stop containers:  docker-compose down" -ForegroundColor White
    Write-Host "   Restart:          docker-compose restart" -ForegroundColor White
    Write-Host "   View status:      docker-compose ps" -ForegroundColor White
    
    Write-Host "`n🎉 Application is ready! Open http://localhost:3000`n" -ForegroundColor Green
    
    # Optionally open browser
    $openBrowser = Read-Host "Open browser now? (y/n)"
    if ($openBrowser -eq "y" -or $openBrowser -eq "Y") {
        Start-Process "http://localhost:3000"
    }
    
} else {
    Write-Host "`n❌ Failed to start containers. Check the errors above.`n" -ForegroundColor Red
    Write-Host "💡 Try these troubleshooting steps:" -ForegroundColor Yellow
    Write-Host "   1. Make sure Docker Desktop is running" -ForegroundColor White
    Write-Host "   2. Check if ports 3000, 8000, or 27017 are already in use" -ForegroundColor White
    Write-Host "   3. Run: docker-compose logs" -ForegroundColor White
    exit 1
}
