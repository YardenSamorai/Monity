# iPhone Shortcut Integration Setup

This guide explains how to set up an iPhone Shortcut to automatically add transactions to Monity.

## Prerequisites

1. An active Monity account
2. An API token (generate one in Settings → API Tokens)
3. iPhone with Shortcuts app installed

## Step 1: Generate API Token

1. Log in to Monity
2. Go to **Settings**
3. Scroll to **iPhone Shortcut Integration**
4. Enter a name (e.g., "My iPhone")
5. Click **Generate Token**
6. **Copy and save the token** - you won't be able to see it again!

## Step 2: Create the Shortcut

1. Open the **Shortcuts** app on your iPhone
2. Tap the **+** button to create a new shortcut
3. Add the following actions:

### Basic Expense Shortcut

```
1. Ask for Input
   - Prompt: "What did you spend money on?"
   - Input Type: Text
   - Variable: description

2. Ask for Input
   - Prompt: "How much?"
   - Input Type: Number
   - Variable: amount

3. Ask for Input
   - Prompt: "Category (optional)"
   - Input Type: Text
   - Variable: category
   - Allow Multiple Selections: No

4. Get Current Date
   - Format: ISO 8601
   - Variable: date

5. Generate UUID
   - Variable: idempotencyKey

6. Get Contents of URL
   - URL: https://your-app-url.com/api/webhook/shortcut
   - Method: POST
   - Headers:
     - Authorization: Bearer YOUR_API_TOKEN_HERE
     - Content-Type: application/json
   - Request Body:
     {
       "type": "expense",
       "amount": [amount],
       "description": [description],
       "category": [category],
       "date": [date],
       "idempotencyKey": [idempotencyKey]
     }
```

### Quick Expense Shortcut (One-Tap)

For a faster one-tap experience, you can create a shortcut that uses predefined values:

```
1. Ask for Input
   - Prompt: "Amount"
   - Input Type: Number
   - Variable: amount

2. Get Current Date
   - Format: ISO 8601
   - Variable: date

3. Generate UUID
   - Variable: idempotencyKey

4. Get Contents of URL
   - URL: https://your-app-url.com/api/webhook/shortcut
   - Method: POST
   - Headers:
     - Authorization: Bearer YOUR_API_TOKEN_HERE
     - Content-Type: application/json
   - Request Body:
     {
       "type": "expense",
       "amount": [amount],
       "description": "Quick Expense",
       "date": [date],
       "idempotencyKey": [idempotencyKey]
     }
```

## Step 3: Test the Shortcut

1. Run the shortcut manually
2. Check your Monity dashboard to verify the transaction was created
3. If it fails, check:
   - API token is correct
   - You have at least one active account
   - Your app URL is correct

## Step 4: Add to Home Screen (Optional)

1. In the Shortcuts app, tap the **...** on your shortcut
2. Tap the **Share** button
3. Select **Add to Home Screen**
4. Customize the icon and name
5. Tap **Add**

## Example JSON Payload

The webhook expects a JSON payload like this:

```json
{
  "type": "expense",
  "amount": 25.50,
  "description": "Coffee at Starbucks",
  "category": "Food & Dining",
  "account": "Checking",
  "date": "2024-01-15T10:30:00Z",
  "idempotencyKey": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Field Descriptions

- **type** (required): `"income"` or `"expense"`
- **amount** (required): Positive number
- **description** (required): Transaction description
- **category** (optional): Category name (will be matched by name)
- **account** (optional): Account name (will be matched by name, defaults to first active account)
- **date** (optional): ISO 8601 datetime string (defaults to now)
- **idempotencyKey** (required): Unique identifier to prevent duplicate transactions

## Security Notes

- Keep your API token secure
- Don't share your API token
- You can revoke tokens in Settings if needed
- Each token can have an expiration date

## Troubleshooting

### "Invalid or inactive API token"
- Check that you copied the full token
- Verify the token is active in Settings
- Check if the token has expired

### "No active account found"
- Create at least one account in Settings → Accounts
- Make sure the account is active

### "Validation error"
- Check that all required fields are provided
- Verify the amount is a positive number
- Ensure the date format is ISO 8601

### Transaction not appearing
- Check the idempotency key - if you run the shortcut twice with the same key, it will return the existing transaction
- Verify the webhook returned a success response
- Check the import logs in Settings (coming in v1)

