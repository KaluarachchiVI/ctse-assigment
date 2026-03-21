import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
// We can reuse the movie form styling as it's very similar
import '../../movie-frontend/pages/CreateMovie.css'; 

export default function CreateSchedule() {
  const navigate = useNavigate();
  const location = useLocation();
  const [movies, setMovies] = useState([]);
  const [movieSearch, setMovieSearch] = useState('');
  const [showMovieDropdown, setShowMovieDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Extract movieId from URL query params if user came from MovieList
  const queryParams = new URLSearchParams(location.search);
  const initialMovieId = queryParams.get('movieId') || '';

  const [formData, setFormData] = useState({
    movieId: initialMovieId,
    hallId: 'Hall-A', // Default value
    date: '',
    time: '',
    price: '',
    availableSeats: '',
    status: 'ACTIVE'
  });

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const response = await axios.get('http://localhost:8087/movies');
        setMovies(response.data);
      } catch (err) {
        console.error('Failed to fetch movies', err);
      }
    };
    fetchMovies();
  }, []);

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

      await axios.post('http://localhost:8087/schedules', payload);
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
            <div className="form-group" style={{ position: 'relative' }}>
              <label className="form-label">Select Movie *</label>
              <div className="searchable-select-container">
                <input
                  type="text"
                  className="form-input"
                  placeholder="Search and select movie..."
                  value={movieSearch}
                  onChange={(e) => {
                    setMovieSearch(e.target.value);
                    setShowMovieDropdown(true);
                  }}
                  onFocus={() => setShowMovieDropdown(true)}
                />
                
                {showMovieDropdown && movieSearch && (
                  <div className="select-dropdown-list">
                    {movies
                      .filter(m => m.title.toLowerCase().includes(movieSearch.toLowerCase()))
                      .map(movie => (
                        <div 
                          key={movie.id} 
                          className="dropdown-item"
                          onClick={() => {
                            setFormData(prev => ({ ...prev, movieId: movie.id }));
                            setMovieSearch(movie.title);
                            setShowMovieDropdown(false);
                          }}
                        >
                          <div className="dropdown-item-title">{movie.title}</div>
                          <div className="dropdown-item-info">{movie.genre} | {movie.rating}</div>
                        </div>
                      ))}
                  </div>
                )}
                
                {formData.movieId && !showMovieDropdown && (
                  <div className="selected-preview">
                    Selected ID: <span className="text-secondary">{formData.movieId}</span>
                  </div>
                )}
              </div>
              <input type="hidden" name="movieId" value={formData.movieId} required />
            </div>

            <div className="form-group">
              <label className="form-label">Hall *</label>
              <select
                name="hallId"
                className="form-input"
                value={formData.hallId}
                onChange={handleChange}
                required
              >
                <option value="Hall-A">Hall A</option>
                <option value="Hall-B">Hall B</option>
                <option value="Hall-C">Hall C</option>
                <option value="Hall-D">Hall D</option>
              </select>
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
