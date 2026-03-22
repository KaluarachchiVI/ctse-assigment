import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import '../../scheduling-frontend/pages/ScheduleList.css';

function formatScheduleDate(value) {
  if (value == null || value === '') return '—';
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

export default function ManageSchedules() {
  const [schedules, setSchedules] = useState([]);
  const [movies, setMovies] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const [schedulesRes, moviesRes] = await Promise.all([
        api.get('/schedules'),
        api.get('/movies')
      ]);
      
      setSchedules(schedulesRes.data);
      
      const movieMap = {};
      moviesRes.data.forEach(movie => {
        movieMap[movie.id] = movie;
      });
      setMovies(movieMap);
    } catch (err) {
      console.error('Failed to fetch data', err);
      setError('Failed to load schedule data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this schedule?')) {
      setDeleteError('');
      try {
        await api.delete(`/schedules/${id}`);
        setSchedules(schedules.filter(s => s.id !== id));
      } catch (err) {
        console.error('Delete error', err);
        setDeleteError('Failed to delete schedule. It may have bookings attached.');
      }
    }
  };

  if (loading) return <div className="container">Loading schedules...</div>;
  if (error) return <div className="container text-danger">{error}</div>;

  return (
    <div className="container schedule-list-container">
      <div className="schedule-header flex justify-between items-center mb-6">
        <h1 className="schedule-title">Manage Schedules</h1>
        <Link to="/admin/schedules/new" className="btn btn-primary">
          + Create New Schedule
        </Link>
      </div>

      {deleteError && (
        <div className="alert-banner alert-banner--error" role="alert">
          ❌ {deleteError}
        </div>
      )}

      <div className="card">
        {schedules.length === 0 ? (
          <p>No schedules found.</p>
        ) : (
          <div className="schedule-table-container">
            <table className="schedule-table">
              <thead>
                <tr>
                  <th>Movie</th>
                  <th>Hall</th>
                  <th>Date</th>
                  <th>Start</th>
                  <th>End</th>
                  <th>Price</th>
                  <th>Seats</th>
                  <th>Status</th>
                  <th>Actions</th>
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
                            <span className="movie-link-title">
                              {movie?.title || `ID: ${schedule.movieId.substring(0, 8)}...`}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>{schedule.hallId}</td>
                      <td>{formatScheduleDate(schedule.date)}</td>
                      <td>{schedule.time}</td>
                      <td>{schedule.endTime || '—'}</td>
                      <td>${schedule.price.toFixed(2)}</td>
                      <td>{schedule.availableSeats}</td>
                      <td>
                        <span
                          className={
                            schedule.status === 'ACTIVE'
                              ? 'schedule-status schedule-status--active'
                              : 'schedule-status schedule-status--inactive'
                          }
                        >
                          {schedule.status}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons flex gap-2">
                          <button 
                            onClick={() => navigate(`/admin/schedules/edit/${schedule.id}`)}
                            className="btn-icon" 
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button 
                            onClick={() => handleDelete(schedule.id)}
                            className="btn-icon" 
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </div>
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
