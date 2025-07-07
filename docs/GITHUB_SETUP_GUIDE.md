# GitHub Repository Setup Guide

**Ms. Hoa Chinese Learning Platform - GitHub Actions CI/CD**

---

## 🚀 Quick Setup Checklist

### 1. Create GitHub Repository
1. Create a new GitHub repository (or use existing)
2. Push all code to the repository
3. Ensure `main` branch is the default branch

### 2. Configure Repository Secrets
Navigate to: **Repository Settings** → **Secrets and variables** → **Actions**

Add these secrets:

#### Required Secrets
```
AZURE_CREDENTIALS
DATABASE_ADMIN_PASSWORD
JWT_SECRET
```

#### Optional (for production)
```
DATABASE_ADMIN_PASSWORD_PROD
JWT_SECRET_PROD
```

---

## 🔐 Secret Configuration Details

### AZURE_CREDENTIALS
```json
{
  "clientId": "your-service-principal-client-id",
  "clientSecret": "your-service-principal-client-secret",
  "subscriptionId": "your-azure-subscription-id",
  "tenantId": "your-azure-tenant-id",
  "activeDirectoryEndpointUrl": "https://login.microsoftonline.com",
  "resourceManagerEndpointUrl": "https://management.azure.com/",
  "activeDirectoryGraphResourceId": "https://graph.windows.net/",
  "sqlManagementEndpointUrl": "https://management.core.windows.net:8443/",
  "galleryEndpointUrl": "https://gallery.azure.com/",
  "managementEndpointUrl": "https://management.core.windows.net/"
}
```

### DATABASE_ADMIN_PASSWORD
```
Baolinh2008@
```

### JWT_SECRET
```
ms-hoa-chinese-learning-super-secret-key-2025
```

---

## 🔄 Workflow Triggers

### Test Environment (`deploy-test.yml`)
**Triggers:**
- Push to `main` or `develop` branches (infrastructure changes)
- Pull requests to `main` branch (validation only)
- Manual trigger via GitHub Actions UI

**Environments:**
- Resource Group: `chinese-learning-test`
- Location: `southeastasia`

### Production Environment (`deploy-infrastructure-prod.yml`)
**Triggers:**
- GitHub releases (when you publish a release)
- Manual trigger with confirmation required

**Environments:**
- Resource Group: `chinese-learning-prod`
- Location: `southeastasia`
- **Safety**: Requires typing "DEPLOY-TO-PRODUCTION" to confirm

---

## 📁 Repository Structure

Your repository should have this structure:
```
├── .github/
│   └── workflows/
│       ├── deploy-test.yml
│       └── deploy-infrastructure-prod.yml
├── infrastructure/
│   ├── main.bicep
│   ├── modules/
│   │   ├── logAnalytics.bicep
│   │   ├── storageAccount.bicep
│   │   ├── containerRegistry.bicep
│   │   ├── postgresql.bicep
│   │   ├── containerAppsEnvironment.bicep
│   │   ├── containerApp.bicep
│   │   └── staticWebApp.bicep
│   ├── parameters/
│   │   ├── test.parameters.json
│   │   └── prod.parameters.json
│   └── scripts/
│       ├── deploy-test.ps1
│       └── deploy-prod.ps1
├── server/
│   └── (your backend code)
├── package.json
├── index.html
└── README.md
```

---

## 🎯 How to Use

### First Time Setup
1. **Configure secrets** (see above)
2. **Push code** to GitHub repository
3. **Test workflow** by making a small change to infrastructure files

### Daily Development
1. **Make changes** to infrastructure files
2. **Commit and push** to `develop` branch
3. **Create pull request** to `main` branch
4. **Merge PR** - this triggers test deployment automatically

### Production Deployment
1. **Create GitHub release** when ready for production
2. **Or manually trigger** production workflow
3. **Confirm deployment** by typing "DEPLOY-TO-PRODUCTION"

---

## 🔍 Monitoring Deployments

### GitHub Actions Dashboard
- Go to **Actions** tab in your repository
- View deployment status and logs
- Debug any issues

### Azure Portal
- Check resource groups: `chinese-learning-test` and `chinese-learning-prod`
- Monitor deployment history
- View resource configurations

---

## 🛠️ Troubleshooting

### Common Issues

#### Authentication Errors
- Verify `AZURE_CREDENTIALS` secret is correctly formatted
- Check Service Principal permissions
- Ensure subscription ID is correct

#### Template Validation Errors
- Run `az bicep build --file infrastructure/main.bicep` locally
- Check parameter file syntax
- Verify resource naming conventions

#### Resource Conflicts
- Check for existing resources with same names
- Verify resource group locations
- Review deployment logs in Azure portal

### Manual Deployment Backup
If GitHub Actions fails, you can deploy manually:

```powershell
# Test environment
.\infrastructure\scripts\deploy-test.ps1

# Production environment
.\infrastructure\scripts\deploy-prod.ps1 -ResourceGroupName "chinese-learning-prod"
```

---

## 🔒 Security Best Practices

1. **Never commit secrets** to the repository
2. **Use GitHub secrets** for all sensitive data
3. **Rotate Service Principal credentials** regularly
4. **Review deployment logs** for any exposed information
5. **Use separate secrets** for test and production

---

## 📞 Support

If you encounter issues:
1. Check GitHub Actions logs
2. Review Azure deployment history
3. Test manual deployment scripts
4. Verify all secrets are correctly configured

**Next Steps**: Configure your GitHub repository and test the first deployment!
