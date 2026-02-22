import { useCallback, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

const REFRESH_INTERVAL_MS = 14 * 60 * 1000; // 14 minutes (access is 15m)

/**
 * Call refreshToken from AuthContext. Use this to attempt restore from cookie on load
 * or to refresh access token on an interval.
 */
export function useRefreshToken(): {
  attemptRestore: () => Promise<boolean>;
} {
  const { refreshToken, accessToken } = useAuth();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const attemptRestore = useCallback(async (): Promise<boolean> => {
    try {
      await refreshToken();
      return true;
    } catch {
      return false;
    }
  }, [refreshToken]);

  useEffect(() => {
    if (!accessToken) return;
    intervalRef.current = setInterval(async () => {
      try {
        await refreshToken();
      } catch {
        /* no-op */
      }
    }, REFRESH_INTERVAL_MS);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [accessToken, refreshToken]);

  return { attemptRestore };
}
