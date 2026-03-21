import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { bookingApi } from '../services/bookingApi';
import './CreateBooking.css';

export default function CreateBooking() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    userId: '',
    showId: '',
    seats: '',
    paymentId: '',
    status: 'PENDING'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Transform seats to an array
      const bookingPayload = {
        ...formData,
        seats: formData.seats.split(',').map(s => s.trim())
      };

      await bookingApi.createBooking(bookingPayload);
      navigate('/bookings/manage');
    } catch (err) {
      setError('Failed to create booking. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in create-booking-container">
      <div className="page-header">
        <h1 className="page-title">Create New Booking</h1>
        <p className="page-description">Fill in the details below to complete your reservation.</p>
      </div>

      <div className="card">
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid md:grid-cols-2">
          <div className="form-group">
            <label className="form-label">User ID</label>
            <input 
              required type="text" name="userId" value={formData.userId} onChange={handleChange}
              className="form-input" placeholder="e.g. U123" 
            />
          </div>

          <div className="form-group">
            <label className="form-label">Show ID</label>
            <input 
              required type="text" name="showId" value={formData.showId} onChange={handleChange}
              className="form-input" placeholder="e.g. S456" 
            />
          </div>

          <div className="form-group form-grid-full">
            <label className="form-label">Selected Seats (comma separated)</label>
            <input 
              required type="text" name="seats" value={formData.seats} onChange={handleChange}
              className="form-input" placeholder="A1, A2, B3" 
            />
          </div>

          <div className="form-group form-grid-full">
            <label className="form-label">Payment ID</label>
            <input 
              required type="text" name="paymentId" value={formData.paymentId} onChange={handleChange}
              className="form-input" placeholder="e.g. PAY789" 
            />
          </div>

          <div className="form-group form-actions">
            <button type="submit" className="btn btn-primary btn-submit" disabled={loading}>
              {loading ? 'Processing...' : 'Confirm Booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
