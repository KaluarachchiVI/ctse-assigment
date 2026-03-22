import { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import api from '@/lib/api';
// We can reuse the movie form styling as it's very similar
import '../../movie-frontend/pages/CreateMovie.css'; 

export default function CreateSchedule() {
  const { id } = useParams();
  const isEditMode = !!id;
  const navigate = useNavigate();
  const location = useLocation();
  const [movies, setMovies] = useState([]);
  const [movieSearch, setMovieSearch] = useState('');
  const [showMovieDropdown, setShowMovieDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]); // array of { field?, message }

  // Extract movieId from URL query params if user came from MovieList
  const queryParams = new URLSearchParams(location.search);
  const initialMovieId = queryParams.get('movieId') || '';

  const [formData, setFormData] = useState({
    movieId: initialMovieId,
    hallId: 'Hall-A',
    date: '',
    time: '',
    endTime: '',
    price: '',
    availableSeats: '',
    status: 'ACTIVE'
  });

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const response = await api.get('/movies');
        setMovies(response.data);
        
        // If in edit mode, fetch the schedule after movies are loaded
        if (isEditMode) {
          const scheduleRes = await api.get(`/schedules/${id}`);
          const schedule = scheduleRes.data;
          
          setFormData({
            movieId: schedule.movieId,
            hallId: schedule.hallId,
            date: schedule.date,
            time: schedule.time,
            endTime: schedule.endTime || '',
            price: schedule.price.toString(),
            availableSeats: schedule.availableSeats.toString(),
            status: schedule.status
          });

          // Find and set the movie search text
          const movie = response.data.find(m => m.id === schedule.movieId);
          if (movie) setMovieSearch(movie.title);
        }
      } catch (err) {
        console.error('Failed to fetch data', err);
        setError('Failed to load data.');
      }
    };
    fetchMovies();
  }, [id, isEditMode]);

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
    setErrors([]);

    // Client-side endTime validation
    if (formData.time && formData.endTime && formData.endTime <= formData.time) {
      setErrors([{ message: 'End time must be after start time.' }]);
      setLoading(false);
      return;
    }

    try {
      const payload = {
        ...formData,
        price: parseFloat(formData.price),
        availableSeats: parseInt(formData.availableSeats, 10)
      };

      if (isEditMode) {
        await api.put(`/schedules/${id}`, payload);
      } else {
        await api.post('/schedules', payload);
      }
      navigate('/admin/schedules');
    } catch (err) {
      console.error('Error saving schedule:', err);
      const data = err.response?.data;
      if (data && typeof data === 'object') {
        // 409 conflict: { error: "Hall..." }
        if (data.error) {
          setErrors([{ type: 'conflict', message: data.error }]);
        } else {
          // 400 validation: { field: "message", ... }
          const msgs = Object.entries(data).map(([field, msg]) => ({ field, message: msg }));
          setErrors(msgs.length ? msgs : [{ message: `Failed to ${isEditMode ? 'update' : 'create'} schedule.` }]);
        }
      } else {
        setErrors([{ message: `Failed to ${isEditMode ? 'update' : 'create'} schedule.` }]);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container animate-fade-in movie-form-container">
      <div className="card form-card">
        <h1 className="form-card-title">{isEditMode ? 'Edit Movie Schedule' : 'Create Movie Schedule'}</h1>

        {errors.length > 0 && (
          <div
            className={`alert-banner ${errors.some(e => e.type === 'conflict') ? 'alert-banner--conflict' : 'alert-banner--error'}`}
            role="alert"
          >
            <strong>{errors.some(e => e.type === 'conflict') ? '⚠️ Scheduling Conflict' : '❌ Validation Errors'}</strong>
            <ul style={{ margin: '6px 0 0', paddingLeft: '1.2rem' }}>
              {errors.map((e, i) => (
                <li key={i}>
                  {e.field ? <strong>{e.field}: </strong> : null}{e.message}
                </li>
              ))}
            </ul>
          </div>
        )}

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
              <label className="form-label">Start Time *</label>
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
              <label className="form-label">End Time *</label>
              <input
                type="time"
                name="endTime"
                className="form-input"
                value={formData.endTime}
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
              {loading ? 'Saving...' : (isEditMode ? 'Update Schedule' : 'Create Schedule')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
