# Recurring Income Setup

## Overview
The recurring income feature automatically creates income transactions (like salary) on a specified day each month.

## Features

1. **Set Monthly Income**: Configure amount, description, account, and category
2. **Flexible Schedule**: Choose any day from 1-28 of the month
3. **Automatic Processing**: Runs daily via cron job
4. **Pause/Resume**: Toggle active status anytime
5. **Full Control**: Delete recurring income anytime

## How It Works

### 1. User Creates Recurring Income
- User goes to **Settings** → **Recurring Income**
- Clicks "Add Recurring Income"
- Fills form:
  - Amount (e.g., $5,000)
  - Description (e.g., "Monthly Salary")
  - Account (where to deposit)
  - Category (optional, e.g., "Salary")
  - Day of Month (1-28)

### 2. System Schedules Next Run
- Calculates `nextRunDate` based on day of month
- If current day has passed, schedules for next month
- Stores in database with `isActive: true`

### 3. Cron Job Processes Daily
The `/api/recurring-income/process` endpoint should be called daily:

```
POST /api/recurring-income/process
Authorization: Bearer YOUR_CRON_SECRET
```

This will:
- Find all active recurring incomes where `nextRunDate <= now`
- Create a transaction for each
- Update account balance
- Calculate and set next `nextRunDate` (same day next month)
- Update `lastRunDate`

### 4. User Manages
- View all recurring incomes in Settings
- See next run date and last run date
- Pause/activate with one click
- Delete if no longer needed

## Setting Up the Cron Job

### Option 1: Vercel Cron Jobs

Create `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/recurring-income/process",
      "schedule": "0 1 * * *"
    }
  ]
}
```

This runs daily at 1:00 AM UTC.

Add to `.env`:
```
CRON_SECRET=your-secret-token-here
```

### Option 2: External Cron Service

Use a service like:
- [cron-job.org](https://cron-job.org)
- [EasyCron](https://www.easycron.com)
- [GitHub Actions](https://github.com/features/actions)

Set up daily HTTP POST to:
```
https://your-app.vercel.app/api/recurring-income/process
```

With header:
```
Authorization: Bearer YOUR_CRON_SECRET
```

### Option 3: Local Development

For testing locally, manually call:
```bash
curl -X POST http://localhost:3001/api/recurring-income/process \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## Database Schema

```prisma
model RecurringIncome {
  id            String    @id
  userId        String
  accountId     String
  categoryId    String?
  amount        Decimal
  description   String
  dayOfMonth    Int       // 1-28
  isActive      Boolean   @default(true)
  nextRunDate   DateTime
  lastRunDate   DateTime?
  createdAt     DateTime
  updatedAt     DateTime
}
```

## User Experience

### In Settings Page
Users see:
- List of all recurring incomes
- Amount and frequency
- Next run date
- Last run date
- Active/Paused status
- Pause/Delete buttons

### When Transaction is Created
- Transaction appears in dashboard and transactions list
- Account balance updates automatically
- Notes field shows "Automatic recurring income"
- Linked to the recurring income record

## Security

- All recurring incomes are user-scoped
- Cron endpoint requires `CRON_SECRET` header
- Users can only manage their own recurring incomes
- Account ownership is verified before processing

## Edge Cases Handled

1. **Day doesn't exist in month**: We only allow days 1-28 to avoid this
2. **First run in past**: Automatically schedules for next month
3. **User deletes account**: Cascade deletes recurring income
4. **Processing fails**: Error is logged, doesn't stop other incomes
5. **Duplicate processing**: Transaction includes date check

## Future Enhancements

1. Multiple frequencies (weekly, bi-weekly, quarterly)
2. End date for recurring incomes
3. Email notifications when processed
4. Transaction preview before creation
5. Bulk recurring income management
6. Recurring expenses (bills, subscriptions)

## Testing

To test the feature:

1. Create a recurring income in Settings
2. Set `dayOfMonth` to tomorrow's day
3. Manually call the process endpoint
4. Verify transaction is created
5. Check account balance updated
6. Verify next run date is set to next month

## Troubleshooting

**Transactions not being created?**
- Check cron job is configured
- Verify `CRON_SECRET` is set correctly
- Check `nextRunDate` is in the past
- Verify `isActive: true`
- Check server logs for errors

**Wrong day of month?**
- Dates use server timezone
- Consider using UTC for consistency
- Day 1-28 ensures valid date every month

**Multiple transactions created?**
- Add idempotency check in process endpoint
- Use unique constraint on `(userId, description, date)`

