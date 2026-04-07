import { useEffect, useMemo, useState } from 'react';

const DEFAULT_TTL = 5 * 60 * 1000;
const GLOBAL_CACHE = new Map();

const readPersistentCache = (cacheKey) => {
  try {
    const raw = localStorage.getItem(`data-cache:${cacheKey}`);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;

    return parsed;
  } catch (error) {
    console.warn('Failed to read persistent cache:', error);
    return null;
  }
};

const writePersistentCache = (cacheKey, entry) => {
  try {
    localStorage.setItem(`data-cache:${cacheKey}`, JSON.stringify(entry));
  } catch (error) {
    console.warn('Failed to write persistent cache:', error);
  }
};

const getCacheEntry = (cacheKey) => {
  return GLOBAL_CACHE.get(cacheKey) || readPersistentCache(cacheKey);
};

const setCacheEntry = (cacheKey, data) => {
  const entry = { data, timestamp: Date.now() };
  GLOBAL_CACHE.set(cacheKey, entry);
  writePersistentCache(cacheKey, entry);
};

const isFresh = (entry, ttl) => {
  if (!entry) return false;
  return Date.now() - entry.timestamp <= ttl;
};

export const useDataCache = (cacheKey, fetchFn, options = {}) => {
  const { ttl = DEFAULT_TTL, autoRefresh = false } = options;
  const [data, setData] = useState(() => {
    const cached = getCacheEntry(cacheKey);
    return cached?.data ?? null;
  });
  const [loading, setLoading] = useState(() => !isFresh(getCacheEntry(cacheKey), ttl));
  const [error, setError] = useState(null);

  const fetchData = async ({ force = false } = {}) => {
    const cached = getCacheEntry(cacheKey);

    if (!force && isFresh(cached, ttl)) {
      setData(cached.data);
      setLoading(false);
      setError(null);
      return cached.data;
    }

    if (cached && !force) {
      setData(cached.data);
      setLoading(false);
    } else if (!cached) {
      setLoading(true);
    }

    try {
      setError(null);
      const fetchedData = await fetchFn();
      setCacheEntry(cacheKey, fetchedData);
      setData(fetchedData);
      return fetchedData;
    } catch (fetchError) {
      console.error(`Error fetching data for ${cacheKey}:`, fetchError);
      setError(fetchError);
      throw fetchError;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const cached = getCacheEntry(cacheKey);
    if (!cached) {
      fetchData().catch(() => {});
      return;
    }

    setData(cached.data);
    setLoading(!isFresh(cached, ttl));

    if (!isFresh(cached, ttl)) {
      fetchData({ force: true }).catch(() => {});
    } else if (autoRefresh) {
      const timer = setTimeout(() => {
        fetchData({ force: true }).catch(() => {});
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [cacheKey, ttl, autoRefresh]);

  const refetch = () => fetchData({ force: true });

  const clearCache = () => {
    GLOBAL_CACHE.delete(cacheKey);
    try {
      localStorage.removeItem(`data-cache:${cacheKey}`);
    } catch (error) {
      console.warn('Failed to clear persistent cache:', error);
    }
    setData(null);
    setLoading(true);
    setError(null);
  };

  return useMemo(() => ({ data, loading, error, refetch, clearCache }), [data, loading, error]);
};
