import { useState, useEffect } from 'react';
import { toInputDate } from '../../utils/formatDate';
import './EventForm.css';

export default function EventForm({ initialData, onSubmit, loading, isEdit }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    venue: '',
    date: '',
    totalSeats: '',
    price: '',
  });
  const [errors, setErrors] = useState({});

  // Resolve edit mode data pre-fill issue
  useEffect(() => {
    if (initialData) {
      setForm({
        title: initialData.title || '',
        description: initialData.description || '',
        venue: initialData.venue || '',
        date: initialData.date ? toInputDate(initialData.date) : '',
        totalSeats: initialData.totalSeats?.toString() || '',
        price: initialData.price?.toString() || '',
      });
    }
  }, [initialData]);

  const validate = () => {
    const newErrors = {};
    if (!form.title.trim() || form.title.length < 3) newErrors.title = 'Title must be at least 3 characters';
    if (!form.description.trim() || form.description.length < 10) newErrors.description = 'Description must be at least 10 characters';
    if (!form.venue.trim()) newErrors.venue = 'Venue is required';
    if (!form.date) newErrors.date = 'Date is required';
    if (form.date && new Date(form.date) <= new Date()) newErrors.date = 'Date must be in the future';
    if (!form.totalSeats || parseInt(form.totalSeats) < 1) newErrors.totalSeats = 'At least 1 seat required';
    if (form.price === '' || parseFloat(form.price) < 0) newErrors.price = 'Price must be 0 or greater';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      title: form.title.trim(),
      description: form.description.trim(),
      venue: form.venue.trim(),
      date: new Date(form.date).toISOString(),
      totalSeats: parseInt(form.totalSeats, 10),
      price: parseFloat(form.price),
    });
  };

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <form className="event-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="title" className="form-label">Event Title</label>
        <input
          id="title"
          type="text"
          className={`form-input ${errors.title ? 'form-input-error' : ''}`}
          placeholder="e.g., JavaScript Conference 2025"
          value={form.title}
          onChange={handleChange('title')}
        />
        {errors.title && <span className="form-error">{errors.title}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="description" className="form-label">Description</label>
        <textarea
          id="description"
          className={`form-input form-textarea ${errors.description ? 'form-input-error' : ''}`}
          placeholder="Describe your event..."
          value={form.description}
          onChange={handleChange('description')}
          rows={4}
        />
        {errors.description && <span className="form-error">{errors.description}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="venue" className="form-label">Venue</label>
        <input
          id="venue"
          type="text"
          className={`form-input ${errors.venue ? 'form-input-error' : ''}`}
          placeholder="e.g., Tech Convention Center, San Francisco"
          value={form.venue}
          onChange={handleChange('venue')}
        />
        {errors.venue && <span className="form-error">{errors.venue}</span>}
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="date" className="form-label">Event Date</label>
          <input
            id="date"
            type="date"
            className={`form-input ${errors.date ? 'form-input-error' : ''}`}
            value={form.date}
            onChange={handleChange('date')}
          />
          {errors.date && <span className="form-error">{errors.date}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="totalSeats" className="form-label">Total Seats</label>
          <input
            id="totalSeats"
            type="number"
            className={`form-input ${errors.totalSeats ? 'form-input-error' : ''}`}
            placeholder="100"
            min="1"
            value={form.totalSeats}
            onChange={handleChange('totalSeats')}
          />
          {errors.totalSeats && <span className="form-error">{errors.totalSeats}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="price" className="form-label">Price ($)</label>
          <input
            id="price"
            type="number"
            className={`form-input ${errors.price ? 'form-input-error' : ''}`}
            placeholder="0.00"
            min="0"
            step="0.01"
            value={form.price}
            onChange={handleChange('price')}
          />
          {errors.price && <span className="form-error">{errors.price}</span>}
        </div>
      </div>

      <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
        {loading ? 'Saving...' : isEdit ? 'Update Event' : 'Create Event'}
      </button>
    </form>
  );
}
