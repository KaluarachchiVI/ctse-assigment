import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { GlowingEffect } from '@/components/ui/glowing-effect';
import { cn } from '@/lib/utils';
import '../../movie-frontend/pages/MovieList.css';

export default function ManageMovies() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const navigate = useNavigate();

  const fetchMovies = async () => {
    try {
      const response = await axios.get('http://localhost:8087/movies');
      setMovies(response.data);
    } catch (err) {
      console.error('Failed to fetch movies', err);
      setError('Failed to load movies.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovies();
  }, []);

  const handleDelete = async (id, title) => {
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      setDeleteError('');
      try {
        await axios.delete(`http://localhost:8087/movies/${id}`);
        setMovies(movies.filter(m => m.id !== id));
      } catch (err) {
        console.error('Delete error', err);
        setDeleteError(`Failed to delete "${title}". Please try again.`);
      }
    }
  };

  if (loading) return <div className="container">Loading movies...</div>;
  if (error) return <div className="container text-danger">{error}</div>;

  return (
    <div className="container movie-list-container">
      <div className="movie-header flex justify-between items-center mb-8">
        <h1 className="movie-title">Manage Movies</h1>
        <Link to="/admin/movies/new" className="btn btn-primary">
          + Add New Movie
        </Link>
      </div>

      {deleteError && (
        <div className="alert-banner alert-banner--error" role="alert">
          ❌ {deleteError}
        </div>
      )}

      {movies.length === 0 ? (
        <p>No movies found. Add one to get started!</p>
      ) : (
        <div className="movie-grid">
          {movies.map((movie) => (
            <div key={movie.id} className="movie-card-admin-wrapper relative">
              <div className="movie-card-outer group relative flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-border bg-card">
                <GlowingEffect
                  disabled={false}
                  glow={false}
                  spread={36}
                  proximity={72}
                  borderWidth={1}
                  movementDuration={1.5}
                />
                <div className="relative">
                  {movie.posterUrl ? (
                    <img src={movie.posterUrl} alt={movie.title} className="movie-poster" />
                  ) : (
                    <div className="movie-poster-placeholder">🎬</div>
                  )}
                  <div className="admin-actions-overlay absolute top-2 right-2 flex gap-2">
                    <button 
                      onClick={() => navigate(`/admin/movies/edit/${movie.id}`)}
                      className="btn-icon btn-edit" 
                      title="Edit Movie"
                    >
                      ✏️
                    </button>
                    <button 
                      onClick={() => handleDelete(movie.id, movie.title)}
                      className="btn-icon btn-delete" 
                      title="Delete Movie"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

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
                    {movie.genre} &bull; {movie.language}
                  </div>
                  <div className="movie-footer mt-4">
                    <Link to={`/movies/${movie.id}`} className="movie-view-hint">Preview →</Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
