import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { bookingApi } from '../services/bookingApi';
import './UserBookings.css';

export default function UserBookings() {
  const { userId } = useParams();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const data = await bookingApi.getBookingsByUser(userId);
      setBookings(data);
    } catch (err) {
      setError('Failed to fetch bookings for this user.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchBookings();
    }
  }, [userId]);

  const getStatusBadge = (status) => {
    switch(status?.toUpperCase()) {
      case 'CONFIRMED': return <span className="badge badge-success">Confirmed</span>;
      case 'CANCELLED': return <span className="badge badge-danger">Cancelled</span>;
      case 'PENDING': return <span className="badge badge-warning">Pending</span>;
      default: return <span className="badge">{status}</span>;
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header user-bookings-header">
        <div>
          <h1 className="page-title">User Bookings: {userId}</h1>
          <p className="page-description">Overview of all reservations for this specific user.</p>
        </div>
        <button onClick={fetchBookings} className="btn btn-outline">
          Refresh List
        </button>
      </div>

      {error && (
        <div className="user-bookings-error">
          {error}
        </div>
      )}

      <div className="table-wrapper">
        {loading ? (
          <div className="user-bookings-loading">Loading bookings...</div>
        ) : bookings.length === 0 ? (
          <div className="user-bookings-empty">No bookings found for this user.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Show ID</th>
                <th>Seats</th>
                <th>Payment ID</th>
                <th>Created At</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map(booking => (
                <tr key={booking.id}>
                  <td className="user-booking-id">#{booking.id?.substring(0, 8)}</td>
                  <td>{booking.showId}</td>
                  <td>{booking.seats?.join(', ')}</td>
                  <td>{booking.paymentId}</td>
                  <td className="user-text-sm">
                    {booking.createdAt ? new Date(booking.createdAt).toLocaleString() : 'N/A'}
                  </td>
                  <td>{getStatusBadge(booking.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
