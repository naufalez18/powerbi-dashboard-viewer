import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Dashboard } from '../contexts/DashboardContext';
import { DashboardSkeleton } from './SkeletonLoader';
import { LoadingSpinner } from './LoadingSpinner';

interface DashboardFrameProps {
  dashboard: Dashboard;
  className?: string;
}

export function DashboardFrame({ dashboard, className = '' }: DashboardFrameProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const progressRef = useRef<NodeJS.Timeout>();

  const maxRetries = 3;
  const loadTimeout = 15000; // 15 seconds

  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
    setLoadingProgress(0);
    
    // Simulate loading progress
    let progress = 0;
    progressRef.current = setInterval(() => {
      progress += Math.random() * 15;
      if (progress > 90) progress = 90; // Don't complete until actual load
      setLoadingProgress(progress);
    }, 200);
    
    // Set a timeout for loading
    timeoutRef.current = setTimeout(() => {
      if (isLoading) {
        setHasError(true);
        setIsLoading(false);
        setLoadingProgress(0);
      }
    }, loadTimeout);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (progressRef.current) {
        clearInterval(progressRef.current);
      }
    };
  }, [dashboard.url, retryCount]);

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
    setLoadingProgress(100);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (progressRef.current) {
      clearInterval(progressRef.current);
    }
    
    // Complete the progress bar
    setTimeout(() => setLoadingProgress(0), 500);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    setLoadingProgress(0);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (progressRef.current) {
      clearInterval(progressRef.current);
    }
  };

  const handleRetry = () => {
    if (retryCount < maxRetries) {
      setRetryCount(prev => prev + 1);
    } else {
      // Force reload by changing the iframe src
      if (iframeRef.current) {
        const url = new URL(dashboard.url);
        url.searchParams.set('_retry', Date.now().toString());
        iframeRef.current.src = url.toString();
        setRetryCount(0);
      }
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
                    <span>Please wait...</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      <iframe
        ref={iframeRef}
        src={dashboard.url}
        className="w-full h-full border-0"
        title={`${dashboard.name} - Power BI Dashboard`}
        onLoad={handleLoad}
        onError={handleError}
        allowFullScreen
        aria-label={`Power BI dashboard: ${dashboard.name}`}
        role="application"
      />
    </div>
  );
}
