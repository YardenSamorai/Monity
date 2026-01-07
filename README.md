# Monity - Personal Finance Management App

A modern personal finance web app built with Next.js (App Router) and PostgreSQL.

## Features

- Track income, expenses, and transfers
- Monthly budgets with Plan vs Actual tracking
- Savings goals management
- Analytics and charts
- iPhone Shortcut integration via webhook
- CSV/OFX file import

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: JavaScript (no TypeScript)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Clerk
- **Styling**: TailwindCSS
- **Charts**: Recharts

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database (local or managed)
- Clerk account for authentication

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your:
- `DATABASE_URL` (PostgreSQL connection string)
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_APP_URL` (e.g., http://localhost:3000)

3. Set up the database:
```bash
npm run db:generate
npm run db:push
npm run db:seed
```

4. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
/app
  /api          # API route handlers
  /dashboard    # Dashboard page
  /transactions # Transactions page
  /budget       # Budget page
  /analytics    # Analytics page
  /goals        # Savings goals page
  /settings     # Settings page
/components     # Reusable UI components
/lib            # Utilities, database client, validations
/prisma         # Database schema and migrations
```

## iPhone Shortcut Integration

See `docs/iphone-shortcut-setup.md` for detailed instructions on setting up the webhook integration.

## Development Plan

### MVP ✅
- [x] Authentication
- [x] Manual transaction entry
- [x] Categories
- [x] Monthly totals
- [x] Basic budget per category
- [x] iPhone Shortcut webhook

### v1 (Next)
- [ ] Savings goals
- [ ] Analytics and charts
- [ ] CSV/OFX import
- [ ] Transfer transactions

### v2 (Future)
- [ ] Open Banking integration (Plaid/TrueLayer)
- [ ] Recurring transactions
- [ ] Multi-currency support
- [ ] Mobile app

