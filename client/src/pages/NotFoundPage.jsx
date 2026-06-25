import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';

export default function NotFoundPage() {
  return (
    <>
      <Navbar />
      <main className="page">
        <div className="container" style={{ textAlign: 'center', paddingTop: '4rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔍</div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
            404 — Page Not Found
          </h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
          <Link to="/" className="btn btn-primary">
            Back to Events
          </Link>
        </div>
      </main>
    </>
  );
}
