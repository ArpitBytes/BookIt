import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import Navbar from '../components/layout/Navbar';
import EventCard from '../components/events/EventCard';
import SearchBar from '../components/common/SearchBar';
import EventFilters from '../components/events/EventFilters';
import Pagination from '../components/common/Pagination';
import Spinner from '../components/common/Spinner';
import { useDebounce } from '../hooks/useDebounce';
import './HomePage.css';

export default function HomePage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  const debouncedSearch = useDebounce(search, 300);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 9 };
      if (debouncedSearch) params.search = debouncedSearch;
      if (dateFilter) params.date = dateFilter;

      const res = await api.get('/events', { params });
      setEvents(res.data.events);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error('Failed to fetch events:', err);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, dateFilter, page]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Reset to page 1 when search or filter changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, dateFilter]);

  return (
    <>
      <Navbar />
      <main className="page">
        <div className="container">
          <div className="home-header">
            <div className="home-title-section">
              <h1 className="home-title">
                Discover <span className="gradient-text">Live Events</span>
              </h1>
              <p className="home-subtitle">
                Find and book the best conferences, workshops, and meetups near you
              </p>
            </div>
          </div>

          <div className="home-controls">
            <SearchBar value={search} onChange={setSearch} />
            <EventFilters dateFilter={dateFilter} onDateChange={setDateFilter} />
          </div>

          {loading ? (
            <div className="page-center">
              <Spinner size="lg" />
            </div>
          ) : events.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">🎭</span>
              <h3>No events found</h3>
              <p>Try adjusting your search or filter criteria</p>
            </div>
          ) : (
            <>
              <div className="events-grid">
                {events.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
              <Pagination
                page={page}
                totalPages={pagination.totalPages}
                onPageChange={setPage}
              />
            </>
          )}
        </div>
      </main>
    </>
  );
}
