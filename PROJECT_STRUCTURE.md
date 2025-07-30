# Project Structure Overview

## Directory Organization

```
nstyle/
│
├── frontend/                 # Frontend React application
│   ├── src/                 # Source code
│   │   ├── components/      # React components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── utils/          # Utility functions
│   │   ├── services/       # API services
│   │   └── integrations/   # External integrations
│   ├── public/             # Static assets
│   ├── package.json        # Frontend dependencies
│   ├── vite.config.ts      # Vite configuration
│   ├── tsconfig.json       # TypeScript configuration
│   └── ...                 # Other frontend config files
│
├── backend/                 # Backend services
│   ├── supabase/           # Supabase configuration
│   │   ├── functions/      # Edge functions
│   │   └── migrations/     # Database migrations
│   └── README.md           # Backend documentation
│
├── deploy/                  # Deployment configurations
│   ├── Dockerfile          # Production Docker image
│   ├── Dockerfile.dev      # Development Docker image
│   ├── Dockerfile.test     # Test Docker image
│   ├── docker-compose.yml  # Docker Compose configuration
│   ├── nginx.conf          # Nginx configuration
│   └── *.sh               # Deployment scripts
│
├── docs/                    # Documentation
│   ├── README.md           # Main project documentation
│   ├── CONTRIBUTING.md     # Contribution guidelines
│   ├── LICENSE             # Project license
│   ├── SETUP_GITHUB.md     # GitHub setup guide
│   ├── GOOGLE_OAUTH_SETUP.md    # Google OAuth guide
│   ├── SUPABASE_AUTH_CONFIG.md  # Supabase auth guide
│   ├── DOCKER_README.md    # Docker deployment guide
│   └── ...                 # Other documentation
│
├── .env.example            # Environment variables template
├── .gitignore             # Git ignore rules
├── .dockerignore          # Docker ignore rules
├── package.json           # Root package.json for monorepo
└── README.md              # Quick start guide
```

## Running the Project

### From Root Directory

```bash
# Install all dependencies
npm run install:all

# Start development server
npm run dev

# Build for production
npm run build

# Run with Docker
npm run docker:dev
```

### Frontend Development

```bash
cd frontend
npm install
npm run dev
```

### Backend Development

The backend uses Supabase. See `backend/README.md` for details.

### Deployment

```bash
cd deploy
docker-compose up -d
```

## Key Benefits of This Structure

1. **Clear Separation**: Frontend, backend, deployment, and docs are clearly separated
2. **Monorepo Support**: Root package.json manages the entire project
3. **Docker Ready**: All Docker files are in the deploy folder
4. **Documentation**: All guides and documentation in one place
5. **Scalability**: Easy to add more services or packages

## Environment Setup

1. Copy `.env.example` to `.env`
2. Fill in your Supabase credentials
3. Run `npm run install:all`
4. Start development with `npm run dev`

## CI/CD Integration

This structure works well with:
- GitHub Actions
- Vercel/Netlify (point to `frontend` folder)
- Docker-based deployments
- Kubernetes deployments