import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '@/lib/api';
import { GlowingEffect } from '@/components/ui/glowing-effect';
import { cn } from '@/lib/utils';
import './MovieList.css';

export default function MovieList() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        // Use the API Gateway URL for movies if available, or direct service.
        // Assuming API Gateway routes /api/movies to the movie service.
        const response = await api.get('/movies');
        setMovies(response.data);
      } catch (err) {
        console.error('Failed to fetch movies', err);
        setError('Failed to load movies. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, []);

  if (loading) return <div className="container">Loading movies...</div>;
  if (error) return <div className="container text-danger">{error}</div>;

  return (
    <div className="container movie-list-container">
      <div className="movie-header">
        <h1 className="movie-title">Movies</h1>
      </div>

      {movies.length === 0 ? (
        <p>No movies found. Add one to get started!</p>
      ) : (
        <div className="movie-grid">
          {movies.map((movie) => (
            <Link key={movie.id} to={`/movies/${movie.id}`} className="movie-card-link">
              <div className="movie-card-outer group relative flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-border bg-card">
                <GlowingEffect
                  disabled={false}
                  glow={false}
                  spread={36}
                  proximity={72}
                  borderWidth={1}
                  movementDuration={1.5}
                />
                {movie.posterUrl ? (
                  <img src={movie.posterUrl} alt={movie.title} className="movie-poster" />
                ) : (
                  <div className="movie-poster-placeholder">🎬</div>
                )}

                <div className="movie-content relative z-10">
                  <span
                    className={cn(
                      'movie-status-pill',
                      movie.status === 'NOW_SHOWING' && 'movie-status-pill--showing',
                      movie.status === 'COMING_SOON' && 'movie-status-pill--soon',
                      movie.status === 'ENDED' && 'movie-status-pill--ended'
                    )}
                  >
                    {movie.status.replace('_', ' ')}
                  </span>
                  <h2 className="movie-card-title">{movie.title}</h2>
                  <div className="movie-meta">
                    {movie.genre} &bull; {movie.language} &bull; {movie.duration} min
                  </div>
                  <p className="movie-description">
                    {movie.description?.substring(0, 100)}
                    {movie.description?.length > 100 ? '...' : ''}
                  </p>
                  <div className="movie-footer">
                    <span className="movie-rating-pill">⭐ {movie.rating}/10</span>
                    <span className="movie-view-hint">View details →</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
