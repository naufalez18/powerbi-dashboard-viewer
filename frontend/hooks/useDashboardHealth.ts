import { useState, useCallback } from 'react';

export interface HealthStatus {
  status: 'online' | 'offline' | 'error' | 'checking';
  lastChecked: Date;
  error?: string;
}

export function useDashboardHealth() {
  const [healthStatus, setHealthStatus] = useState<Record<string, HealthStatus>>({});
  const [isChecking, setIsChecking] = useState(false);

  const checkHealth = useCallback(async (dashboardId: string, url: string) => {
    setIsChecking(true);
    setHealthStatus(prev => ({
      ...prev,
      [dashboardId]: {
        status: 'checking',
        lastChecked: new Date(),
      }
    }));

    try {
      // Create a simple health check by trying to fetch the URL
      // Note: This might be blocked by CORS, but we can still detect some issues
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      try {
        const response = await fetch(url, {
          method: 'HEAD',
          mode: 'no-cors', // This will help avoid CORS issues
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // With no-cors mode, we can't read the response status
        // But if the fetch completes without error, the URL is likely accessible
        setHealthStatus(prev => ({
          ...prev,
          [dashboardId]: {
            status: 'online',
            lastChecked: new Date(),
          }
        }));
      } catch (fetchError) {
        clearTimeout(timeoutId);
        
        if (fetchError instanceof Error) {
          if (fetchError.name === 'AbortError') {
            setHealthStatus(prev => ({
              ...prev,
              [dashboardId]: {
                status: 'error',
                lastChecked: new Date(),
                error: 'Request timeout'
              }
            }));
          } else {
            // For CORS errors or network errors, we'll try a different approach
            // Create an iframe to test if the URL loads
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            iframe.src = url;
            
            const checkPromise = new Promise<void>((resolve, reject) => {
              const timeout = setTimeout(() => {
                document.body.removeChild(iframe);
                reject(new Error('Iframe load timeout'));
              }, 5000);

              iframe.onload = () => {
                clearTimeout(timeout);
                document.body.removeChild(iframe);
                resolve();
              };

              iframe.onerror = () => {
                clearTimeout(timeout);
                document.body.removeChild(iframe);
                reject(new Error('Failed to load in iframe'));
              };
            });

            document.body.appendChild(iframe);

            try {
              await checkPromise;
              setHealthStatus(prev => ({
                ...prev,
                [dashboardId]: {
                  status: 'online',
                  lastChecked: new Date(),
                }
              }));
            } catch (iframeError) {
              setHealthStatus(prev => ({
                ...prev,
                [dashboardId]: {
                  status: 'offline',
                  lastChecked: new Date(),
                  error: iframeError instanceof Error ? iframeError.message : 'Unknown error'
                }
              }));
            }
          }
        } else {
          setHealthStatus(prev => ({
            ...prev,
            [dashboardId]: {
              status: 'error',
              lastChecked: new Date(),
              error: 'Unknown error occurred'
            }
          }));
        }
      }
    } catch (error) {
      setHealthStatus(prev => ({
        ...prev,
        [dashboardId]: {
          status: 'error',
          lastChecked: new Date(),
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }));
    } finally {
      setIsChecking(false);
    }
  }, []);

  return {
    healthStatus,
    checkHealth,
    isChecking,
  };
}
