# Security Guidelines

## 🔒 Environment Variables & API Keys

### Critical Security Rules

1. **NEVER commit `.env` files** - They are automatically ignored by `.gitignore`
2. **Use `.env.local`** for local development (also auto-ignored)
3. **Frontend variables are PUBLIC** - Any `VITE_` variable is bundled into the frontend and visible to users
4. **Use development keys only** in frontend environment variables
5. **Production secrets** go in server environment variables only

### Frontend vs Backend Variables

**Frontend (Client-Side) - VITE_ prefix:**
- ✅ `VITE_SUPABASE_URL` - Public endpoint
- ✅ `VITE_SUPABASE_ANON_KEY` - Public anonymous key  
- ✅ `VITE_GOOGLE_MAPS_API_KEY` - Development/restricted key only
- ❌ Never put production secrets in VITE_ variables

**Backend (Server-Side) - No VITE_ prefix:**
- ✅ `SUPABASE_SERVICE_ROLE_KEY` - Server-side only
- ✅ `STRIPE_SECRET_KEY` - Server-side only
- ✅ `REDIS_PASSWORD` - Server-side only
- ✅ `GRAFANA_PASSWORD` - Server-side only

### Deployment Security

**Development:**
- Use `.env.local` for local development
- Use development/test API keys with restricted permissions
- Never commit actual API keys

**Production:**
- Set environment variables directly in deployment platform
- Use production API keys with minimal required permissions
- Enable domain restrictions on API keys
- Monitor API key usage for unusual activity

### API Key Security Best Practices

**Google Maps API Key:**
- Enable only required APIs (Maps JavaScript API, Places API)
- Restrict to specific domains/IP addresses
- Set up usage quotas and alerts
- Use separate keys for development and production

**Supabase Keys:**
- Anon key has limited permissions (safe for frontend)
- Service role key should never be exposed to frontend
- Enable RLS (Row Level Security) on all tables
- Monitor authentication logs

### Incident Response

If API keys are accidentally exposed:

1. **Immediately revoke/regenerate** the exposed keys
2. **Check usage logs** for unauthorized access
3. **Update all deployment environments** with new keys
4. **Review code** to prevent future exposure
5. **Monitor for abuse** of the exposed keys

### Build Security & Netlify Configuration

**Frontend Environment Variables (VITE_ prefix):**
- These are **intentionally public** and included in the build output
- `VITE_SUPABASE_URL` - Public Supabase endpoint (safe to expose)
- `VITE_SUPABASE_ANON_KEY` - Public anonymous key with RLS protection
- `VITE_GOOGLE_MAPS_API_KEY` - Restricted to specific domains

**Netlify Secrets Scanning:**
- Netlify scans build output for secrets (security feature)
- We configure `SECRETS_SCAN_OMIT_KEYS` in `netlify.toml` to allow public frontend variables
- This prevents build failures while maintaining security

**Build Security Best Practices:**
- Use placeholder values in `.env.example` files
- Never put server-side secrets in `VITE_` variables
- Review build output during development
- Monitor API key usage for unusual activity

## 🛡️ Additional Security Measures

- All API endpoints have input validation
- CORS is configured to specific origins
- Rate limiting prevents abuse
- Comprehensive error logging for security monitoring
- Regular security audits and dependency updates