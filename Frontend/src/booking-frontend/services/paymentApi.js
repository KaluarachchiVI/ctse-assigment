import axios from 'axios';
import { getGatewayBaseUrl } from '../../lib/gateway';

/**
 * POST /payments — public (no HTTP Basic). Used for Stripe Checkout redirect
 * and for mock gateway when PAYMENT_GATEWAY_PROVIDER=mock.
 */
export async function createPayment(payload) {
  const response = await axios.post(`${getGatewayBaseUrl()}/payments`, payload, {
    headers: { 'Content-Type': 'application/json' },
  });
  return response.data;
}

/** @deprecated alias — prefer createPayment */
export async function processPayment(payload) {
  return createPayment(payload);
}
