import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './CreateMovie.css'; // Will create this next or use existing utilities

export default function CreateMovie() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    genre: '',
    language: '',
    director: '',
    cast: '',
    duration: '',
    releaseDate: '',
    rating: '',
    posterUrl: '',
    status: 'NOW_SHOWING'
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
        cast: formData.cast.split(',').map(item => item.trim()).filter(item => item),
        duration: parseInt(formData.duration, 10),
        rating: parseFloat(formData.rating)
      };

      await axios.post('http://localhost:8080/api/movies', payload);
      navigate('/movies');
    } catch (err) {
      console.error('Error creating movie:', err);
      setError(err.response?.data?.message || 'Failed to create movie. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container animate-fade-in movie-form-container">
      <div className="card form-card">
        <h1 className="form-card-title">Add New Movie</h1>
        
        {error && <div className="error-message">{error}</div>}

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
              <label className="form-label">Genre</label>
              <input
                type="text"
                name="genre"
                className="form-input"
                value={formData.genre}
                onChange={handleChange}
                placeholder="Action, Sci-Fi..."
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
              <label className="form-label">Duration (minutes)</label>
              <input
                type="number"
                name="duration"
                className="form-input"
                value={formData.duration}
                onChange={handleChange}
                min="1"
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
              <label className="form-label">Rating (0-10)</label>
              <input
                type="number"
                name="rating"
                className="form-input"
                value={formData.rating}
                onChange={handleChange}
                step="0.1"
                min="0"
                max="10"
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
                <option value="NOW_SHOWING">Now Showing</option>
                <option value="COMING_SOON">Coming Soon</option>
                <option value="ENDED">Ended</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Cast (Comma separated)</label>
            <input
              type="text"
              name="cast"
              className="form-input"
              value={formData.cast}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Poster URL</label>
            <input
              type="url"
              name="posterUrl"
              className="form-input"
              value={formData.posterUrl}
              onChange={handleChange}
              placeholder="https://..."
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              name="description"
              className="form-input"
              value={formData.description}
              onChange={handleChange}
              rows="4"
            ></textarea>
          </div>

          <div className="form-actions" style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => navigate('/movies')}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Movie'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
