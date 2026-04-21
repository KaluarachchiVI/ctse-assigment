/** API gateway base (same origin as CORS on gateway). */
export const getGatewayBaseUrl = () =>
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8087';
