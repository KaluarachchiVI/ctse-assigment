import axios from 'axios';
import api from '@/lib/api';
import { getGatewayBaseUrl } from '../../lib/gateway';

function gateway() { return getGatewayBaseUrl(); }

/** @deprecated Legacy yuvidu booking paths — prefer createBookingV2 / getMyBookings */
const bookingBase = () => `${gateway()}/booking`;

export const bookingApi = {
  /** booking-service-late: POST /booking */
  createBookingV2: async (payload) => {
    const response = await api.post('/booking', payload);
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
    // Shared api already has the token from localStorage
    const response = await api.get('/booking/me');
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
    const response = await api.post('/booking', bookingData);
    return response.data;
  },

  getBookingById: async (id) => {
    const response = await api.get(`/booking/${id}`);
    return response.data;
  },

  getBookingsByUser: async (userId) => {
    const response = await api.get(`/booking/user/${userId}`);
    return response.data;
  },

  getAllBookings: async () => {
    const response = await api.get('/booking');
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
