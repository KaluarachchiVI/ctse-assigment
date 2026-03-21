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
          <Link to="/movies" className="btn btn-primary home-btn-full">
            Browse &amp; book
          </Link>
        </div>

        <div className="card home-card-content">
          <div className="home-icon">📋</div>
          <h2 className="home-card-title">My bookings</h2>
          <p className="home-card-text">
            Signed-in users can see tickets and booking status on their profile.
          </p>
          <Link to="/profile" className="btn btn-outline home-btn-full">
            Open profile
          </Link>
        </div>
      </div>
    </div>
  );
}
