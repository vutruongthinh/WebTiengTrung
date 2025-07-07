// Main Bicep template for Ms. Hoa Chinese Learning Platform
// This template orchestrates all infrastructure components

@description('Environment name (test or prod)')
param environmentName string = 'test'

@description('Primary location for most resources')
param location string = 'southeastasia'

@description('Location for Static Web App')
param staticWebAppLocation string = 'eastasia'

@description('Database administrator login')
param databaseAdminLogin string = 'mshoaadmin'

@description('Database administrator password')
@secure()
param databaseAdminPassword string

@description('JWT secret for application authentication')
@secure()
param jwtSecret string

@description('Container image name')
param containerImageName string = 'ms-hoa-backend'

@description('Container image tag')
param containerImageTag string = 'latest'

// Variables for consistent naming
var resourcePrefix = 'mshoa'
var environmentSuffix = environmentName == 'prod' ? 'prod' : '2025'
var containerNamePrefix = 'ms-hoa'

// Resource names
var logAnalyticsWorkspaceName = 'workspace-${resourcePrefix}resources${environmentSuffix}'
var storageAccountName = '${resourcePrefix}storage${environmentSuffix}'
var containerRegistryName = environmentName == 'prod' ? '${resourcePrefix}prodregistry' : '${resourcePrefix}registry9977'
var postgresServerName = '${resourcePrefix}postgres${environmentSuffix}'
var containerAppsEnvName = '${containerNamePrefix}-env${environmentName == 'prod' ? '-prod' : ''}'
var containerAppName = '${containerNamePrefix}-backend${environmentName == 'prod' ? '-prod' : ''}'
var staticWebAppName = '${resourcePrefix}frontend${environmentSuffix}'

// 1. Log Analytics Workspace (foundation for monitoring)
module logAnalytics 'modules/logAnalytics.bicep' = {
  name: 'logAnalytics-deployment'
  params: {
    workspaceName: logAnalyticsWorkspaceName
    location: location
  }
}

// 2. Storage Account
module storageAccount 'modules/storageAccount.bicep' = {
  name: 'storageAccount-deployment'
  params: {
    storageAccountName: storageAccountName
    location: location
  }
}

// 3. Container Registry
module containerRegistry 'modules/containerRegistry.bicep' = {
  name: 'containerRegistry-deployment'
  params: {
    registryName: containerRegistryName
    location: location
    logAnalyticsWorkspaceId: logAnalytics.outputs.workspaceId
  }
}

// 4. PostgreSQL Flexible Server
module postgresql 'modules/postgresql.bicep' = {
  name: 'postgresql-deployment'
  params: {
    serverName: postgresServerName
    location: location
    administratorLogin: databaseAdminLogin
    administratorPassword: databaseAdminPassword
    logAnalyticsWorkspaceId: logAnalytics.outputs.workspaceId
  }
}

// 5. Container Apps Environment
module containerAppsEnvironment 'modules/containerAppsEnvironment.bicep' = {
  name: 'containerAppsEnv-deployment'
  params: {
    environmentName: containerAppsEnvName
    location: location
    logAnalyticsWorkspaceId: logAnalytics.outputs.workspaceId
  }
}

// 6. Container App
module containerApp 'modules/containerApp.bicep' = {
  name: 'containerApp-deployment'
  dependsOn: [
    containerRegistry
    postgresql
  ]
  params: {
    containerAppName: containerAppName
    location: location
    environmentId: containerAppsEnvironment.outputs.environmentId
    containerRegistryName: containerRegistryName
    containerImageName: containerImageName
    containerImageTag: containerImageTag
    postgresServerName: postgresServerName
    databaseAdminLogin: databaseAdminLogin
    databaseAdminPassword: databaseAdminPassword
    jwtSecret: jwtSecret
    staticWebAppUrl: staticWebApp.outputs.defaultHostName
  }
}

// 7. Static Web App
module staticWebApp 'modules/staticWebApp.bicep' = {
  name: 'staticWebApp-deployment'
  params: {
    staticWebAppName: staticWebAppName
    location: staticWebAppLocation
    logAnalyticsWorkspaceId: logAnalytics.outputs.workspaceId
  }
}

// Outputs
output resourceGroupName string = resourceGroup().name
output containerRegistryLoginServer string = containerRegistry.outputs.loginServer
output containerAppUrl string = containerApp.outputs.applicationUrl
output staticWebAppUrl string = staticWebApp.outputs.defaultHostName
output postgresServerFqdn string = postgresql.outputs.serverFqdn
output logAnalyticsWorkspaceId string = logAnalytics.outputs.workspaceId
