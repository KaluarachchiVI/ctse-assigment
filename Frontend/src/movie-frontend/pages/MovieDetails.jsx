import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { getGatewayBaseUrl } from '../../lib/gateway';
import './MovieDetails.css';

function formatShowingDate(value) {
  if (value == null) return '';
  try {
    if (Array.isArray(value) && value.length >= 3) {
      const [y, m, day] = value;
      return new Date(y, m - 1, day).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }
    return new Date(value).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return String(value);
  }
}

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
        const base = getGatewayBaseUrl();
        const [movieRes, schedulesRes] = await Promise.all([
          api.get(`/movies/${id}`),
          api.get(`/schedules/movie/${id}`),
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
    return schedules.filter((s) => {
      const d = s.date;
      if (d == null) return false;
      const key =
        typeof d === 'string'
          ? d.slice(0, 10)
          : Array.isArray(d)
            ? `${d[0]}-${String(d[1]).padStart(2, '0')}-${String(d[2]).padStart(2, '0')}`
            : '';
      return key === dateFilter;
    });
  }, [schedules, dateFilter]);

  if (loading) return <div className="container">Loading movie details...</div>;
  if (error) return (
    <div className="container text-center">
      <h2 className="text-danger">{error}</h2>
      <Link to="/movies" className="btn btn-primary mt-4">Back to Movies</Link>
    </div>
  );

  return (
    <div className="movie-details-page">
      {/* Cinematic Hero Backdrop */}
      <div className="movie-hero-backdrop" style={{ 
        backgroundImage: `linear-gradient(to bottom, rgba(10, 10, 15, 0.4), var(--bg-color)), url(${movie.backdropUrl || movie.posterUrl})` 
      }}>
        <div className="container hero-container">
          <Link to="/movies" className="back-btn">← Back</Link>
          
          <div className="movie-hero-content-wrapper">
            <div className="movie-hero-poster-box">
              <img src={movie.posterUrl} alt={movie.title} className="hero-poster-img" />
              <div className="hero-rating">⭐ {movie.rating}</div>
            </div>
            
            <div className="hero-text-details">
              <div className="hero-tags">
                <span className="badge badge-primary">{movie.genre}</span>
                <span className="badge badge-outline">{movie.status.replace('_', ' ')}</span>
              </div>
              <h1 className="hero-title">{movie.title}</h1>
              <div className="hero-meta-row">
                <span>⏱️ {movie.duration} min</span>
                <span>•</span>
                <span>🌐 {movie.language}</span>
                <span>•</span>
                <span>📅 {new Date(movie.releaseDate).getFullYear()}</span>
              </div>
              <p className="hero-description">{movie.description}</p>
              
              <div className="hero-credits">
                <div className="credit-item">
                  <span className="credit-label">Director</span>
                  <span className="credit-value">{movie.director}</span>
                </div>
                {movie.tmdbId && (
                  <div className="credit-item">
                    <span className="credit-label">TMDB ID</span>
                    <span className="credit-value">{movie.tmdbId}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container movie-details-main">
        <div className="content-left">
          {/* Cast Section */}
          {movie.castDetails && movie.castDetails.length > 0 && (
            <section className="details-section">
              <h3 className="section-title">Top Cast</h3>
              <div className="cast-row-scroll">
                {movie.castDetails.map((person, index) => (
                  <div key={index} className="cast-card">
                    <img src={person.profilePath || 'https://via.placeholder.com/150x225?text=No+Photo'} alt={person.name} />
                    <div className="cast-card-info">
                      <div className="cast-name">{person.name}</div>
                      <div className="cast-char">{person.character}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Media Gallery */}
          {movie.additionalImages && movie.additionalImages.length > 0 && (
            <section className="details-section">
              <h3 className="section-title">Media Gallery</h3>
              <div className="media-gallery">
                {movie.additionalImages.map((img, index) => (
                  <img key={index} src={img} className="gallery-img" alt="Gallery" onClick={() => window.open(img, '_blank')} />
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Schedules Section */}
        <section className="schedules-view" id="schedules" aria-labelledby="showings-heading">
          <div className="schedules-panel">
            <div className="schedules-section-header">
              <div className="schedules-heading-block">
                <h2 id="showings-heading" className="schedules-title">
                  Available Showings
                </h2>
                <p className="schedules-subtitle">Pick a time to book your seats</p>
              </div>
              <div className="schedule-filter">
                <label htmlFor="showing-date-filter" className="schedule-filter-label">
                  Filter by date
                </label>
                <input
                  id="showing-date-filter"
                  type="date"
                  className="form-input schedule-date-input"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                />
              </div>
            </div>

            {filteredSchedules.length === 0 ? (
              <div className="schedule-empty card">
                <p className="text-muted">
                  No showings scheduled{' '}
                  {dateFilter
                    ? `for ${new Date(dateFilter + 'T12:00:00').toLocaleDateString()}`
                    : 'yet'}
                  .
                </p>
              </div>
            ) : (
              <ul className="schedule-grid">
                {filteredSchedules.map((schedule) => (
                  <li key={schedule.id} className="schedule-card">
                    <div className="schedule-card-top">
                      <span className="hall-name">{schedule.hallId}</span>
                      <time className="schedule-date-pill" dateTime={String(schedule.date)}>
                        {formatShowingDate(schedule.date)}
                      </time>
                    </div>
                    <div className="schedule-time">{schedule.time}</div>
                    <div className="schedule-card-footer">
                      <div className="price-tag">
                        <span className="price-label">Tickets from</span>
                        <span className="price-amount">${schedule.price.toFixed(2)}</span>
                      </div>
                      <Link
                        to={`/bookings/new?scheduleId=${schedule.id}&movieId=${movie.id}`}
                        className="btn btn-primary schedule-book-btn"
                      >
                        Book Now
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
