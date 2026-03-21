import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './MovieDetails.css';

export default function MovieDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    const fetchMovieData = async () => {
      try {
        const [movieRes, schedulesRes] = await Promise.all([
          axios.get(`http://localhost:8087/movies/${id}`),
          axios.get(`http://localhost:8087/schedules/movie/${id}`)
        ]);
        
        setMovie(movieRes.data);
        setSchedules(schedulesRes.data);
      } catch (err) {
        console.error('Failed to fetch movie details', err);
        setError('Movie not found or server error.');
      } finally {
        setLoading(false);
      }
    };

    fetchMovieData();
  }, [id]);

  const filteredSchedules = useMemo(() => {
    if (!dateFilter) return schedules;
    return schedules.filter(s => s.date === dateFilter);
  }, [schedules, dateFilter]);

  if (loading) return <div className="container">Loading movie details...</div>;
  if (error) return (
    <div className="container text-center">
      <h2 className="text-danger">{error}</h2>
      <Link to="/movies" className="btn btn-primary mt-4">Back to Movies</Link>
    </div>
  );

  return (
    <div className="container movie-details-container">
      <Link to="/movies" className="btn btn-outline mb-4" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
        ← Back to Movies
      </Link>

      <div className="movie-details-hero">
        <div className="movie-hero-poster-wrapper">
          {movie.posterUrl ? (
            <img src={movie.posterUrl} alt={movie.title} className="movie-hero-poster" />
          ) : (
            <div className="movie-poster-large-placeholder">🎬</div>
          )}
        </div>
        
        <div className="movie-hero-content">
          <span className={`badge mb-3 ${
            movie.status === 'NOW_SHOWING' ? 'badge-success' : 
            movie.status === 'COMING_SOON' ? 'badge-warning' : 'badge-danger'
          }`}>
            {movie.status.replace('_', ' ')}
          </span>
          <h1 className="movie-details-title">{movie.title}</h1>
          
          <div className="movie-details-meta">
            <span>⭐ {movie.rating}/10</span>
            <span>⏱️ {movie.duration}m</span>
            <span>🎭 {movie.genre}</span>
            <span>🌐 {movie.language}</span>
          </div>

          <div className="movie-description-section">
            <span className="section-label">Synopsis</span>
            <p className="movie-details-description">{movie.description}</p>
          </div>

          <div className="movie-credits-grid">
            <div>
              <span className="section-label">Director</span>
              <div className="text-main font-semibold">{movie.director}</div>
            </div>
            <div>
              <span className="section-label">Main Cast</span>
              <div className="text-main font-semibold">{movie.cast}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="schedules-view">
        <div className="schedules-section-header">
          <div>
            <h2 className="movie-title-text" style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>Available Showings</h2>
            <p className="text-muted">Select a time to book your seats</p>
          </div>
          <div className="schedule-filter">
            <label className="section-label" style={{ marginBottom: '0.25rem' }}>Filter by Date</label>
            <input 
              type="date" 
              className="form-input" 
              style={{ width: '200px' }}
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
          </div>
        </div>

        {filteredSchedules.length === 0 ? (
          <div className="card text-center p-8">
            <p className="text-muted">No showings scheduled {dateFilter ? `for ${new Date(dateFilter).toLocaleDateString()}` : 'yet'}.</p>
          </div>
        ) : (
          <div className="schedule-grid">
            {filteredSchedules.map(schedule => (
              <div key={schedule.id} className="schedule-card">
                <div className="schedule-card-header">
                  <span className="hall-name">{schedule.hallId}</span>
                  <span className="badge badge-outline">{new Date(schedule.date).toLocaleDateString()}</span>
                </div>
                <div className="schedule-time">{schedule.time}</div>
                <div className="schedule-card-footer">
                  <div className="price-tag">
                    <span className="text-muted text-xs block">Tickets from</span>
                    <span className="text-main font-bold">${schedule.price.toFixed(2)}</span>
                  </div>
                  <Link 
                    to={`/bookings/new?scheduleId=${schedule.id}&movieId=${movie.id}`} 
                    className="btn btn-primary btn-sm"
                  >
                    Book Now
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
