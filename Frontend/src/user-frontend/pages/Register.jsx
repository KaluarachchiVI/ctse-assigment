import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthService from '../services/AuthService';
import './Register.css';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        phone: ''
    });
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            await AuthService.register(formData);
            navigate('/login');
        } catch (err) {
            setError('Registration failed. Email might already be in use.');
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-container animate-fade-in">
                <form className="auth-card" onSubmit={handleRegister}>
                    <div className="auth-header">
                        <h2>Join Us</h2>
                        <p>Create an account to start booking movie tickets</p>
                    </div>

                    {error && (
                        <div className="auth-error">
                            <span className="error-icon">⚠️</span>
                            {error}
                        </div>
                    )}

                    <div className="form-group">
                        <label className="form-label">Full Name</label>
                        <input 
                            type="text" 
                            name="name"
                            className="form-input"
                            placeholder="John Doe"
                            value={formData.name} 
                            onChange={handleChange} 
                            required 
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <input 
                            type="email" 
                            name="email"
                            className="form-input"
                            placeholder="name@example.com"
                            value={formData.email} 
                            onChange={handleChange} 
                            required 
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2">
                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <input 
                                type="password" 
                                name="password"
                                className="form-input"
                                placeholder="••••••••"
                                value={formData.password} 
                                onChange={handleChange} 
                                required 
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Phone Number</label>
                            <input 
                                type="text" 
                                name="phone"
                                className="form-input"
                                placeholder="000-0000"
                                value={formData.phone} 
                                onChange={handleChange} 
                            />
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary auth-submit">
                        Create Account
                    </button>

                    <div className="auth-footer">
                        <p>
                            Already have an account? <button type="button" className="auth-link" onClick={() => navigate('/login')}>Login here</button>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Register;
