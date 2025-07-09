// Log Analytics Workspace module
// Foundation for monitoring and logging across all resources

@description('Log Analytics Workspace name')
param workspaceName string

@description('Location for the workspace')
param location string = resourceGroup().location

@description('SKU for the workspace')
param sku string = 'PerGB2018'

@description('Data retention in days')
param retentionInDays int = 30

resource logAnalyticsWorkspace 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: workspaceName
  location: location
  properties: {
    sku: {
      name: sku
    }
    retentionInDays: retentionInDays
    features: {
      enableLogAccessUsingOnlyResourcePermissions: true
    }
  }
}

output workspaceId string = logAnalyticsWorkspace.id
output workspaceName string = logAnalyticsWorkspace.name
output customerId string = logAnalyticsWorkspace.properties.customerId
