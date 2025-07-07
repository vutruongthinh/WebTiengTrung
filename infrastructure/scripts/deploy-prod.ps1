# Deploy Infrastructure to Production Environment
# This script deploys the Bicep templates to the production environment

param(
    [string]$ResourceGroupName = "chinese-learning-prod",
    [string]$Location = "southeastasia",
    [string]$TemplateFile = "infrastructure\main.bicep",
    [string]$ParametersFile = "infrastructure\parameters\prod.parameters.json"
)

Write-Host "⚠️  PRODUCTION DEPLOYMENT" -ForegroundColor Red
Write-Host "This will deploy infrastructure to PRODUCTION environment" -ForegroundColor Yellow
Write-Host "Resource Group: $ResourceGroupName" -ForegroundColor Yellow
Write-Host "Location: $Location" -ForegroundColor Yellow

# Confirmation prompt
$confirmation = Read-Host "Are you sure you want to deploy to PRODUCTION? (type 'YES' to continue)"
if ($confirmation -ne "YES") {
    Write-Host "Deployment cancelled." -ForegroundColor Yellow
    exit 0
}

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

# Final confirmation before deployment
Write-Host "`n⚠️  FINAL CONFIRMATION REQUIRED" -ForegroundColor Red
$finalConfirmation = Read-Host "Deploy to PRODUCTION now? (type 'DEPLOY' to proceed)"
if ($finalConfirmation -ne "DEPLOY") {
    Write-Host "Deployment cancelled." -ForegroundColor Yellow
    exit 0
}

# Deploy the template
Write-Host "🚀 Deploying to PRODUCTION..." -ForegroundColor Cyan
$deployment = az deployment group create `
    --resource-group $ResourceGroupName `
    --template-file $TemplateFile `
    --parameters $ParametersFile `
    --name "production-$(Get-Date -Format 'yyyyMMdd-HHmmss')" `
    --output json | ConvertFrom-Json

if ($deployment.properties.provisioningState -eq "Succeeded") {
    Write-Host "✅ PRODUCTION deployment successful!" -ForegroundColor Green
    
    # Display outputs
    Write-Host "`nDeployment Outputs:" -ForegroundColor Cyan
    $deployment.properties.outputs.PSObject.Properties | ForEach-Object {
        Write-Host "  $($_.Name): $($_.Value.value)" -ForegroundColor White
    }
    
    Write-Host "`n🎉 PRODUCTION environment is live!" -ForegroundColor Green
} else {
    Write-Host "❌ PRODUCTION deployment failed" -ForegroundColor Red
    Write-Host $deployment.properties.error.message -ForegroundColor Red
    exit 1
}
