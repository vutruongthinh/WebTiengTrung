# Azure Test Infrastructure Setup Script
# Ms. Hoa Chinese Learning Platform - Test Environment

# Variables
$resourceGroup = "chinese-learning-test"
$location = "southeastasia"  # Fixed: Valid Azure region name
$appServicePlan = "test-appserviceplan"
$backendApp = "test-backend-app-$(Get-Random -Minimum 1000 -Maximum 9999)"  # Must be globally unique
$frontendApp = "test-frontend-$(Get-Random -Minimum 1000 -Maximum 9999)"  # Must be globally unique
$database = "test-db-$(Get-Random -Minimum 1000 -Maximum 9999)"  # Must be globally unique
$storageAccount = "mshoastorage2025"  # Easy to remember storage account name
$dbAdminUser = "mshoaadmin"
$dbAdminPassword = "Baolinh2008@"  # Change this to a secure password

Write-Host "🚀 Starting Azure Infrastructure Setup for Ms. Hoa Chinese Learning Platform" -ForegroundColor Green
Write-Host "📍 Location: $location" -ForegroundColor Cyan
Write-Host "📦 Resource Group: $resourceGroup" -ForegroundColor Cyan

# Set Azure CLI path
$azPath = "C:\Program Files\Microsoft SDKs\Azure\CLI2\wbin\az.cmd"

# Step 1: Create Resource Group
Write-Host "`n📁 Creating Resource Group..." -ForegroundColor Yellow
& $azPath group create --name $resourceGroup --location $location

# Step 2: Create Storage Account
Write-Host "`n💾 Creating Storage Account..." -ForegroundColor Yellow
& $azPath storage account create `
    --name $storageAccount `
    --resource-group $resourceGroup `
    --location $location `
    --sku Standard_LRS `
    --kind StorageV2

# Step 3: Create PostgreSQL Flexible Server
Write-Host "`n🗄️ Creating PostgreSQL Database..." -ForegroundColor Yellow
& $azPath postgres flexible-server create `
    --name $database `
    --resource-group $resourceGroup `
    --location $location `
    --admin-user $dbAdminUser `
    --admin-password $dbAdminPassword `
    --sku-name Standard_B1ms `
    --tier Burstable `
    --storage-size 32 `
    --version 15

# Step 4: Configure PostgreSQL firewall (allow Azure services)
Write-Host "`n🔥 Configuring Database Firewall..." -ForegroundColor Yellow
& $azPath postgres flexible-server firewall-rule create `
    --resource-group $resourceGroup `
    --name $database `
    --rule-name AllowAzureServices `
    --start-ip-address 0.0.0.0 `
    --end-ip-address 0.0.0.0

# Step 5: Create App Service Plan
Write-Host "`n📋 Creating App Service Plan..." -ForegroundColor Yellow
& $azPath appservice plan create `
    --name $appServicePlan `
    --resource-group $resourceGroup `
    --location $location `
    --sku FREE `
    --is-linux

# Step 6: Create Backend App Service
Write-Host "`n🚀 Creating Backend App Service..." -ForegroundColor Yellow
& $azPath webapp create `
    --name $backendApp `
    --resource-group $resourceGroup `
    --plan $appServicePlan `
    --runtime "NODE:20-lts"

# Step 7: Create Static Web App for Frontend
Write-Host "`n🌐 Creating Static Web App for Frontend..." -ForegroundColor Yellow
& $azPath staticwebapp create `
    --name $frontendApp `
    --resource-group $resourceGroup `
    --location $location

Write-Host "`n✅ Infrastructure Setup Complete!" -ForegroundColor Green
Write-Host "`n📊 Resource Summary:" -ForegroundColor Cyan
Write-Host "Resource Group: $resourceGroup" -ForegroundColor White
Write-Host "Storage Account: $storageAccount" -ForegroundColor White
Write-Host "Database: $database" -ForegroundColor White
Write-Host "Backend App: $backendApp" -ForegroundColor White
Write-Host "Frontend App: $frontendApp" -ForegroundColor White
Write-Host "Location: $location" -ForegroundColor White

Write-Host "`n🔑 Important Information:" -ForegroundColor Yellow
Write-Host "Database Admin User: $dbAdminUser" -ForegroundColor White
Write-Host "Database Admin Password: $dbAdminPassword" -ForegroundColor Red
Write-Host "`n⚠️ SAVE THIS PASSWORD SECURELY!" -ForegroundColor Red

# Get connection strings and URLs
Write-Host "`n🔗 Getting Connection Information..." -ForegroundColor Yellow

# Database connection string
$dbConnectionString = & $azPath postgres flexible-server show-connection-string `
    --server-name $database `
    --database-name postgres `
    --admin-user $dbAdminUser `
    --admin-password $dbAdminPassword

Write-Host "`nDatabase Connection String:" -ForegroundColor Cyan
Write-Host $dbConnectionString -ForegroundColor White

# Backend App URL
$backendUrl = & $azPath webapp show --name $backendApp --resource-group $resourceGroup --query "defaultHostName" --output tsv
Write-Host "`nBackend URL: https://$backendUrl" -ForegroundColor Cyan

# Static Web App URL
$frontendUrl = & $azPath staticwebapp show --name $frontendApp --resource-group $resourceGroup --query "defaultHostname" --output tsv
Write-Host "Frontend URL: https://$frontendUrl" -ForegroundColor Cyan

Write-Host "`n🎉 Setup completed successfully!" -ForegroundColor Green
Write-Host "Next steps: Configure GitHub Actions for CI/CD" -ForegroundColor Yellow
