import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthService from '../services/AuthService';
import { ADMIN_USERNAME, ADMIN_PASSWORD } from '../../lib/adminAuth';
import './Login.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        
        // Admin Auto-Redirect Check
        if (email === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
            localStorage.setItem('adminAuth', '1');
            navigate('/admin');
            return;
        }

        try {
            await AuthService.login(email, password);
            navigate('/profile');
        } catch (err) {
            setError('Invalid email or password');
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-container animate-fade-in">
                <form className="auth-card" onSubmit={handleLogin}>
                    <div className="auth-header">
                        <h2>Welcome Back</h2>
                        <p>Enter your credentials to access your account</p>
                    </div>
                    
                    {error && (
                        <div className="auth-error">
                            <span className="error-icon">⚠️</span>
                            {error}
                        </div>
                    )}

                    <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <input 
                            type="email" 
                            className="form-input"
                            placeholder="name@example.com"
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                            required 
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input 
                            type="password" 
                            className="form-input"
                            placeholder="••••••••"
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            required 
                        />
                    </div>

                    <button type="submit" className="btn btn-primary auth-submit">
                        Sign In
                    </button>

                    <div className="auth-footer">
                        <p>
                            Don't have an account? <button type="button" className="auth-link" onClick={() => navigate('/register')}>Register here</button>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;
