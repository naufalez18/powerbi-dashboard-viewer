import { useState, useEffect, useRef, useCallback } from 'react';
import { Dashboard } from '../contexts/DashboardContext';

interface PooledConnection {
  id: string;
  iframe: HTMLIFrameElement;
  isActive: boolean;
  isLoaded: boolean;
  lastUsed: Date;
  loadTime: number;
  dashboard: Dashboard;
}

interface ConnectionPoolOptions {
  maxConnections?: number;
  idleTimeoutMs?: number;
  warmupDelayMs?: number;
}

export function useConnectionPool(
  dashboards: Dashboard[],
  options: ConnectionPoolOptions = {}
) {
  const {
    maxConnections = 5,
    idleTimeoutMs = 10 * 60 * 1000, // 10 minutes
    warmupDelayMs = 500,
  } = options;

  const [connectionPool, setConnectionPool] = useState<Map<string, PooledConnection>>(new Map());
  const [isWarmingUp, setIsWarmingUp] = useState(false);
  const poolContainerRef = useRef<HTMLDivElement | null>(null);
  const cleanupIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Create hidden container for pooled connections
  useEffect(() => {
    if (!poolContainerRef.current) {
      const container = document.createElement('div');
      container.id = 'connection-pool-container';
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
      poolContainerRef.current = container;
    }

    return () => {
      if (poolContainerRef.current) {
        document.body.removeChild(poolContainerRef.current);
        poolContainerRef.current = null;
      }
    };
  }, []);

  // Cleanup idle connections periodically
  useEffect(() => {
    cleanupIntervalRef.current = setInterval(() => {
      setConnectionPool(prev => {
        const now = new Date();
        const updated = new Map(prev);
        
        for (const [id, connection] of updated) {
          const timeSinceLastUse = now.getTime() - connection.lastUsed.getTime();
          if (!connection.isActive && timeSinceLastUse > idleTimeoutMs) {
            if (connection.iframe.parentNode) {
              connection.iframe.parentNode.removeChild(connection.iframe);
            }
            updated.delete(id);
            console.log(`Removed idle connection for dashboard: ${connection.dashboard.name}`);
          }
        }

        return updated;
      });
    }, 30000); // Check every 30 seconds

    return () => {
      if (cleanupIntervalRef.current) {
        clearInterval(cleanupIntervalRef.current);
        cleanupIntervalRef.current = null;
      }
    };
  }, [idleTimeoutMs]);

  const createPooledConnection = useCallback((dashboard: Dashboard): Promise<PooledConnection> => {
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
      iframe.title = `${dashboard.name} - Power BI Dashboard (Pooled)`;
      iframe.setAttribute('allowfullscreen', 'true');
      iframe.setAttribute('aria-label', `Power BI dashboard: ${dashboard.name} (pooled)`);
      iframe.setAttribute('role', 'application');

      const timeout = setTimeout(() => {
        reject(new Error(`Connection timeout for ${dashboard.name}`));
      }, 20000); // 20 second timeout for pool connections

      const handleLoad = () => {
        clearTimeout(timeout);
        iframe.removeEventListener('load', handleLoad);
        iframe.removeEventListener('error', handleError);
        
        const loadTime = Date.now() - startTime;
        const connection: PooledConnection = {
          id: dashboard.id,
          iframe,
          isActive: false,
          isLoaded: true,
          lastUsed: new Date(),
          loadTime,
          dashboard,
        };
        
        console.log(`Pooled connection for "${dashboard.name}" ready in ${loadTime}ms`);
        resolve(connection);
      };

      const handleError = () => {
        clearTimeout(timeout);
        iframe.removeEventListener('load', handleLoad);
        iframe.removeEventListener('error', handleError);
        reject(new Error(`Failed to create pooled connection for ${dashboard.name}`));
      };

      iframe.addEventListener('load', handleLoad);
      iframe.addEventListener('error', handleError);

      if (poolContainerRef.current) {
        poolContainerRef.current.appendChild(iframe);
      }
    });
  }, []);

  const warmUpPool = useCallback(async () => {
    if (dashboards.length === 0 || isWarmingUp) return;

    setIsWarmingUp(true);
    console.log('Warming up connection pool...');

    try {
      // Warm up connections for the first few dashboards
      const dashboardsToWarmUp = dashboards.slice(0, Math.min(maxConnections, dashboards.length));
      
      for (const dashboard of dashboardsToWarmUp) {
        if (!connectionPool.has(dashboard.id)) {
          try {
            const connection = await createPooledConnection(dashboard);
            setConnectionPool(prev => new Map(prev).set(dashboard.id, connection));
            
            // Add delay between connections to avoid overwhelming the browser
            await new Promise(resolve => setTimeout(resolve, warmupDelayMs));
          } catch (error) {
            console.warn(`Failed to warm up connection for "${dashboard.name}":`, error);
          }
        }
      }
    } finally {
      setIsWarmingUp(false);
      console.log('Connection pool warm-up complete');
    }
  }, [dashboards, maxConnections, connectionPool, createPooledConnection, warmupDelayMs, isWarmingUp]);

  const acquireConnection = useCallback(async (dashboardId: string): Promise<HTMLIFrameElement | null> => {
    const dashboard = dashboards.find(d => d.id === dashboardId);
    if (!dashboard) return null;

    let connection = connectionPool.get(dashboardId);
    
    if (connection && connection.isLoaded && !connection.isActive) {
      // Use existing pooled connection
      connection.isActive = true;
      connection.lastUsed = new Date();
      
      setConnectionPool(prev => new Map(prev).set(dashboardId, connection!));
      console.log(`Acquired pooled connection for "${dashboard.name}"`);
      return connection.iframe;
    }

    if (!connection) {
      // Create new connection if pool has space
      if (connectionPool.size < maxConnections) {
        try {
          connection = await createPooledConnection(dashboard);
          connection.isActive = true;
          setConnectionPool(prev => new Map(prev).set(dashboardId, connection!));
          console.log(`Created new pooled connection for "${dashboard.name}"`);
          return connection.iframe;
        } catch (error) {
          console.warn(`Failed to create pooled connection for "${dashboard.name}":`, error);
          return null;
        }
      } else {
        // Pool is full, find least recently used inactive connection
        let lruConnection: PooledConnection | null = null;
        let oldestTime = Date.now();
        
        for (const [, conn] of connectionPool) {
          if (!conn.isActive && conn.lastUsed.getTime() < oldestTime) {
            oldestTime = conn.lastUsed.getTime();
            lruConnection = conn;
          }
        }
        
        if (lruConnection) {
          // Reuse LRU connection
          if (lruConnection.iframe.parentNode) {
            lruConnection.iframe.parentNode.removeChild(lruConnection.iframe);
          }
          
          setConnectionPool(prev => {
            const updated = new Map(prev);
            updated.delete(lruConnection!.id);
            return updated;
          });
          
          try {
            connection = await createPooledConnection(dashboard);
            connection.isActive = true;
            setConnectionPool(prev => new Map(prev).set(dashboardId, connection!));
            console.log(`Replaced LRU connection for "${dashboard.name}"`);
            return connection.iframe;
          } catch (error) {
            console.warn(`Failed to replace connection for "${dashboard.name}":`, error);
            return null;
          }
        }
      }
    }

    return null;
  }, [dashboards, connectionPool, maxConnections, createPooledConnection]);

  const releaseConnection = useCallback((dashboardId: string) => {
    setConnectionPool(prev => {
      const updated = new Map(prev);
      const connection = updated.get(dashboardId);
      if (connection) {
        connection.isActive = false;
        connection.lastUsed = new Date();
        updated.set(dashboardId, connection);
        console.log(`Released connection for dashboard: ${connection.dashboard.name}`);
      }
      return updated;
    });
  }, []);

  const getPoolStats = useCallback(() => {
    const activeConnections = Array.from(connectionPool.values()).filter(c => c.isActive).length;
    const idleConnections = connectionPool.size - activeConnections;
    
    return {
      totalConnections: connectionPool.size,
      activeConnections,
      idleConnections,
      maxConnections,
      isWarmingUp,
      utilizationPercentage: (connectionPool.size / maxConnections) * 100,
    };
  }, [connectionPool, maxConnections, isWarmingUp]);

  // Warm up pool when dashboards change
  useEffect(() => {
    if (dashboards.length > 0) {
      // Delay warm-up to avoid interfering with initial page load
      const timeoutId = setTimeout(warmUpPool, 2000);
      return () => clearTimeout(timeoutId);
    }
  }, [dashboards, warmUpPool]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      connectionPool.forEach(connection => {
        if (connection.iframe.parentNode) {
          connection.iframe.parentNode.removeChild(connection.iframe);
        }
      });
    };
  }, [connectionPool]);

  return {
    acquireConnection,
    releaseConnection,
    warmUpPool,
    getPoolStats,
    isWarmingUp,
  };
}
