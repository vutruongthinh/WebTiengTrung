# Deploy Infrastructure to Test Environment
# This script deploys the Bicep templates to the test environment

param(
    [string]$ResourceGroupName = "chinese-learning-test",
    [string]$Location = "southeastasia",
    [string]$TemplateFile = "infrastructure\main.bicep",
    [string]$ParametersFile = "infrastructure\parameters\test.parameters.json"
)

Write-Host "Deploying infrastructure to TEST environment..." -ForegroundColor Green
Write-Host "Resource Group: $ResourceGroupName" -ForegroundColor Yellow
Write-Host "Location: $Location" -ForegroundColor Yellow

# Ensure resource group exists
Write-Host "Ensuring resource group exists..." -ForegroundColor Cyan
az group create --name $ResourceGroupName --location $Location

# Validate the template
Write-Host "Validating Bicep template..." -ForegroundColor Cyan
$validation = az deployment group validate `
    --resource-group $ResourceGroupName `
    --template-file $TemplateFile `
    --parameters $ParametersFile `
    --output json | ConvertFrom-Json

if ($validation.error) {
    Write-Host "❌ Template validation failed:" -ForegroundColor Red
    Write-Host $validation.error.message -ForegroundColor Red
    exit 1
} else {
    Write-Host "✅ Template validation successful" -ForegroundColor Green
}

# Deploy the template
Write-Host "Deploying infrastructure..." -ForegroundColor Cyan
$deployment = az deployment group create `
    --resource-group $ResourceGroupName `
    --template-file $TemplateFile `
    --parameters $ParametersFile `
    --name "infrastructure-$(Get-Date -Format 'yyyyMMdd-HHmmss')" `
    --output json | ConvertFrom-Json

if ($deployment.properties.provisioningState -eq "Succeeded") {
    Write-Host "✅ Deployment successful!" -ForegroundColor Green
    
    # Display outputs
    Write-Host "`nDeployment Outputs:" -ForegroundColor Cyan
    $deployment.properties.outputs.PSObject.Properties | ForEach-Object {
        Write-Host "  $($_.Name): $($_.Value.value)" -ForegroundColor White
    }
} else {
    Write-Host "❌ Deployment failed" -ForegroundColor Red
    Write-Host $deployment.properties.error.message -ForegroundColor Red
    exit 1
}

Write-Host "`n🎉 Test environment deployment complete!" -ForegroundColor Green
