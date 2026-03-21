import { Link } from 'react-router-dom';
import './AdminDashboard.css';

export default function AdminDashboard() {
  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard-header">
        <p className="eyebrow">Admin</p>
        <h1>Dashboard</h1>
        <p className="sub">Manage movies, schedules, and bookings.</p>
      </div>
      <div className="admin-dashboard-grid">
        <Link to="/admin/movies/new" className="admin-tile">
          <h2>Add movie</h2>
          <p>Create a new listing in the catalogue.</p>
        </Link>
        <Link to="/admin/schedules/new" className="admin-tile">
          <h2>Create schedule</h2>
          <p>Add showtimes for a movie.</p>
        </Link>
        <Link to="/admin/bookings" className="admin-tile">
          <h2>Manage bookings</h2>
          <p>View and update reservation status.</p>
        </Link>
      </div>
    </div>
  );
}
