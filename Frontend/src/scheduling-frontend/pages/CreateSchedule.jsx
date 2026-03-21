import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
// We can reuse the movie form styling as it's very similar
import '../../movie-frontend/pages/CreateMovie.css'; 

export default function CreateSchedule() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Extract movieId from URL query params if user came from MovieList
  const queryParams = new URLSearchParams(location.search);
  const initialMovieId = queryParams.get('movieId') || '';

  const [formData, setFormData] = useState({
    movieId: initialMovieId,
    hallId: '',
    date: '',
    time: '',
    price: '',
    availableSeats: '',
    status: 'ACTIVE'
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
      const payload = {
        ...formData,
        price: parseFloat(formData.price),
        availableSeats: parseInt(formData.availableSeats, 10)
      };

      await axios.post('http://localhost:8080/api/schedules', payload);
      navigate('/schedules');
    } catch (err) {
      console.error('Error creating schedule:', err);
      setError(err.response?.data?.message || 'Failed to create schedule. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container animate-fade-in movie-form-container">
      <div className="card form-card">
        <h1 className="form-card-title">Create Movie Schedule</h1>
        
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="grid md:grid-cols-2">
            <div className="form-group">
              <label className="form-label">Movie ID *</label>
              <input
                type="text"
                name="movieId"
                className="form-input"
                value={formData.movieId}
                onChange={handleChange}
                required
                placeholder="Paste Movie ID here"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Hall ID *</label>
              <input
                type="text"
                name="hallId"
                className="form-input"
                value={formData.hallId}
                onChange={handleChange}
                required
                placeholder="e.g., HALL-A"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Date *</label>
              <input
                type="date"
                name="date"
                className="form-input"
                value={formData.date}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Time *</label>
              <input
                type="time"
                name="time"
                className="form-input"
                value={formData.time}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Price ($) *</label>
              <input
                type="number"
                name="price"
                className="form-input"
                value={formData.price}
                onChange={handleChange}
                step="0.01"
                min="0"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Available Seats *</label>
              <input
                type="number"
                name="availableSeats"
                className="form-input"
                value={formData.availableSeats}
                onChange={handleChange}
                min="1"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Status</label>
              <select 
                name="status" 
                className="form-input" 
                value={formData.status} 
                onChange={handleChange}
              >
                <option value="ACTIVE">Active</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => navigate('/schedules')}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Schedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
