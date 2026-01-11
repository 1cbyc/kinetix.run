# Kinetix API

Backend API server for the Kinetix.run platform.

## Environment Variables

```bash
# Required
DATABASE_URL=postgresql://user:password@host:5432/kinetix
JWT_SECRET=your-jwt-secret-min-32-chars
ENCRYPTION_KEY=your-64-hex-character-encryption-key

# Optional
PORT=3001
NODE_ENV=production
DASHBOARD_URL=http://localhost:3000
GITHUB_WEBHOOK_SECRET=optional
GITLAB_WEBHOOK_SECRET=optional
```

## Local Development

```bash
# Install dependencies (from monorepo root)
pnpm install

# Set up environment
cp .env.example .env
# Edit .env with your values

# Run database migrations
pnpm db:migrate

# Start development server
cd apps/api
pnpm dev
```

## Production Deployment

### Railway

1. Create Railway project
2. Add PostgreSQL database
3. Set environment variables
4. Deploy (auto-deploys from GitHub)

### Docker

```bash
docker build -f apps/api/Dockerfile -t kinetix-api .
docker run -p 3001:3001 --env-file .env kinetix-api
```