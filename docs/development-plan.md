# Development Plan

## MVP Scope ✅

The MVP includes the following features:

- [x] Authentication (Clerk)
- [x] Manual transaction entry
- [x] Categories (default + custom)
- [x] Monthly totals and summaries
- [x] Basic budget per category
- [x] iPhone Shortcut webhook that inserts a transaction
- [x] Account management
- [x] Dashboard with KPIs

## v1 Features (Next Phase)

### Savings Goals
- [ ] Create, read, update, delete savings goals
- [ ] Track progress toward goals
- [ ] Link transactions to goals
- [ ] Goal completion notifications

### Analytics & Charts
- [ ] Monthly spending trends (line chart)
- [ ] Category breakdown (pie chart)
- [ ] Income vs Expenses over time
- [ ] Spending by category (bar chart)
- [ ] Cash flow forecast

### File Import
- [ ] CSV import with preview
- [ ] Column mapping UI
- [ ] OFX/QFX import support
- [ ] Import validation and error handling
- [ ] Import history and logs

### Transfer Transactions
- [ ] UI for creating transfer transactions
- [ ] Visual representation of transfers
- [ ] Transfer history

### Recurring Transactions
- [ ] Create recurring transaction templates
- [ ] Automatic transaction creation
- [ ] Recurrence patterns (daily, weekly, monthly, custom)

## v2 Features (Future)

### Open Banking Integration
- [ ] Plaid integration (US)
- [ ] TrueLayer integration (UK/EU)
- [ ] Account linking UI
- [ ] Automatic transaction sync
- [ ] Transaction categorization suggestions

### Advanced Features
- [ ] Multi-currency support
- [ ] Budget alerts and notifications
- [ ] Export to PDF/CSV
- [ ] Advanced reporting
- [ ] Financial insights and recommendations
- [ ] Bill reminders

### Mobile App
- [ ] React Native app
- [ ] Push notifications
- [ ] Offline support
- [ ] Biometric authentication

## Implementation Order

### Phase 1: MVP (Current) ✅
1. Project setup
2. Database schema
3. Authentication
4. Basic CRUD operations
5. Dashboard
6. iPhone Shortcut integration

### Phase 2: v1
1. Savings goals (2-3 days)
2. Analytics with charts (3-4 days)
3. CSV import (2-3 days)
4. Transfer transactions UI (1-2 days)
5. Recurring transactions (3-4 days)

### Phase 3: v2
1. Open Banking research and abstraction layer (1 week)
2. Plaid integration (1 week)
3. Multi-currency (1 week)
4. Advanced features (2 weeks)
5. Mobile app (4-6 weeks)

## Technical Debt & Improvements

### Short Term
- [ ] Add rate limiting to webhook endpoints
- [ ] Implement proper error boundaries
- [ ] Add loading states to all forms
- [ ] Improve mobile responsiveness
- [ ] Add transaction edit/delete UI
- [ ] Add pagination to transactions list

### Medium Term
- [ ] Add unit tests
- [ ] Add integration tests
- [ ] Implement proper logging
- [ ] Add monitoring and error tracking (Sentry)
- [ ] Optimize database queries
- [ ] Add caching layer

### Long Term
- [ ] Migrate to TypeScript (if needed)
- [ ] Implement GraphQL API (if needed)
- [ ] Add real-time updates (WebSockets)
- [ ] Implement advanced search and filtering
- [ ] Add data export/import
- [ ] Implement backup and restore

## Performance Targets

- Dashboard load time: < 1s
- Transaction list: < 500ms
- API response time: < 200ms (p95)
- Database query time: < 100ms (p95)

## Security Checklist

- [x] User isolation in all queries
- [x] Input validation with Zod
- [x] SQL injection prevention (Prisma)
- [x] XSS prevention (React)
- [ ] Rate limiting
- [ ] API token hashing
- [ ] Audit logging (partial)
- [ ] Data encryption at rest
- [ ] HTTPS enforcement
- [ ] CORS configuration

## Testing Strategy

### Unit Tests
- Validation schemas
- Utility functions
- Business logic

### Integration Tests
- API endpoints
- Database operations
- Authentication flow

### E2E Tests
- User registration and login
- Transaction creation
- Budget management
- iPhone Shortcut integration

## Deployment Checklist

- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] Seed data loaded
- [ ] Clerk configured
- [ ] Domain configured
- [ ] SSL certificate active
- [ ] Monitoring set up
- [ ] Error tracking configured
- [ ] Backup strategy in place

