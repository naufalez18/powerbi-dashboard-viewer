import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Zap } from 'lucide-react';
import { Dashboard } from '../contexts/DashboardContext';
import { DashboardSkeleton } from './SkeletonLoader';
import { LoadingSpinner } from './LoadingSpinner';
import { useDashboardPreloader } from '../hooks/useDashboardPreloader';
import { useConnectionPool } from '../hooks/useConnectionPool';

interface DashboardFrameProps {
  dashboard: Dashboard;
  className?: string;
  currentDashboardIndex: number;
  dashboards: Dashboard[];
}

export function DashboardFrame({ 
  dashboard, 
  className = '', 
  currentDashboardIndex, 
  dashboards 
}: DashboardFrameProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadMethod, setLoadMethod] = useState<'preloaded' | 'pooled' | 'fresh'>('fresh');
  const [loadTime, setLoadTime] = useState<number | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const loadStartTime = useRef<number>(0);

  const maxRetries = 3;
  const loadTimeout = 15000; // 15 seconds

  // Initialize preloader and connection pool
  const {
    getPreloadedIframe,
    removePreloadedDashboard,
    getPreloadStats,
    isPreloading,
  } = useDashboardPreloader(dashboards, currentDashboardIndex);

  const {
    acquireConnection,
    releaseConnection,
    getPoolStats,
    isWarmingUp,
  } = useConnectionPool(dashboards);

  useEffect(() => {
    loadDashboard();
    return () => {
      cleanup();
    };
  }, [dashboard.url, retryCount]); // eslint-disable-line react-hooks/exhaustive-deps

  const cleanup = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (progressRef.current) {
      clearInterval(progressRef.current);
      progressRef.current = null;
    }
  };

  const loadDashboard = async () => {
    setIsLoading(true);
    setHasError(false);
    setLoadingProgress(0);
    setLoadTime(null);
    loadStartTime.current = Date.now();
    
    // Start progress simulation
    let progress = 0;
    progressRef.current = setInterval(() => {
      progress += Math.random() * 10;
      if (progress > 85) progress = 85; // Don't complete until actual load
      setLoadingProgress(progress);
    }, 200);
    
    // Set timeout for loading
    timeoutRef.current = setTimeout(() => {
      if (isLoading) {
        setHasError(true);
        setIsLoading(false);
        setLoadingProgress(0);
        cleanup();
      }
    }, loadTimeout);

    try {
      // Try to get preloaded iframe first
      const preloadedIframe = getPreloadedIframe(dashboard.id);
      if (preloadedIframe) {
        await usePreloadedIframe(preloadedIframe);
        return;
      }

      // Try to get pooled connection
      const pooledIframe = await acquireConnection(dashboard.id);
      if (pooledIframe) {
        await usePooledIframe(pooledIframe);
        return;
      }

      // Fall back to fresh iframe
      await createFreshIframe();
    } catch (error) {
      console.error('Error loading dashboard:', error);
      handleError();
    }
  };

  const usePreloadedIframe = async (preloadedIframe: HTMLIFrameElement) => {
    try {
      setLoadMethod('preloaded');
      
      // Clone the preloaded iframe
      const clonedIframe = preloadedIframe.cloneNode(true) as HTMLIFrameElement;
      clonedIframe.style.cssText = `
        width: 100%;
        height: 100%;
        border: none;
        display: block;
      `;
      
      if (containerRef.current) {
        // Clear existing content
        containerRef.current.innerHTML = '';
        containerRef.current.appendChild(clonedIframe);
        iframeRef.current = clonedIframe;
      }

      // Remove the preloaded iframe since we've used it
      removePreloadedDashboard(dashboard.id);
      
      // Simulate a brief loading time for the clone
      await new Promise(resolve => setTimeout(resolve, 200));
      
      handleLoad();
      console.log(`Dashboard "${dashboard.name}" loaded from preloaded iframe`);
    } catch (error) {
      console.warn('Failed to use preloaded iframe:', error);
      // Fall back to pooled or fresh
      const pooledIframe = await acquireConnection(dashboard.id);
      if (pooledIframe) {
        await usePooledIframe(pooledIframe);
      } else {
        await createFreshIframe();
      }
    }
  };

  const usePooledIframe = async (pooledIframe: HTMLIFrameElement) => {
    try {
      setLoadMethod('pooled');
      
      // Move the pooled iframe to the display container
      if (containerRef.current && pooledIframe.parentNode) {
        // Clear existing content
        containerRef.current.innerHTML = '';
        pooledIframe.parentNode.removeChild(pooledIframe);
        containerRef.current.appendChild(pooledIframe);
        iframeRef.current = pooledIframe;
      }

      // Pooled iframe should already be loaded
      handleLoad();
      console.log(`Dashboard "${dashboard.name}" loaded from connection pool`);
    } catch (error) {
      console.warn('Failed to use pooled iframe:', error);
      // Release the connection and fall back to fresh
      releaseConnection(dashboard.id);
      await createFreshIframe();
    }
  };

  const createFreshIframe = async () => {
    return new Promise<void>((resolve, reject) => {
      setLoadMethod('fresh');
      
      const iframe = document.createElement('iframe');
      iframe.src = dashboard.url;
      iframe.style.cssText = `
        width: 100%;
        height: 100%;
        border: none;
        display: block;
      `;
      iframe.title = `${dashboard.name} - Power BI Dashboard`;
      iframe.setAttribute('allowfullscreen', 'true');
      iframe.setAttribute('aria-label', `Power BI dashboard: ${dashboard.name}`);
      iframe.setAttribute('role', 'application');

      const handleIframeLoad = () => {
        iframe.removeEventListener('load', handleIframeLoad);
        iframe.removeEventListener('error', handleIframeError);
        handleLoad();
        resolve();
      };

      const handleIframeError = () => {
        iframe.removeEventListener('load', handleIframeLoad);
        iframe.removeEventListener('error', handleIframeError);
        handleError();
        reject(new Error('Iframe failed to load'));
      };

      iframe.addEventListener('load', handleIframeLoad);
      iframe.addEventListener('error', handleIframeError);

      if (containerRef.current) {
        containerRef.current.innerHTML = '';
        containerRef.current.appendChild(iframe);
        iframeRef.current = iframe;
      }

      console.log(`Dashboard "${dashboard.name}" loading fresh iframe`);
    });
  };

  const handleLoad = () => {
    const totalLoadTime = Date.now() - loadStartTime.current;
    setLoadTime(totalLoadTime);
    setIsLoading(false);
    setHasError(false);
    setLoadingProgress(100);
    
    cleanup();
    
    // Complete the progress bar
    setTimeout(() => setLoadingProgress(0), 500);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    setLoadingProgress(0);
    setLoadTime(null);
    
    cleanup();
  };

  const handleRetry = () => {
    if (retryCount < maxRetries) {
      setRetryCount(prev => prev + 1);
    } else {
      // Force reload by changing the iframe src
      setRetryCount(0);
      loadDashboard();
    }
  };

  // Release pooled connection when component unmounts or dashboard changes
  useEffect(() => {
    return () => {
      if (loadMethod === 'pooled') {
        releaseConnection(dashboard.id);
      }
    };
  }, [dashboard.id, loadMethod, releaseConnection]);

  const getLoadMethodIcon = () => {
    switch (loadMethod) {
      case 'preloaded':
        return <Zap className="h-3 w-3 text-green-600" title="Loaded from preloaded cache" />;
      case 'pooled':
        return <Zap className="h-3 w-3 text-blue-600" title="Loaded from connection pool" />;
      default:
        return null;
    }
  };

  const getLoadMethodText = () => {
    switch (loadMethod) {
      case 'preloaded':
        return 'Preloaded';
      case 'pooled':
        return 'Pooled';
      case 'fresh':
        return 'Fresh';
      default:
        return 'Loading';
    }
  };

  if (hasError) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <span>Dashboard Load Error</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Unable to load "{dashboard.name}". This could be due to:
            </p>
            <ul className="text-sm text-gray-600 mb-4 list-disc list-inside space-y-1">
              <li>Network connectivity issues</li>
              <li>Dashboard permissions or access restrictions</li>
              <li>Power BI service unavailability</li>
              <li>Invalid or expired dashboard URL</li>
            </ul>
            <div className="flex flex-col space-y-2">
              <Button
                onClick={handleRetry}
                className="w-full flex items-center space-x-2"
                disabled={isLoading}
              >
                <RefreshCw className="h-4 w-4" />
                <span>Retry ({retryCount}/{maxRetries})</span>
              </Button>
              <p className="text-xs text-gray-500 text-center">
                Attempt {retryCount + 1} of {maxRetries + 1}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`relative h-full ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-white z-10">
          {/* Progress bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200">
            <div 
              className="h-full bg-blue-600 transition-all duration-300 ease-out"
              style={{ width: `${loadingProgress}%` }}
            />
          </div>
          
          {/* Loading content */}
          <div className="h-full">
            <DashboardSkeleton />
            
            {/* Loading overlay */}
            <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center">
              <div className="text-center space-y-4">
                <LoadingSpinner size="lg" />
                <div className="space-y-2">
                  <p className="text-lg font-medium text-gray-900">Loading Dashboard</p>
                  <p className="text-sm text-gray-600">"{dashboard.name}"</p>
                  <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
                    <span>Progress: {Math.round(loadingProgress)}%</span>
                    <span>•</span>
                    <span>Method: {getLoadMethodText()}</span>
                    {(isPreloading || isWarmingUp) && (
                      <>
                        <span>•</span>
                        <span className="flex items-center space-x-1">
                          <Zap className="h-3 w-3" />
                          <span>Optimizing...</span>
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Performance indicator */}
      {!isLoading && loadTime && (
        <div className="absolute top-2 right-2 z-20">
          <div className="flex items-center space-x-1 bg-white bg-opacity-90 rounded-full px-2 py-1 text-xs text-gray-600 shadow-sm">
            {getLoadMethodIcon()}
            <span>{loadTime}ms</span>
          </div>
        </div>
      )}
      
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
