/**
 * Admin UI login at /admin/login only (no public nav link).
 * Must match booking-service `BOOKING_ADMIN_*` (docker-compose defaults: admin / admin-pass).
 */
export const ADMIN_USERNAME =
  import.meta.env.VITE_ADMIN_USERNAME || 'admin';
export const ADMIN_PASSWORD =
  import.meta.env.VITE_ADMIN_PASSWORD || 'admin-pass';

export function basicAuthHeader() {
  return `Basic ${btoa(`${ADMIN_USERNAME}:${ADMIN_PASSWORD}`)}`;
}

export function isAdminSession() {
  return localStorage.getItem('role') === 'ADMIN';
}

export function logoutAdmin() {
  localStorage.removeItem('token');
  localStorage.removeItem('userId');
  localStorage.removeItem('role');
  localStorage.removeItem('email');
  localStorage.removeItem('name');
}
