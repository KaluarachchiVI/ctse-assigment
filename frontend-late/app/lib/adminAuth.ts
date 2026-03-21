/**
 * Basic auth for booking-service, movie-service, and scheduling-service admin APIs.
 * Must match `BOOKING_ADMIN_USERNAME` / `BOOKING_ADMIN_PASSWORD` in the backend (docker-compose / .env).
 *
 * Precedence (first wins):
 * - `NEXT_PUBLIC_BOOKING_ADMIN_USERNAME` / `NEXT_PUBLIC_BOOKING_ADMIN_PASSWORD` — use for My Tickets / booking GET /booking
 * - `NEXT_PUBLIC_ADMIN_USERNAME` / `NEXT_PUBLIC_ADMIN_PASSWORD` — shared admin UI + APIs
 *
 * Keep `BOOKING_ADMIN_*` and the chosen `NEXT_PUBLIC_*` pair identical, then rebuild the frontend after changes.
 */
export const ADMIN_USERNAME =
  process.env.NEXT_PUBLIC_BOOKING_ADMIN_USERNAME ||
  process.env.NEXT_PUBLIC_ADMIN_USERNAME ||
  "admin";
export const ADMIN_PASSWORD =
  process.env.NEXT_PUBLIC_BOOKING_ADMIN_PASSWORD ||
  process.env.NEXT_PUBLIC_ADMIN_PASSWORD ||
  "admin-pass";

export function basicAuthHeader(): string {
  return `Basic ${btoa(`${ADMIN_USERNAME}:${ADMIN_PASSWORD}`)}`;
}
