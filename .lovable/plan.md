

## Problem

`create-checkout` uses `STRIPE_SECRET_KEY` which is an expired live key (`sk_live_...7GaDwu`). It ignores the admin's payment mode toggle entirely, unlike `create-payment`, `customer-portal`, `check-subscription`, and `stripe-webhook` which all read `settings.payment_mode`.

## Plan

### 1. Update `create-checkout/index.ts`

Apply the same pattern as `create-payment` and `customer-portal`:

- Read `payment_mode` from `settings` table using service role client
- Select `STRIPE_TEST_SECRET_KEY` or `STRIPE_LIVE_SECRET_KEY` based on mode
- Select correct Price ID per mode:
  - **Test**: `price_1T8xazJttvYKlxWaK8EfKELu` (current hardcoded value)
  - **Live**: `price_1T8o5WJttvYKlxWaKGiSG26L` (from `tiers.ts`)
- Remove reference to `STRIPE_SECRET_KEY` entirely

No secrets needed — `STRIPE_TEST_SECRET_KEY` and `STRIPE_LIVE_SECRET_KEY` are already configured.

### 2. No other changes needed

`customer-portal`, `check-subscription`, `stripe-webhook`, and `create-payment` already respect the toggle.

