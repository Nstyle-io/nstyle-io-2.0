# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Frontend Development (from root or frontend/):**
```bash
npm run dev           # Start Vite dev server on port 8080
npm run build         # Build for production
npm run preview       # Preview production build
npm run lint          # Run ESLint
npm run lint:fix      # Fix ESLint issues
npm run typecheck     # TypeScript type checking
npm run test          # Run Vitest tests
npm run test:ui       # Run tests with UI
npm run test:run      # Run tests once
```

**Root-level commands:**
```bash
npm run install:all   # Install all dependencies (root + frontend)
npm run dev           # Proxy to frontend dev server
npm run build         # Proxy to frontend build
npm run type-check    # Proxy to frontend typecheck
npm run docker:dev    # Start Docker development environment
npm run docker:prod   # Start Docker production environment
npm run docker:down   # Stop Docker containers
```

**Supabase Commands:**
```bash
cd supabase
supabase start        # Start local Supabase (requires Docker)
supabase stop         # Stop local Supabase
supabase db reset     # Reset local database
supabase functions serve # Serve edge functions locally
```

## Architecture Overview

**Tech Stack:**
- Frontend: React 18 + TypeScript + Vite
- UI: Radix UI components + Tailwind CSS + shadcn/ui
- State Management: React Query (@tanstack/react-query)
- Backend: Supabase (PostgreSQL + Edge Functions)
- Authentication: Supabase Auth + Firebase Auth (dual support)
- Maps: Google Maps API
- Testing: Vitest + Testing Library

**Project Structure:**
- `frontend/` - React application with Vite
- `supabase/` - Database schema, migrations, and edge functions
- `deploy/` - Docker configurations for deployment
- `docs/` - Setup guides and documentation

**Key Components Architecture:**
- `frontend/src/components/` - Organized by feature (auth, booking, social, etc.)
- `frontend/src/pages/` - Route components
- `frontend/src/integrations/` - External service integrations (Firebase, Supabase)
- `frontend/src/hooks/` - Custom React hooks
- `frontend/src/services/` - API layer and business logic

**Authentication Flow:**
The app supports dual authentication through both Supabase and Firebase. The `backend-selector.ts` service manages which backend to use, and `unified-auth.ts` provides a unified interface.

**Database:**
Supabase PostgreSQL with RLS (Row Level Security) enabled. Edge functions handle server-side logic for appointments, payments, and notifications.

**Google Maps Integration:**
Uses `@googlemaps/js-api-loader` for salon discovery and location services. Configuration in Google Maps setup docs.

## Important Development Notes

- The app runs on port 8080 (not the default 5173)
- Uses path aliases: `@/` points to `frontend/src/`
- Supabase local development runs on ports 54321-54326
- Docker development environment available via `npm run docker:dev`
- Monorepo structure with workspaces for frontend and backend
- Environment variables template in `.env.example`