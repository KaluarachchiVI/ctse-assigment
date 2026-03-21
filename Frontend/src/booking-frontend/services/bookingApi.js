import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8082/booking';

export const bookingApi = {
  createBooking: async (bookingData) => {
    const response = await axios.post(API_URL, bookingData);
    return response.data;
  },

  getBookingById: async (id) => {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data;
  },

  getBookingsByUser: async (userId) => {
    const response = await axios.get(`${API_URL}/user/${userId}`);
    return response.data;
  },

  getAllBookings: async () => {
    const response = await axios.get(API_URL);
    return response.data;
  },

  updateBookingStatus: async (id, status) => {
    const response = await axios.put(`${API_URL}/${id}/status`, null, {
      params: { status }
    });
    return response.data;
  },

  cancelBooking: async (id) => {
    console.log(`Attempting to cancel booking with ID: ${id}`);
    const url = `${API_URL}/${id}/cancel`;
    console.log(`URL: ${url}`);
    try {
      const response = await axios.put(url);
      console.log('Cancellation response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Cancellation error:', error.response || error);
      throw error;
    }
  }
};
