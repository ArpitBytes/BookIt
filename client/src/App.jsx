import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/layout/ProtectedRoute';
import HomePage from './pages/HomePage';
import EventDetailPage from './pages/EventDetailPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import MyBookingsPage from './pages/MyBookingsPage';
import OrganizerDashboard from './pages/OrganizerDashboard';
import CreateEventPage from './pages/CreateEventPage';
import EditEventPage from './pages/EditEventPage';
import EventAttendeesPage from './pages/EventAttendeesPage';
import AnalyticsPage from './pages/AnalyticsPage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/events/:id" element={<EventDetailPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* User-only routes */}
          <Route
            path="/bookings"
            element={
              <ProtectedRoute roles={['USER']}>
                <MyBookingsPage />
              </ProtectedRoute>
            }
          />

          {/* Organizer-only routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute roles={['ORGANIZER']}>
                <OrganizerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/events/new"
            element={
              <ProtectedRoute roles={['ORGANIZER']}>
                <CreateEventPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/events/:id/edit"
            element={
              <ProtectedRoute roles={['ORGANIZER']}>
                <EditEventPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/events/:id/attendees"
            element={
              <ProtectedRoute roles={['ORGANIZER']}>
                <EventAttendeesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/analytics"
            element={
              <ProtectedRoute roles={['ORGANIZER']}>
                <AnalyticsPage />
              </ProtectedRoute>
            }
          />

          {/* Catch-all */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
