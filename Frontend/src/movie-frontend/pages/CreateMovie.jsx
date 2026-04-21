import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '@/lib/api';
import { tmdbApi } from '../services/tmdbService';
import './CreateMovie.css';

export default function CreateMovie() {
  const { id } = useParams();
  const isEditMode = !!id;
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]); // array of { field?, message }
  
  // TMDB Search State
  const [tmdbQuery, setTmdbQuery] = useState('');
  const [tmdbResults, setTmdbResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    genre: '',
    language: '',
    director: '',
    duration: '',
    releaseDate: '',
    rating: '',
    posterUrl: '',
    backdropUrl: '',
    tmdbId: '',
    castDetails: [],
    additionalImages: [],
    status: 'NOW_SHOWING'
  });

  const handleTmdbSearch = async () => {
    if (!tmdbQuery) return;
    setIsSearching(true);
    try {
      const results = await tmdbApi.searchMovies(tmdbQuery);
      setTmdbResults(results);
    } catch (err) {
      console.error('TMDB Search Error:', err);
      setErrors([{ message: 'Failed to search TMDB. Check your API key.' }]);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (isEditMode) {
      const fetchMovie = async () => {
        setLoading(true);
        try {
          const response = await api.get(`/movies/${id}`);
          setFormData(response.data);
        } catch (err) {
          console.error('Fetch error:', err);
          setErrors([{ message: 'Failed to load movie details for editing.' }]);
        } finally {
          setLoading(false);
        }
      };
      fetchMovie();
    }
  }, [id, isEditMode]);

  const handleSelectMovie = async (tmdbMovie) => {
    setLoading(true);
    setTmdbResults([]);
    setTmdbQuery('');
    try {
      const { details, credits, images } = await tmdbApi.getMovieDetails(tmdbMovie.id);
      
      const director = credits.crew.find(c => c.job === 'Director')?.name || '';
      const cast = credits.cast.slice(0, 10).map(c => ({
        name: c.name,
        character: c.character,
        profilePath: tmdbApi.getImageUrl(c.profile_path, 'w185')
      }));

      const backdropUrl = tmdbApi.getImageUrl(details.backdrop_path);
      const posterUrl = tmdbApi.getImageUrl(details.poster_path, 'w500');
      const gallery = images.backdrops.slice(0, 5).map(img => tmdbApi.getImageUrl(img.file_path));

      setFormData({
        title: details.title,
        description: details.overview,
        genre: details.genres.map(g => g.name).join(', '),
        language: details.original_language.toUpperCase(),
        director: director,
        duration: details.runtime || '',
        releaseDate: details.release_date,
        rating: details.vote_average.toFixed(1),
        posterUrl: posterUrl,
        backdropUrl: backdropUrl,
        tmdbId: details.id.toString(),
        castDetails: cast,
        additionalImages: gallery,
        status: 'NOW_SHOWING'
      });
    } catch (err) {
      console.error('TMDB Detail Error:', err);
      setErrors([{ message: 'Failed to fetch movie details from TMDB.' }]);
    } finally {
      setLoading(false);
    }
  };

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

    try {
      const payload = {
        ...formData,
        duration: parseInt(formData.duration, 10) || 0,
        rating: parseFloat(formData.rating) || 0
      };

      if (isEditMode) {
        await api.put(`/movies/${id}`, payload);
      } else {
        await api.post('/movies', payload);
      }
      navigate('/admin/movies');
    } catch (err) {
      console.error('Error saving movie:', err);
      const data = err.response?.data;
      if (data && typeof data === 'object') {
        const msgs = Object.entries(data).map(([field, msg]) => ({ field, message: msg }));
        setErrors(msgs.length ? msgs : [{ message: `Failed to ${isEditMode ? 'update' : 'create'} movie.` }]);
      } else {
        setErrors([{ message: `Failed to ${isEditMode ? 'update' : 'create'} movie.` }]);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container animate-fade-in movie-form-container">
      <div className="card form-card">
        <h1 className="form-card-title">{isEditMode ? 'Edit Movie' : 'Add New Movie'}</h1>

        {errors.length > 0 && (
          <div className="alert-banner alert-banner--error" role="alert">
            <strong>❌ Validation Errors</strong>
            <ul style={{ margin: '6px 0 0', paddingLeft: '1.2rem' }}>
              {errors.map((e, i) => (
                <li key={i}>
                  {e.field ? <strong>{e.field}: </strong> : null}{e.message}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="tmdb-search-section mb-8">
          <label className="form-label">Search TMDB to Auto-Fill</label>
          <div className="flex gap-2">
            <input 
              type="text" 
              className="form-input" 
              placeholder="Enter movie title..." 
              value={tmdbQuery}
              onChange={(e) => setTmdbQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleTmdbSearch()}
            />
            <button 
              type="button" 
              className="btn btn-outline" 
              onClick={handleTmdbSearch}
              disabled={isSearching}
            >
              {isSearching ? 'Searching...' : 'Search'}
            </button>
          </div>

          {tmdbResults.length > 0 && (
            <div className="tmdb-results-dropdown">
              {tmdbResults.slice(0, 5).map(m => (
                <div key={m.id} className="tmdb-result-item" onClick={() => handleSelectMovie(m)}>
                  <img src={tmdbApi.getImageUrl(m.poster_path, 'w92')} alt={m.title} />
                  <div>
                    <div className="font-bold">{m.title}</div>
                    <div className="text-xs text-muted">{m.release_date?.split('-')[0]}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid md:grid-cols-2">
            <div className="form-group">
              <label className="form-label">Title *</label>
              <input
                type="text"
                name="title"
                className="form-input"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">TMDB ID</label>
              <input
                type="text"
                name="tmdbId"
                className="form-input"
                value={formData.tmdbId}
                onChange={handleChange}
                readOnly
              />
            </div>

            <div className="form-group">
              <label className="form-label">Genre</label>
              <input
                type="text"
                name="genre"
                className="form-input"
                value={formData.genre}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Language</label>
              <input
                type="text"
                name="language"
                className="form-input"
                value={formData.language}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Duration (min)</label>
              <input
                type="number"
                name="duration"
                className="form-input"
                value={formData.duration}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Director</label>
              <input
                type="text"
                name="director"
                className="form-input"
                value={formData.director}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Release Date</label>
              <input
                type="date"
                name="releaseDate"
                className="form-input"
                value={formData.releaseDate}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Rating</label>
              <input
                type="number"
                name="rating"
                className="form-input"
                value={formData.rating}
                onChange={handleChange}
                step="0.1"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Status</label>
              <select name="status" className="form-input" value={formData.status} onChange={handleChange}>
                <option value="NOW_SHOWING">Now Showing</option>
                <option value="COMING_SOON">Coming Soon</option>
                <option value="ENDED">Ended</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Poster URL</label>
            <input type="text" name="posterUrl" className="form-input" value={formData.posterUrl} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label className="form-label">Backdrop URL</label>
            <input type="text" name="backdropUrl" className="form-input" value={formData.backdropUrl} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea name="description" className="form-input" value={formData.description} onChange={handleChange} rows="3"></textarea>
          </div>

          {formData.castDetails.length > 0 && (
            <div className="mb-6">
              <label className="section-label">Cast Preview ({formData.castDetails.length})</label>
              <div className="flex gap-2 overflow-x-auto pb-4">
                {formData.castDetails.slice(0, 6).map((c, i) => (
                  <div key={i} className="flex-shrink-0 text-center" style={{ width: '80px' }}>
                    <img src={c.profilePath} className="w-16 h-16 rounded-full object-cover mx-auto mb-1 border-2 border-primary" alt={c.name} />
                    <div className="text-xs font-bold truncate">{c.name}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="form-actions">
            <button type="button" className="btn btn-outline" onClick={() => navigate('/movies')}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving...' : 'Save Movie'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
