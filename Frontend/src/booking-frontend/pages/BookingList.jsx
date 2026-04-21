import { useState, useEffect } from 'react';
import { bookingApi } from '../services/bookingApi';
import { basicAuthHeader } from '../../lib/adminAuth';
import './BookingList.css';

export default function BookingList() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const authHeader = () => basicAuthHeader();

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const data = await bookingApi.getAllBookingsAdmin(authHeader());
      setBookings(data);
    } catch (err) {
      setError('Failed to fetch bookings. Check admin credentials and gateway.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await bookingApi.updateBookingStatusAdmin(id, newStatus, authHeader());
      fetchBookings();
    } catch {
      alert('Failed to update status.');
    }
  };

  const handleCancel = async (id) => {
    try {
      await bookingApi.updateBookingStatusAdmin(id, 'CANCELLED', authHeader());
      fetchBookings();
    } catch {
      alert('Failed to cancel booking.');
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toUpperCase()) {
      case 'CONFIRMED':
        return <span className="booking-status booking-status--confirmed">Confirmed</span>;
      case 'CANCELLED':
        return <span className="booking-status booking-status--cancelled">Cancelled</span>;
      case 'PENDING':
        return <span className="booking-status booking-status--pending">Pending</span>;
      default:
        return <span className="booking-status booking-status--default">{status}</span>;
    }
  };

  const formatCreated = (booking) => {
    const raw = booking.createdAt;
    if (!raw) return 'N/A';
    const d = Array.isArray(raw) ? raw[0] : raw;
    try {
      return new Date(d).toLocaleString();
    } catch {
      return 'N/A';
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header booking-header">
        <div>
          <h1 className="page-title">Manage Bookings</h1>
          <p className="page-description">Overview of all reservations (booking-service-late admin API).</p>
        </div>
        <button type="button" onClick={fetchBookings} className="btn btn-outline booking-refresh-btn">
          Refresh List
        </button>
      </div>

      {error && <div className="status-message">{error}</div>}

      <div className="table-wrapper booking-table-shell">
        {loading ? (
          <div className="loading-state">Loading bookings...</div>
        ) : bookings.length === 0 ? (
          <div className="empty-state">No bookings found.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>User ID</th>
                <th>Show ID</th>
                <th>Seats</th>
                <th>Created At</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking.id}>
                  <td className="booking-id">#{booking.id?.substring(0, 8)}</td>
                  <td>{booking.userId || '—'}</td>
                  <td>{booking.showId}</td>
                  <td>{booking.seats?.join(', ')}</td>
                  <td className="text-xs text-muted">{formatCreated(booking)}</td>
                  <td>{getStatusBadge(booking.status)}</td>
                  <td>
                    <div className="action-buttons">
                      {booking.status !== 'CONFIRMED' && booking.status !== 'CANCELLED' && (
                        <button
                          type="button"
                          className="btn btn-outline btn-action-sm booking-btn-secondary"
                          onClick={() => handleUpdateStatus(booking.id, 'CONFIRMED')}
                        >
                          Confirm
                        </button>
                      )}
                      {booking.status !== 'CANCELLED' && (
                        <button
                          type="button"
                          className="btn btn-danger btn-action-sm"
                          onClick={() => handleCancel(booking.id)}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
