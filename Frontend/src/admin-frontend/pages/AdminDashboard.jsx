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
        <Link to="/admin/movies" className="admin-tile">
          <h2>Manage movies</h2>
          <p>View, edit, or delete film listings.</p>
        </Link>
        <Link to="/admin/schedules" className="admin-tile">
          <h2>Manage schedules</h2>
          <p>View, edit, or delete showtimes.</p>
        </Link>
        <Link to="/admin/bookings" className="admin-tile">
          <h2>Manage bookings</h2>
          <p>View and update reservation status.</p>
        </Link>
      </div>
    </div>
  );
}
