# Azure Container Apps Deployment Script for Ms. Hoa Chinese Learning Platform
# This script deploys the Docker container to Azure Container Apps

# Configuration
$RESOURCE_GROUP = "chinese-learning-test"
$LOCATION = "southeastasia"  # Singapore - closest to Vietnam
$CONTAINER_APP_NAME = "ms-hoa-backend"
$CONTAINER_APP_ENV = "ms-hoa-env"
$ACR_NAME = "mshoaregistry9977"
$IMAGE_NAME = "ms-hoa-backend"
$IMAGE_TAG = "latest"

Write-Host "Starting Azure Container Apps deployment..." -ForegroundColor Green

# Check if logged into Azure
Write-Host "Checking Azure login status..." -ForegroundColor Yellow
try {
    $account = az account show --output json | ConvertFrom-Json
    Write-Host "Logged in as: $($account.user.name)" -ForegroundColor Green
} catch {
    Write-Host "Not logged into Azure. Please run 'az login' first." -ForegroundColor Red
    exit 1
}

# Create resource group if it doesn't exist
Write-Host "Creating/checking resource group: $RESOURCE_GROUP" -ForegroundColor Yellow
az group create --name $RESOURCE_GROUP --location $LOCATION

# Create Azure Container Registry if it doesn't exist
Write-Host "Creating/checking Azure Container Registry: $ACR_NAME" -ForegroundColor Yellow
$acrExists = az acr show --name $ACR_NAME --resource-group $RESOURCE_GROUP 2>$null
if (!$acrExists) {
    Write-Host "Creating new ACR..." -ForegroundColor Yellow
    az acr create --resource-group $RESOURCE_GROUP --name $ACR_NAME --sku Basic --admin-enabled true
} else {
    Write-Host "ACR already exists" -ForegroundColor Green
}

# Get ACR login server
$ACR_LOGIN_SERVER = az acr show --name $ACR_NAME --resource-group $RESOURCE_GROUP --query loginServer --output tsv

# Login to ACR
Write-Host "Logging into Azure Container Registry..." -ForegroundColor Yellow
az acr login --name $ACR_NAME

# Tag and push Docker image
Write-Host "Tagging Docker image..." -ForegroundColor Yellow
docker tag $IMAGE_NAME "$ACR_LOGIN_SERVER/${IMAGE_NAME}:${IMAGE_TAG}"

Write-Host "Pushing image to ACR..." -ForegroundColor Yellow
docker push "$ACR_LOGIN_SERVER/${IMAGE_NAME}:${IMAGE_TAG}"

# Get ACR credentials
Write-Host "Getting ACR credentials..." -ForegroundColor Yellow
$ACR_USERNAME = az acr credential show --name $ACR_NAME --query username --output tsv
$ACR_PASSWORD = az acr credential show --name $ACR_NAME --query passwords[0].value --output tsv

# Create Container Apps environment if it doesn't exist
Write-Host "Creating/checking Container Apps environment: $CONTAINER_APP_ENV" -ForegroundColor Yellow
$envExists = az containerapp env show --name $CONTAINER_APP_ENV --resource-group $RESOURCE_GROUP 2>$null
if (!$envExists) {
    Write-Host "Creating new Container Apps environment..." -ForegroundColor Yellow
    az containerapp env create --name $CONTAINER_APP_ENV --resource-group $RESOURCE_GROUP --location $LOCATION
} else {
    Write-Host "Container Apps environment already exists" -ForegroundColor Green
}

# Check if container app exists
$appExists = az containerapp show --name $CONTAINER_APP_NAME --resource-group $RESOURCE_GROUP 2>$null

if (!$appExists) {
    # Create new container app
    Write-Host "Creating new container app: $CONTAINER_APP_NAME" -ForegroundColor Yellow
    
    az containerapp create `
        --name $CONTAINER_APP_NAME `
        --resource-group $RESOURCE_GROUP `
        --environment $CONTAINER_APP_ENV `
        --image "$ACR_LOGIN_SERVER/${IMAGE_NAME}:${IMAGE_TAG}" `
        --registry-server $ACR_LOGIN_SERVER `
        --registry-username $ACR_USERNAME `
        --registry-password $ACR_PASSWORD `
        --target-port 8080 `
        --ingress external `
        --min-replicas 1 `
        --max-replicas 3 `
        --cpu 0.5 `
        --memory 1Gi `
        --env-vars "NODE_ENV=production" "PORT=8080" "DATABASE_URL=postgresql://mshoaadmin:Baolinh2008@@mshoapostgres2025.postgres.database.azure.com/postgres?sslmode=require" "JWT_SECRET=ms-hoa-chinese-learning-super-secret-key-2025" "JWT_EXPIRE=24h" "FRONTEND_URL=https://ashy-forest-090598d00.2.azurestaticapps.net"
        
} else {
    # Update existing container app
    Write-Host "Updating existing container app: $CONTAINER_APP_NAME" -ForegroundColor Yellow
    
    az containerapp update `
        --name $CONTAINER_APP_NAME `
        --resource-group $RESOURCE_GROUP `
        --image "$ACR_LOGIN_SERVER/${IMAGE_NAME}:${IMAGE_TAG}" `
        --registry-server $ACR_LOGIN_SERVER `
        --registry-username $ACR_USERNAME `
        --registry-password $ACR_PASSWORD
}

# Get the app URL
Write-Host "Getting application URL..." -ForegroundColor Yellow
$APP_URL = az containerapp show --name $CONTAINER_APP_NAME --resource-group $RESOURCE_GROUP --query properties.configuration.ingress.fqdn --output tsv

Write-Host ""
Write-Host "Deployment completed successfully!" -ForegroundColor Green
Write-Host "Application URL: https://$APP_URL" -ForegroundColor Cyan
Write-Host "Health Check: https://$APP_URL/api/health" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Test the deployed application at the URL above" -ForegroundColor White
Write-Host "2. Check logs with: az containerapp logs show --name $CONTAINER_APP_NAME --resource-group $RESOURCE_GROUP --follow" -ForegroundColor White
Write-Host "3. Monitor the app in Azure Portal" -ForegroundColor White
