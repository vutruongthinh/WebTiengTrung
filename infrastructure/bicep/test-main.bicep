// Test main template
param environmentName string = 'test'
param location string = 'southeastasia'

var testVar = 'test-${environmentName}'

// Simple test module
module logAnalytics 'modules/logAnalytics.bicep' = {
  name: 'logAnalytics-deployment'
  params: {
    workspaceName: testVar
    location: location
  }
}
