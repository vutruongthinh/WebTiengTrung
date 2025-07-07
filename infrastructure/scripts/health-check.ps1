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

# Initialize results tracking
$healthResults = @{
    Environment = $Environment
    ResourceGroup = $resourceGroupName
    Timestamp = Get-Date
    OverallStatus = "Unknown"
    Resources = @{}
    Summary = @{
        Total = 0
        Healthy = 0
        Unhealthy = 0
        Warnings = 0
    }
}

# Function to test resource health
function Test-ResourceHealth {
    param(
        [string]$ResourceType,
        [string]$TestName,
        [scriptblock]$TestScript,
        [string]$ExpectedResult = ""
    )
    
    Write-Host "🔍 Testing $TestName..." -ForegroundColor Yellow
    $healthResults.Summary.Total++
    
    try {
        $result = & $TestScript
        $status = if ($result) { "✅ Healthy" } else { "❌ Failed" }
        $color = if ($result) { "Green" } else { "Red" }
        
        Write-Host "  $status - $TestName" -ForegroundColor $color
        
        if ($Detailed -and $result) {
            Write-Host "    Details: $ExpectedResult" -ForegroundColor Gray
        }
        
        $healthResults.Resources[$ResourceType] = @{
            Status = if ($result) { "Healthy" } else { "Failed" }
            Details = $result
            TestName = $TestName
        }
        
        if ($result) { $healthResults.Summary.Healthy++ } else { $healthResults.Summary.Unhealthy++ }
        return $result
    }
    catch {
        Write-Host "  ❌ Error - $TestName" -ForegroundColor Red
        Write-Host "    Error: $($_.Exception.Message)" -ForegroundColor Red
        
        $healthResults.Resources[$ResourceType] = @{
            Status = "Error"
            Details = $_.Exception.Message
            TestName = $TestName
        }
        $healthResults.Summary.Unhealthy++
        return $false
    }
}

# Check if Azure CLI is authenticated
Write-Host "🔐 Checking Azure CLI authentication..." -ForegroundColor Yellow
try {
    $account = az account show 2>$null | ConvertFrom-Json
    if ($account) {
        Write-Host "  ✅ Authenticated as: $($account.user.name)" -ForegroundColor Green
        Write-Host "  📋 Subscription: $($account.name)" -ForegroundColor Gray
    } else {
        throw "No account information returned"
    }
}
catch {
    Write-Host "  ❌ Azure CLI not authenticated. Please run 'az login'" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Test 1: Resource Group
Test-ResourceHealth -ResourceType "ResourceGroup" -TestName "Resource Group Existence" -TestScript {
    $rg = az group show --name $resourceGroupName 2>$null | ConvertFrom-Json
    return $rg -and $rg.properties.provisioningState -eq "Succeeded"
} -ExpectedResult "Resource group exists and is in Succeeded state"

# Test 2: Log Analytics Workspace
Test-ResourceHealth -ResourceType "LogAnalytics" -TestName "Log Analytics Workspace" -TestScript {
    $workspaceName = "workspace-mshoaresources$environmentSuffix"
    $workspace = az monitor log-analytics workspace show --resource-group $resourceGroupName --workspace-name $workspaceName 2>$null | ConvertFrom-Json
    return $workspace -and $workspace.provisioningState -eq "Succeeded"
} -ExpectedResult "Log Analytics workspace operational"

# Test 3: Storage Account
Test-ResourceHealth -ResourceType "StorageAccount" -TestName "Storage Account" -TestScript {
    $storageName = "mshoastorage$environmentSuffix"
    $storage = az storage account show --resource-group $resourceGroupName --name $storageName 2>$null | ConvertFrom-Json
    if ($storage -and $storage.statusOfPrimary -eq "available") {
        # Test blob container
        $containers = az storage container list --account-name $storageName --auth-mode login 2>$null | ConvertFrom-Json
        return $containers -and ($containers | Where-Object { $_.name -eq "media" })
    }
    return $false
} -ExpectedResult "Storage account available with media container"

# Test 4: Container Registry
Test-ResourceHealth -ResourceType "ContainerRegistry" -TestName "Container Registry" -TestScript {
    $registryName = if ($Environment -eq "prod") { "mshoaprodregistry" } else { "mshoaregistry9977" }
    $registry = az acr show --resource-group $resourceGroupName --name $registryName 2>$null | ConvertFrom-Json
    return $registry -and $registry.provisioningState -eq "Succeeded"
} -ExpectedResult "Container registry ready for image storage"

# Test 5: PostgreSQL Server
Test-ResourceHealth -ResourceType "PostgreSQL" -TestName "PostgreSQL Flexible Server" -TestScript {
    $postgresName = "mshoapostgres$environmentSuffix"
    $postgres = az postgres flexible-server show --resource-group $resourceGroupName --name $postgresName 2>$null | ConvertFrom-Json
    if ($postgres -and $postgres.state -eq "Ready") {
        # Test database exists
        $databases = az postgres flexible-server db list --resource-group $resourceGroupName --server-name $postgresName 2>$null | ConvertFrom-Json
        return $databases -and ($databases | Where-Object { $_.name -eq "mshoaapp" })
    }
    return $false
} -ExpectedResult "PostgreSQL server ready with mshoaapp database"

# Test 6: Container Apps Environment
Test-ResourceHealth -ResourceType "ContainerAppsEnvironment" -TestName "Container Apps Environment" -TestScript {
    $envName = if ($Environment -eq "prod") { "$containerNamePrefix-env-prod" } else { "$containerNamePrefix-env" }
    $env = az containerapp env show --resource-group $resourceGroupName --name $envName 2>$null | ConvertFrom-Json
    return $env -and $env.properties.provisioningState -eq "Succeeded"
} -ExpectedResult "Container Apps environment ready for applications"

# Test 7: Container App
Test-ResourceHealth -ResourceType "ContainerApp" -TestName "Container App" -TestScript {
    $appName = if ($Environment -eq "prod") { "$containerNamePrefix-backend-prod" } else { "$containerNamePrefix-backend" }
    $app = az containerapp show --resource-group $resourceGroupName --name $appName 2>$null | ConvertFrom-Json
    if ($app -and $app.properties.provisioningState -eq "Succeeded") {
        # Test if app is running
        return $app.properties.runningStatus -eq "Running"
    }
    return $false
} -ExpectedResult "Container app running and accessible"

# Test 8: Static Web App
Test-ResourceHealth -ResourceType "StaticWebApp" -TestName "Static Web App" -TestScript {
    $staticAppName = "mshoafrontend$environmentSuffix"
    $staticApp = az staticwebapp show --resource-group $resourceGroupName --name $staticAppName 2>$null | ConvertFrom-Json
    return $staticApp -and $staticApp.repositoryUrl -ne $null
} -ExpectedResult "Static web app ready for frontend deployment"

# Calculate overall health status
Write-Host ""
Write-Host "📊 HEALTH CHECK SUMMARY" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan

$healthPercentage = if ($healthResults.Summary.Total -gt 0) { 
    [math]::Round(($healthResults.Summary.Healthy / $healthResults.Summary.Total) * 100, 1) 
} else { 0 }

$healthResults.OverallStatus = switch ($healthPercentage) {
    { $_ -eq 100 } { "Excellent" }
    { $_ -ge 90 } { "Good" }
    { $_ -ge 70 } { "Warning" }
    default { "Critical" }
}

$statusColor = switch ($healthResults.OverallStatus) {
    "Excellent" { "Green" }
    "Good" { "Yellow" }
    "Warning" { "DarkYellow" }
    "Critical" { "Red" }
}

Write-Host "Overall Status: " -NoNewline
Write-Host "$($healthResults.OverallStatus) ($healthPercentage%)" -ForegroundColor $statusColor
Write-Host "Total Resources: $($healthResults.Summary.Total)" -ForegroundColor Gray
Write-Host "Healthy: $($healthResults.Summary.Healthy)" -ForegroundColor Green
Write-Host "Unhealthy: $($healthResults.Summary.Unhealthy)" -ForegroundColor Red

# Display resource URLs if all healthy
if ($healthResults.Summary.Unhealthy -eq 0) {
    Write-Host ""
    Write-Host "🌐 INFRASTRUCTURE ENDPOINTS" -ForegroundColor Cyan
    Write-Host "============================" -ForegroundColor Cyan
    
    $registryName = if ($Environment -eq "prod") { "mshoaprodregistry" } else { "mshoaregistry9977" }
    $postgresName = "mshoapostgres$environmentSuffix"
    $appName = if ($Environment -eq "prod") { "$containerNamePrefix-backend-prod" } else { "$containerNamePrefix-backend" }
    $staticAppName = "mshoafrontend$environmentSuffix"
    
    # Get actual URLs
    try {
        $containerApp = az containerapp show --resource-group $resourceGroupName --name $appName 2>$null | ConvertFrom-Json
        $staticApp = az staticwebapp show --resource-group $resourceGroupName --name $staticAppName 2>$null | ConvertFrom-Json
        
        Write-Host "Container Registry: $registryName.azurecr.io" -ForegroundColor Green
        Write-Host "PostgreSQL Server: $postgresName.postgres.database.azure.com" -ForegroundColor Green
        if ($containerApp.properties.configuration.ingress.fqdn) {
            Write-Host "Backend API: https://$($containerApp.properties.configuration.ingress.fqdn)" -ForegroundColor Green
        }
        if ($staticApp.defaultHostname) {
            Write-Host "Frontend: https://$($staticApp.defaultHostname)" -ForegroundColor Green
        }
    }
    catch {
        Write-Host "Could not retrieve endpoint URLs" -ForegroundColor Yellow
    }
}

# Output JSON if requested
if ($OutputJson) {
    $jsonOutput = $healthResults | ConvertTo-Json -Depth 3
    $jsonFile = "health-check-$Environment-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
    $jsonOutput | Out-File -FilePath $jsonFile -Encoding UTF8
    Write-Host ""
    Write-Host "📄 JSON report saved to: $jsonFile" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "Health check completed at $(Get-Date)" -ForegroundColor Gray

# Exit with appropriate code
if ($healthResults.Summary.Unhealthy -gt 0) {
    Write-Host ""
    Write-Host "⚠️  Some resources are unhealthy. Please check the details above." -ForegroundColor Yellow
    exit 1
} else {
    Write-Host ""
    Write-Host "🎉 All infrastructure resources are healthy!" -ForegroundColor Green
    exit 0
}
