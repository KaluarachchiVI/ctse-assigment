/**
 * Browser-facing API base URL (Spring Cloud Gateway on :8087).
 * Use this for all API calls (including booking seat map) so CORS is handled only by the gateway.
 */
export function getGatewayBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_API_GATEWAY_URL?.replace(/\/$/, "") ||
    "http://localhost:8087"
  );
}

/** Authorization header for user JWT (same token stored at login/register). */
export function bearerAuthHeader(token: string): string {
  return `Bearer ${token}`;
}
