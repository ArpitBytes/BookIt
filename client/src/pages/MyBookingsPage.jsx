import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import Navbar from '../components/layout/Navbar';
import Pagination from '../components/common/Pagination';
import Spinner from '../components/common/Spinner';
import Toast from '../components/common/Toast';
import Modal from '../components/common/Modal';
import { formatDateTime, formatCurrency } from '../utils/formatDate';
import './MyBookingsPage.css';

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const [cancelModal, setCancelModal] = useState({ open: false, bookingId: null });
  const [cancelLoading, setCancelLoading] = useState(false);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/bookings', { params: { page, limit: 10 } });
      setBookings(res.data.bookings);
      setPagination(res.data.pagination);
    } catch {
      setToast({ message: 'Failed to load bookings', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleCancel = async () => {
    setCancelLoading(true);
    try {
      await api.patch(`/bookings/${cancelModal.bookingId}/cancel`);
      setToast({ message: 'Booking cancelled successfully', type: 'success' });
      setCancelModal({ open: false, bookingId: null });
      fetchBookings();
    } catch (err) {
      const message = err.response?.data?.error?.message || 'Cancellation failed';
      setToast({ message, type: 'error' });
    } finally {
      setCancelLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />
      <Modal
        isOpen={cancelModal.open}
        title="Cancel Booking"
        message="Are you sure you want to cancel this booking? This action cannot be undone."
        confirmText={cancelLoading ? 'Cancelling...' : 'Yes, Cancel'}
        onConfirm={handleCancel}
        onCancel={() => setCancelModal({ open: false, bookingId: null })}
      />
      <main className="page">
        <div className="container">
          <h1 className="page-title">My Bookings</h1>

          {loading ? (
            <div className="page-center"><Spinner size="lg" /></div>
          ) : bookings.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">🎫</span>
              <h3>No bookings yet</h3>
              <p>Browse events and book your first ticket!</p>
            </div>
          ) : (
            <>
              <div className="bookings-list">
                {bookings.map((booking) => (
                  <div key={booking.id} className={`booking-item ${booking.status === 'CANCELLED' ? 'booking-cancelled' : ''}`}>
                    <div className="booking-event">
                      <h3 className="booking-event-title">{booking.event.title}</h3>
                      <div className="booking-event-meta">
                        <span>📍 {booking.event.venue}</span>
                        <span>🗓 {formatDateTime(booking.event.date)}</span>
                        <span>💰 {formatCurrency(booking.event.price)}</span>
                      </div>
                    </div>
                    <div className="booking-status-section">
                      <span className={`booking-status status-${booking.status.toLowerCase()}`}>
                        {booking.status}
                      </span>
                      <span className="booking-date">
                        Booked {formatDateTime(booking.bookedAt)}
                      </span>
                      {booking.status === 'CONFIRMED' && (
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => setCancelModal({ open: true, bookingId: booking.id })}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <Pagination page={page} totalPages={pagination.totalPages} onPageChange={setPage} />
            </>
          )}
        </div>
      </main>
    </>
  );
}
