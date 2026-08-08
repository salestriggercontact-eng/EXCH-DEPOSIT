import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../api/axios';

const UnlockContext = createContext(null);

export function UnlockProvider({ children }) {
  const [isUnlocked, setIsUnlocked] = useState(null); // null = still loading
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setLoading(true);
    return api
      .get('/dashboard/home')
      .then((res) => setIsUnlocked(res.data.summary.isUnlocked))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return <UnlockContext.Provider value={{ isUnlocked, loading, refresh }}>{children}</UnlockContext.Provider>;
}

export function useUnlock() {
  const ctx = useContext(UnlockContext);
  if (!ctx) throw new Error('useUnlock must be used inside UnlockProvider');
  return ctx;
}
