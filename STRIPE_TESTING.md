# Stripe Testing Guide for Urban Barnacle

This guide explains how to test the Stripe payment integration for 3D model purchases in development and staging environments.

## 🔧 Setup Requirements

### 1. Get Stripe Test API Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Switch to **Test mode** (toggle in the left sidebar)
3. Navigate to **Developers** → **API keys**
4. Copy the following keys:
   - **Publishable key** (starts with `pk_test_`)
   - **Secret key** (starts with `sk_test_`)

### 2. Environment Configuration

#### Development (Local)
Add to your local `.env` file:
```bash
# Stripe Test Configuration
STRIPE_SECRET_KEY=sk_test_your_test_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_test_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here  # Optional for basic testing
```

#### Staging (GitHub Actions)
Add these variables to your GitHub repository:
1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Click **Variables** tab
3. Add these variables:
   - `STRIPE_SECRET_KEY`: `sk_test_your_test_secret_key`
   - `STRIPE_PUBLISHABLE_KEY`: `pk_test_your_test_publishable_key`
   - `STRIPE_WEBHOOK_SECRET`: `whsec_your_webhook_secret` (optional)

## 🧪 Testing Process

### 1. Verify Stripe is Enabled
Check that Stripe is properly configured by visiting:
```
GET /api/v1/payments/config
```

Expected response:
```json
{
  "publishable_key": "pk_test_...",
  "enabled": true
}
```

### 2. Test Payment Flow

1. **Navigate to an item with a 3D model**
2. **Click "Purchase 3D Model - $10.00"**
3. **You'll be redirected to Stripe Checkout**
4. **Use Stripe test card numbers:**

#### Test Card Numbers:
- **Success**: `4242 4242 4242 4242`
- **Declined**: `4000 0000 0000 0002`
- **Requires Authentication**: `4000 0025 0000 3155`
- **Insufficient Funds**: `4000 0000 0000 9995`

#### Test Details:
- **Expiry**: Any future date (e.g., `12/25`)
- **CVC**: Any 3 digits (e.g., `123`)
- **ZIP**: Any 5 digits (e.g., `12345`)

### 3. Test Success Flow
After successful payment:
1. You'll be redirected to `/payment/success?session_id=...`
2. The page should show:
   - Payment confirmation
   - Download link for the 3D model
   - Item details

### 4. Test Cancel Flow
If you cancel the payment:
1. You'll be redirected to `/payment/cancel`
2. The page should show a cancellation message

## 🔍 Debugging

### Check Stripe Configuration
```bash
# In your backend container
docker compose exec backend python -c "
from app.core.config import settings
print(f'Stripe enabled: {settings.stripe_enabled}')
print(f'Has secret key: {bool(settings.STRIPE_SECRET_KEY)}')
print(f'Has publishable key: {bool(settings.STRIPE_PUBLISHABLE_KEY)}')
"
```

### View Payment Logs
```bash
# Check backend logs for payment processing
docker compose logs backend | grep -i stripe
```

### Stripe Dashboard
Monitor test payments in your Stripe Dashboard:
1. Go to **Payments** → **All payments**
2. Filter by **Test mode**
3. View payment details and status

## 🚨 Important Notes

### Test Mode vs Live Mode
- **Test keys** start with `pk_test_` and `sk_test_`
- **Live keys** start with `pk_live_` and `sk_live_`
- Always use test keys in development and staging
- Never commit API keys to version control

### Test Data
- Test payments don't charge real money
- Test data is separate from live data
- You can create unlimited test payments

### Webhook Testing (Optional)
For webhook testing in development:
1. Install [Stripe CLI](https://stripe.com/docs/stripe-cli)
2. Run: `stripe listen --forward-to localhost:8000/api/v1/payments/webhook`
3. Use the webhook signing secret provided by the CLI

## 🔗 Useful Links

- [Stripe Test Cards](https://stripe.com/docs/testing#cards)
- [Stripe Dashboard](https://dashboard.stripe.com)
- [Stripe CLI](https://stripe.com/docs/stripe-cli)
- [Stripe Checkout Documentation](https://stripe.com/docs/payments/checkout)

## 📝 Testing Checklist

- [ ] Stripe test keys configured in environment
- [ ] `/api/v1/payments/config` returns enabled: true
- [ ] Can create checkout session
- [ ] Successful payment redirects to success page
- [ ] Download link is provided after payment
- [ ] Cancelled payment redirects to cancel page
- [ ] Payment appears in Stripe Dashboard (test mode)
- [ ] Error handling works for declined cards
