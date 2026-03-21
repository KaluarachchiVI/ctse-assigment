import { Link } from 'react-router-dom';
import './Home.css';

export default function Home() {
  return (
    <div className="animate-fade-in home-container">
      <h1 className="home-hero-title">
        Premium Movie Booking
      </h1>
      <p className="home-description">
        Experience the future of cinema booking. Seamlessly manage your reservations, view upcoming shows, and more.
      </p>
      
      <div className="grid md:grid-cols-2 home-grid">
        <div className="card home-card-content">
          <div className="home-icon">🎟️</div>
          <h2 className="home-card-title">Book a Ticket</h2>
          <p className="home-card-text">
            Ready for your next movie night? Book your favorite seats now.
          </p>
          <Link to="/bookings/new" className="btn btn-primary home-btn-full">
            Book Now
          </Link>
        </div>

        <div className="card home-card-content">
          <div className="home-icon">📋</div>
          <h2 className="home-card-title">Manage Bookings</h2>
          <p className="home-card-text">
            View all bookings, update statuses, or cancel your reservations.
          </p>
          <Link to="/bookings/manage" className="btn btn-outline home-btn-full">
            View All Bookings
          </Link>
        </div>
      </div>
    </div>
  );
}
