import { useEffect } from 'react';
import { getAuth, getIdToken } from 'firebase/auth';

/**
 * Custom hook to handle device wake-up events.
 * Refreshes the Firebase Auth token when the document visibility changes to 'visible'.
 * @param {Function} onAuthFail - Callback triggered if token refresh fails.
 */
export const useWakeUpRoutine = (onAuthFail) => {
  useEffect(() => {
    const handleVisibilityChange = async () => {
      // document.visibilityState becomes 'visible' the moment the tablet wakes up
      if (document.visibilityState === 'visible') {
        console.log("System Awoken: Running health check...");
        
        const auth = getAuth();
        if (auth.currentUser) {
           try {
             // Passing 'true' forces Firebase to silently refresh the token
             await getIdToken(auth.currentUser, true);
             console.log("Auth token refreshed successfully.");
           } catch (err) {
             console.error("Auth token died during sleep.", err);
             // Trigger your logout / fallback logic
             if (onAuthFail) onAuthFail();
           }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [onAuthFail]);
};
