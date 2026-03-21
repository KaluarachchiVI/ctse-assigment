# Movie ticket booking (CTSE)

Microservices: API gateway, user, booking, movie, scheduling, payment. The Vite UI lives under `Frontend/`.

## After you clone or pull from GitHub

### 1. Root environment file (Docker / Stripe)

Compose reads variables from a **`.env` file next to `docker-compose.yml`** (the repo root). That file is gitignored.

1. Copy the template:

   ```bash
   cp .env.example .env
   ```

2. Edit **`.env`** and set at least:

   - **`STRIPE_API_KEY`** — your Stripe secret key (`sk_test_...` for test mode). Checkout will not work until this is set (the placeholder `dummy` is rejected).
   - **`STRIPE_WEBHOOK_SECRET`** — optional for local UI flow; required if you use `POST /payments/webhook/stripe` with the Stripe CLI or dashboard webhooks.

3. Leave **`PAYMENT_GATEWAY_PROVIDER=stripe-checkout`** unless you switch to the mock gateway for demos.

4. **`USER_SERVICE_ENABLED`** — when `true`, the payment service checks that the user exists in user-service for logged-in checkout. Set `false` only if you need to relax that check in a pinch.

See **`.env.example`** for all keys and short comments.

### 2. Run the stack with Docker

From the repo root:

```bash
docker compose build
docker compose up -d
```

Default ports:

| Service           | Port |
|-------------------|------|
| API gateway       | 8087 |
| user-service      | 8081 |
| booking-service   | 8082 |
| movie-service     | 8083 |
| scheduling-service| 8084 |
| payment-service   | 8085 |

Point the browser at the gateway (**`http://localhost:8087`**) for API calls.

After changing **`.env`**, recreate the payment service so it picks up new values:

```bash
docker compose up -d --force-recreate payment-service
```

### 3. Frontend (Vite)

The UI uses **Tailwind CSS** (with preflight disabled so existing global styles stay intact), **`motion`** (Framer Motion–compatible API) for the border glow, and **`clsx` / `tailwind-merge`** via `Frontend/src/lib/utils.js` (`cn` helper). Reusable primitives such as **`GlowingEffect`** live under **`Frontend/src/components/ui/`** (JSX port of the Aceternity-style glowing border, adapted for this Vite + JS app). The Vite config maps the **`@` alias** to **`Frontend/src`**.

```bash
cd Frontend
cp .env.example .env
```

Set **`VITE_API_BASE_URL=http://localhost:8087`** (or your gateway URL). Install and run:

```bash
npm install
npm run dev
```

Open the URL Vite prints (often `http://localhost:5173`).

### Quick setup (Windows)

From the repo root you can run **`.\setup.ps1`** in PowerShell. It checks **Node**, optionally runs **`docker compose build`** / **`up -d`**, copies **`.env.example`** → **`.env`** if missing, then **`npm install`** and **`npm run build`** in **`Frontend/`**. Adjust **`.env`** and **`Frontend/.env`** before relying on payments or the gateway in production.

### 4. If something still fails

- Confirm **`.env`** exists at the **repository root** (not only inside `Frontend/`) when using Docker Compose.
- Rebuild services you changed: `docker compose build <service-name> && docker compose up -d`.
- Booking and user services must share the same **`JWT_SECRET`** as in `docker-compose.yml` for tokens to validate (already aligned in this repo’s compose file).
