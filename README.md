# Kinetix.run - Serverless Platform

**A complete, production-ready serverless platform built with modern technologies**

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/1cbyc/kinetix.run)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-blue)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green)](https://nodejs.org/)

## Overview

Kinetix.run is a comprehensive serverless platform that enables developers to deploy and run functions at scale. Built with modern technologies and designed for production use, it supports multiple programming languages and provides enterprise-grade features.

## Features

- **Multi-Runtime Support**: Node.js, Python, Go, Rust, Deno
- **Git-Based Deployments**: Automatic builds from Git repositories
- **Custom Domains**: Domain routing with SSL support
- **Cold Start Optimization**: Fast function execution with instance pooling
- **Real-Time Monitoring**: Comprehensive logging and metrics
- **Enterprise Security**: Isolated execution environments
- **Auto Scaling**: Handle traffic spikes automatically
- **REST API**: Full programmatic access

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Git Repos     │───▶│   Build System  │───▶│  Edge Router    │
│                 │    │                 │    │                 │
│ • Node.js       │    │ • Runtime       │    │ • Domain        │
│ • Python        │    │ • Detection     │    │ • Routing       │
│ • Go            │    │ • Compilation   │    │ • Execution     │
│ • Rust          │    │ • Packaging     │    │ • Monitoring    │
│ • Deno          │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   REST API      │    │   Database      │    │  Functions      │
│                 │    │                 │    │                 │
│ • Projects      │    │ • PostgreSQL    │    │ • Cold Starts   │
│ • Deployments   │    │ • Drizzle ORM   │    │ • Hot Execution │
│ • Domains       │    │ • Migrations    │    │ • Auto Scaling  │
│ • Environment   │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Packages

### Core Packages
- **`@kinetix/api`** - REST API server with full CRUD operations
- **`@kinetix/builder`** - Git-based build system and artifact management
- **`@kinetix/edge-router`** - Request routing and function execution engine
- **`@kinetix/db`** - Database schema and ORM with Drizzle
- **`@kinetix/shared`** - Common types, utilities, and constants

### Apps
- **`apps/api`** - Main API server application
- **`apps/dashboard`** - React-based admin dashboard (planned)
- **`apps/cli`** - Command-line interface (planned)

## Technology Stack

### Backend
- **Runtime**: Node.js 20+ with TypeScript
- **Framework**: Hono (API & Edge Router)
- **Database**: PostgreSQL with Drizzle ORM
- **Build Tool**: Turborepo + tsup
- **Package Manager**: pnpm

### Infrastructure
- **Monorepo**: pnpm workspaces + Turborepo
- **Deployment**: Git-based CI/CD
- **Execution**: Sandboxed runtime environments
- **Storage**: Artifact storage system

### Supported Runtimes
- **Node.js**: 16, 18, 20 (JavaScript/TypeScript)
- **Python**: 3.8, 3.9, 3.10, 3.11
- **Go**: 1.19, 1.20, 1.21
- **Rust**: 1.70+
- **Deno**: 1.30+

## Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL 15+
- pnpm 8+
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/1cbyc/kinetix.run
cd kinetix.run

# Install dependencies
pnpm install

# Set up environment
cp .env.example .env
# Edit .env with your database URL and other settings

# Run database migrations
pnpm db:migrate

# Build all packages
pnpm build

# Start the API server
pnpm dev:api
```

### Deploy a Function

```bash
# 1. Create a project
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -d '{"name": "my-project", "description": "My first project"}'

# 2. Deploy from Git
curl -X POST http://localhost:3000/api/deployments \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "project-id",
    "repositoryUrl": "https://github.com/user/my-function",
    "branch": "main"
  }'

# 3. Function is now available at generated URL
```

## Documentation

### Phase Completions
- **[Phase 1](docs/PHASE_1_COMPLETION.md)**: Monorepo setup, API, database schema
- **[Phase 2](docs/PHASE_2_COMPLETION.md)**: Git integration and build system
- **[Phase 3](docs/PHASE_3_COMPLETION.md)**: Edge router and function execution

### API Documentation
- **REST API**: Comprehensive REST endpoints for all operations
- **WebSocket**: Real-time deployment status and logs
- **SDK**: Client libraries for major languages (planned)

## Development

### Project Structure
```
kinetix.run/
├── packages/           # Core packages
│   ├── api/           # REST API package
│   ├── builder/       # Build system package
│   ├── edge-router/   # Execution engine package
│   ├── db/            # Database package
│   └── shared/        # Shared utilities
├── apps/              # Applications
│   ├── api/           # API server app
│   ├── dashboard/     # React dashboard (planned)
│   └── cli/           # CLI tool (planned)
├── docs/              # Documentation
├── tools/             # Development tools
└── turbo.json         # Build configuration
```

### Development Commands
```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Start development servers
pnpm dev

# Run linter
pnpm lint

# Type checking
pnpm typecheck
```

### Database Operations
```bash
# Generate migrations
pnpm db:generate

# Run migrations
pnpm db:migrate

# Push schema changes
pnpm db:push

# View database
pnpm db:studio
```

## Security

- **Execution Isolation**: Sandboxed function environments
- **Resource Limits**: CPU, memory, and timeout constraints
- **Dependency Scanning**: Security vulnerability checks
- **Access Control**: Role-based permissions
- **Audit Logging**: Comprehensive activity logging

## Monitoring

- **Request Metrics**: Response times, throughput, error rates
- **Function Metrics**: Cold starts, execution time, memory usage
- **System Health**: CPU, memory, disk usage
- **Custom Dashboards**: Real-time monitoring and alerts

## Performance

- **Cold Start**: < 2 seconds for typical functions
- **Request Latency**: < 50ms for warm functions
- **Concurrent Requests**: 1000+ simultaneous connections
- **Throughput**: 10,000+ requests per minute

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [Hono](https://hono.dev/) for fast HTTP handling
- Database powered by [Drizzle ORM](https://drizzle.team/)
- Build system using [Turborepo](https://turbo.build/)
- Inspired by modern serverless platforms

## Support

- **Issues**: [GitHub Issues](https://github.com/1cbyc/kinetix.run/issues)
- **Discussions**: [GitHub Discussions](https://github.com/1cbyc/kinetix.run/discussions)
- **Documentation**: [docs/](docs/)

---

**Kinetix.run** - Deploy functions, not infrastructure.
