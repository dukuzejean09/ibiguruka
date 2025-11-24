# NeighborWatch Connect - Setup and Run Script
# PowerShell script for Windows

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  NeighborWatch Connect - Setup" -ForegroundColor Cyan
Write-Host "  Community Safety Platform" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is installed
Write-Host "Checking prerequisites..." -ForegroundColor Yellow
if (!(Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Docker is not installed!" -ForegroundColor Red
    Write-Host "Please install Docker Desktop from: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    exit 1
}

if (!(Get-Command docker-compose -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Docker Compose is not installed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Docker is installed" -ForegroundColor Green
Write-Host ""

# Check if environment files exist
if (!(Test-Path "api\.env")) {
    Write-Host "Setting up environment files..." -ForegroundColor Yellow
    Copy-Item "api\.env.example" "api\.env"
    Write-Host "✅ Created api\.env" -ForegroundColor Green
    Write-Host "⚠️  Please update SECRET_KEY in api\.env before production!" -ForegroundColor Yellow
}

if (!(Test-Path "frontend\.env")) {
    Copy-Item "frontend\.env.example" "frontend\.env"
    Write-Host "✅ Created frontend\.env" -ForegroundColor Green
}

Write-Host ""
Write-Host "Building Docker containers..." -ForegroundColor Yellow
Write-Host "This may take a few minutes..." -ForegroundColor Gray
Write-Host ""

docker-compose build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Build successful!" -ForegroundColor Green
Write-Host ""
Write-Host "Starting services..." -ForegroundColor Yellow

docker-compose up -d

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to start services!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ All services started!" -ForegroundColor Green
Write-Host ""

# Wait for services to be ready
Write-Host "Waiting for services to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  🎉 NeighborWatch Connect is Ready!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Access the application:" -ForegroundColor Cyan
Write-Host "  📱 Frontend:    http://localhost:3000" -ForegroundColor White
Write-Host "  🔧 API:         http://localhost:8000" -ForegroundColor White
Write-Host "  📚 API Docs:    http://localhost:8000/docs" -ForegroundColor White
Write-Host "  🗄️  MongoDB:     mongodb://localhost:27017" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Open http://localhost:3000 in your browser" -ForegroundColor White
Write-Host "  2. Create admin user (see QUICKSTART.md)" -ForegroundColor White
Write-Host "  3. Test the application" -ForegroundColor White
Write-Host ""
Write-Host "Useful commands:" -ForegroundColor Cyan
Write-Host "  View logs:           docker-compose logs -f" -ForegroundColor White
Write-Host "  Stop services:       docker-compose stop" -ForegroundColor White
Write-Host "  Restart services:    docker-compose restart" -ForegroundColor White
Write-Host "  Remove everything:   docker-compose down -v" -ForegroundColor White
Write-Host ""
Write-Host "For help, see:" -ForegroundColor Cyan
Write-Host "  📖 README.md" -ForegroundColor White
Write-Host "  🚀 QUICKSTART.md" -ForegroundColor White
Write-Host "  📦 INSTALLATION.md" -ForegroundColor White
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Ask if user wants to view logs
$viewLogs = Read-Host "Would you like to view the logs? (y/n)"
if ($viewLogs -eq "y" -or $viewLogs -eq "Y") {
    docker-compose logs -f
}
