import { BrowserRouter as Router, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import Login from './user-frontend/pages/Login';
import Register from './user-frontend/pages/Register';
import Profile from './user-frontend/pages/Profile';
import Home from './booking-frontend/pages/Home';
import BookingList from './booking-frontend/pages/BookingList';
import CreateBooking from './booking-frontend/pages/CreateBooking';
import PaymentPage from './booking-frontend/pages/PaymentPage';
import PaymentSuccess from './booking-frontend/pages/PaymentSuccess';
import UserBookings from './booking-frontend/pages/UserBookings';
import MovieList from './movie-frontend/pages/MovieList';
import MovieDetails from './movie-frontend/pages/MovieDetails';
import CreateMovie from './movie-frontend/pages/CreateMovie';
import ScheduleList from './scheduling-frontend/pages/ScheduleList';
import CreateSchedule from './scheduling-frontend/pages/CreateSchedule';
import AdminRoute from './admin-frontend/AdminRoute';
import AdminLogin from './admin-frontend/pages/AdminLogin';
import AdminDashboard from './admin-frontend/pages/AdminDashboard';
import './App.css';

function Navbar() {
  return (
    <nav className="navbar">
      <div className="nav-brand">
        <NavLink to="/">MovieTickets</NavLink>
      </div>
      <div className="nav-links">
        <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Home</NavLink>
        <NavLink to="/movies" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Movies</NavLink>
        <NavLink to="/schedules" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Schedules</NavLink>
        <NavLink to="/profile" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Profile</NavLink>
      </div>
      <div className="nav-auth">
        {!localStorage.getItem('token') ? (
          <>
            <NavLink to="/login" className="auth-btn login-btn">Login</NavLink>
            <NavLink to="/register" className="auth-btn register-btn">Register</NavLink>
          </>
        ) : (
          <NavLink to="/profile" className="auth-btn profile-btn">My Dashboard</NavLink>
        )}
      </div>
    </nav>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <p>&copy; 2026 MovieTickets Inc. All rights reserved.</p>
    </footer>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={
          <div className="home-hero">
            <h1>Book Your Favorite Movies</h1>
            <p>Simple, fast, and secure ticket booking system.</p>
            <div className="hero-actions">
              <NavLink to="/register" className="cta-button">Get Started</NavLink>
            </div>
          </div>
        } />

        <Route path="/*" element={
          <div className="app-container">
            <Navbar />
            <main className="main-content">
              <Routes>
                <Route path="/bookinghome" element={<Home />} />
                <Route path="/movies" element={<MovieList />} />
                <Route path="/movies/:id" element={<MovieDetails />} />
                <Route path="/movies/new" element={<Navigate to="/admin/movies/new" replace />} />
                <Route path="/schedules" element={<ScheduleList />} />
                <Route path="/schedules/new" element={<Navigate to="/admin/schedules/new" replace />} />
                <Route path="/bookings/new" element={<CreateBooking />} />
                <Route path="/payment" element={<PaymentPage />} />
                <Route path="/payment/success" element={<PaymentSuccess />} />
                <Route path="/bookings/manage" element={<Navigate to="/admin/bookings" replace />} />
                <Route path="/bookings/user/:userId" element={<UserBookings />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/profile" element={<Profile />} />

                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                <Route path="/admin/bookings" element={<AdminRoute><BookingList /></AdminRoute>} />
                <Route path="/admin/movies/new" element={<AdminRoute><CreateMovie /></AdminRoute>} />
                <Route path="/admin/schedules/new" element={<AdminRoute><CreateSchedule /></AdminRoute>} />

                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </main>
            <Footer />
          </div>
        } />
      </Routes>
    </Router>
  );
}

export default App;
