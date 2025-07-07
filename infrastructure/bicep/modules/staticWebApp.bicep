// Static Web App module
// For hosting the frontend React/Next.js application

@description('Static Web App name')
param staticWebAppName string

@description('Location for the Static Web App')
param location string = 'eastasia'

@description('Log Analytics Workspace ID for monitoring')
param logAnalyticsWorkspaceId string

resource staticWebApp 'Microsoft.Web/staticSites@2022-09-01' = {
  name: staticWebAppName
  location: location
  sku: {
    name: 'Free'
    tier: 'Free'
  }
  properties: {
    repositoryUrl: null
    branch: null
    allowConfigFileUpdates: true
    enterpriseGradeCdnStatus: 'Disabled'
  }
}

output staticWebAppId string = staticWebApp.id
output staticWebAppName string = staticWebApp.name
output defaultHostName string = staticWebApp.properties.defaultHostname
output repositoryUrl string = staticWebApp.properties.repositoryUrl ?? ''
output branch string = staticWebApp.properties.branch ?? ''
