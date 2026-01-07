# Monity Architecture

## High-Level Overview

Monity is a personal finance management web application built with Next.js (App Router) and PostgreSQL. It follows a server-side rendering approach with API routes for data mutations.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: JavaScript (no TypeScript)
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: Clerk
- **Styling**: TailwindCSS
- **Charts**: Recharts (for future analytics)
- **Validation**: Zod

## Architecture Patterns

### 1. Data Flow

```
User Action → UI Component → API Route → Prisma → PostgreSQL
                ↓
         Server Component (SSR)
```

- **Server Components**: Used for pages that need data fetching (Dashboard, Transactions, Budget)
- **Client Components**: Used for interactive forms and modals (TransactionForm, BudgetForm)
- **API Routes**: Handle all data mutations (POST, PATCH, DELETE)

### 2. Authentication Flow

1. User signs in/up via Clerk
2. Clerk middleware protects routes
3. `getOrCreateUser()` helper:
   - Gets Clerk user ID from session
   - Finds or creates user in database
   - Returns user object for database queries

### 3. Database Schema

#### Core Entities

- **User**: Links Clerk user ID to database user
- **Account**: Financial accounts (bank, cash, credit)
- **Transaction**: Income, expense, or transfer transactions
- **Category**: Transaction categories with auto-categorization rules
- **Budget**: Monthly budgets per category
- **SavingsGoal**: Savings goals with progress tracking
- **Import**: Tracks all data imports (Shortcuts, CSV, etc.)
- **ApiToken**: API tokens for webhook access
- **AuditLog**: Audit trail for important actions

#### Key Design Decisions

1. **User Isolation**: All queries filter by `userId` to ensure strong isolation
2. **Account Balance**: Calculated field updated on transaction create/update/delete
3. **Idempotency**: Transactions support `idempotencyKey` to prevent duplicates
4. **Soft Deletes**: Accounts can be marked inactive instead of deleted
5. **Default Categories**: System categories available to all users

### 4. API Design

#### RESTful Routes

- `GET /api/transactions` - List transactions (with filters)
- `POST /api/transactions` - Create transaction
- `GET /api/transactions/[id]` - Get single transaction
- `PATCH /api/transactions/[id]` - Update transaction
- `DELETE /api/transactions/[id]` - Delete transaction

Similar patterns for:
- `/api/accounts`
- `/api/categories`
- `/api/budgets`
- `/api/api-tokens`

#### Webhook Endpoint

- `POST /api/webhook/shortcut` - iPhone Shortcut integration
  - Authentication: Bearer token (API token)
  - Idempotency: Uses `idempotencyKey` to prevent duplicates
  - Auto-categorization: Matches category by name
  - Account selection: Matches account by name or uses default

### 5. iPhone Shortcut Integration

#### Flow

```
iPhone Shortcut → HTTP POST → /api/webhook/shortcut
                      ↓
              Validate API Token
                      ↓
              Check Idempotency
                      ↓
              Find/Create Category
                      ↓
              Find Account
                      ↓
              Create Transaction
                      ↓
              Update Account Balance
                      ↓
              Create Import Record
                      ↓
              Create Audit Log
                      ↓
              Return Success
```

#### Security

- Bearer token authentication
- Token expiration support
- Idempotency keys prevent replay attacks
- Audit logging for all imports
- IP address and user agent tracking

### 6. Data Validation

All API inputs are validated using Zod schemas:

- `createTransactionSchema`
- `updateTransactionSchema`
- `createBudgetSchema`
- `createAccountSchema`
- `createCategorySchema`
- `shortcutWebhookSchema`

Validation errors return 400 with detailed error messages.

### 7. Error Handling

- API routes use try/catch blocks
- Errors logged to console (in development)
- User-friendly error messages
- Proper HTTP status codes:
  - 200: Success
  - 201: Created
  - 400: Validation error
  - 401: Unauthorized
  - 404: Not found
  - 500: Server error

### 8. Performance Considerations

#### Database Indexes

- `userId` on all user-scoped tables
- `userId + date` on transactions for date range queries
- `userId + categoryId` for category filtering
- `idempotencyKey` unique index for fast duplicate detection
- Composite indexes for common query patterns

#### Pagination

- Transactions API supports `page` and `limit` parameters
- Default limit: 50 records
- Returns pagination metadata

#### Caching (Future)

- Consider caching category lists
- Cache monthly totals
- Use Next.js revalidation for dashboard data

## File Structure

```
/app
  /api              # API route handlers
    /transactions   # Transaction CRUD
    /accounts       # Account management
    /categories     # Category management
    /budgets        # Budget management
    /api-tokens     # API token management
    /webhook        # Webhook endpoints
      /shortcut     # iPhone Shortcut webhook
  /dashboard        # Dashboard page
  /transactions     # Transactions list page
  /budget           # Budget page
  /analytics        # Analytics page (v1)
  /goals            # Savings goals page (v1)
  /settings         # Settings page
  /sign-in          # Clerk sign-in
  /sign-up          # Clerk sign-up
  layout.js         # Root layout with ClerkProvider
  page.js           # Home page (redirects)

/components
  Layout.js              # Main layout with navigation
  TransactionForm.js     # Transaction creation form
  BudgetForm.js          # Budget creation form
  AccountForm.js         # Account creation form
  CategoryForm.js        # Category creation form
  ApiTokenManager.js     # API token management UI

/lib
  prisma.js         # Prisma client singleton
  auth.js           # Auth helpers (getOrCreateUser)
  validations.js    # Zod schemas
  utils.js          # Utility functions

/prisma
  schema.prisma     # Database schema
  seed.js           # Seed data script

/docs
  architecture.md           # This file
  iphone-shortcut-setup.md  # Shortcut setup guide
```

## Security Considerations

1. **User Isolation**: All queries filter by `userId`
2. **API Token Security**: Tokens are hashed (future) and can expire
3. **Input Validation**: All inputs validated with Zod
4. **SQL Injection**: Prisma prevents SQL injection
5. **XSS**: React escapes by default
6. **CSRF**: Next.js API routes protected by default
7. **Rate Limiting**: Should be added for webhook endpoints (future)

## Deployment

### Vercel + Managed PostgreSQL

1. Push code to Git repository
2. Connect to Vercel
3. Set environment variables:
   - `DATABASE_URL`
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
   - `NEXT_PUBLIC_APP_URL`
4. Run migrations: `npm run db:push`
5. Seed database: `npm run db:seed`

### Environment Variables

See `.env.example` for required variables.

## Development Workflow

1. Install dependencies: `npm install`
2. Set up `.env` file
3. Generate Prisma client: `npm run db:generate`
4. Push schema to database: `npm run db:push`
5. Seed database: `npm run db:seed`
6. Run dev server: `npm run dev`

## Future Enhancements (v1, v2)

### v1
- Savings goals CRUD
- Analytics with Recharts
- CSV/OFX import
- Transfer transactions UI
- Recurring transactions

### v2
- Open Banking integration (Plaid/TrueLayer)
- Multi-currency support
- Mobile app (React Native)
- Advanced categorization rules
- Budget alerts
- Export to PDF/CSV

