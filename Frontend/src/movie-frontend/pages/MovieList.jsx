import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
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
        const response = await axios.get('http://localhost:8087/movies');
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
        <Link to="/movies/new" className="btn btn-primary">
          Add New Movie
        </Link>
      </div>

      {movies.length === 0 ? (
        <p>No movies found. Add one to get started!</p>
      ) : (
        <div className="movie-grid">
          {movies.map((movie) => (
            <Link key={movie.id} to={`/movies/${movie.id}`} className="movie-card-link">
              <div className="card movie-card">
                {movie.posterUrl ? (
                  <img src={movie.posterUrl} alt={movie.title} className="movie-poster" />
                ) : (
                  <div className="movie-poster-placeholder">🎬</div>
                )}
                
                <div className="movie-content">
                  <span className={`badge badge-status ${
                    movie.status === 'NOW_SHOWING' ? 'badge-success' : 
                    movie.status === 'COMING_SOON' ? 'badge-warning' : 'badge-danger'
                  }`}>
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
                    <span className="badge badge-warning">⭐ {movie.rating}/10</span>
                    <span className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.875rem' }}>
                      Details
                    </span>
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
