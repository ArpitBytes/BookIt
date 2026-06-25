import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './Navbar.css';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <span className="brand-icon">🎫</span>
          <span className="brand-text">BookIt</span>
        </Link>

        <div className="navbar-links">
          <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>Events</Link>

          {isAuthenticated ? (
            <>
              {user.role === 'USER' && (
                <Link to="/bookings" className={`nav-link ${location.pathname === '/bookings' ? 'active' : ''}`}>My Bookings</Link>
              )}
              {user.role === 'ORGANIZER' && (
                <>
                  <Link to="/dashboard" className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}>Dashboard</Link>
                  <Link to="/dashboard/analytics" className={`nav-link ${location.pathname === '/dashboard/analytics' ? 'active' : ''}`}>Analytics</Link>
                </>
              )}
              <div className="nav-user">
                <span className="nav-user-name">{user.name}</span>
                <span className="nav-user-role">{user.role}</span>
                <button onClick={handleLogout} className="btn btn-outline btn-sm">
                  Logout
                </button>
              </div>
            </>
          ) : (
            <div className="nav-auth">
              <Link to="/login" className="btn btn-outline btn-sm">Login</Link>
              <Link to="/signup" className="btn btn-primary btn-sm">Sign Up</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
