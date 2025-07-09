# Azure Service Principal for GitHub Actions

**Created**: July 7, 2025 10:57 AM  
**Purpose**: Automated deployment of Ms. Hoa Chinese Learning Platform infrastructure

## Service Principal Details

- **Name**: sp-mshoa-github-actions
- **Role**: Contributor
- **Scope**: Subscription level
- **Subscription ID**: 04128140-c049-4cd0-aab2-5b88753a199f

## GitHub Secrets Configuration

Add these secrets to your GitHub repository settings:

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

### Additional Secrets
- **AZURE_SUBSCRIPTION_ID**: `04128140-c049-4cd0-aab2-5b88753a199f`
- **AZURE_CLIENT_ID**: `ee52e6a3-f723-4516-9be1-1741a3c6d8a3`
- **AZURE_TENANT_ID**: `b1c18174-46da-4660-9a9f-46f9b8b2602e`
- **DATABASE_ADMIN_PASSWORD**: `Baolinh2008@`
- **JWT_SECRET**: `ms-hoa-chinese-learning-super-secret-key-2025`

## Security Notes
⚠️ **IMPORTANT**: 
- Never commit these credentials to version control
- Store them only in GitHub repository secrets
- Rotate credentials regularly
- Use separate service principals for test and production if needed
