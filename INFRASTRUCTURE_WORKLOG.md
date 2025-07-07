# Infrastructure Setup Worklog

**Project**: Ms. Hoa Chinese Learning Platform - IaC & CI/CD Setup  
**Start Date**: July 7, 2025  
**Objective**: Convert manual deployment to Infrastructure as Code with automated CI/CD pipelines

---

## Table of Contents
1. [Current State Analysis](#current-state-analysis)
2. [Infrastructure Documentation](#infrastructure-documentation)
3. [Bicep Template Creation](#bicep-template-creation)
4. [GitHub Actions Setup](#github-actions-setup)
5. [Production Environment Deployment](#production-environment-deployment)
6. [Testing and Validation](#testing-and-validation)
7. [Issues and Resolutions](#issues-and-resolutions)
8. [Command Reference](#command-reference)

---

## Current State Analysis

### Initial Environment Status
**Date**: July 7, 2025  
**Status**: Starting infrastructure analysis

#### Pre-Setup Verification Commands
```powershell
# Verify Azure CLI login
az account show --output table

# Check current resource group
az group show --name chinese-learning-test --output table

# List all resources in test environment
az resource list --resource-group chinese-learning-test --output table
```

#### Environment Variables Used
- `RESOURCE_GROUP`: chinese-learning-test
- `LOCATION`: southeastasia
- `CONTAINER_APP_NAME`: ms-hoa-backend
- `CONTAINER_APP_ENV`: ms-hoa-env
- `ACR_NAME`: mshoaregistry9977
- `IMAGE_NAME`: ms-hoa-backend
- `IMAGE_TAG`: latest

---

## Infrastructure Documentation

### Step 1.1: Resource Group Analysis
**Objective**: Document current resource group configuration

#### Commands Executed:
```powershell
# Get resource group details
az group show --name chinese-learning-test --output json > current-rg-config.json

# List all resources with details
az resource list --resource-group chinese-learning-test --output json > current-resources.json

# Get resource group tags and metadata
az group show --name chinese-learning-test --query "{name:name, location:location, tags:tags, properties:properties}" --output table
```

**Output**: [To be filled during execution]

**Notes**: [To be filled during execution]

---

### Step 1.2: Container Registry Analysis
**Objective**: Document Container Registry configuration

#### Commands Executed:
```powershell
# Get ACR details
az acr show --name mshoaregistry9977 --resource-group chinese-learning-test --output json > acr-config.json

# List repositories in ACR
az acr repository list --name mshoaregistry9977 --output table

# Get ACR credentials info (not actual credentials)
az acr credential show --name mshoaregistry9977 --query "{username:username, passwordsCount:length(passwords)}" --output table

# Check ACR SKU and settings
az acr show --name mshoaregistry9977 --query "{name:name, sku:sku.name, adminUserEnabled:adminUserEnabled, loginServer:loginServer}" --output table
```

**Output**: [To be filled during execution]

**Notes**: [To be filled during execution]

---

### Step 1.3: Container Apps Analysis
**Objective**: Document Container Apps environment and app configuration

#### Commands Executed:
```powershell
# Get Container Apps Environment details
az containerapp env show --name ms-hoa-env --resource-group chinese-learning-test --output json > containerapp-env-config.json

# Get Container App details
az containerapp show --name ms-hoa-backend --resource-group chinese-learning-test --output json > containerapp-config.json

# Get current revision details
az containerapp revision list --name ms-hoa-backend --resource-group chinese-learning-test --output table

# Get ingress configuration
az containerapp show --name ms-hoa-backend --resource-group chinese-learning-test --query "properties.configuration.ingress" --output json

# Get environment variables (excluding secrets)
az containerapp show --name ms-hoa-backend --resource-group chinese-learning-test --query "properties.template.containers[0].env" --output table
```

**Output**: [To be filled during execution]

**Notes**: [To be filled during execution]

---

### Step 1.4: Static Web App Analysis
**Objective**: Document Static Web App configuration

#### Commands Executed:
```powershell
# Get Static Web App details
az staticwebapp show --name mshoafrontend2025 --resource-group chinese-learning-test --output json > staticwebapp-config.json

# Get custom domains (if any)
az staticwebapp hostname list --name mshoafrontend2025 --resource-group chinese-learning-test --output table

# Get deployment details
az staticwebapp show --name mshoafrontend2025 --query "{name:name, defaultHostname:defaultHostname, repositoryUrl:repositoryUrl, branch:branch}" --output table
```

**Output**: [To be filled during execution]

**Notes**: [To be filled during execution]

---

### Step 1.5: PostgreSQL Database Analysis
**Objective**: Document PostgreSQL server configuration

#### Commands Executed:
```powershell
# Get PostgreSQL server details
az postgres server show --name mshoapostgres2025 --resource-group chinese-learning-test --output json > postgresql-config.json

# Get firewall rules
az postgres server firewall-rule list --server-name mshoapostgres2025 --resource-group chinese-learning-test --output table

# Get server configuration
az postgres server show --name mshoapostgres2025 --resource-group chinese-learning-test --query "{name:name, version:version, sku:sku, administratorLogin:administratorLogin, sslEnforcement:sslEnforcement}" --output table

# List databases
az postgres db list --server-name mshoapostgres2025 --resource-group chinese-learning-test --output table
```

**Output**: [To be filled during execution]

**Notes**: [To be filled during execution]

---

## Bicep Template Creation

### Step 2.1: Create Infrastructure Directory Structure
**Objective**: Set up organized structure for Bicep templates

#### Commands Executed:
```powershell
# Create infrastructure directory structure
mkdir infrastructure
mkdir infrastructure\modules
mkdir infrastructure\parameters
mkdir infrastructure\scripts

# Create initial files
New-Item -Path "infrastructure\main.bicep" -ItemType File
New-Item -Path "infrastructure\modules\containerRegistry.bicep" -ItemType File
New-Item -Path "infrastructure\modules\containerApps.bicep" -ItemType File
New-Item -Path "infrastructure\modules\staticWebApp.bicep" -ItemType File
New-Item -Path "infrastructure\modules\postgresql.bicep" -ItemType File
New-Item -Path "infrastructure\parameters\test.parameters.json" -ItemType File
New-Item -Path "infrastructure\parameters\prod.parameters.json" -ItemType File
```

**Output**: [To be filled during execution]

**Notes**: [To be filled during execution]

---

### Step 2.2: Create Main Bicep Template
**Objective**: Create the main orchestration template

#### Files Created:
- `infrastructure/main.bicep`
- `infrastructure/parameters/test.parameters.json`
- `infrastructure/parameters/prod.parameters.json`

**Commands for Validation**:
```powershell
# Validate main Bicep template
az deployment group validate --resource-group chinese-learning-test --template-file infrastructure\main.bicep --parameters infrastructure\parameters\test.parameters.json

# Build Bicep to ARM template (for verification)
az bicep build --file infrastructure\main.bicep
```

**Output**: [To be filled during execution]

**Notes**: [To be filled during execution]

---

### Step 2.3: Create Module Templates
**Objective**: Create modular Bicep templates for each resource type

#### Container Registry Module
```powershell
# Validate Container Registry module
az deployment group validate --resource-group chinese-learning-test --template-file infrastructure\modules\containerRegistry.bicep --parameters registryName=testacr location=southeastasia
```

#### Container Apps Module
```powershell
# Validate Container Apps module
az deployment group validate --resource-group chinese-learning-test --template-file infrastructure\modules\containerApps.bicep --parameters @infrastructure\parameters\containerapp-test.json
```

#### Static Web App Module
```powershell
# Validate Static Web App module
az deployment group validate --resource-group chinese-learning-test --template-file infrastructure\modules\staticWebApp.bicep --parameters appName=testapp location=eastasia
```

#### PostgreSQL Module
```powershell
# Validate PostgreSQL module
az deployment group validate --resource-group chinese-learning-test --template-file infrastructure\modules\postgresql.bicep --parameters @infrastructure\parameters\postgresql-test.json
```

**Output**: [To be filled during execution]

**Notes**: [To be filled during execution]

---

## GitHub Actions Setup

### Step 3.1: Create Azure Service Principal
**Objective**: Create service principal for GitHub Actions authentication

#### Commands Executed:
```powershell
# Create service principal with Contributor role
az ad sp create-for-rbac --name "GitHubActions-ChineseLearning" --role contributor --scopes /subscriptions/{subscription-id}/resourceGroups/chinese-learning-test /subscriptions/{subscription-id}/resourceGroups/chinese-learning-prod --sdk-auth

# Get subscription ID
az account show --query id --output tsv

# Verify service principal
az ad sp list --display-name "GitHubActions-ChineseLearning" --output table
```

**Output**: [To be filled during execution]

**Security Note**: Service principal credentials will be stored as GitHub secrets, not in this log.

---

### Step 3.2: GitHub Repository Secrets Configuration
**Objective**: Configure required secrets in GitHub repository

#### Secrets to Configure:
- `AZURE_CREDENTIALS` - Service principal JSON
- `AZURE_CLIENT_ID` - Service principal client ID  
- `AZURE_CLIENT_SECRET` - Service principal secret
- `AZURE_SUBSCRIPTION_ID` - Azure subscription ID
- `AZURE_TENANT_ID` - Azure tenant ID
- `DATABASE_PASSWORD` - PostgreSQL admin password
- `JWT_SECRET` - Application JWT secret

**GitHub CLI Commands** (if available):
```bash
gh secret set AZURE_CREDENTIALS --body '{service-principal-json}'
gh secret set AZURE_SUBSCRIPTION_ID --body '{subscription-id}'
gh secret set DATABASE_PASSWORD --body '{database-password}'
gh secret set JWT_SECRET --body '{jwt-secret}'
```

**Manual Steps**: [To be documented during execution]

---

### Step 3.3: Create GitHub Actions Workflows
**Objective**: Create automated deployment workflows

#### Files Created:
- `.github/workflows/ci-test.yml`
- `.github/workflows/cd-test.yml`
- `.github/workflows/cd-production.yml`
- `.github/workflows/infrastructure.yml`

#### Workflow Testing Commands:
```powershell
# Test workflow syntax (if GitHub CLI available)
gh workflow list
gh workflow view ci-test.yml
```

**Output**: [To be filled during execution]

**Notes**: [To be filled during execution]

---

## Production Environment Deployment

### Step 4.1: Deploy Production Infrastructure
**Objective**: Deploy production environment using Bicep templates

#### Commands Executed:
```powershell
# Create production resource group
az group create --name chinese-learning-prod --location southeastasia

# Deploy infrastructure to production
az deployment group create --resource-group chinese-learning-prod --template-file infrastructure\main.bicep --parameters infrastructure\parameters\prod.parameters.json

# Verify deployment
az deployment group show --resource-group chinese-learning-prod --name main --output table

# List deployed resources
az resource list --resource-group chinese-learning-prod --output table
```

**Output**: [To be filled during execution]

**Notes**: [To be filled during execution]

---

### Step 4.2: Configure Production Environment
**Objective**: Set up production-specific configurations

#### Commands Executed:
```powershell
# Configure production container app environment variables
az containerapp update --name ms-hoa-backend-prod --resource-group chinese-learning-prod --set-env-vars "NODE_ENV=production" "PORT=8080"

# Configure production database firewall rules
az postgres server firewall-rule create --resource-group chinese-learning-prod --server mshoapostgres-prod --name "AllowAzureServices" --start-ip-address 0.0.0.0 --end-ip-address 0.0.0.0

# Test production endpoints
curl -s "https://{prod-container-app-url}/api/health"
```

**Output**: [To be filled during execution]

**Notes**: [To be filled during execution]

---

## Testing and Validation

### Step 5.1: Infrastructure Validation Tests
**Objective**: Validate that infrastructure is correctly deployed

#### Commands Executed:
```powershell
# Test container app health
az containerapp show --name ms-hoa-backend-prod --resource-group chinese-learning-prod --query "properties.provisioningState"

# Test database connectivity
az postgres server show --name mshoapostgres-prod --resource-group chinese-learning-prod --query "userVisibleState"

# Test static web app
az staticwebapp show --name mshoafrontend-prod --resource-group chinese-learning-prod --query "defaultHostname"

# Verify container registry
az acr show --name mshoaprodregistry --resource-group chinese-learning-prod --query "loginServer"
```

**Output**: [To be filled during execution]

**Notes**: [To be filled during execution]

---

### Step 5.2: End-to-End Application Tests
**Objective**: Validate complete application functionality

#### Test Cases:
1. **Frontend Accessibility**: Test static web app loads
2. **Backend API**: Test health endpoint and API responses  
3. **Database Connectivity**: Test database connections
4. **Authentication**: Test user login/registration
5. **File Upload**: Test video/content upload functionality

#### Commands/Tests:
```powershell
# Test frontend
curl -s "https://{frontend-url}"

# Test backend health
curl -s "https://{backend-url}/api/health"

# Test API endpoints
curl -s "https://{backend-url}/api/courses"

# Test authentication endpoint
curl -X POST "https://{backend-url}/api/auth/login" -H "Content-Type: application/json" -d '{"email":"test@example.com","password":"testpass"}'
```

**Output**: [To be filled during execution]

**Notes**: [To be filled during execution]

---

## Issues and Resolutions

### Issue Log
**Format**: Date | Issue Description | Commands/Steps Tried | Resolution | Status

| Date | Issue | Commands/Steps | Resolution | Status |
|------|-------|----------------|------------|--------|
| [Date] | [Description] | [Commands] | [Resolution] | [✅/❌/🔄] |

---

## Command Reference

### Frequently Used Commands

#### Azure CLI - Resource Management
```powershell
# List all resource groups
az group list --output table

# Show resource group details
az group show --name {rg-name} --output json

# List resources in a group
az resource list --resource-group {rg-name} --output table

# Delete resource group (CAREFUL!)
az group delete --name {rg-name} --yes --no-wait
```

#### Azure CLI - Container Apps
```powershell
# Show container app
az containerapp show --name {app-name} --resource-group {rg-name}

# Update container app
az containerapp update --name {app-name} --resource-group {rg-name} --image {image-name}

# Get logs
az containerapp logs show --name {app-name} --resource-group {rg-name} --tail 20

# List revisions
az containerapp revision list --name {app-name} --resource-group {rg-name}
```

#### Azure CLI - Container Registry
```powershell
# Show registry
az acr show --name {registry-name}

# List repositories
az acr repository list --name {registry-name}

# List tags
az acr repository show-tags --name {registry-name} --repository {repo-name}

# Login to registry
az acr login --name {registry-name}
```

#### Azure CLI - Bicep/ARM Deployments
```powershell
# Validate template
az deployment group validate --resource-group {rg-name} --template-file {template-file}

# Deploy template
az deployment group create --resource-group {rg-name} --template-file {template-file} --parameters {params-file}

# Show deployment
az deployment group show --resource-group {rg-name} --name {deployment-name}

# List deployments
az deployment group list --resource-group {rg-name} --output table
```

#### Docker Commands
```powershell
# Build image
docker build -t {image-name} .

# Tag image
docker tag {image-name} {registry-url}/{image-name}:{tag}

# Push image
docker push {registry-url}/{image-name}:{tag}

# List images
docker images

# Remove image
docker rmi {image-name}
```

#### GitHub CLI (if available)
```bash
# List workflows
gh workflow list

# View workflow
gh workflow view {workflow-name}

# List secrets
gh secret list

# Set secret
gh secret set {SECRET_NAME} --body "{secret-value}"
```

---

## Progress Tracking

### Checklist
- [ ] **Step 1**: Current infrastructure analysis completed
- [ ] **Step 2**: Bicep templates created and validated
- [ ] **Step 3**: GitHub Actions workflows configured
- [ ] **Step 4**: Production environment deployed
- [ ] **Step 5**: End-to-end testing completed
- [ ] **Step 6**: Documentation updated

### Time Log
| Step | Start Time | End Time | Duration | Notes |
|------|------------|----------|----------|-------|
| Step 1 | [Time] | [Time] | [Duration] | [Notes] |
| Step 2 | [Time] | [Time] | [Duration] | [Notes] |
| Step 3 | [Time] | [Time] | [Duration] | [Notes] |
| Step 4 | [Time] | [Time] | [Duration] | [Notes] |
| Step 5 | [Time] | [Time] | [Duration] | [Notes] |

---

**Last Updated**: [Date]  
**Status**: [In Progress/Completed]  
**Next Action**: [Next step to take]
