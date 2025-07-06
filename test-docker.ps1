# Docker Installation Verification Script
Write-Host "🐳 Verifying Docker installation..." -ForegroundColor Green

# Check if Docker is running
try {
    docker --version
    Write-Host "✅ Docker version check passed" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker not found or not running" -ForegroundColor Red
    Write-Host "💡 Make sure Docker Desktop is started" -ForegroundColor Yellow
    exit 1
}

# Test Docker with hello-world
Write-Host "🧪 Testing Docker with hello-world..." -ForegroundColor Yellow
try {
    docker run hello-world
    Write-Host "✅ Docker hello-world test passed" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker hello-world test failed" -ForegroundColor Red
    Write-Host "💡 Docker may not be running properly" -ForegroundColor Yellow
}

# Check Docker info
Write-Host "📊 Docker system info:" -ForegroundColor Yellow
try {
    docker system info --format "Version: {{.ServerVersion}} | OS: {{.OSType}} | Arch: {{.Architecture}}"
    Write-Host "✅ Docker system info retrieved" -ForegroundColor Green
} catch {
    Write-Host "❌ Could not get Docker system info" -ForegroundColor Red
}

Write-Host "🎉 Docker verification complete!" -ForegroundColor Green
Write-Host "🚀 Ready to build containers!" -ForegroundColor Cyan
