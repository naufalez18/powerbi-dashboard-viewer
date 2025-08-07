import { useState, useEffect, useRef, useCallback } from 'react';
import { Dashboard } from '../contexts/DashboardContext';

export function useAutoRotation(dashboards: Dashboard[], isUserActive: boolean, rotationIntervalSeconds: number = 60) {
  const [currentDashboardIndex, setCurrentDashboardIndex] = useState(0);
  const [isRotating, setIsRotating] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(rotationIntervalSeconds);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startRotation = useCallback(() => {
    setIsRotating(true);
    setTimeRemaining(rotationIntervalSeconds);
  }, [rotationIntervalSeconds]);

  const stopRotation = useCallback(() => {
    setIsRotating(false);
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }, []);

  const nextDashboard = useCallback(() => {
    if (dashboards.length > 0) {
      setCurrentDashboardIndex((prev) => (prev + 1) % dashboards.length);
      setTimeRemaining(rotationIntervalSeconds);
    }
  }, [dashboards.length, rotationIntervalSeconds]);

  // Update time remaining when rotation interval changes
  useEffect(() => {
    if (isRotating) {
      setTimeRemaining(rotationIntervalSeconds);
    }
  }, [rotationIntervalSeconds, isRotating]);

  useEffect(() => {
    if (isRotating && !isUserActive && dashboards.length > 1) {
      // Start countdown
      countdownRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            nextDashboard();
            return rotationIntervalSeconds;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (countdownRef.current) {
          clearInterval(countdownRef.current);
          countdownRef.current = null;
        }
      };
    } else {
      // Pause countdown when user is active
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    }
  }, [isRotating, isUserActive, dashboards.length, nextDashboard, rotationIntervalSeconds]);

  // Reset countdown when user becomes active
  useEffect(() => {
    if (isUserActive && isRotating) {
      setTimeRemaining(rotationIntervalSeconds);
    }
  }, [isUserActive, isRotating, rotationIntervalSeconds]);

  // Reset index if it's out of bounds (e.g., after deleting dashboards)
  useEffect(() => {
    if (currentDashboardIndex >= dashboards.length && dashboards.length > 0) {
      setCurrentDashboardIndex(0);
    }
  }, [dashboards.length, currentDashboardIndex]);

  return {
    currentDashboardIndex,
    isRotating,
    timeRemaining,
    startRotation,
    stopRotation,
    nextDashboard,
  };
}
