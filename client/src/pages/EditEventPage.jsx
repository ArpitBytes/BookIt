import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Navbar from '../components/layout/Navbar';
import EventForm from '../components/events/EventForm';
import Spinner from '../components/common/Spinner';
import Toast from '../components/common/Toast';

export default function EditEventPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'success' });

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await api.get(`/events/${id}`);
        setEvent(res.data.event);
      } catch {
        setToast({ message: 'Failed to load event', type: 'error' });
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id]);

  const handleSubmit = async (data) => {
    setSaving(true);
    try {
      await api.put(`/events/${id}`, data);
      setToast({ message: 'Event updated successfully!', type: 'success' });
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err) {
      const message = err.response?.data?.error?.message || 'Failed to update event';
      setToast({ message, type: 'error' });
    } finally {
      setSaving(false);
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

  return (
    <>
      <Navbar />
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />
      <main className="page">
        <div className="container">
          <h1 className="page-title">Edit Event</h1>
          <EventForm initialData={event} onSubmit={handleSubmit} loading={saving} isEdit />
        </div>
      </main>
    </>
  );
}
