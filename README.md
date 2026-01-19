# 1337 Refund Management System

A financial reimbursement tracking platform for the 1337/42 school ecosystem. Students can submit refund requests, and staff can review and approve them.

## Features

- **42 School OAuth** - Login with your 42 intra account
- **Role-based access** - Students submit requests, Staff review them
- **Status tracking** - Track requests through the approval pipeline
- **Receipt upload** - Upload receipts for verification
- **Real-time updates** - Auto-refreshing dashboards
- **Notifications** - In-app notifications for status changes
- **PDF Export** - Staff can export reports

## Quick Start (Docker)

### Prerequisites
- Docker and Docker Compose installed
- 42 OAuth application credentials (get from [42 Intra](https://profile.intra.42.fr/oauth/applications))

### Setup

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd refund-med
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and add your 42 OAuth credentials:
   - `AUTH_42_SCHOOL_ID` - Your 42 OAuth client ID
   - `AUTH_42_SCHOOL_SECRET` - Your 42 OAuth client secret
   - `AUTH_SECRET` - Generate with: `openssl rand -base64 32`

3. **Deploy (Production)**
   ```bash
   docker compose up -d
   ```
   
   This will:
   - Build optimized production image
   - Start PostgreSQL database
   - Run database migrations
   - Start the Next.js production server

4. **Access the app**
   - App: http://localhost:3000

### Development Mode

For development with hot reload:
```bash
docker compose -f docker-compose.dev.yml up
```

### OAuth Callback URL

When creating your 42 OAuth application, set the redirect URI to:
```
http://localhost:3000/api/auth/callback/42-school
```

## Development (Without Docker)

```bash
# Install dependencies
npm install

# Start PostgreSQL (or use Docker for just the DB)
docker compose up db

# Push database schema
npx prisma db push

# Start dev server
npm run dev
```

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Auth**: Better-Auth with 42 OAuth
- **Database**: PostgreSQL + Prisma ORM
- **Styling**: Tailwind CSS + Shadcn/UI
- **State**: React Query + Zustand

## Project Structure

```
src/
├── actions/      # Server actions (API logic)
├── app/          # Next.js App Router pages
├── components/   # React components
├── lib/          # Utilities (auth, prisma, etc.)
├── store/        # Zustand stores
└── types/        # TypeScript types
```

## License

MIT