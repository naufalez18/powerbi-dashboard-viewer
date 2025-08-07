import { useState, useEffect, useRef } from 'react';

export function useUserActivity(timeoutMs: number = 5000) {
  const [isActive, setIsActive] = useState(true);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const resetTimeout = () => {
      setIsActive(true);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      timeoutRef.current = setTimeout(() => {
        setIsActive(false);
      }, timeoutMs);
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    // Set initial timeout
    resetTimeout();

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, resetTimeout, true);
    });

    return () => {
      // Cleanup
      events.forEach(event => {
        document.removeEventListener(event, resetTimeout, true);
      });
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [timeoutMs]);

  return isActive;
}
