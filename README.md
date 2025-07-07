# Ms. Hoa Chinese Learning Platform

## Project Structure

```
WebTiengTrung/
├── 📁 frontend/                    # Frontend Website
│   ├── index.html                  # Main HTML page
│   ├── script.js                   # JavaScript functionality
│   ├── styles.css                  # CSS styles
│   ├── package.json                # Frontend dependencies
│   └── package-lock.json           # Lock file
│
├── 📁 backend/                     # Backend API Server
│   ├── server/                     # Express.js server code
│   │   ├── app.js                  # Main application
│   │   ├── models/                 # Database models
│   │   ├── routes/                 # API routes
│   │   ├── middleware/             # Custom middleware
│   │   └── utils/                  # Utility functions
│   ├── Dockerfile                  # Docker container definition
│   ├── .dockerignore              # Docker ignore rules
│   └── .env*                       # Environment variables
│
├── 📁 infrastructure/              # Infrastructure as Code
│   ├── bicep/                      # Azure Bicep templates
│   │   ├── main.bicep              # Main template
│   │   └── modules/                # Modular templates
│   ├── parameters/                 # Environment parameters
│   │   ├── test.parameters.json    # Test environment
│   │   └── prod.parameters.json    # Production environment
│   └── scripts/                    # Deployment scripts
│
├── 📁 .github/                     # CI/CD Workflows
│   └── workflows/                  # GitHub Actions
│       ├── deploy-infrastructure-test.yml
│       └── deploy-infrastructure-prod.yml
│
├── 📁 docs/                        # Documentation
│   ├── INFRASTRUCTURE_SETUP.md     # Infrastructure guide
│   ├── DATABASE_DESIGN.md          # Database schema
│   └── *.md                        # Other documentation
│
├── 📁 config/                      # Legacy Configuration Files
│   └── *.json                      # Old config files (for reference)
│
├── 📁 scripts/                     # Utility Scripts
│   └── *.ps1                       # PowerShell deployment scripts
│
└── 📁 node_modules/                # Dependencies (auto-generated)
```

## Quick Start

### Frontend Development
```bash
cd frontend
npm install
# Open index.html in browser
```

### Backend Development
```bash
cd backend
npm install
npm start
```

### Infrastructure Deployment
```bash
# Test environment (automatic on main branch push)
git push origin main

# Production environment (manual trigger)
# Go to GitHub Actions → Deploy Infrastructure - Production Environment
```

## Key Files

- **Frontend Entry Point**: `frontend/index.html`
- **Backend Entry Point**: `backend/server/app.js`
- **Infrastructure Main Template**: `infrastructure/bicep/main.bicep`
- **CI/CD Workflows**: `.github/workflows/`
- **Documentation**: `docs/`

## Environment Variables

- **Development**: `backend/.env`
- **Azure Container**: `backend/.env.azure`
- **Docker**: `backend/.env.container`

## Deployment

The project uses Infrastructure as Code (IaC) with Azure Bicep and GitHub Actions for automated deployment to both test and production environments.
