import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

/**
 * Generic data-fetching hook.
 * @param {string} url - API endpoint
 * @param {object} options - { params, immediate }
 */
export function useFetch(url, options = {}) {
  const { params = {}, immediate = true } = options;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(
    async (overrideParams = {}) => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(url, {
          params: { ...params, ...overrideParams },
        });
        setData(res.data);
        return res.data;
      } catch (err) {
        const message =
          err.response?.data?.error?.message || 'Something went wrong';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [url, JSON.stringify(params)]
  );

  useEffect(() => {
    if (immediate) {
      fetchData();
    }
  }, [fetchData, immediate]);

  return { data, loading, error, refetch: fetchData };
}
