import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Toast from '../components/common/Toast';
import { useAuth } from '../hooks/useAuth';
import './AuthPage.css';

export default function SignupPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'USER' });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      setToast({ message: 'Please fill in all fields', type: 'error' });
      return;
    }
    if (form.password.length < 6) {
      setToast({ message: 'Password must be at least 6 characters', type: 'error' });
      return;
    }
    setLoading(true);
    try {
      const user = await signup(form.name, form.email, form.password, form.role);
      navigate(user.role === 'ORGANIZER' ? '/dashboard' : '/');
    } catch (err) {
      const message = err.response?.data?.error?.message || 'Signup failed';
      setToast({ message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />
      <main className="page">
        <div className="auth-container">
          <div className="auth-card">
            <div className="auth-header">
              <h1 className="auth-title">Create your account</h1>
              <p className="auth-subtitle">Join BookIt to discover and book live events</p>
            </div>

            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name" className="form-label">Full Name</label>
                <input
                  id="name"
                  type="text"
                  className="form-input"
                  placeholder="John Doe"
                  value={form.name}
                  onChange={handleChange('name')}
                />
              </div>

              <div className="form-group">
                <label htmlFor="email" className="form-label">Email</label>
                <input
                  id="email"
                  type="email"
                  className="form-input"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={handleChange('email')}
                />
              </div>

              <div className="form-group">
                <label htmlFor="password" className="form-label">Password</label>
                <input
                  id="password"
                  type="password"
                  className="form-input"
                  placeholder="Min. 6 characters"
                  value={form.password}
                  onChange={handleChange('password')}
                />
              </div>

              <div className="form-group">
                <label className="form-label">I want to</label>
                <div className="role-selector">
                  <button
                    type="button"
                    className={`role-btn ${form.role === 'USER' ? 'role-active' : ''}`}
                    onClick={() => setForm((prev) => ({ ...prev, role: 'USER' }))}
                  >
                    🎫 Attend Events
                  </button>
                  <button
                    type="button"
                    className={`role-btn ${form.role === 'ORGANIZER' ? 'role-active' : ''}`}
                    onClick={() => setForm((prev) => ({ ...prev, role: 'ORGANIZER' }))}
                  >
                    🎤 Organize Events
                  </button>
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>

            <p className="auth-footer">
              Already have an account? <Link to="/login">Sign in</Link>
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
