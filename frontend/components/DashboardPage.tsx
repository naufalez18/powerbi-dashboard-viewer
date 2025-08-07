import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useDashboards } from '../contexts/DashboardContext';
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
import mandiriLogo from '../assets/mandiri-logo.png';

export default function DashboardPage() {
  const { isAuthenticated, logout } = useAuth();
  const { dashboards } = useDashboards();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showNavigation, setShowNavigation] = useState(true);
  const [selectedDashboard, setSelectedDashboard] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  
  const isUserActive = useUserActivity();
  const { 
    currentDashboardIndex, 
    isRotating, 
    timeRemaining, 
    startRotation, 
    stopRotation, 
    nextDashboard 
  } = useAutoRotation(dashboards, isUserActive);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

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

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const currentDashboard = dashboards.find(d => d.id === selectedDashboard);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div ref={containerRef} className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      {showNavigation && (
        <nav className="bg-white shadow-sm border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <img 
                  src={mandiriLogo} 
                  alt="Mandiri Logo" 
                  className="h-8 w-auto object-contain"
                  onError={(e) => {
                    // Fallback to a simple colored div if image fails to load
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const fallback = document.createElement('div');
                    fallback.className = 'h-8 w-12 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-xs';
                    fallback.textContent = 'REO';
                    if (target.parentNode) {
                      target.parentNode.appendChild(fallback);
                    }
                  }}
                />
                <h1 className="text-xl font-semibold text-gray-900">
                  REO Dashboard Viewer
                </h1>
              </div>
              <Badge variant={isUserActive ? "default" : "secondary"}>
                {isUserActive ? "Active" : "Idle"}
              </Badge>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Dashboard Selector */}
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Dashboard:</label>
                <Select value={selectedDashboard} onValueChange={setSelectedDashboard}>
                  <SelectTrigger className="w-48">
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
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={isRotating ? stopRotation : startRotation}
                    className="flex items-center space-x-1"
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
                    <Badge variant="outline" className="text-xs">
                      Next: {formatTime(timeRemaining)}
                    </Badge>
                  )}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={nextDashboard}
                    className="flex items-center space-x-1"
                  >
                    <RotateCcw className="h-4 w-4" />
                    <span>Next</span>
                  </Button>
                </div>
              )}

              {/* View Controls */}
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/settings')}
                  className="flex items-center space-x-1"
                >
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowNavigation(!showNavigation)}
                  className="flex items-center space-x-1"
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
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </Button>
            </div>
          </div>
        </nav>
      )}

      {/* Dashboard Content */}
      <div className={`${showNavigation ? 'h-[calc(100vh-80px)]' : 'h-screen'} w-full`}>
        {currentDashboard ? (
          <iframe
            src={currentDashboard.url}
            className="w-full h-full border-0"
            title={currentDashboard.name}
            allowFullScreen
          />
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
                  onClick={() => navigate('/settings')}
                  className="w-full flex items-center space-x-2"
                >
                  <Settings className="h-4 w-4" />
                  <span>Go to Settings</span>
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Floating Navigation Toggle (when nav is hidden) */}
      {!showNavigation && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowNavigation(true)}
          className="fixed top-4 right-4 z-50 bg-white shadow-lg"
        >
          <Eye className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
