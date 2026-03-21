import axios from 'axios';
import { getGatewayBaseUrl } from '../../lib/gateway';

const gateway = () => getGatewayBaseUrl();

/** @deprecated Legacy yuvidu booking paths — prefer createBookingV2 / getMyBookings */
const bookingBase = () => `${gateway()}/booking`;

export const bookingApi = {
  /** booking-service-late: POST /booking */
  createBookingV2: async (payload) => {
    const response = await axios.post(`${gateway()}/booking`, payload);
    return response.data;
  },

  /** Public: no JWT — use fetch so no Authorization header is ever sent (axios can inherit globals). */
  getConfirmedSeats: async (showId) => {
    const url = `${gateway()}/booking/public/show/${encodeURIComponent(showId)}/confirmed-seats`;
    const res = await fetch(url);
    if (!res.ok) {
      const err = new Error(`confirmed-seats failed: ${res.status}`);
      err.status = res.status;
      throw err;
    }
    return res.json();
  },

  getMyBookings: async (token) => {
    const response = await axios.get(`${gateway()}/booking/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  /** Admin: Basic auth */
  getAllBookingsAdmin: async (basicAuthHeader) => {
    const response = await axios.get(`${gateway()}/booking`, {
      headers: { Authorization: basicAuthHeader },
    });
    return response.data;
  },

  updateBookingStatusAdmin: async (id, status, basicAuthHeader) => {
    const response = await axios.put(
      `${gateway()}/booking/${encodeURIComponent(id)}/status`,
      null,
      { params: { status }, headers: { Authorization: basicAuthHeader } }
    );
    return response.data;
  },

  createBooking: async (bookingData) => {
    const response = await axios.post(bookingBase(), bookingData);
    return response.data;
  },

  getBookingById: async (id) => {
    const response = await axios.get(`${bookingBase()}/${id}`);
    return response.data;
  },

  getBookingsByUser: async (userId) => {
    const response = await axios.get(`${bookingBase()}/user/${userId}`);
    return response.data;
  },

  getAllBookings: async () => {
    const response = await axios.get(bookingBase());
    return response.data;
  },

  updateBookingStatus: async (id, status) => {
    const response = await axios.put(`${bookingBase()}/${id}/status`, null, {
      params: { status },
    });
    return response.data;
  },

  cancelBooking: async (id) => {
    const response = await axios.put(`${bookingBase()}/${id}/cancel`);
    return response.data;
  },
};
