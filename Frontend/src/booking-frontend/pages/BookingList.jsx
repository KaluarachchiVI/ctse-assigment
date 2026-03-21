import { useState, useEffect } from 'react';
import { bookingApi } from '../services/bookingApi';
import './BookingList.css';

export default function BookingList() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const data = await bookingApi.getAllBookings();
      setBookings(data);
    } catch (err) {
      setError('Failed to fetch bookings.');
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
      await bookingApi.updateBookingStatus(id, newStatus);
      fetchBookings(); // Refresh the list
    } catch (err) {
      alert('Failed to update status.');
    }
  };

  const handleCancel = async (id) => {

    try {
      await bookingApi.cancelBooking(id);
      fetchBookings(); // Refresh
    } catch (err) {
      alert('Failed to cancel booking.');
    }


  };

  const getStatusBadge = (status) => {
    switch (status?.toUpperCase()) {
      case 'CONFIRMED': return <span className="badge badge-success">Confirmed</span>;
      case 'CANCELLED': return <span className="badge badge-danger">Cancelled</span>;
      case 'PENDING': return <span className="badge badge-warning">Pending</span>;
      default: return <span className="badge">{status}</span>;
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header booking-header">
        <div>
          <h1 className="page-title">Manage Bookings</h1>
          <p className="page-description">Overview of all reservations in the system.</p>
        </div>
        <button onClick={fetchBookings} className="btn btn-outline">
          Refresh List
        </button>
      </div>

      {error && (
        <div className="status-message">
          {error}
        </div>
      )}

      <div className="table-wrapper">
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
              {bookings.map(booking => (
                <tr key={booking.id}>
                  <td className="booking-id">#{booking.id?.substring(0, 8)}</td>
                  <td>{booking.userId}</td>
                  <td>{booking.showId}</td>
                  <td>{booking.seats?.join(', ')}</td>
                  <td className="text-xs text-muted">
                    {booking.createdAt ? new Date(booking.createdAt).toLocaleString() : 'N/A'}
                  </td>
                  <td>{getStatusBadge(booking.status)}</td>
                  <td>
                    <div className="action-buttons">
                      {booking.status !== 'CONFIRMED' && booking.status !== 'CANCELLED' && (
                        <button
                          className="btn btn-outline btn-action-sm"
                          onClick={() => handleUpdateStatus(booking.id, 'CONFIRMED')}
                        >
                          Confirm
                        </button>
                      )}
                      {booking.status !== 'CANCELLED' && (
                        <button
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
