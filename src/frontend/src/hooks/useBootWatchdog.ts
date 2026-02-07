import { useEffect, useState, useCallback } from 'react';

interface BootWatchdogOptions {
  isAuthenticated: boolean;
  actorInitializing: boolean;
  profileLoading: boolean;
  profileFetched: boolean;
  timeoutMs?: number;
}

interface BootWatchdogResult {
  isStuck: boolean;
  stuckReason: string | null;
  resetWatchdog: () => void;
}

/**
 * Boot watchdog hook that detects prolonged initialization states
 * and surfaces a recoverable error instead of spinning indefinitely.
 */
export function useBootWatchdog({
  isAuthenticated,
  actorInitializing,
  profileLoading,
  profileFetched,
  timeoutMs = 15000, // 15 seconds default
}: BootWatchdogOptions): BootWatchdogResult {
  const [isStuck, setIsStuck] = useState(false);
  const [stuckReason, setStuckReason] = useState<string | null>(null);

  const resetWatchdog = useCallback(() => {
    console.log('[BootWatchdog] Resetting watchdog state');
    setIsStuck(false);
    setStuckReason(null);
  }, []);

  useEffect(() => {
    // Only monitor authenticated users
    if (!isAuthenticated) {
      setIsStuck(false);
      setStuckReason(null);
      return;
    }

    // If profile is fetched, boot is complete
    if (profileFetched) {
      setIsStuck(false);
      setStuckReason(null);
      return;
    }

    console.log('[BootWatchdog] Starting watchdog timer');

    const timer = setTimeout(() => {
      console.log('[BootWatchdog] Timeout reached, checking state...');
      console.log('[BootWatchdog] State:', {
        actorInitializing,
        profileLoading,
        profileFetched,
      });

      // Determine what's stuck
      if (actorInitializing) {
        console.error('[BootWatchdog] Actor initialization stuck');
        setIsStuck(true);
        setStuckReason('Actor initialization timed out after 15 seconds. Please refresh and try again.');
      } else if (!profileFetched && profileLoading) {
        console.error('[BootWatchdog] Profile fetch stuck');
        setIsStuck(true);
        setStuckReason('Profile loading timed out after 15 seconds. Please refresh and try again.');
      } else if (!profileFetched && !profileLoading) {
        console.error('[BootWatchdog] Profile query never enabled');
        setIsStuck(true);
        setStuckReason('Profile query was not enabled. Please refresh and try again.');
      }
    }, timeoutMs);

    return () => {
      console.log('[BootWatchdog] Clearing watchdog timer');
      clearTimeout(timer);
    };
  }, [
    isAuthenticated,
    actorInitializing,
    profileLoading,
    profileFetched,
    timeoutMs,
  ]);

  return { isStuck, stuckReason, resetWatchdog };
}
