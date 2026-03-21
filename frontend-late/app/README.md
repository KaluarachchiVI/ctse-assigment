# Frontend (Next.js)

## Mock payment page (demo only)

For assignment screenshots and local demos without Stripe:

1. Copy `.env.example` to `.env.local` and set:

   ```bash
   NEXT_PUBLIC_USE_MOCK_PAYMENT_PAGE=true
   ```

2. Run **payment-service** with **`PAYMENT_GATEWAY_PROVIDER=mock`** so `POST /payments` completes synchronously (no Checkout redirect). Card-style fields on `/payment` are **not** sent to the API—only booking id, amount, and payment metadata.

3. Leave **`NEXT_PUBLIC_USE_MOCK_PAYMENT_PAGE`** unset or `false` to use the normal **Stripe Checkout** flow (`PAYMENT_GATEWAY_PROVIDER=stripe-checkout` + Stripe keys).

See also `payment-service/README.md` for gateway options.
