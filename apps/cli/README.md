# Kinetix CLI

Command-line interface for the Kinetix.run serverless platform.

## Installation

```bash
# From the monorepo root
pnpm install

# Build the CLI
pnpm --filter @kinetix/cli build

# Install globally (optional)
cd apps/cli
pnpm link --global
```

## Usage

**Note:** When installed via `pnpm link --global`, the CLI will be available as `kinetix`. For local testing, use `node dist/index.js`.

### Authentication

```bash
# Login to your account
kinetix auth login

# View current user
kinetix auth whoami

# Logout
kinetix auth logout
```

### Projects

```bash
# List all projects
kinetix projects list

# Create a new project
kinetix projects create

# Get project details
kinetix projects get <project-id>

# Delete a project
kinetix projects delete <project-id>
```

### Deployments

```bash
# Deploy a project
kinetix deploy <project-id>

# List deployments for a project
kinetix deployments list <project-id>

# Get deployment details
kinetix deployments get <deployment-id>

# View deployment logs
kinetix deployments logs <deployment-id>
```

### Domains

```bash
# List domains for a project
kinetix domains list <project-id>

# Add a domain
kinetix domains add <project-id> <domain>

# Delete a domain
kinetix domains delete <project-id> <domain-id>
```

### Environment Variables

```bash
# List environment variables
kinetix env list <project-id>

# Set an environment variable
kinetix env set <project-id> <key> <value>

# Delete an environment variable
kinetix env delete <project-id> <key>
```

## Configuration

The CLI stores configuration in `~/.config/kinetix-nodejs/config.json`:

- `accessToken`: Your authentication token
- `apiUrl`: API base URL (default: http://localhost:3001)
- `currentProject`: Currently selected project ID

## Environment Variables

- `KINETIX_API_URL`: Override the API URL

## Examples

```bash
# Complete workflow
kinetix auth login
kinetix projects create
kinetix deploy <project-id>
kinetix deployments list <project-id>
kinetix env set <project-id> API_KEY "your-key"
```

## Commands Reference

- `auth login` - Login to your account
- `auth logout` - Logout from your account
- `auth whoami` - Show current user information
- `projects list` - List all projects
- `projects create` - Create a new project
- `projects get <id>` - Get project details
- `projects delete <id>` - Delete a project
- `deploy <projectId>` - Deploy a project
- `deployments list <projectId>` - List deployments
- `deployments get <id>` - Get deployment details
- `deployments logs <id>` - View deployment logs
- `domains list <projectId>` - List domains
- `domains add <projectId> <domain>` - Add a domain
- `domains delete <projectId> <domainId>` - Delete a domain
- `env list <projectId>` - List environment variables
- `env set <projectId> <key> <value>` - Set environment variable
- `env delete <projectId> <key>` - Delete environment variable