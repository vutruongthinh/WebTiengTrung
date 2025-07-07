# Infrastructure as Code (IaC) and CI/CD Setup Plan

## Overview
This document outlines the complete setup for converting our current manual Azure deployment to a professional Infrastructure as Code (IaC) approach with automated CI/CD pipelines.

## Current State
- **Test Environment**: `chinese-learning-test` resource group
- **Manual Deployment**: PowerShell scripts
- **Resources**: Container Apps, Container Registry, Static Web App, PostgreSQL Database
- **Working Application**: Backend and frontend deployed and functional

## Target Architecture

### Environment Structure
```
┌─ Production Environment (chinese-learning-prod)
│  ├── Container Apps Environment
│  ├── Container Registry
│  ├── Static Web App
│  ├── PostgreSQL Database (Production)
│  └── Application Insights
│
├─ Test Environment (chinese-learning-test) [Current]
│  ├── Container Apps Environment
│  ├── Container Registry
│  ├── Static Web App
│  ├── PostgreSQL Database (Test)
│  └── Application Insights
│
└─ Shared Resources
   ├── GitHub Repository
   ├── GitHub Actions (CI/CD)
   └── Azure Service Principal
```

### CI/CD Pipeline Flow
```
Developer Push → GitHub → Build & Test → Deploy to Test → Manual Approval → Deploy to Production
```

## Phase 1: Infrastructure as Code Setup

### 1.1 Choose IaC Technology: Azure Bicep
**Why Bicep:**
- Native Azure support
- Cleaner syntax than ARM templates
- Type safety and IntelliSense
- Easier to learn and maintain
- Compiles to ARM templates

### 1.2 Current Infrastructure Analysis
We need to capture these resources in Bicep:

#### Test Environment Resources:
- **Resource Group**: `chinese-learning-test`
- **Container Apps Environment**: `ms-hoa-env`
- **Container App**: `ms-hoa-backend`
- **Container Registry**: `mshoaregistry9977`
- **Static Web App**: `mshoafrontend2025`
- **PostgreSQL Database**: `mshoapostgres2025`

#### Resource Dependencies:
```
Resource Group
├── PostgreSQL Server
├── Container Registry
├── Container Apps Environment
│   └── Container App (depends on Registry)
└── Static Web App
```

### 1.3 Bicep Template Structure
```
infrastructure/
├── main.bicep                 # Main orchestration template
├── modules/
│   ├── containerRegistry.bicep
│   ├── containerApps.bicep
│   ├── staticWebApp.bicep
│   ├── postgresql.bicep
│   └── monitoring.bicep
├── parameters/
│   ├── test.parameters.json
│   └── prod.parameters.json
└── scripts/
    ├── deploy-test.ps1
    └── deploy-prod.ps1
```

### 1.4 Environment-Specific Configuration
| Resource | Test Environment | Production Environment |
|----------|------------------|------------------------|
| Resource Group | `chinese-learning-test` | `chinese-learning-prod` |
| Container App | `ms-hoa-backend` | `ms-hoa-backend-prod` |
| Container Registry | `mshoaregistry9977` | `mshoaprodregistry` |
| Static Web App | `mshoafrontend2025` | `mshoafrontend-prod` |
| PostgreSQL | `mshoapostgres2025` | `mshoapostgres-prod` |

## Phase 2: GitHub Actions CI/CD Pipeline

### 2.1 GitHub Repository Setup
- **Secrets Configuration**:
  - `AZURE_CLIENT_ID` - Service Principal ID
  - `AZURE_CLIENT_SECRET` - Service Principal Secret
  - `AZURE_SUBSCRIPTION_ID` - Azure Subscription
  - `AZURE_TENANT_ID` - Azure Tenant
  - `DATABASE_PASSWORD` - PostgreSQL password
  - `JWT_SECRET` - Application JWT secret

### 2.2 Workflow Structure
```
.github/workflows/
├── ci-test.yml           # Continuous Integration (Test)
├── cd-test.yml           # Continuous Deployment (Test)
├── cd-production.yml     # Continuous Deployment (Production)
└── infrastructure.yml    # Infrastructure deployment
```

### 2.3 Pipeline Stages

#### CI Pipeline (Triggered on Pull Request)
1. **Code Quality Checks**
   - Linting (ESLint, Prettier)
   - Security scanning (npm audit)
   - Unit tests

2. **Build & Test**
   - Docker image build
   - Integration tests
   - Health check tests

#### CD Test Pipeline (Triggered on main branch push)
1. **Infrastructure Deployment**
   - Deploy/update Bicep templates to test environment
   - Validate infrastructure health

2. **Application Deployment**
   - Build and push Docker image
   - Deploy to test container app
   - Deploy frontend to test static web app
   - Run smoke tests

#### CD Production Pipeline (Manual approval)
1. **Manual Approval Gate**
   - Stakeholder review
   - Test environment validation

2. **Production Deployment**
   - Blue-green deployment strategy
   - Health checks and rollback capability
   - Production smoke tests

## Phase 3: Security and Monitoring

### 3.1 Security Setup
- **Service Principal** with minimal required permissions
- **Key Vault** for secrets management
- **Managed Identity** for container apps
- **Network Security** (if needed)

### 3.2 Monitoring and Observability
- **Application Insights** for both environments
- **Log Analytics Workspace** for centralized logging
- **Alerts** for critical failures
- **Performance monitoring** and dashboards

## Implementation Steps

### Step 1: Analyze Current Infrastructure
- [ ] Export current resource configurations
- [ ] Document environment variables and secrets
- [ ] Identify resource dependencies

### Step 2: Create Bicep Templates
- [ ] Create main.bicep orchestration template
- [ ] Create modular Bicep files for each resource type
- [ ] Create parameter files for test and production
- [ ] Test Bicep templates against test environment

### Step 3: Setup GitHub Actions
- [ ] Create Azure Service Principal
- [ ] Configure GitHub repository secrets
- [ ] Create workflow files
- [ ] Test CI pipeline with sample changes

### Step 4: Deploy Production Environment
- [ ] Deploy production infrastructure via Bicep
- [ ] Configure production-specific settings
- [ ] Test production deployment pipeline

### Step 5: Setup Monitoring
- [ ] Configure Application Insights
- [ ] Set up alerting rules
- [ ] Create monitoring dashboards

### Step 6: Documentation and Training
- [ ] Update deployment documentation
- [ ] Create troubleshooting guides
- [ ] Team training on new processes

## Benefits After Implementation

### Immediate Benefits
- **Consistent Environments**: Test and production are identical
- **Automated Deployments**: No manual errors
- **Version Control**: Infrastructure changes are tracked
- **Rollback Capability**: Quick recovery from issues

### Long-term Benefits
- **Scalability**: Easy to add new environments
- **Compliance**: Audit trail for all changes
- **Team Collaboration**: Clear deployment processes
- **Cost Optimization**: Infrastructure optimization opportunities

## Risk Mitigation

### Deployment Risks
- **Backup Strategy**: Database backups before deployments
- **Blue-Green Deployment**: Zero-downtime production updates
- **Health Checks**: Automatic rollback on failure
- **Staged Rollout**: Deploy to test first, then production

### Security Risks
- **Secret Management**: No hardcoded secrets in code
- **Least Privilege**: Minimal required permissions
- **Audit Logging**: All deployment actions logged
- **Access Control**: Protected production deployments

## Timeline Estimate

| Phase | Duration | Description |
|-------|----------|-------------|
| **Phase 1**: IaC Setup | 2-3 days | Create Bicep templates and test |
| **Phase 2**: CI/CD Pipeline | 2-3 days | GitHub Actions workflows |
| **Phase 3**: Production Setup | 1 day | Deploy prod environment |
| **Phase 4**: Testing & Validation | 1 day | End-to-end testing |
| **Total** | **6-7 days** | Complete professional setup |

## Success Criteria

### Technical Success
- [ ] Infrastructure fully defined in code
- [ ] Automated deployments working for both environments
- [ ] Zero-downtime production deployments
- [ ] Monitoring and alerting functional

### Process Success
- [ ] Team can deploy confidently
- [ ] Clear documentation and procedures
- [ ] Audit trail for all changes
- [ ] Quick rollback capability demonstrated

## Next Steps

1. **Start with Infrastructure Analysis** - Document current setup
2. **Create Bicep Templates** - Begin with simple resources
3. **Test Incrementally** - Validate each component
4. **Build CI/CD Gradually** - Start with basic workflows
5. **Add Advanced Features** - Blue-green, monitoring, etc.

---

**Ready to begin?** Let's start with Step 1: Analyzing and documenting our current infrastructure setup!
