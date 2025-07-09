# Infrastructure Health Check Script
# Validates all Azure resources in the Ms. Hoa Chinese Learning Platform

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("test", "prod")]
    [string]$Environment,
    
    [Parameter(Mandatory=$false)]
    [switch]$Detailed,
    
    [Parameter(Mandatory=$false)]
    [switch]$OutputJson
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
$failedTests = 0

# Function to run a health check
function Test-Resource {
    param(
        [string]$TestName,
        [scriptblock]$TestCommand,
        [string]$SuccessMessage,
        [string]$ErrorMessage
    )
    
    $script:totalTests++
    Write-Host "🔍 Testing $TestName..." -ForegroundColor Yellow
    
    try {
        $result = Invoke-Command -ScriptBlock $TestCommand
        if ($result) {
            Write-Host "  ✅ $SuccessMessage" -ForegroundColor Green
            $script:passedTests++
            return $true
        } else {
            Write-Host "  ❌ $ErrorMessage" -ForegroundColor Red
            $script:failedTests++
            return $false
        }
    }
    catch {
        Write-Host "  ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
        $script:failedTests++
        return $false
    }
}

# Check Azure CLI authentication
Write-Host "🔐 Checking Azure CLI authentication..." -ForegroundColor Yellow
$account = az account show 2>$null | ConvertFrom-Json
if ($account) {
    Write-Host "  ✅ Authenticated as: $($account.user.name)" -ForegroundColor Green
    if ($Detailed) {
        Write-Host "    Subscription: $($account.name)" -ForegroundColor Gray
    }
} else {
    Write-Host "  ❌ Azure CLI not authenticated. Please run 'az login'" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Test 1: Resource Group
Test-Resource -TestName "Resource Group" -TestCommand {
    $rg = az group show --name $resourceGroupName 2>$null | ConvertFrom-Json
    return $rg -and $rg.properties.provisioningState -eq "Succeeded"
} -SuccessMessage "Resource group exists and ready" -ErrorMessage "Resource group not found or failed"

# Test 2: Log Analytics Workspace
Test-Resource -TestName "Log Analytics Workspace" -TestCommand {
    $workspaceName = "workspace-mshoaresources$environmentSuffix"
    $workspace = az monitor log-analytics workspace show --resource-group $resourceGroupName --workspace-name $workspaceName 2>$null | ConvertFrom-Json
    return $workspace -and $workspace.provisioningState -eq "Succeeded"
} -SuccessMessage "Log Analytics workspace operational" -ErrorMessage "Log Analytics workspace not found or failed"

# Test 3: Storage Account
Test-Resource -TestName "Storage Account" -TestCommand {
    $storageName = "mshoastorage$environmentSuffix"
    $storage = az storage account show --resource-group $resourceGroupName --name $storageName 2>$null | ConvertFrom-Json
    return $storage -and $storage.statusOfPrimary -eq "available"
} -SuccessMessage "Storage account available" -ErrorMessage "Storage account not available"

# Test 4: Container Registry
Test-Resource -TestName "Container Registry" -TestCommand {
    $registryName = if ($Environment -eq "prod") { "mshoaprodregistry" } else { "mshoaregistry9977" }
    $registry = az acr show --resource-group $resourceGroupName --name $registryName 2>$null | ConvertFrom-Json
    return $registry -and $registry.provisioningState -eq "Succeeded"
} -SuccessMessage "Container registry ready" -ErrorMessage "Container registry not found or failed"

# Test 5: PostgreSQL Server
Test-Resource -TestName "PostgreSQL Server" -TestCommand {
    $postgresName = "mshoapostgres$environmentSuffix"
    $postgres = az postgres flexible-server show --resource-group $resourceGroupName --name $postgresName 2>$null | ConvertFrom-Json
    return $postgres -and $postgres.state -eq "Ready"
} -SuccessMessage "PostgreSQL server ready" -ErrorMessage "PostgreSQL server not ready"

# Test 6: Container Apps Environment
Test-Resource -TestName "Container Apps Environment" -TestCommand {
    $envName = if ($Environment -eq "prod") { "$containerNamePrefix-env-prod" } else { "$containerNamePrefix-env" }
    $env = az containerapp env show --resource-group $resourceGroupName --name $envName 2>$null | ConvertFrom-Json
    return $env -and $env.properties.provisioningState -eq "Succeeded"
} -SuccessMessage "Container Apps environment ready" -ErrorMessage "Container Apps environment not ready"

# Test 7: Container App
Test-Resource -TestName "Container App" -TestCommand {
    $appName = if ($Environment -eq "prod") { "$containerNamePrefix-backend-prod" } else { "$containerNamePrefix-backend" }
    $app = az containerapp show --resource-group $resourceGroupName --name $appName 2>$null | ConvertFrom-Json
    return $app -and $app.properties.provisioningState -eq "Succeeded"
} -SuccessMessage "Container app running" -ErrorMessage "Container app not running"

# Test 8: Static Web App
Test-Resource -TestName "Static Web App" -TestCommand {
    $staticAppName = "mshoafrontend$environmentSuffix"
    $staticApp = az staticwebapp show --resource-group $resourceGroupName --name $staticAppName 2>$null | ConvertFrom-Json
    return $staticApp -ne $null
} -SuccessMessage "Static web app ready" -ErrorMessage "Static web app not found"

# Summary
Write-Host ""
Write-Host "📊 HEALTH CHECK SUMMARY" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan

$healthPercentage = if ($totalTests -gt 0) { [math]::Round(($passedTests / $totalTests) * 100, 1) } else { 0 }

$overallStatus = switch ($healthPercentage) {
    { $_ -eq 100 } { "Excellent" }
    { $_ -ge 90 } { "Good" }
    { $_ -ge 70 } { "Warning" }
    default { "Critical" }
}

$statusColor = switch ($overallStatus) {
    "Excellent" { "Green" }
    "Good" { "Yellow" }
    "Warning" { "DarkYellow" }
    "Critical" { "Red" }
}

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
    
    $registryName = if ($Environment -eq "prod") { "mshoaprodregistry" } else { "mshoaregistry9977" }
    $postgresName = "mshoapostgres$environmentSuffix"
    
    Write-Host "Container Registry: $registryName.azurecr.io" -ForegroundColor Green
    Write-Host "PostgreSQL Server: $postgresName.postgres.database.azure.com" -ForegroundColor Green
    
    # Get container app URL
    $appName = if ($Environment -eq "prod") { "$containerNamePrefix-backend-prod" } else { "$containerNamePrefix-backend" }
    $containerApp = az containerapp show --resource-group $resourceGroupName --name $appName 2>$null | ConvertFrom-Json
    if ($containerApp -and $containerApp.properties.configuration.ingress.fqdn) {
        Write-Host "Backend API: https://$($containerApp.properties.configuration.ingress.fqdn)" -ForegroundColor Green
    }
    
    # Get static app URL
    $staticAppName = "mshoafrontend$environmentSuffix"
    $staticApp = az staticwebapp show --resource-group $resourceGroupName --name $staticAppName 2>$null | ConvertFrom-Json
    if ($staticApp -and $staticApp.defaultHostname) {
        Write-Host "Frontend: https://$($staticApp.defaultHostname)" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "Health check completed at $(Get-Date)" -ForegroundColor Gray

# Exit with appropriate code
if ($failedTests -gt 0) {
    Write-Host ""
    Write-Host "⚠️  Some resources are unhealthy. Please check the details above." -ForegroundColor Yellow
    exit 1
} else {
    Write-Host ""
    Write-Host "🎉 All infrastructure resources are healthy!" -ForegroundColor Green
    exit 0
}
