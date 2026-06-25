import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Navbar from '../components/layout/Navbar';
import EventForm from '../components/events/EventForm';
import Toast from '../components/common/Toast';
import './CreateEventPage.css';

export default function CreateEventPage() {
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const navigate = useNavigate();

  const handleSubmit = async (data) => {
    setLoading(true);
    try {
      await api.post('/events', data);
      setToast({ message: 'Event created successfully! 🎉', type: 'success' });
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err) {
      const message = err.response?.data?.error?.message || 'Failed to create event';
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
        <div className="container">
          <h1 className="page-title">Create New Event</h1>
          <EventForm onSubmit={handleSubmit} loading={loading} />
        </div>
      </main>
    </>
  );
}
