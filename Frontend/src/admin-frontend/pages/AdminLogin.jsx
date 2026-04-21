import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthService from '../../user-frontend/services/AuthService';
import { ADMIN_USERNAME, ADMIN_PASSWORD } from '../../lib/adminAuth';
import './AdminLogin.css';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const data = await AuthService.login(username, password);
      if (localStorage.getItem('role') === 'ADMIN') {
        navigate('/admin');
      } else {
        AuthService.logout();
        setError('You do not have administrative privileges.');
      }
    } catch (err) {
      setError('Invalid admin credentials or server error.');
    }
  };

  return (
    <div className="admin-login-page">
      <h1>Admin Login</h1>
      <p className="admin-login-hint">
        This screen is not linked from the main site — open{' '}
        <code>/admin/login</code> directly (e.g. <code>http://localhost:5173/admin/login</code>).
        <br />
        <br />
        Username and password must match <code>BOOKING_ADMIN_USERNAME</code> and{' '}
        <code>BOOKING_ADMIN_PASSWORD</code> in Docker / booking-service (defaults:{' '}
        <strong>admin</strong> / <strong>admin-pass</strong>). You can override them with{' '}
        <code>VITE_ADMIN_USERNAME</code> and <code>VITE_ADMIN_PASSWORD</code> in{' '}
        <code>Frontend/.env</code>.
      </p>
      <form onSubmit={onSubmit} className="admin-login-form">
        {error && <div className="error-message">{error}</div>}
        <div className="form-group">
          <label>Username</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
          />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>
        <button type="submit" className="btn btn-primary btn-block">
          Enter dashboard
        </button>
      </form>
      <p className="admin-login-footer">
        <Link to="/movies">← Back to site</Link>
      </p>
    </div>
  );
}
