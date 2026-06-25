import './EventFilters.css';

export default function EventFilters({ dateFilter, onDateChange }) {
  return (
    <div className="event-filters">
      <div className="filter-group">
        <label className="filter-label" htmlFor="date-filter">Filter by date</label>
        <input
          id="date-filter"
          type="date"
          className="filter-input"
          value={dateFilter}
          onChange={(e) => onDateChange(e.target.value)}
        />
      </div>
      {dateFilter && (
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => onDateChange('')}
        >
          Clear filter
        </button>
      )}
    </div>
  );
}
