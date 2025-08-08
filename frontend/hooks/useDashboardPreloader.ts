import { useState, useEffect, useRef, useCallback } from 'react';
import { Dashboard } from '../contexts/DashboardContext';

interface PreloadedDashboard {
  id: string;
  iframe: HTMLIFrameElement;
  isLoaded: boolean;
  loadTime: number;
  lastUsed: Date;
}

interface PreloaderOptions {
  maxPreloadedDashboards?: number;
  preloadTimeoutMs?: number;
  cleanupIntervalMs?: number;
}

export function useDashboardPreloader(
  dashboards: Dashboard[],
  currentDashboardIndex: number,
  options: PreloaderOptions = {}
) {
  const {
    maxPreloadedDashboards = 3,
    preloadTimeoutMs = 15000,
    cleanupIntervalMs = 60000,
  } = options;

  const [preloadedDashboards, setPreloadedDashboards] = useState<Map<string, PreloadedDashboard>>(new Map());
  const [isPreloading, setIsPreloading] = useState(false);
  const preloadContainerRef = useRef<HTMLDivElement | null>(null);
  const cleanupIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Create hidden container for preloaded iframes
  useEffect(() => {
    if (!preloadContainerRef.current) {
      const container = document.createElement('div');
      container.id = 'dashboard-preload-container';
      container.style.cssText = `
        position: fixed;
        top: -9999px;
        left: -9999px;
        width: 1px;
        height: 1px;
        overflow: hidden;
        visibility: hidden;
        pointer-events: none;
        z-index: -1;
      `;
      document.body.appendChild(container);
      preloadContainerRef.current = container;
    }

    return () => {
      if (preloadContainerRef.current) {
        document.body.removeChild(preloadContainerRef.current);
        preloadContainerRef.current = null;
      }
    };
  }, []);

  // Cleanup old preloaded dashboards periodically
  useEffect(() => {
    cleanupIntervalRef.current = setInterval(() => {
      setPreloadedDashboards(prev => {
        const now = new Date();
        const updated = new Map(prev);
        
        // Remove dashboards that haven't been used in the last 5 minutes
        for (const [id, preloaded] of updated) {
          const timeSinceLastUse = now.getTime() - preloaded.lastUsed.getTime();
          if (timeSinceLastUse > 5 * 60 * 1000) { // 5 minutes
            if (preloaded.iframe.parentNode) {
              preloaded.iframe.parentNode.removeChild(preloaded.iframe);
            }
            updated.delete(id);
          }
        }

        return updated;
      });
    }, cleanupIntervalMs);

    return () => {
      if (cleanupIntervalRef.current) {
        clearInterval(cleanupIntervalRef.current);
        cleanupIntervalRef.current = null;
      }
    };
  }, [cleanupIntervalMs]);

  const createPreloadedIframe = useCallback((dashboard: Dashboard): Promise<HTMLIFrameElement> => {
    return new Promise((resolve, reject) => {
      const iframe = document.createElement('iframe');
      const startTime = Date.now();
      
      iframe.src = dashboard.url;
      iframe.style.cssText = `
        width: 100%;
        height: 100%;
        border: none;
        display: block;
      `;
      iframe.title = `${dashboard.name} - Power BI Dashboard (Preloaded)`;
      iframe.setAttribute('allowfullscreen', 'true');
      iframe.setAttribute('aria-label', `Power BI dashboard: ${dashboard.name} (preloaded)`);
      iframe.setAttribute('role', 'application');

      const timeout = setTimeout(() => {
        reject(new Error(`Preload timeout for ${dashboard.name}`));
      }, preloadTimeoutMs);

      const handleLoad = () => {
        clearTimeout(timeout);
        iframe.removeEventListener('load', handleLoad);
        iframe.removeEventListener('error', handleError);
        
        const loadTime = Date.now() - startTime;
        console.log(`Dashboard "${dashboard.name}" preloaded in ${loadTime}ms`);
        resolve(iframe);
      };

      const handleError = () => {
        clearTimeout(timeout);
        iframe.removeEventListener('load', handleLoad);
        iframe.removeEventListener('error', handleError);
        reject(new Error(`Failed to preload ${dashboard.name}`));
      };

      iframe.addEventListener('load', handleLoad);
      iframe.addEventListener('error', handleError);

      if (preloadContainerRef.current) {
        preloadContainerRef.current.appendChild(iframe);
      }
    });
  }, [preloadTimeoutMs]);

  const preloadDashboard = useCallback(async (dashboard: Dashboard) => {
    if (preloadedDashboards.has(dashboard.id)) {
      // Update last used time
      setPreloadedDashboards(prev => {
        const updated = new Map(prev);
        const existing = updated.get(dashboard.id);
        if (existing) {
          existing.lastUsed = new Date();
          updated.set(dashboard.id, existing);
        }
        return updated;
      });
      return;
    }

    try {
      setIsPreloading(true);
      const iframe = await createPreloadedIframe(dashboard);
      
      setPreloadedDashboards(prev => {
        const updated = new Map(prev);
        
        // Remove oldest if we're at the limit
        if (updated.size >= maxPreloadedDashboards) {
          let oldestId = '';
          let oldestTime = Date.now();
          
          for (const [id, preloaded] of updated) {
            if (preloaded.lastUsed.getTime() < oldestTime) {
              oldestTime = preloaded.lastUsed.getTime();
              oldestId = id;
            }
          }
          
          if (oldestId) {
            const oldest = updated.get(oldestId);
            if (oldest && oldest.iframe.parentNode) {
              oldest.iframe.parentNode.removeChild(oldest.iframe);
            }
            updated.delete(oldestId);
          }
        }

        updated.set(dashboard.id, {
          id: dashboard.id,
          iframe,
          isLoaded: true,
          loadTime: Date.now(),
          lastUsed: new Date(),
        });

        return updated;
      });
    } catch (error) {
      console.warn(`Failed to preload dashboard "${dashboard.name}":`, error);
    } finally {
      setIsPreloading(false);
    }
  }, [preloadedDashboards, maxPreloadedDashboards, createPreloadedIframe]);

  // Preload next dashboards when current index changes
  useEffect(() => {
    if (dashboards.length <= 1) return;

    const preloadNext = async () => {
      // Preload the next 2 dashboards in rotation
      const indicesToPreload = [
        (currentDashboardIndex + 1) % dashboards.length,
        (currentDashboardIndex + 2) % dashboards.length,
      ];

      for (const index of indicesToPreload) {
        const dashboard = dashboards[index];
        if (dashboard && !preloadedDashboards.has(dashboard.id)) {
          await preloadDashboard(dashboard);
          // Add a small delay between preloads to avoid overwhelming the browser
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    };

    // Delay preloading slightly to let the current dashboard settle
    const timeoutId = setTimeout(preloadNext, 1000);

    return () => clearTimeout(timeoutId);
  }, [currentDashboardIndex, dashboards, preloadedDashboards, preloadDashboard]);

  const getPreloadedIframe = useCallback((dashboardId: string): HTMLIFrameElement | null => {
    const preloaded = preloadedDashboards.get(dashboardId);
    if (preloaded && preloaded.isLoaded) {
      // Update last used time
      preloaded.lastUsed = new Date();
      return preloaded.iframe;
    }
    return null;
  }, [preloadedDashboards]);

  const removePreloadedDashboard = useCallback((dashboardId: string) => {
    setPreloadedDashboards(prev => {
      const updated = new Map(prev);
      const preloaded = updated.get(dashboardId);
      if (preloaded && preloaded.iframe.parentNode) {
        preloaded.iframe.parentNode.removeChild(preloaded.iframe);
      }
      updated.delete(dashboardId);
      return updated;
    });
  }, []);

  const getPreloadStats = useCallback(() => {
    const stats = {
      totalPreloaded: preloadedDashboards.size,
      maxCapacity: maxPreloadedDashboards,
      isPreloading,
      preloadedIds: Array.from(preloadedDashboards.keys()),
    };
    return stats;
  }, [preloadedDashboards, maxPreloadedDashboards, isPreloading]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      preloadedDashboards.forEach(preloaded => {
        if (preloaded.iframe.parentNode) {
          preloaded.iframe.parentNode.removeChild(preloaded.iframe);
        }
      });
    };
  }, [preloadedDashboards]);

  return {
    preloadDashboard,
    getPreloadedIframe,
    removePreloadedDashboard,
    getPreloadStats,
    isPreloading,
  };
}
