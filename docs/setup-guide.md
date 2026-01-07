# Setup Guide

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database (local or managed)
- Clerk account (free tier works)
- Git (optional)

## Step 1: Clone and Install

```bash
# If using Git
git clone <repository-url>
cd Monity

# Install dependencies
npm install
```

## Step 2: Set Up Environment Variables

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Edit `.env` with your values:

```env
# Database - Get from your PostgreSQL provider
DATABASE_URL="postgresql://user:password@localhost:5432/monity?schema=public"

# Clerk - Get from https://dashboard.clerk.com
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# JWT Secret (generate with: openssl rand -base64 32)
JWT_SECRET=your-secret-key-here
```

## Step 3: Set Up Clerk

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Create a new application
3. Copy the publishable key and secret key to `.env`
4. Configure sign-in/sign-up URLs:
   - Sign-in URL: `http://localhost:3000/sign-in`
   - Sign-up URL: `http://localhost:3000/sign-up`
   - After sign-in: `http://localhost:3000/dashboard`
   - After sign-up: `http://localhost:3000/dashboard`

## Step 4: Set Up Database

### Option A: Local PostgreSQL

1. Install PostgreSQL locally
2. Create a database:
```bash
createdb monity
```
3. Update `DATABASE_URL` in `.env`

### Option B: Managed PostgreSQL (Recommended for Production)

- **Vercel Postgres**: Integrated with Vercel
- **Supabase**: Free tier available
- **Neon**: Serverless PostgreSQL
- **Railway**: Easy setup

## Step 5: Initialize Database

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed default categories
npm run db:seed
```

## Step 6: Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Step 7: Create Your First Account

1. Sign up for an account
2. Go to Settings
3. Click "Add Account"
4. Create your first account (e.g., "Checking Account")

## Step 8: Set Up iPhone Shortcut (Optional)

See `docs/iphone-shortcut-setup.md` for detailed instructions.

## Troubleshooting

### Database Connection Error

- Verify `DATABASE_URL` is correct
- Check PostgreSQL is running (if local)
- Verify database exists
- Check firewall settings (if remote)

### Clerk Authentication Error

- Verify Clerk keys are correct
- Check URLs match in Clerk dashboard
- Clear browser cache and cookies

### Prisma Errors

- Run `npm run db:generate` again
- Check database connection
- Verify schema is pushed: `npm run db:push`

### Port Already in Use

- Change port: `npm run dev -- -p 3001`
- Or kill process using port 3000

## Production Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Connect PostgreSQL database
5. Deploy

### Other Platforms

- **Railway**: Similar to Vercel
- **Render**: Good for full-stack apps
- **Fly.io**: Good for global deployment

## Next Steps

- Read `docs/architecture.md` for architecture overview
- Read `docs/development-plan.md` for feature roadmap
- Read `docs/iphone-shortcut-setup.md` for Shortcut integration

