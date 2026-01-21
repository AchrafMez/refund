# 1337 Refund Management System

A financial reimbursement tracking platform for the 1337/42 school ecosystem. Students can submit refund requests, and staff can review and approve them.

## Features

- **42 School OAuth** - Login with your 42 intra account
- **Role-based access** - Students submit requests, Staff review them
- **Status tracking** - Track requests through the approval pipeline
- **Receipt upload** - Upload receipts for verification
- **Real-time updates** - Auto-refreshing dashboards with WebSocket
- **Notifications** - In-app notifications for status changes
- **PDF Export** - Download request summaries
- **Analytics** - Staff dashboard with charts and insights

## Quick Start

### Prerequisites
- **Docker & Docker Compose** installed
- **42 OAuth credentials** - Get from [42 Intra OAuth Apps](https://profile.intra.42.fr/oauth/applications)

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd reftofund
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   ```
   
   **Edit `.env` and set:**
   ```env
   # Generate with: openssl rand -base64 32
   AUTH_SECRET=your_generated_secret_here
   
   # Get from https://profile.intra.42.fr/oauth/applications
   AUTH_42_SCHOOL_ID=your_42_oauth_client_id
   AUTH_42_SCHOOL_SECRET=your_42_oauth_client_secret
   
   # Database (use defaults for local development)
   DATABASE_URL=postgresql://postgres:postgres@localhost:5433/local_db
   DIRECT_URL=postgresql://postgres:postgres@localhost:5433/local_db
   ```

3. **Choose your environment:**

   ### Option A: Production (Docker - Recommended for Deployment)
   ```bash
   docker compose up -d --build
   ```
   Runs optimized production build with automatic migrations.
   
   ### Option B: Development (Local - Recommended for Development)
   ```bash
   # Start database and Redis
   docker compose up -d db redis
   
   # Install dependencies
   npm install
   
   # Initialize database
   npx prisma db push
   
   # Start dev server
   npm run dev
   ```
   Runs with hot-reload on http://localhost:3000

4. **Configure 42 OAuth Redirect URI**
   
   In your 42 OAuth application settings, add:
   ```
   http://localhost:3000/api/auth/callback/42-school
   ```

5. **Access the application**
   - **App**: http://localhost:3000
   - **Prisma Studio** (dev only): http://localhost:5555 (run `npx prisma studio`)

## Development Commands

```bash
# Start dev server (after setting up DB)
npm run dev

# Generate Prisma client after schema changes
npx prisma generate

# Push schema changes to database
npx prisma db push

# Open Prisma Studio (database GUI)
npx prisma studio

# Run production build locally
npm run build
npm start
```

## Troubleshooting

### "Can't reach database server"
- Make sure Docker containers are running: `docker ps`
- Start database: `docker compose up -d db redis`
- Check connection: `docker logs refund-med-db`

### Permission errors with node_modules or .next
```bash
# Remove and reinstall
rm -rf node_modules .next
npm install
```

### Prisma Client out of sync
```bash
npx prisma generate
npx prisma db push
```

## Tech Stack

- **Framework**: Next.js 16.1 (App Router, Turbopack)
- **Runtime**: React 19
- **Auth**: Better-Auth with 42 OAuth
- **Database**: PostgreSQL + Prisma ORM
- **Cache/Queue**: Redis + BullMQ
- **Real-time**: Custom Socket.IO Server
- **Styling**: Tailwind CSS v4 + Shadcn/UI
- **State**: TanStack Query + Zustand

## Project Structure

```
src/
├── actions/      # Server actions (database operations)
├── app/          # Next.js App Router pages
│   ├── (auth)/   # Auth pages (login)
│   ├── (dashboard)/ # Protected pages (student/staff)
│   └── api/      # API routes
├── components/   # React components
│   ├── ui/       # Shadcn UI components
│   └── student/  # Student-specific components
├── hooks/        # Custom React hooks
├── lib/          # Core utilities (auth, prisma, queue, websocket)
├── store/        # Zustand state stores
└── types/        # TypeScript type definitions

server.ts         # Custom Next.js + Socket.IO server setup

scripts/
├── backup-db.sh          # Database backup utility
├── verify-local-db.sh    # Database verification tool
├── update-staff-roles.ts # Script to manage staff permissions
└── docker-*.sh           # Docker management scripts
```

## Environment Variables

See `.env.example` for all available options. Key variables:

- `AUTH_SECRET` - Session encryption key
- `AUTH_42_SCHOOL_ID` - 42 OAuth client ID
- `AUTH_42_SCHOOL_SECRET` - 42 OAuth client secret
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection (optional, for queues)
- `NEXT_PUBLIC_BETTER_AUTH_URL` - Auth API URL
