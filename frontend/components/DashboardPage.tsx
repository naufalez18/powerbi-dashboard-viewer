import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
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
import { powerBiDashboards } from '../config/dashboards';
import { useUserActivity } from '../hooks/useUserActivity';
import { useAutoRotation } from '../hooks/useAutoRotation';

export default function DashboardPage() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showNavigation, setShowNavigation] = useState(true);
  const [selectedDashboard, setSelectedDashboard] = useState(powerBiDashboards[0]?.id || '');
  const containerRef = useRef<HTMLDivElement>(null);
  
  const isUserActive = useUserActivity();
  const { 
    currentDashboardIndex, 
    isRotating, 
    timeRemaining, 
    startRotation, 
    stopRotation, 
    nextDashboard 
  } = useAutoRotation(powerBiDashboards, isUserActive);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (powerBiDashboards[currentDashboardIndex]) {
      setSelectedDashboard(powerBiDashboards[currentDashboardIndex].id);
    }
  }, [currentDashboardIndex]);

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

  const currentDashboard = powerBiDashboards.find(d => d.id === selectedDashboard);

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
              <h1 className="text-xl font-semibold text-gray-900">
                Power BI Dashboard Viewer
              </h1>
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
                    {powerBiDashboards.map((dashboard) => (
                      <SelectItem key={dashboard.id} value={dashboard.id}>
                        {dashboard.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Rotation Controls */}
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

              {/* View Controls */}
              <div className="flex items-center space-x-2">
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
                  <span>No Dashboard Selected</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Please select a dashboard from the dropdown menu above.
                </p>
                <p className="text-sm text-gray-500">
                  You can also configure dashboard URLs in the settings.
                </p>
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
