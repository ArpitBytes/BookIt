import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import Navbar from '../components/layout/Navbar';
import Spinner from '../components/common/Spinner';
import Pagination from '../components/common/Pagination';
import { formatDate, formatCurrency } from '../utils/formatDate';
import './OrganizerDashboard.css';

export default function OrganizerDashboard() {
  const [stats, setStats] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [statsRes, eventsRes] = await Promise.all([
          api.get('/dashboard/stats'),
          api.get('/events/mine', { params: { page, limit: 10 } }),
        ]);
        setStats(statsRes.data);
        setEvents(eventsRes.data.events);
        setPagination(eventsRes.data.pagination);
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [page]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="page-center"><Spinner size="lg" /></div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="page">
        <div className="container">
          <div className="dashboard-header">
            <div>
              <h1 className="page-title">Organizer Dashboard</h1>
              <p className="page-subtitle">Manage your events and track performance</p>
            </div>
            <Link to="/dashboard/events/new" className="btn btn-primary">
              + Create Event
            </Link>
          </div>

          {stats && (
            <div className="stats-grid">
              <div className="stat-card">
                <span className="stat-icon">📅</span>
                <div className="stat-info">
                  <span className="stat-value">{stats.totalEvents}</span>
                  <span className="stat-label">Total Events</span>
                </div>
              </div>
              <div className="stat-card">
                <span className="stat-icon">🎫</span>
                <div className="stat-info">
                  <span className="stat-value">{stats.totalBookings}</span>
                  <span className="stat-label">Total Bookings</span>
                </div>
              </div>
              <div className="stat-card">
                <span className="stat-icon">💰</span>
                <div className="stat-info">
                  <span className="stat-value">{formatCurrency(stats.totalRevenue)}</span>
                  <span className="stat-label">Total Revenue</span>
                </div>
              </div>
              <div className="stat-card">
                <span className="stat-icon">📊</span>
                <div className="stat-info">
                  <span className="stat-value">{stats.conversionRate}%</span>
                  <span className="stat-label">Conversion Rate</span>
                </div>
              </div>
            </div>
          )}

          <div className="dashboard-section">
            <h2 className="section-title">Your Events</h2>
            {events.length === 0 ? (
              <div className="empty-state">
                <p>No events yet. Create your first event!</p>
              </div>
            ) : (
              <>
                <div className="events-table-wrapper">
                  <table className="events-table">
                    <thead>
                      <tr>
                        <th>Event</th>
                        <th>Date</th>
                        <th>Seats</th>
                        <th>Bookings</th>
                        <th>Price</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {events.map((event) => (
                        <tr key={event.id}>
                          <td className="table-event-title">{event.title}</td>
                          <td>{formatDate(event.date)}</td>
                          <td>{event.availableSeats}/{event.totalSeats}</td>
                          <td>{event._count?.bookings || 0}</td>
                          <td>{formatCurrency(event.price)}</td>
                          <td>
                            <div className="table-actions">
                              <Link to={`/dashboard/events/${event.id}/edit`} className="btn btn-ghost btn-sm">
                                Edit
                              </Link>
                              <Link to={`/dashboard/events/${event.id}/attendees`} className="btn btn-ghost btn-sm">
                                Attendees
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination page={page} totalPages={pagination.totalPages} onPageChange={setPage} />
              </>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
