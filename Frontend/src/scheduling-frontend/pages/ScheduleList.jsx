import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './ScheduleList.css';

export default function ScheduleList() {
  const [schedules, setSchedules] = useState([]);
  const [movies, setMovies] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [schedulesRes, moviesRes] = await Promise.all([
          axios.get('http://localhost:8087/schedules'),
          axios.get('http://localhost:8087/movies')
        ]);
        
        setSchedules(schedulesRes.data);
        
        // Map movies by ID for easy lookup
        const movieMap = {};
        moviesRes.data.forEach(movie => {
          movieMap[movie.id] = movie;
        });
        setMovies(movieMap);
      } catch (err) {
        console.error('Failed to fetch data', err);
        setError('Failed to load schedule data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div className="container">Loading schedules...</div>;
  if (error) return <div className="container text-danger">{error}</div>;

  return (
    <div className="container schedule-list-container">
      <div className="schedule-header">
        <h1 className="schedule-title">Movie Schedules</h1>
        <Link to="/schedules/new" className="btn btn-primary">
          Create Schedule
        </Link>
      </div>

      <div className="card">
        {schedules.length === 0 ? (
          <p>No schedules found. Create one to get started!</p>
        ) : (
          <div className="schedule-table-container">
            <table className="schedule-table">
              <thead>
                <tr>
                  <th>Movie</th>
                  <th>Hall</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Price</th>
                  <th>Available Seats</th>
                  <th>Status</th>
                  <th className="action-column">Actions</th>
                </tr>
              </thead>
              <tbody>
                {schedules.map((schedule) => {
                  const movie = movies[schedule.movieId];
                  return (
                    <tr key={schedule.id}>
                      <td>
                        <div className="movie-cell">
                          <img 
                            src={movie?.posterUrl || 'https://via.placeholder.com/40x60?text=N/A'} 
                            alt={movie?.title} 
                            className="mini-poster"
                          />
                          <div className="movie-info">
                            <Link to="/movies" className="movie-link-title">
                              {movie?.title || `ID: ${schedule.movieId.substring(0, 8)}...`}
                            </Link>
                            <span className="movie-link-genre">{movie?.genre || 'N/A'}</span>
                          </div>
                        </div>
                      </td>
                      <td>{schedule.hallId}</td>
                      <td>{new Date(schedule.date).toLocaleDateString()}</td>
                      <td>{schedule.time}</td>
                      <td>${schedule.price.toFixed(2)}</td>
                      <td>{schedule.availableSeats}</td>
                      <td>
                        <span className={`badge ${schedule.status === 'ACTIVE' ? 'badge-success' : 'badge-danger'}`}>
                          {schedule.status}
                        </span>
                      </td>
                      <td className="action-column">
                        <button className="btn btn-outline" style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}>
                          Edit
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
