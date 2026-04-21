# Movie Ticket Booking — System Overview

Microservices-based movie ticket booking platform built for the CTSE assignment.
All services are Spring Boot (Java 17) except the UI, which is a React + Vite
app. Data lives in a shared MongoDB Atlas cluster (logical isolation per
collection set). The system is deployed to **Azure Container Apps** with images
stored in **Azure Container Registry (ACR)** and built / shipped by
**GitHub Actions**.

---

## 1. High-level Architecture

```
                       ┌────────────────────────┐
                       │   Frontend (Vite/React)│
                       │   hosted on Vercel/etc │
                       └───────────┬────────────┘
                                   │ HTTPS
                                   ▼
                       ┌────────────────────────┐
                       │      API Gateway       │  Spring Cloud Gateway
                       │       :8087            │  (routes + CORS)
                       └───────────┬────────────┘
             ┌─────────────┬───────┼───────┬────────────┐
             ▼             ▼       ▼       ▼            ▼
      ┌───────────┐ ┌───────────┐ ┌────────┐ ┌──────────────┐ ┌──────────────┐
      │user-service│ │booking-svc│ │movie-  │ │scheduling-   │ │payment-svc   │
      │   :8081    │ │   :8082   │ │service │ │service :8084 │ │   :8085      │
      │            │ │           │ │ :8083  │ │              │ │ + Stripe     │
      └─────┬──────┘ └─────┬─────┘ └───┬────┘ └──────┬───────┘ └───────┬──────┘
            └──────────────┴───────────┴─────────────┴─────────────────┘
                                   │
                                   ▼
                           MongoDB Atlas
                           (one cluster, multiple DBs/collections)
```

Every backend service is independently deployable, builds its own Docker image,
and is exposed to the outside world only through the gateway.

---

## 2. Services & Functionalities

### 2.1 API Gateway (`Gateway/api-gateway`)

Role: Single public entry point. Handles routing + CORS.

- Tech: Spring Cloud Gateway, port `8087`.
- Reads target URLs from env vars (with Azure Container Apps FQDNs as
  fallbacks).
- Path-based routing (see `Gateway/api-gateway/src/main/resources/application.yml`):

  | Path prefix    | Routed to         |
  |----------------|-------------------|
  | `/users/**`    | user-service      |
  | `/booking/**`  | booking-service   |
  | `/payments/**` | payment-service   |
  | `/movies/**`   | movie-service     |
  | `/schedules/**`| scheduling-service|

- CORS: allows `localhost:*`, `*.vercel.app`, `*.netlify.app`, and the Azure
  Container Apps `mangohill-*.azurecontainerapps.io` domain.
- Timeouts are tuned higher than defaults (`response-timeout: 120s`) so Stripe
  Checkout calls don't surface as `504` with missing CORS headers.

### 2.2 User Service (`User-Backend/user-service`)

Role: Identity & profile. Base path `/users`, port `8081`.

Endpoints (see `UserController.java`):

| Method | Path                     | Purpose                              |
|--------|--------------------------|--------------------------------------|
| POST   | `/users/register`        | Create account                       |
| POST   | `/users/login`           | Returns `{ token, userId, role }`    |
| GET    | `/users/{userId}`        | Profile (id, name, email, phone)     |
| GET    | `/users/{userId}/bookings` | Aggregates bookings for this user  |
| PUT    | `/users/{userId}`        | Update profile                       |

- Issues JWTs signed with `JWT_SECRET` (HMAC). The same secret is shared with
  booking-service so that tokens verify across the two services.
- Role field supports `USER` / `ADMIN` (admin UI uses HTTP Basic, not JWT).

### 2.3 Movie Service (`Movie-Backend/movie-service`)

Role: Movie catalog. Base path `/movies`, port `8083`.

Endpoints (see `MovieController.java`):

| Method | Path                      | Purpose                           |
|--------|---------------------------|-----------------------------------|
| GET    | `/movies`                 | List all                          |
| GET    | `/movies/health`          | Health probe                      |
| GET    | `/movies/{id}`            | Movie by id                       |
| GET    | `/movies/status/{status}` | Filter by status (e.g. NOW_SHOWING)|
| GET    | `/movies/genre/{genre}`   | Filter by genre                   |
| GET    | `/movies/search?title=`   | Title search                      |
| POST   | `/movies`                 | Create (admin)                    |
| PUT    | `/movies/{id}`            | Update (admin)                    |
| DELETE | `/movies/{id}`            | Delete (admin)                    |

Includes `@Valid` request validation and a global exception handler that
returns field-level JSON errors on bad payloads.

### 2.4 Scheduling Service (`Scheduling-Backend/scheduling-service`)

Role: Show times and seat inventory. Port `8084`.

Schedule endpoints (`/schedules`):

| Method | Path                                | Purpose                              |
|--------|-------------------------------------|--------------------------------------|
| GET    | `/schedules`                        | All schedules                        |
| GET    | `/schedules/{id}`                   | Schedule by id                       |
| GET    | `/schedules/movie/{movieId}`        | Schedules for a movie                |
| GET    | `/schedules/date/{date}`            | All schedules on a date (ISO)        |
| GET    | `/schedules/search?movieId=&date=`  | Movie + date                         |
| POST   | `/schedules`                        | Create (admin)                       |
| PUT    | `/schedules/{id}`                   | Update (admin) — detects conflicts   |
| DELETE | `/schedules/{id}`                   | Delete (admin)                       |

- Returns HTTP `409 CONFLICT` via `ScheduleConflictException` when overlapping
  schedules are detected.

Seat endpoints (`/seats`):

| Method | Path                                     | Purpose                          |
|--------|------------------------------------------|----------------------------------|
| GET    | `/seats/schedule/{scheduleId}`           | All seats for a show             |
| GET    | `/seats/schedule/{scheduleId}/available` | Only unbooked seats              |
| POST   | `/seats/book`                            | Book a single seat               |
| POST   | `/seats/unavailable`                     | Mark multiple seats unavailable  |

### 2.5 Booking Service (`booking-service-late`)

Role: Create & manage bookings, issue tickets. Port `8082`.

Endpoints (`BookingController.java`):

| Method | Path                                               | Auth        | Purpose                          |
|--------|----------------------------------------------------|-------------|----------------------------------|
| POST   | `/booking`                                         | Bearer JWT  | Create booking                   |
| GET    | `/booking/public/show/{showId}/confirmed-seats`    | Public      | Seat availability                |
| GET    | `/booking/me`                                      | Bearer JWT  | Current user's bookings          |
| GET    | `/booking`                                         | HTTP Basic  | Admin — all bookings             |
| PUT    | `/booking/{bookingId}/status?status=CONFIRMED`     | HTTP Basic  | Admin manual status update       |
| PUT    | `/bookings/{bookingId}/status` (JSON body)         | Internal    | Called by payment-service        |
| POST   | `/booking/{bookingId}/ticket`                      | Internal    | Issue ticket after payment       |

- Two auth mechanisms live side by side:
  1. **OAuth2 resource server** validating JWTs signed with the shared secret
     (user flow).
  2. **HTTP Basic** (`BOOKING_ADMIN_USERNAME` / `BOOKING_ADMIN_PASSWORD`) for
     admin UI and for service-to-service calls from payment-service.
- `/booking/public/**` is explicitly excluded from the JWT filter so the seat
  availability endpoint can be hit anonymously.

### 2.6 Payment Service (`payment-service`)

Role: Stripe Checkout integration, refunds, ticket issuance trigger. Port
`8085`.

Endpoints (`PaymentController.java`):

| Method | Path                            | Purpose                                     |
|--------|---------------------------------|---------------------------------------------|
| POST   | `/payments`                     | Direct payment process (mock or real)       |
| POST   | `/payments/checkout-session`    | Create a Stripe Checkout session            |
| POST   | `/payments/webhook/stripe`      | Stripe webhook — `checkout.session.completed` |
| GET    | `/payments/{paymentId}`         | Get payment by id                           |
| GET    | `/payments/booking/{bookingId}` | Payments for a booking                      |
| POST   | `/payments/refund`              | Refund                                      |

Behaviour on `checkout.session.completed`:

1. Verifies Stripe signature with `STRIPE_WEBHOOK_SECRET`.
2. Upserts a `Payment` document (idempotent via `transactionReference`).
3. Calls booking-service `PUT /bookings/{id}/status` to mark it `CONFIRMED`.
4. Calls booking-service `POST /booking/{id}/ticket` to issue a ticket.
5. Sends the ticket to the customer via `EmailService` (SMTP, Gmail by
   default).

Configurable via `payment-service/src/main/resources/application.yml`:

- `payment.gateway.provider` — `stripe-checkout` (default) or mock.
- `STRIPE_API_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_CHECKOUT_CURRENCY`.
- `booking.service.base-url` + `user.service.base-url` — downstream calls.
- `USER_SERVICE_ENABLED` — when `true`, validates users against user-service
  before checkout.

### 2.7 Frontend (`Frontend/`)

React + Vite JS app (Tailwind CSS w/ preflight disabled, `motion` for border
glow, `clsx` + `tailwind-merge`).

Routing (`App.jsx`):

- Public: landing page, login, register, movies list/details, schedules,
  payment success.
- User (JWT): profile, create booking, payment page, my bookings.
- Admin (HTTP Basic via `VITE_ADMIN_USERNAME` / `VITE_ADMIN_PASSWORD`):
  dashboard, manage movies, manage schedules, booking list.

Environment (`Frontend/.env`):

- `VITE_API_BASE_URL` — API gateway URL.
- `VITE_PAYMENT_BASIC` — Base64 for `payment-user:payment-pass`, required for
  browser-initiated `POST /payments` calls.
- `VITE_ADMIN_USERNAME` / `VITE_ADMIN_PASSWORD` — must match booking-service
  admin creds.
- `VITE_TMDB_API_KEY` — enriches the UI with TMDB posters/metadata.

---

## 3. Integration Points Between Services

1. **Gateway → every backend** (HTTP, path-based). The gateway is stateless
   and only forwards.

2. **Frontend → Gateway** (HTTPS). The browser never talks to a backend
   directly in production.

3. **user-service → booking-service**
   `GET /users/{id}/bookings` internally calls booking-service to aggregate a
   user's bookings into the response (`BOOKING_SERVICE_URL`).

4. **payment-service → booking-service** (most important integration):
   - On webhook: `PUT /bookings/{id}/status` and
     `POST /booking/{id}/ticket`.
   - Uses HTTP Basic (same admin creds as above) via the `BookingClient`.

5. **payment-service → user-service** (optional, controlled by
   `USER_SERVICE_ENABLED`): fetches user email/name for logged-in checkout so
   Stripe session + ticket email are pre-filled.

6. **payment-service → Stripe** (outbound, HTTPS):
   - Creates Checkout sessions.
   - Receives webhooks at `/payments/webhook/stripe` (signature-verified).

7. **payment-service → SMTP (Gmail)**: ticket email delivery using
   `spring.mail.*`.

8. **All services → MongoDB Atlas**: shared cluster
   (`cluster1.kt7i4.mongodb.net`), one DB (`microservice`) with each service
   owning its own collections.

9. **Shared JWT secret**: user-service issues tokens; booking-service validates
   them as an OAuth2 resource server. The `JWT_SECRET` env var must be
   identical everywhere (enforced in `docker-compose.yml`).

---

## 4. Hosting — Azure Container Apps

### 4.1 Platform

- **Azure Container Registry (ACR):** `bookingacrsliitproject.azurecr.io`
  stores every service image (tagged with 7-char git SHA + `:latest`).
- **Azure Container Apps** in resource group **`booking-rg`**, region
  `southeastasia`. Each service is its own Container App; the FQDNs look like
  `https://<app-name>.mangohill-a3908265.southeastasia.azurecontainerapps.io`.

Container App names seen in config:
- `user-service-app`
- `booking-service-late-2` / `booking-service-app`
- `movie-service-app`
- `scheduling-service-app`
- `payment-new-new-6-app` (currently deployed payment service)
- `gateway-new-new-3` (current gateway)

### 4.2 CI/CD via GitHub Actions

Two kinds of workflows live in `.github/workflows/`:

**A. CI workflows** (one per backend service, plus SonarCloud):

- Trigger on push / PR that touches that service's folder.
- Run `mvn verify` with JaCoCo, upload the coverage report, and enforce a
  minimum **80% line coverage** (example in `payment-service-ci.yml`).
- Also run Checkstyle and a Docker build sanity check.
- `sonarcloud.yml` runs SonarCloud scanning on `main` and PRs using the
  `sonar-project.properties` at the repo root.

**B. Deploy workflows** (e.g. `payment-service-deploy.yml`,
`booking-service-deploy.yml`):

1. Trigger on push to `main` for the service's folder.
2. Log in to ACR with `ACR_USERNAME` / `ACR_PASSWORD` secrets.
3. `docker build` and push two tags: the git SHA and `:latest`.
4. Azure login (`AZURE_CREDENTIALS`), then
   `az containerapp update --image ...` (or a direct REST `PATCH` for
   booking-service) to roll the Container App to the new image.

So pushing to `main` with a change under `payment-service/` produces a new
image in ACR and a zero-click rolling update in Azure.

### 4.3 Secrets handled by Actions / Azure

- `ACR_USERNAME`, `ACR_PASSWORD` — registry push.
- `AZURE_CREDENTIALS` (service principal) — `az containerapp update`.
- `AZURE_USER`, `AZURE_PASS` — legacy ROPC flow in the booking deploy
  workflow.
- `SONAR_TOKEN` — SonarCloud.
- Stripe keys, SMTP creds, Mongo URI are set as **Container App environment
  variables** directly in Azure, not in the repo.

---

## 5. Docker — Basics of How It's Used

### 5.1 Per-service Dockerfiles

Every backend service has a **two-stage Maven → JRE** Dockerfile. Example
(`payment-service/Dockerfile`):

```dockerfile
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn -q -e -B package -DskipTests

FROM eclipse-temurin:17-jre-jammy
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8085
ENV JAVA_OPTS=""
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar app.jar"]
```

Why multi-stage:
- Stage 1 uses a Maven + JDK image only to build the fat JAR.
- Stage 2 ships only a slim `eclipse-temurin:17-jre-jammy` runtime with the
  JAR. The final image doesn't contain Maven or the `.m2` cache, keeping it
  small.
- `JAVA_OPTS` is exposed so Azure / Compose can pass tuning flags (e.g.
  memory limits) without rebuilding.

Same pattern for booking-service (port `8082`), user-service (`8081`),
movie-service (`8083`), scheduling-service (`8084`), and the gateway
(`8087`).

### 5.2 `docker-compose.yml` (local dev)

A single `docker-compose.yml` at the repo root brings up the whole stack:

- Defines all 6 services with `build: ./<service-folder>`.
- Maps host ports 1:1 (`8081`–`8085`, `8087`).
- Uses Compose's default bridge network, so services reach each other by name
  (`http://booking-service:8082`, etc). Those names are what the gateway and
  payment-service are pre-configured with.
- Injects env vars for:
  - MongoDB URI (shared Atlas cluster).
  - Shared `JWT_SECRET` across user, booking, movie, scheduling, payment.
  - Booking admin creds shared with payment-service.
  - Stripe + user-service toggles sourced from the **root `.env`** file
    (Docker Compose auto-loads it; kept out of git via `.gitignore`).
- `depends_on` makes the gateway wait for the other services to start (but
  doesn't wait for them to be healthy, so the first few requests may need a
  moment).

Typical dev loop:

```bash
cp .env.example .env              # fill STRIPE_API_KEY etc
docker compose build
docker compose up -d
docker compose up -d --force-recreate payment-service   # after .env edits
```

### 5.3 Docker in CI/CD

- CI workflows run `docker build -t <service>:ci <service>` as a smoke test
  so a broken Dockerfile fails the PR.
- Deploy workflows build with the ACR hostname baked into the tag, push both
  the SHA tag and `:latest`, and then point the Azure Container App at the
  SHA tag so rollouts are traceable.

### 5.4 Frontend in Docker

The frontend has its own build args (`VITE_API_BASE_URL`,
`VITE_PAYMENT_BASIC`) that must be passed at **image build time**, because
Vite bakes env values into the bundle. See the comment block at the bottom
of `Frontend/.env` for the exact `docker compose build frontend --build-arg
…` invocation.

---

## 6. Quick Reference — Ports & URLs

| Component           | Local port | Azure Container App (prefix)        |
|---------------------|-----------:|-------------------------------------|
| API gateway         | 8087       | `gateway-new-new-3`                 |
| user-service        | 8081       | `user-service-app`                  |
| booking-service     | 8082       | `booking-service-late-2`            |
| movie-service       | 8083       | `movie-service-app`                 |
| scheduling-service  | 8084       | `scheduling-service-app`            |
| payment-service     | 8085       | `payment-new-new-6-app`             |
| Frontend (Vite dev) | 5173       | (deployed separately, e.g. Vercel)  |

Domain suffix for all Azure Container Apps:
`mangohill-a3908265.southeastasia.azurecontainerapps.io`.

---

## 7. Environment Variables — Summary

**Shared across services**

- `JWT_SECRET` — HMAC key for JWTs (user + booking + others).
- `SPRING_DATA_MONGODB_URI` / `MONGO_URI` / `MONGODB_URI` — MongoDB Atlas
  connection string.

**Booking / admin flow**

- `BOOKING_ADMIN_USERNAME`, `BOOKING_ADMIN_PASSWORD` — HTTP Basic creds for
  admin UI + payment→booking calls.

**Gateway routing**

- `USER_SERVICE_URL`, `BOOKING_SERVICE_URL`, `MOVIE_SERVICE_URL`,
  `SCHEDULING_SERVICE_URL`, `PAYMENT_SERVICE_URL`.

**Payment / Stripe**

- `PAYMENT_GATEWAY_PROVIDER` (default `stripe-checkout`).
- `STRIPE_API_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_CHECKOUT_CURRENCY`.
- `USER_SERVICE_ENABLED` — toggle user lookup during checkout.
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `MAIL_FROM` —
  ticket emails.

**Frontend**

- `VITE_API_BASE_URL`, `VITE_PAYMENT_BASIC`, `VITE_ADMIN_USERNAME`,
  `VITE_ADMIN_PASSWORD`, `VITE_TMDB_API_KEY`, `VITE_TMDB_ACCESS_TOKEN`.
