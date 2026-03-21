import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthService from '../services/AuthService';
import './Register.css';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        passwordHash: '',
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
        <div className="register-container">
            <form className="register-form" onSubmit={handleRegister}>
                <h2>Register</h2>
                {error && <p className="error">{error}</p>}
                <div className="form-group">
                    <label>Full Name</label>
                    <input 
                        type="text" 
                        name="name"
                        value={formData.name} 
                        onChange={handleChange} 
                        required 
                    />
                </div>
                <div className="form-group">
                    <label>Email</label>
                    <input 
                        type="email" 
                        name="email"
                        value={formData.email} 
                        onChange={handleChange} 
                        required 
                    />
                </div>
                <div className="form-group">
                    <label>Password</label>
                    <input 
                        type="password" 
                        name="passwordHash"
                        value={formData.passwordHash} 
                        onChange={handleChange} 
                        required 
                    />
                </div>
                <div className="form-group">
                    <label>Phone</label>
                    <input 
                        type="text" 
                        name="phone"
                        value={formData.phone} 
                        onChange={handleChange} 
                    />
                </div>
                <button type="submit">Register</button>
                <p>
                    Already have an account? <span onClick={() => navigate('/login')}>Login here</span>
                </p>
            </form>
        </div>
    );
};

export default Register;
