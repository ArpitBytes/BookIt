import { useState, useEffect } from 'react';
import api from '../api/axios';
import Navbar from '../components/layout/Navbar';
import Spinner from '../components/common/Spinner';
import Pagination from '../components/common/Pagination';
import { formatCurrency } from '../utils/formatDate';
import { timeAgo } from '../utils/formatDate';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Legend,
} from 'recharts';
import './AnalyticsPage.css';

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [logPage, setLogPage] = useState(1);
  const [logPagination, setLogPagination] = useState({ total: 0, totalPages: 1 });
  const [actionFilter, setActionFilter] = useState('');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.get('/dashboard/analytics');
        setAnalytics(res.data);
      } catch (err) {
        console.error('Failed to load analytics:', err);
      }
    };
    fetchAnalytics();
  }, []);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const params = { page: logPage, limit: 15 };
        if (actionFilter) params.action = actionFilter;
        const res = await api.get('/dashboard/activity-logs', { params });
        setLogs(res.data.logs);
        setLogPagination(res.data.pagination);
      } catch (err) {
        console.error('Failed to load logs:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [logPage, actionFilter]);

  const actionColors = {
    EVENT_VIEWED: '#60a5fa',
    BOOKING_STARTED: '#fbbf24',
    BOOKING_CONFIRMED: '#4ade80',
    BOOKING_CANCELLED: '#f87171',
  };

  if (!analytics && loading) {
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
          <h1 className="page-title">Analytics</h1>

          {analytics && (
            <>
              {/* Charts */}
              <div className="charts-grid">
                <div className="chart-card">
                  <h3 className="chart-title">Bookings (Last 30 Days)</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={analytics.bookingsOverTime}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        stroke="rgba(255,255,255,0.3)"
                        fontSize={11}
                      />
                      <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} />
                      <Tooltip
                        contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                        labelFormatter={(d) => new Date(d).toLocaleDateString()}
                      />
                      <Bar dataKey="count" fill="url(#barGradient)" radius={[4, 4, 0, 0]} />
                      <defs>
                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#a78bfa" />
                          <stop offset="100%" stopColor="#7c3aed" />
                        </linearGradient>
                      </defs>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="chart-card">
                  <h3 className="chart-title">Views vs Bookings</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={analytics.viewsOverTime}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        stroke="rgba(255,255,255,0.3)"
                        fontSize={11}
                      />
                      <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} />
                      <Tooltip
                        contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="count" name="Views" stroke="#60a5fa" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Top Events & Conversion */}
              <div className="analytics-grid">
                <div className="analytics-card">
                  <h3 className="chart-title">Top Events by Bookings</h3>
                  <div className="top-events-list">
                    {analytics.topEvents.map((event, i) => (
                      <div key={event.id} className="top-event-item">
                        <span className="top-event-rank">#{i + 1}</span>
                        <div className="top-event-info">
                          <span className="top-event-name">{event.title}</span>
                          <span className="top-event-stats">
                            {event.bookedSeats} / {event.totalSeats} booked
                          </span>
                        </div>
                        <span className="top-event-count">{event.bookingCount}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="analytics-card">
                  <h3 className="chart-title">Conversion by Event</h3>
                  <div className="conversion-list">
                    {analytics.conversionData.map((event) => (
                      <div key={event.id} className="conversion-item">
                        <span className="conversion-name">{event.title}</span>
                        <div className="conversion-bar">
                          <div
                            className="conversion-bar-fill"
                            style={{ width: `${Math.min(event.conversionRate, 100)}%` }}
                          />
                        </div>
                        <span className="conversion-rate">{event.conversionRate}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Activity Logs */}
          <div className="dashboard-section">
            <div className="section-header">
              <h2 className="section-title">Activity Logs</h2>
              <select
                className="filter-select"
                value={actionFilter}
                onChange={(e) => { setActionFilter(e.target.value); setLogPage(1); }}
              >
                <option value="">All Actions</option>
                <option value="EVENT_VIEWED">Event Viewed</option>
                <option value="BOOKING_STARTED">Booking Started</option>
                <option value="BOOKING_CONFIRMED">Booking Confirmed</option>
                <option value="BOOKING_CANCELLED">Booking Cancelled</option>
              </select>
            </div>

            {loading ? (
              <div className="page-center"><Spinner size="md" /></div>
            ) : logs.length === 0 ? (
              <div className="empty-state"><p>No activity logs found</p></div>
            ) : (
              <>
                <div className="logs-list">
                  {logs.map((log) => (
                    <div key={log.id} className="log-item">
                      <span className="log-action" style={{ color: actionColors[log.action] }}>
                        {log.action.replace(/_/g, ' ')}
                      </span>
                      <span className="log-detail">
                        {log.user?.name || 'Anonymous'} — {log.event?.title}
                      </span>
                      <span className="log-time">{timeAgo(log.createdAt)}</span>
                    </div>
                  ))}
                </div>
                <Pagination page={logPage} totalPages={logPagination.totalPages} onPageChange={setLogPage} />
              </>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
