# Kinetix Dashboard

Modern, dark-themed dashboard for the Kinetix.run serverless platform.

## Features

- **Dark Theme**: Starlink-inspired dark theme with clean, minimalist design
- **Authentication**: Login and registration pages
- **Projects Management**: Create, view, and manage projects
- **Deployments**: Track deployments with status, logs, and details
- **Domains**: Manage custom domains for projects
- **Environment Variables**: Secure environment variable management
- **Responsive**: Fully responsive design for all screen sizes

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Custom components with Starlink-inspired design
- **Icons**: Lucide React

## Getting Started

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

## Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Project Structure

```
src/
├── app/                  # Next.js App Router pages
│   ├── login/           # Authentication pages
│   ├── register/
│   └── dashboard/       # Dashboard pages
├── components/          # React components
│   ├── ui/              # Base UI components
│   ├── layout/          # Layout components
│   └── projects/        # Project-specific components
├── lib/                 # Utilities and API client
└── types/               # TypeScript types
```