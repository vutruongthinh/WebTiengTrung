# GitHub Secrets Configuration Guide

## Required Secrets for Infrastructure CI/CD

Before running the Infrastructure CI/CD workflows, you need to configure these secrets in your GitHub repository.

### How to Add Secrets

1. Go to your GitHub repository: `https://github.com/vutruongthinh/WebTiengTrung`
2. Click **Settings** tab
3. Click **Secrets and variables** → **Actions**
4. Click **New repository secret**

### Required Secrets

#### 1. `AZURE_CREDENTIALS`
**Value**: Your Azure Service Principal JSON
```json
{
  "clientId": "your-service-principal-client-id",
  "clientSecret": "your-service-principal-client-secret", 
  "subscriptionId": "your-azure-subscription-id",
  "tenantId": "your-azure-tenant-id"
}
```

#### 2. `DATABASE_ADMIN_PASSWORD`
**Value**: Your PostgreSQL admin password
```
Baolinh2008@
```

#### 3. `JWT_SECRET`
**Value**: Your JWT secret key
```
ms-hoa-chinese-learning-super-secret-key-2025
```

## Azure Service Principal Setup

If you don't have a service principal yet, create one:

```bash
# Create service principal with contributor access
az ad sp create-for-rbac \
  --name "GitHubActions-ChineseLearning" \
  --role contributor \
  --scopes /subscriptions/{your-subscription-id} \
  --sdk-auth

# The output JSON goes into AZURE_CREDENTIALS secret
```

## Workflow Triggers

### Test Environment
- **Auto-deploy**: Push to `master` branch with infrastructure changes
- **Manual deploy**: Go to Actions → "Deploy Infrastructure - Test Environment" → "Run workflow"

### Production Environment  
- **Manual deploy only**: Go to Actions → "Deploy Infrastructure - Production Environment" → "Run workflow"
- **Confirmation required**: Type "DEPLOY-TO-PRODUCTION" to confirm

## Next Steps

1. Configure the secrets above
2. Test the workflow by pushing changes to master
3. Manually trigger production deployment when ready

## Security Notes

- Production deployments require manual confirmation
- Secrets are encrypted and not visible in logs
- Service principal has minimal required permissions
- Consider using Azure Key Vault for additional security
