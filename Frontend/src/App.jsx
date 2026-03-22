import { BrowserRouter as Router, Routes, Route, NavLink, Navigate, useNavigate } from 'react-router-dom';
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
import ManageMovies from './admin-frontend/pages/ManageMovies';
import ManageSchedules from './admin-frontend/pages/ManageSchedules';
import LandingPage from './components/LandingPage';
import AuthService from './user-frontend/services/AuthService';
import { isAdminSession, logoutAdmin } from './lib/adminAuth';
import './App.css';

function Navbar() {
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem('token');
  const isAdmin = isAdminSession();

  const handleLogout = () => {
    if (isAdmin) {
      logoutAdmin();
    } else {
      AuthService.logout();
    }
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <NavLink to="/">MovieTickets</NavLink>
      </div>
      <div className="nav-links">
        <NavLink end to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Home</NavLink>
        <NavLink to="/movies" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Movies</NavLink>
        <NavLink to="/schedules" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Schedules</NavLink>
        {isAdmin ? (
          <NavLink to="/admin" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Admin Dashboard</NavLink>
        ) : (
          <NavLink to="/profile" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Profile</NavLink>
        )}
      </div>
      <div className="nav-auth">
        {!isLoggedIn && !isAdmin ? (
          <>
            <NavLink to="/login" className="auth-btn login-btn">Login</NavLink>
            <NavLink to="/register" className="auth-btn register-btn">Register</NavLink>
          </>
        ) : (
          <>
            {isAdmin ? (
               <NavLink to="/admin" className="auth-btn profile-btn">Admin Panel</NavLink>
            ) : (
               <NavLink to="/profile" className="auth-btn profile-btn">Account</NavLink>
            )}
            <button onClick={handleLogout} className="auth-btn logout-btn" style={{ marginLeft: '10px' }}>
              Logout
            </button>
          </>
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
        <Route
          path="/"
          element={
            <div className="app-container landing-root">
              <Navbar />
              <LandingPage />
              <Footer />
            </div>
          }
        />

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
                
                <Route path="/admin/movies" element={<AdminRoute><ManageMovies /></AdminRoute>} />
                <Route path="/admin/movies/new" element={<AdminRoute><CreateMovie /></AdminRoute>} />
                <Route path="/admin/movies/edit/:id" element={<AdminRoute><CreateMovie /></AdminRoute>} />
                
                <Route path="/admin/schedules" element={<AdminRoute><ManageSchedules /></AdminRoute>} />
                <Route path="/admin/schedules/new" element={<AdminRoute><CreateSchedule /></AdminRoute>} />
                <Route path="/admin/schedules/edit/:id" element={<AdminRoute><CreateSchedule /></AdminRoute>} />

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
