import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axios';
import Navbar from '../components/layout/Navbar';
import Spinner from '../components/common/Spinner';
import Toast from '../components/common/Toast';
import { useAuth } from '../hooks/useAuth';
import { formatDateTime, formatCurrency } from '../utils/formatDate';
import './EventDetailPage.css';

export default function EventDetailPage() {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'success' });

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await api.get(`/events/${id}`);
        setEvent(res.data.event);
      } catch (err) {
        setToast({ message: 'Failed to load event', type: 'error' });
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id]);

  const handleBook = async () => {
    if (!isAuthenticated) {
      setToast({ message: 'Please login to book this event', type: 'error' });
      return;
    }
    setBookingLoading(true);
    try {
      await api.post('/bookings', { eventId: id });
      setToast({ message: 'Booking confirmed! 🎉', type: 'success' });
      // Refresh event data to update seat count
      const res = await api.get(`/events/${id}`);
      setEvent(res.data.event);
    } catch (err) {
      const message = err.response?.data?.error?.message || 'Booking failed';
      setToast({ message, type: 'error' });
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="page-center"><Spinner size="lg" /></div>
      </>
    );
  }

  if (!event) {
    return (
      <>
        <Navbar />
        <div className="page-center">
          <div className="empty-state">
            <span className="empty-icon">🔍</span>
            <h3>Event not found</h3>
          </div>
        </div>
      </>
    );
  }

  const isPast = new Date(event.date) < new Date();
  const seatsLeft = event.availableSeats;
  const seatPercentage = ((event.totalSeats - seatsLeft) / event.totalSeats) * 100;
  const isOrganizer = user?.role === 'ORGANIZER';

  return (
    <>
      <Navbar />
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />
      <main className="page">
        <div className="container">
          <div className="event-detail">
            <div className="event-detail-main">
              <div className="event-detail-badge">
                <span className="event-detail-month">
                  {new Date(event.date).toLocaleDateString('en-US', { month: 'short' })}
                </span>
                <span className="event-detail-day">{new Date(event.date).getDate()}</span>
              </div>

              <h1 className="event-detail-title">{event.title}</h1>

              <div className="event-detail-meta">
                <div className="meta-item">
                  <span className="meta-icon">📍</span>
                  <span>{event.venue}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-icon">🗓</span>
                  <span>{formatDateTime(event.date)}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-icon">👤</span>
                  <span>Organized by {event.organizer?.name}</span>
                </div>
              </div>

              <div className="event-detail-description">
                <h2>About this event</h2>
                <p>{event.description}</p>
              </div>
            </div>

            <div className="event-detail-sidebar">
              <div className="booking-card">
                <div className="booking-price">
                  {Number(event.price) === 0 ? (
                    <span className="price-free-lg">FREE</span>
                  ) : (
                    <span>{formatCurrency(event.price)}</span>
                  )}
                </div>

                <div className="booking-seats">
                  <div className="seats-bar-lg">
                    <div className="seats-bar-fill-lg" style={{ width: `${seatPercentage}%` }} />
                  </div>
                  <div className="seats-info">
                    <span className={seatsLeft <= 5 ? 'seats-low' : ''}>
                      {seatsLeft} seats left
                    </span>
                    <span className="seats-total">of {event.totalSeats}</span>
                  </div>
                </div>

                {isPast ? (
                  <button className="btn btn-primary btn-lg" disabled>
                    Event has ended
                  </button>
                ) : isOrganizer ? (
                  <button className="btn btn-primary btn-lg" disabled>
                    Organizers cannot book
                  </button>
                ) : seatsLeft <= 0 ? (
                  <button className="btn btn-primary btn-lg" disabled>
                    Sold out
                  </button>
                ) : (
                  <button
                    className="btn btn-primary btn-lg"
                    onClick={handleBook}
                    disabled={bookingLoading}
                  >
                    {bookingLoading ? 'Booking...' : 'Book Now 🎫'}
                  </button>
                )}

                {seatsLeft <= 5 && seatsLeft > 0 && !isPast && (
                  <p className="booking-urgency">🔥 Hurry! Only {seatsLeft} seats remaining</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
