import { useState, useEffect, useRef, useCallback } from 'react';

interface Dashboard {
  id: string;
  name: string;
  url: string;
}

export function useAutoRotation(dashboards: Dashboard[], isUserActive: boolean) {
  const [currentDashboardIndex, setCurrentDashboardIndex] = useState(0);
  const [isRotating, setIsRotating] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(60); // 1 minute in seconds
  const intervalRef = useRef<NodeJS.Timeout>();
  const countdownRef = useRef<NodeJS.Timeout>();

  const ROTATION_INTERVAL = 60000; // 1 minute in milliseconds

  const startRotation = useCallback(() => {
    setIsRotating(true);
    setTimeRemaining(60);
  }, []);

  const stopRotation = useCallback(() => {
    setIsRotating(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }
  }, []);

  const nextDashboard = useCallback(() => {
    if (dashboards.length > 0) {
      setCurrentDashboardIndex((prev) => (prev + 1) % dashboards.length);
      setTimeRemaining(60);
    }
  }, [dashboards.length]);

  useEffect(() => {
    if (isRotating && !isUserActive && dashboards.length > 1) {
      // Start countdown
      countdownRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            nextDashboard();
            return 60;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (countdownRef.current) {
          clearInterval(countdownRef.current);
        }
      };
    } else {
      // Pause countdown when user is active
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    }
  }, [isRotating, isUserActive, dashboards.length, nextDashboard]);

  // Reset countdown when user becomes active
  useEffect(() => {
    if (isUserActive && isRotating) {
      setTimeRemaining(60);
    }
  }, [isUserActive, isRotating]);

  return {
    currentDashboardIndex,
    isRotating,
    timeRemaining,
    startRotation,
    stopRotation,
    nextDashboard,
  };
}
