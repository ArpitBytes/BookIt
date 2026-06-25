import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axios';
import Navbar from '../components/layout/Navbar';
import Spinner from '../components/common/Spinner';
import Pagination from '../components/common/Pagination';
import { formatDateTime } from '../utils/formatDate';
import './EventAttendeesPage.css';

export default function EventAttendeesPage() {
  const { id } = useParams();
  const [attendees, setAttendees] = useState([]);
  const [eventTitle, setEventTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  const fetchAttendees = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/dashboard/events/${id}/attendees`, {
        params: { page, limit: 15 },
      });
      setAttendees(res.data.attendees);
      setEventTitle(res.data.eventTitle);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error('Failed to load attendees:', err);
    } finally {
      setLoading(false);
    }
  }, [id, page]);

  useEffect(() => {
    fetchAttendees();
  }, [fetchAttendees]);

  return (
    <>
      <Navbar />
      <main className="page">
        <div className="container">
          <h1 className="page-title">Attendees</h1>
          {eventTitle && <p className="page-subtitle">For: {eventTitle}</p>}

          {loading ? (
            <div className="page-center"><Spinner size="lg" /></div>
          ) : attendees.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">👥</span>
              <h3>No attendees yet</h3>
              <p>Share your event to get bookings!</p>
            </div>
          ) : (
            <>
              <div className="attendees-table-wrapper">
                <table className="attendees-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Booked At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendees.map((a, i) => (
                      <tr key={a.bookingId}>
                        <td>{(page - 1) * 15 + i + 1}</td>
                        <td className="attendee-name">{a.name}</td>
                        <td>{a.email}</td>
                        <td>{formatDateTime(a.bookedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination page={page} totalPages={pagination.totalPages} onPageChange={setPage} />
            </>
          )}
        </div>
      </main>
    </>
  );
}
