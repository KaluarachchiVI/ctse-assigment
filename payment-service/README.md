# Payment Service (CTSE Movie Booking)

Spring Boot microservice responsible for processing payments for movie bookings.

## Responsibilities

- **Process payments** for bookings via `POST /payments`.
- **Query payments** via `GET /payments/{paymentId}` and `GET /payments/booking/{bookingId}`.
- **Refund payments** via `POST /payments/refund`.
- **Notify Booking service** about payment outcome via `PUT /bookings/{bookingId}/status`
  with JSON body: `{ "status": "CONFIRMED" | "FAILED" | "CANCELLED" }`.
- **Optionally verify user** with User service via `GET /users/{userId}`.

## Tech Stack

- Spring Boot 3 (Web, Data MongoDB, Validation, Security, Actuator)
- MongoDB
- OpenAPI/Swagger via springdoc-openapi
- Java 17
- Docker, Kubernetes (EKS), GitHub Actions CI/CD

## Stripe + `POST /payments` (recommended demo flow)

1. Set `PAYMENT_GATEWAY_PROVIDER=stripe-checkout` (or `stripe`) and a valid `STRIPE_API_KEY` (**not** the placeholder `dummy` — use a real `sk_test_...` / `sk_live_...` key from the Stripe Dashboard).
2. After creating a booking, call `POST /payments` with `successUrl` / `cancelUrl` (Stripe placeholders `{CHECKOUT_SESSION_ID}`) — response includes `checkoutUrl` for redirect. The same Stripe Checkout logic is used by `POST /payments/checkout-session` (with Basic auth `payment-user` / `payment-pass`).
3. After Stripe redirects back, call `POST /payments` again with `stripeCheckoutSessionId` to finalize (or rely on the webhook).

### Troubleshooting `502` / errors from Checkout

- **Invalid API key**: Use a valid secret key; placeholder `dummy` returns **400** with a clear message.
- **Currency not supported**: Checkout line items use `STRIPE_CHECKOUT_CURRENCY` (default `lkr`). If your Stripe account does not support LKR, set e.g. `STRIPE_CHECKOUT_CURRENCY=usd` in `.env` (amount is still sent as major units × 100 minor units, same as before).
- Errors from Stripe are returned as **502** with JSON `message` describing the Stripe error code and text.

## Mock gateway + frontend demo payment page

For a **non-Stripe** synchronous flow (e.g. local demos):

1. Set **`PAYMENT_GATEWAY_PROVIDER=mock`**. Then `POST /payments` without `successUrl` / `cancelUrl` returns **`status: SUCCESS`** immediately via the mock gateway (no Checkout URL).
2. In the Next.js app, set **`NEXT_PUBLIC_USE_MOCK_PAYMENT_PAGE=true`** (see `frontend/app/.env.example`). After reserving seats, the UI navigates to **`/payment`** with a **demo-only** mock card form; **do not** enter real PANs—the browser form is not PCI scope, and card fields are **not** posted to this API.

Use **`stripe-checkout`** when teammates need the real Stripe redirect flow.

## Running Locally

Prerequisites:

- Java 17
- Maven
- MongoDB instance (or MongoDB Atlas connection string)

```bash
export MONGODB_URI="mongodb://localhost:27017/payments-db"
export BOOKING_SERVICE_BASE_URL="http://localhost:8080"
export USER_SERVICE_BASE_URL="http://localhost:8081"

mvn spring-boot:run
```

The service will start on port `8082`.

- Swagger UI: `http://localhost:8082/swagger-ui.html`
- Health check: `http://localhost:8082/actuator/health`

### Sample Requests

**Process Payment**

```bash
curl -u payment-user:payment-pass -X POST http://localhost:8082/payments \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": "B1001",
    "userId": "U1001",
    "amount": 3000,
    "paymentMethod": "CARD"
  }'
```

## Docker

Build and run locally:

```bash
docker build -t ctse/payment-service .

docker run -p 8082:8082 \
  -e MONGODB_URI="mongodb://host.docker.internal:27017/payments-db" \
  -e BOOKING_SERVICE_BASE_URL="http://host.docker.internal:8080" \
  -e USER_SERVICE_BASE_URL="http://host.docker.internal:8081" \
  ctse/payment-service
```

## Kubernetes (EKS)

- `k8s/deployment.yaml` – Deployment with environment variables and probes.
- `k8s/service.yaml` – LoadBalancer service to make the API reachable from the internet.
- `k8s/ingress.yaml` – Ingress mapping `/payments` to this service.

The deployment manifest expects `${PAYMENT_IMAGE}` in `k8s/deployment.yaml`. Your GitHub Actions workflow injects it during deployment using `envsubst`.
For manual deployment, replace `image: ${PAYMENT_IMAGE}` with `your-registry/your-image:tag`:

```bash
kubectl apply -f k8s/
```

Least privilege:

- The deployment uses `k8s/service-account.yaml` (`payment-service-sa`). If your EKS cluster is configured with IRSA, add the `eks.amazonaws.com/role-arn` annotation in that file to grant the service only the AWS permissions it needs.

## CI/CD & DevSecOps

- GitHub Actions workflow in `.github/workflows/ci-cd.yml`:
  - Runs tests with Maven.
  - Optionally runs Snyk SAST scan (if `SNYK_TOKEN` secret is configured).
  - Builds and pushes Docker image to a registry.
  - Deploys manifests to AWS EKS.

Security highlights:

- Secured endpoints with Spring Security (HTTP Basic for demo; swap to JWT if your group issues bearer tokens from the user service).
- No card details stored in the database; only high-level payment info.
- Configuration via environment variables and Kubernetes secrets.

### `/payments` request fields (assignment contract)

For the assignment contract, you can call `POST /payments` with:

- `bookingId`
- `userId` (optional if you support guest flow)
- `amount`
- `paymentMethod`

Ticket/email fields (`ticketEmail`, `guestName`) are used for ticket issuance + emailing. For guest checkout they are required; for registered users they are auto-filled best-effort from the User service (and ticketing is skipped if email/name cannot be resolved).


