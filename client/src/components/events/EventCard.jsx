import { Link } from 'react-router-dom';
import { formatDate, formatCurrency } from '../../utils/formatDate';
import './EventCard.css';

export default function EventCard({ event }) {
  const seatsLeft = event.availableSeats;
  const totalSeats = event.totalSeats;
  const seatPercentage = ((totalSeats - seatsLeft) / totalSeats) * 100;
  const isPast = new Date(event.date) < new Date();

  return (
    <Link to={`/events/${event.id}`} className={`event-card ${isPast ? 'event-card-past' : ''}`}>
      <div className="event-card-header">
        <div className="event-card-date">
          <span className="event-card-month">
            {new Date(event.date).toLocaleDateString('en-US', { month: 'short' })}
          </span>
          <span className="event-card-day">
            {new Date(event.date).getDate()}
          </span>
        </div>
        <div className="event-card-price">
          {Number(event.price) === 0 ? (
            <span className="price-free">FREE</span>
          ) : (
            formatCurrency(event.price)
          )}
        </div>
      </div>

      <h3 className="event-card-title">{event.title}</h3>

      <div className="event-card-info">
        <span className="event-card-venue">📍 {event.venue}</span>
        <span className="event-card-time">🗓 {formatDate(event.date)}</span>
      </div>

      <div className="event-card-footer">
        <div className="seats-bar">
          <div
            className="seats-bar-fill"
            style={{ width: `${seatPercentage}%` }}
          />
        </div>
        <span className={`seats-text ${seatsLeft <= 5 ? 'seats-low' : ''} ${seatsLeft === 0 ? 'seats-sold-out' : ''}`}>
          {isPast ? 'Event ended' : seatsLeft === 0 ? '🚫 Sold Out' : `${seatsLeft} / ${totalSeats} seats left`}
        </span>
      </div>
    </Link>
  );
}
