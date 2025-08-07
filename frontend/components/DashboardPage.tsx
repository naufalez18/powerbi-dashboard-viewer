import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useDashboards } from '../contexts/DashboardContext';
import { useSettings } from '../contexts/SettingsContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  LogOut, 
  Play, 
  Pause, 
  Maximize, 
  Minimize, 
  Eye, 
  EyeOff,
  RotateCcw,
  Settings
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useUserActivity } from '../hooks/useUserActivity';
import { useAutoRotation } from '../hooks/useAutoRotation';
import { DashboardFrame } from './DashboardFrame';
import { ErrorBoundary } from './ErrorBoundary';
import { NavigationSkeleton } from './SkeletonLoader';
import { FullPageLoader } from './LoadingSpinner';
import mandiriLogo from '../assets/mandiri-logo.png';

export default function DashboardPage() {
  const { isAuthenticated, logout } = useAuth();
  const { dashboards } = useDashboards();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showNavigation, setShowNavigation] = useState(true);
  const [selectedDashboard, setSelectedDashboard] = useState('');
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isNavigationLoading, setIsNavigationLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const isUserActive = useUserActivity();
  const { 
    currentDashboardIndex, 
    isRotating, 
    timeRemaining, 
    startRotation, 
    stopRotation, 
    nextDashboard 
  } = useAutoRotation(dashboards, isUserActive, settings.rotationInterval);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    // Simulate initial loading
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (dashboards.length > 0 && !selectedDashboard) {
      setSelectedDashboard(dashboards[0].id);
    }
  }, [dashboards, selectedDashboard]);

  useEffect(() => {
    if (dashboards[currentDashboardIndex]) {
      setSelectedDashboard(dashboards[currentDashboardIndex].id);
    }
  }, [currentDashboardIndex, dashboards]);

  const handleLogout = () => {
    logout();
    navigate('/');
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
  };

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      try {
        await containerRef.current?.requestFullscreen();
        setIsFullscreen(true);
      } catch (error) {
        console.error('Error entering fullscreen:', error);
        toast({
          title: "Fullscreen Error",
          description: "Unable to enter fullscreen mode.",
          variant: "destructive",
        });
      }
    } else {
      try {
        await document.exitFullscreen();
        setIsFullscreen(false);
      } catch (error) {
        console.error('Error exiting fullscreen:', error);
      }
    }
  };

  const handleNavigationToggle = () => {
    setIsNavigationLoading(true);
    setTimeout(() => {
      setShowNavigation(!showNavigation);
      setIsNavigationLoading(false);
    }, 150);
  };

  const handleSettingsNavigation = () => {
    setIsNavigationLoading(true);
    setTimeout(() => {
      navigate('/settings');
    }, 200);
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      // Keyboard shortcuts
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 'f':
            event.preventDefault();
            toggleFullscreen();
            break;
          case 'h':
            event.preventDefault();
            handleNavigationToggle();
            break;
          case 'r':
            event.preventDefault();
            if (dashboards.length > 1) {
              isRotating ? stopRotation() : startRotation();
            }
            break;
          case 'n':
            event.preventDefault();
            if (dashboards.length > 1) {
              nextDashboard();
            }
            break;
        }
      }
      
      // Escape key to exit fullscreen or show navigation
      if (event.key === 'Escape') {
        if (isFullscreen) {
          document.exitFullscreen();
        } else if (!showNavigation) {
          setShowNavigation(true);
        }
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullscreen, showNavigation, dashboards.length, isRotating, startRotation, stopRotation, nextDashboard]);

  const currentDashboard = dashboards.find(d => d.id === selectedDashboard);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isAuthenticated) {
    return null;
  }

  if (isInitialLoading) {
    return <FullPageLoader text="Initializing Dashboard..." />;
  }

  return (
    <ErrorBoundary>
      <div 
        ref={containerRef} 
        className="min-h-screen bg-gray-50"
        role="main"
        aria-label="Dashboard Viewer Application"
      >
        {/* Navigation Bar */}
        {showNavigation && (
          <>
            {isNavigationLoading ? (
              <NavigationSkeleton />
            ) : (
              <nav 
                className="bg-white shadow-sm border-b border-gray-200 p-4"
                role="navigation"
                aria-label="Main navigation"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-3">
                      <img 
                        src={mandiriLogo} 
                        alt="Mandiri Logo" 
                        className="h-8 w-auto object-contain"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const fallback = document.createElement('div');
                          fallback.className = 'h-8 w-12 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-xs';
                          fallback.textContent = 'REO';
                          fallback.setAttribute('aria-label', 'REO Logo');
                          if (target.parentNode) {
                            target.parentNode.appendChild(fallback);
                          }
                        }}
                      />
                      <h1 className="text-xl font-semibold text-gray-900">
                        REO Dashboard Viewer
                      </h1>
                    </div>
                    <Badge 
                      variant={isUserActive ? "default" : "secondary"}
                      aria-label={`User status: ${isUserActive ? "Active" : "Idle"}`}
                    >
                      {isUserActive ? "Active" : "Idle"}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    {/* Dashboard Selector */}
                    <div className="flex items-center space-x-2">
                      <label 
                        htmlFor="dashboard-select"
                        className="text-sm font-medium text-gray-700"
                      >
                        Dashboard:
                      </label>
                      <Select 
                        value={selectedDashboard} 
                        onValueChange={setSelectedDashboard}
                      >
                        <SelectTrigger 
                          className="w-48"
                          id="dashboard-select"
                          aria-label="Select dashboard to view"
                        >
                          <SelectValue placeholder="Select dashboard" />
                        </SelectTrigger>
                        <SelectContent>
                          {dashboards.map((dashboard) => (
                            <SelectItem key={dashboard.id} value={dashboard.id}>
                              {dashboard.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Rotation Controls */}
                    {dashboards.length > 1 && (
                      <div 
                        className="flex items-center space-x-2"
                        role="group"
                        aria-label="Dashboard rotation controls"
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={isRotating ? stopRotation : startRotation}
                          className="flex items-center space-x-1"
                          aria-label={isRotating ? "Pause automatic rotation" : "Start automatic rotation"}
                          title={`${isRotating ? "Pause" : "Start"} rotation (Ctrl+R)`}
                        >
                          {isRotating ? (
                            <>
                              <Pause className="h-4 w-4" />
                              <span>Pause</span>
                            </>
                          ) : (
                            <>
                              <Play className="h-4 w-4" />
                              <span>Start</span>
                            </>
                          )}
                        </Button>
                        
                        {isRotating && (
                          <Badge 
                            variant="outline" 
                            className="text-xs"
                            aria-label={`Next dashboard in ${formatTime(timeRemaining)}`}
                          >
                            Next: {formatTime(timeRemaining)}
                          </Badge>
                        )}
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={nextDashboard}
                          className="flex items-center space-x-1"
                          aria-label="Go to next dashboard"
                          title="Next dashboard (Ctrl+N)"
                        >
                          <RotateCcw className="h-4 w-4" />
                          <span>Next</span>
                        </Button>
                      </div>
                    )}

                    {/* View Controls */}
                    <div 
                      className="flex items-center space-x-2"
                      role="group"
                      aria-label="View controls"
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSettingsNavigation}
                        className="flex items-center space-x-1"
                        aria-label="Open settings page"
                        disabled={isNavigationLoading}
                      >
                        <Settings className="h-4 w-4" />
                        <span>Settings</span>
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleNavigationToggle}
                        className="flex items-center space-x-1"
                        aria-label={showNavigation ? "Hide navigation bar" : "Show navigation bar"}
                        title={`${showNavigation ? "Hide" : "Show"} navigation (Ctrl+H)`}
                        disabled={isNavigationLoading}
                      >
                        {showNavigation ? (
                          <>
                            <EyeOff className="h-4 w-4" />
                            <span>Hide Nav</span>
                          </>
                        ) : (
                          <>
                            <Eye className="h-4 w-4" />
                            <span>Show Nav</span>
                          </>
                        )}
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={toggleFullscreen}
                        className="flex items-center space-x-1"
                        aria-label={isFullscreen ? "Exit fullscreen mode" : "Enter fullscreen mode"}
                        title={`${isFullscreen ? "Exit" : "Enter"} fullscreen (Ctrl+F)`}
                      >
                        {isFullscreen ? (
                          <>
                            <Minimize className="h-4 w-4" />
                            <span>Exit Fullscreen</span>
                          </>
                        ) : (
                          <>
                            <Maximize className="h-4 w-4" />
                            <span>Fullscreen</span>
                          </>
                        )}
                      </Button>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleLogout}
                      className="flex items-center space-x-1"
                      aria-label="Logout from application"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Logout</span>
                    </Button>
                  </div>
                </div>
              </nav>
            )}
          </>
        )}

        {/* Dashboard Content */}
        <main 
          className={`${showNavigation ? 'h-[calc(100vh-80px)]' : 'h-screen'} w-full`}
          aria-label="Dashboard content area"
        >
          {currentDashboard ? (
            <ErrorBoundary
              fallback={
                <div className="flex items-center justify-center h-full">
                  <Card className="w-96">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Settings className="h-5 w-5" />
                        <span>Dashboard Error</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 mb-4">
                        There was an error loading the dashboard component.
                      </p>
                      <Button
                        onClick={() => window.location.reload()}
                        className="w-full flex items-center space-x-2"
                      >
                        <Settings className="h-4 w-4" />
                        <span>Reload Page</span>
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              }
            >
              <DashboardFrame dashboard={currentDashboard} />
            </ErrorBoundary>
          ) : (
            <div className="flex items-center justify-center h-full">
              <Card className="w-96">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Settings className="h-5 w-5" />
                    <span>No Dashboard Available</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    {dashboards.length === 0 
                      ? "No dashboards have been configured yet."
                      : "Please select a dashboard from the dropdown menu above."
                    }
                  </p>
                  <Button
                    onClick={handleSettingsNavigation}
                    className="w-full flex items-center space-x-2"
                    aria-label="Go to settings to configure dashboards"
                    disabled={isNavigationLoading}
                  >
                    <Settings className="h-4 w-4" />
                    <span>Go to Settings</span>
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </main>

        {/* Floating Navigation Toggle (when nav is hidden) */}
        {!showNavigation && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleNavigationToggle}
            className="fixed top-4 right-4 z-50 bg-white shadow-lg"
            aria-label="Show navigation bar"
            title="Show navigation (Ctrl+H)"
            disabled={isNavigationLoading}
          >
            <Eye className="h-4 w-4" />
          </Button>
        )}

        {/* Keyboard shortcuts help (hidden, for screen readers) */}
        <div className="sr-only" aria-live="polite">
          <p>Keyboard shortcuts available:</p>
          <ul>
            <li>Ctrl+F: Toggle fullscreen</li>
            <li>Ctrl+H: Toggle navigation</li>
            <li>Ctrl+R: Start/stop rotation</li>
            <li>Ctrl+N: Next dashboard</li>
            <li>Escape: Exit fullscreen or show navigation</li>
          </ul>
        </div>
      </div>
    </ErrorBoundary>
  );
}
