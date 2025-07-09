# Infrastructure Health Check Script
# Validates all Azure resources in the Ms. Hoa Chinese Learning Platform

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("test", "prod")]
    [string]$Environment
)

# Set environment-specific variables
$environmentSuffix = if ($Environment -eq "prod") { "prod" } else { "2025" }
$resourceGroupName = "chinese-learning-$Environment"
$containerNamePrefix = "ms-hoa"

Write-Host "=== Ms. Hoa Infrastructure Health Check ===" -ForegroundColor Green
Write-Host "Environment: $Environment" -ForegroundColor Cyan
Write-Host "Resource Group: $resourceGroupName" -ForegroundColor Cyan
Write-Host "Time: $(Get-Date)" -ForegroundColor Gray
Write-Host ""

# Initialize counters
$totalTests = 0
$passedTests = 0

# Check Azure CLI authentication
Write-Host "🔐 Checking Azure CLI authentication..." -ForegroundColor Yellow
$account = az account show 2>$null | ConvertFrom-Json
if ($account) {
    Write-Host "  ✅ Authenticated as: $($account.user.name)" -ForegroundColor Green
} else {
    Write-Host "  ❌ Azure CLI not authenticated. Please run 'az login'" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Test 1: Resource Group
$totalTests++
Write-Host "🔍 Testing Resource Group..." -ForegroundColor Yellow
$rg = az group show --name $resourceGroupName 2>$null | ConvertFrom-Json
if ($rg -and $rg.properties.provisioningState -eq "Succeeded") {
    Write-Host "  ✅ Resource group exists and ready" -ForegroundColor Green
    $passedTests++
} else {
    Write-Host "  ❌ Resource group not found or failed" -ForegroundColor Red
}

# Test 2: Log Analytics
$totalTests++
Write-Host "🔍 Testing Log Analytics Workspace..." -ForegroundColor Yellow
$workspaceName = "workspace-mshoaresources$environmentSuffix"
$workspace = az monitor log-analytics workspace show --resource-group $resourceGroupName --workspace-name $workspaceName 2>$null | ConvertFrom-Json
if ($workspace -and $workspace.provisioningState -eq "Succeeded") {
    Write-Host "  ✅ Log Analytics workspace operational" -ForegroundColor Green
    $passedTests++
} else {
    Write-Host "  ❌ Log Analytics workspace not found or failed" -ForegroundColor Red
}

# Test 3: Storage Account
$totalTests++
Write-Host "🔍 Testing Storage Account..." -ForegroundColor Yellow
$storageName = "mshoastorage$environmentSuffix"
$storage = az storage account show --resource-group $resourceGroupName --name $storageName 2>$null | ConvertFrom-Json
if ($storage -and $storage.statusOfPrimary -eq "available") {
    Write-Host "  ✅ Storage account available" -ForegroundColor Green
    $passedTests++
} else {
    Write-Host "  ❌ Storage account not available" -ForegroundColor Red
}

# Test 4: Container Registry
$totalTests++
Write-Host "🔍 Testing Container Registry..." -ForegroundColor Yellow
$registryName = if ($Environment -eq "prod") { "mshoaprodregistry" } else { "mshoaregistry9977" }
$registry = az acr show --resource-group $resourceGroupName --name $registryName 2>$null | ConvertFrom-Json
if ($registry -and $registry.provisioningState -eq "Succeeded") {
    Write-Host "  ✅ Container registry ready" -ForegroundColor Green
    $passedTests++
} else {
    Write-Host "  ❌ Container registry not found or failed" -ForegroundColor Red
}

# Test 5: PostgreSQL Server
$totalTests++
Write-Host "🔍 Testing PostgreSQL Server..." -ForegroundColor Yellow
$postgresName = "mshoapostgres$environmentSuffix"
$postgres = az postgres flexible-server show --resource-group $resourceGroupName --name $postgresName 2>$null | ConvertFrom-Json
if ($postgres -and $postgres.state -eq "Ready") {
    Write-Host "  ✅ PostgreSQL server ready" -ForegroundColor Green
    $passedTests++
} else {
    Write-Host "  ❌ PostgreSQL server not ready" -ForegroundColor Red
}

# Test 6: Container Apps Environment
$totalTests++
Write-Host "🔍 Testing Container Apps Environment..." -ForegroundColor Yellow
$envName = if ($Environment -eq "prod") { "$containerNamePrefix-env-prod" } else { "$containerNamePrefix-env" }
$env = az containerapp env show --resource-group $resourceGroupName --name $envName 2>$null | ConvertFrom-Json
if ($env -and $env.properties.provisioningState -eq "Succeeded") {
    Write-Host "  ✅ Container Apps environment ready" -ForegroundColor Green
    $passedTests++
} else {
    Write-Host "  ❌ Container Apps environment not ready" -ForegroundColor Red
}

# Test 7: Container App
$totalTests++
Write-Host "🔍 Testing Container App..." -ForegroundColor Yellow
$appName = if ($Environment -eq "prod") { "$containerNamePrefix-backend-prod" } else { "$containerNamePrefix-backend" }
$app = az containerapp show --resource-group $resourceGroupName --name $appName 2>$null | ConvertFrom-Json
if ($app -and $app.properties.provisioningState -eq "Succeeded") {
    Write-Host "  ✅ Container app running" -ForegroundColor Green
    $passedTests++
} else {
    Write-Host "  ❌ Container app not running" -ForegroundColor Red
}

# Test 8: Static Web App
$totalTests++
Write-Host "🔍 Testing Static Web App..." -ForegroundColor Yellow
$staticAppName = "mshoafrontend$environmentSuffix"
$staticApp = az staticwebapp show --resource-group $resourceGroupName --name $staticAppName 2>$null | ConvertFrom-Json
if ($staticApp) {
    Write-Host "  ✅ Static web app ready" -ForegroundColor Green
    $passedTests++
} else {
    Write-Host "  ❌ Static web app not found" -ForegroundColor Red
}

# Summary
Write-Host ""
Write-Host "📊 HEALTH CHECK SUMMARY" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan

$failedTests = $totalTests - $passedTests
$healthPercentage = if ($totalTests -gt 0) { [math]::Round(($passedTests / $totalTests) * 100, 1) } else { 0 }

$overallStatus = if ($healthPercentage -eq 100) { "Excellent" } 
                elseif ($healthPercentage -ge 90) { "Good" }
                elseif ($healthPercentage -ge 70) { "Warning" }
                else { "Critical" }

$statusColor = if ($overallStatus -eq "Excellent") { "Green" }
              elseif ($overallStatus -eq "Good") { "Yellow" }
              elseif ($overallStatus -eq "Warning") { "DarkYellow" }
              else { "Red" }

Write-Host "Overall Status: " -NoNewline
Write-Host "$overallStatus ($healthPercentage%)" -ForegroundColor $statusColor
Write-Host "Total Tests: $totalTests" -ForegroundColor Gray
Write-Host "Passed: $passedTests" -ForegroundColor Green
Write-Host "Failed: $failedTests" -ForegroundColor Red

# Display endpoints if all tests passed
if ($failedTests -eq 0) {
    Write-Host ""
    Write-Host "🌐 INFRASTRUCTURE ENDPOINTS" -ForegroundColor Cyan
    Write-Host "============================" -ForegroundColor Cyan
    
    Write-Host "Container Registry: $registryName.azurecr.io" -ForegroundColor Green
    Write-Host "PostgreSQL Server: $postgresName.postgres.database.azure.com" -ForegroundColor Green
    
    # Get container app URL
    if ($app -and $app.properties.configuration.ingress.fqdn) {
        Write-Host "Backend API: https://$($app.properties.configuration.ingress.fqdn)" -ForegroundColor Green
    }
    
    # Get static app URL
    if ($staticApp -and $staticApp.defaultHostname) {
        Write-Host "Frontend: https://$($staticApp.defaultHostname)" -ForegroundColor Green
    }
}

Write-Host ""
if ($failedTests -gt 0) {
    Write-Host "⚠️  Some resources are unhealthy. Please check the details above." -ForegroundColor Yellow
    Write-Host "Health check completed at $(Get-Date)" -ForegroundColor Gray
    exit 1
} else {
    Write-Host "🎉 All infrastructure resources are healthy!" -ForegroundColor Green
    Write-Host "Health check completed at $(Get-Date)" -ForegroundColor Gray
    exit 0
}
