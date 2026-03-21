import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthService from '../services/AuthService';
import api from '../services/api';
import './Profile.css';

const Profile = () => {
    const [user, setUser] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const userId = localStorage.getItem('userId');
        const token = localStorage.getItem('token');

        if (!token || !userId) {
            navigate('/login');
            return;
        }

        const fetchProfileData = async () => {
            try {
                // Fetch user details
                const userRes = await api.get(`/users/${userId}`);
                setUser(userRes.data);

                // Fetch bookings
                const bookingsRes = await api.get(`/users/${userId}/bookings`);
                setBookings(bookingsRes.data);
            } catch (error) {
                console.error("Error fetching profile data:", error);
                if (error.response?.status === 401) {
                    AuthService.logout();
                    navigate('/login');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchProfileData();
    }, [navigate]);

    const handleLogout = () => {
        AuthService.logout();
        navigate('/login');
    };

    if (loading) {
        return (
            <div className="profile-loading">
                <div className="loader"></div>
                <p>Loading your dashboard...</p>
            </div>
        );
    }

    return (
        <div className="profile-dashboard">
            <header className="dashboard-header">
                <h1>Welcome back, {user?.name}!</h1>
                <button onClick={handleLogout} className="logout-button">Logout</button>
            </header>

            <div className="dashboard-grid">
                {/* User Info Card */}
                <section className="info-card">
                    <div className="card-header">
                        <i className="fas fa-user-circle"></i>
                        <h2>Personal Information</h2>
                    </div>
                    <div className="card-body">
                        <div className="info-item">
                            <span className="label">Full Name</span>
                            <span className="value">{user?.name}</span>
                        </div>
                        <div className="info-item">
                            <span className="label">Email Address</span>
                            <span className="value">{user?.email}</span>
                        </div>
                        <div className="info-item">
                            <span className="label">Phone Number</span>
                            <span className="value">{user?.phone || 'Not provided'}</span>
                        </div>
                    </div>
                </section>

                {/* Booked Movies Section */}
                <section className="bookings-section">
                    <div className="section-header">
                        <h2>My Bookings</h2>
                        <span className="badge">{bookings.length} Total</span>
                    </div>
                    
                    {bookings.length > 0 ? (
                        <div className="bookings-table-container">
                            <table className="bookings-table">
                                <thead>
                                    <tr>
                                        <th>Booking ID</th>
                                        <th>Seats</th>
                                        <th>Date</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {bookings.map((booking) => (
                                        <tr key={booking.id}>
                                            <td className="booking-id">#{booking.id.substring(0, 8)}</td>
                                            <td> {booking.seats && booking.seats.length > 0 ? booking.seats.join(', ') : 'N/A'}</td>
                                            <td>{new Date(booking.createdAt).toLocaleDateString()}</td>
                                            <td>
                                                <span className={`status-badge ${booking.status?.toLowerCase()}`}>
                                                    {booking.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="empty-state">
                            <p>You haven't booked any movies yet.</p>
                            <button onClick={() => navigate('/')} className="browse-btn">Browse Movies</button>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
};

export default Profile;
