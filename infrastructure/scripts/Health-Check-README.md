# Health Check Script Documentation

## Test-Infrastructure.ps1

### Purpose
Validates all Azure resources in the Ms. Hoa Chinese Learning Platform infrastructure.

### Usage

#### Basic Usage
```powershell
# Test environment health check
.\infrastructure\scripts\Test-Infrastructure.ps1 -Environment test

# Production environment health check  
.\infrastructure\scripts\Test-Infrastructure.ps1 -Environment prod
```

### What It Tests

#### 8 Critical Infrastructure Components
1. **Resource Group** - Validates group exists and is ready
2. **Log Analytics Workspace** - Monitoring foundation
3. **Storage Account** - File and blob storage
4. **Container Registry** - Docker image repository
5. **PostgreSQL Server** - Database server
6. **Container Apps Environment** - Application hosting environment
7. **Container App** - Backend API application
8. **Static Web App** - Frontend website

### Expected Output

#### Successful Test (Example)
```
=== Ms. Hoa Infrastructure Health Check ===
Environment: test
Resource Group: chinese-learning-test

🔐 Checking Azure CLI authentication...
  ✅ Authenticated as: user@domain.com

🔍 Testing Resource Group...
  ✅ Resource group exists and ready
🔍 Testing Log Analytics Workspace...
  ✅ Log Analytics workspace operational
🔍 Testing Storage Account...
  ✅ Storage account available
🔍 Testing Container Registry...
  ✅ Container registry ready
🔍 Testing PostgreSQL Server...
  ✅ PostgreSQL server ready
🔍 Testing Container Apps Environment...
  ✅ Container Apps environment ready
🔍 Testing Container App...
  ✅ Container app running
🔍 Testing Static Web App...
  ✅ Static web app ready

📊 HEALTH CHECK SUMMARY
=========================
Overall Status: Excellent (100%)
Total Tests: 8
Passed: 8
Failed: 0

🌐 INFRASTRUCTURE ENDPOINTS
============================
Container Registry: mshoaregistry9977.azurecr.io
PostgreSQL Server: mshoapostgres2025.postgres.database.azure.com
Backend API: https://ms-hoa-backend.agreeablefield-d33e4bba.southeastasia.azurecontainerapps.io
Frontend: https://ashy-forest-090598d00.2.azurestaticapps.net

🎉 All infrastructure resources are healthy!
```

### Environment Differences

#### Test Environment (test)
- **Resource Group**: chinese-learning-test
- **Registry**: mshoaregistry9977
- **Database**: mshoapostgres2025
- **Container App**: ms-hoa-backend
- **Static App**: mshoafrontend2025

#### Production Environment (prod)
- **Resource Group**: chinese-learning-prod
- **Registry**: mshoaprodregistry
- **Database**: mshoapostgres-prod
- **Container App**: ms-hoa-backend-prod
- **Static App**: mshoafrontend-prod

### Exit Codes
- **0**: All tests passed (healthy)
- **1**: One or more tests failed (unhealthy)

### Prerequisites
- Azure CLI installed and authenticated (`az login`)
- Permissions to read resources in the target resource group
- PowerShell 5.1 or later

### Integration with CI/CD

#### GitHub Actions Usage
```yaml
- name: Health Check Infrastructure
  run: |
    .\infrastructure\scripts\Test-Infrastructure.ps1 -Environment test
```

#### Manual Deployment Verification
```powershell
# After deployment, verify infrastructure
.\infrastructure\scripts\Test-Infrastructure.ps1 -Environment test

# Check exit code
if ($LASTEXITCODE -eq 0) {
    Write-Host "Infrastructure is healthy ✅"
} else {
    Write-Host "Infrastructure has issues ❌"
}
```

### Troubleshooting

#### Common Issues
1. **Authentication Error**: Run `az login`
2. **Resource Not Found**: Check environment parameter (test/prod)
3. **Permission Denied**: Verify Azure RBAC permissions
4. **Service Unavailable**: Check Azure service health

#### Debug Steps
1. Verify Azure CLI: `az account show`
2. Check resource group: `az group show --name chinese-learning-test`
3. List resources: `az resource list --resource-group chinese-learning-test`

### Maintenance

#### When to Run
- After infrastructure deployments
- Before application deployments  
- During incident response
- Regular health monitoring
- Before production releases

#### Expected Results
- **Test Environment**: Should always be 100% healthy after successful deployment
- **Production Environment**: Should maintain 100% health during normal operations

### Script Limitations
- Does not test application functionality (only infrastructure)
- Does not validate network connectivity between services
- Does not check application-specific configurations
- Does not test database contents or schemas

For application-level testing, additional scripts are needed.
