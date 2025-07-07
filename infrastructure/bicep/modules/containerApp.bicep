// Container App module
// Main application container

@description('Container App name')
param containerAppName string

@description('Location for the container app')
param location string = resourceGroup().location

@description('Container Apps Environment ID')
param environmentId string

@description('Container Registry name')
param containerRegistryName string

@description('Container image name')
param containerImageName string

@description('Container image tag')
param containerImageTag string = 'latest'

@description('PostgreSQL server name')
param postgresServerName string

@description('Database administrator login')
param databaseAdminLogin string

@description('Database administrator password')
@secure()
param databaseAdminPassword string

@description('JWT secret')
@secure()
param jwtSecret string

@description('Static Web App URL')
param staticWebAppUrl string

// Get reference to existing container registry
resource containerRegistry 'Microsoft.ContainerRegistry/registries@2023-01-01-preview' existing = {
  name: containerRegistryName
}

resource containerApp 'Microsoft.App/containerApps@2023-05-01' = {
  name: containerAppName
  location: location
  properties: {
    managedEnvironmentId: environmentId
    configuration: {
      secrets: [
        {
          name: 'database-password'
          value: databaseAdminPassword
        }
        {
          name: 'jwt-secret'
          value: jwtSecret
        }
        {
          name: 'registry-password'
          value: containerRegistry.listCredentials().passwords[0].value
        }
      ]
      registries: [
        {
          server: containerRegistry.properties.loginServer
          username: containerRegistry.listCredentials().username
          passwordSecretRef: 'registry-password'
        }
      ]
      ingress: {
        external: true
        targetPort: 8080
        transport: 'Auto'
        traffic: [
          {
            weight: 100
            latestRevision: true
          }
        ]
      }
    }
    template: {
      containers: [
        {
          image: '${containerRegistry.properties.loginServer}/${containerImageName}:${containerImageTag}'
          name: containerImageName
          env: [
            {
              name: 'NODE_ENV'
              value: 'production'
            }
            {
              name: 'PORT'
              value: '8080'
            }
            {
              name: 'DATABASE_URL'
              value: 'postgresql://${databaseAdminLogin}:${databaseAdminPassword}@${postgresServerName}.postgres.database.azure.com/postgres?sslmode=require'
            }
            {
              name: 'JWT_SECRET'
              secretRef: 'jwt-secret'
            }
            {
              name: 'JWT_EXPIRE'
              value: '24h'
            }
            {
              name: 'FRONTEND_URL'
              value: 'https://${staticWebAppUrl}'
            }
          ]
          resources: {
            cpu: json('0.5')
            memory: '1Gi'
          }
        }
      ]
      scale: {
        minReplicas: 1
        maxReplicas: 3
        rules: [
          {
            name: 'http-scale'
            http: {
              metadata: {
                concurrentRequests: '100'
              }
            }
          }
        ]
      }
    }
  }
}

output containerAppId string = containerApp.id
output containerAppName string = containerApp.name
output applicationUrl string = containerApp.properties.configuration.ingress.fqdn
output latestRevisionName string = containerApp.properties.latestRevisionName
