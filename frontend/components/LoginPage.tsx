import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff } from 'lucide-react';
import { ErrorBoundary } from './ErrorBoundary';
import { LoadingSpinner } from './LoadingSpinner';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    // Simulate initial page load
    const timer = setTimeout(() => {
      setIsPageLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate authentication delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const success = login(username, password);
    if (success) {
      // Add a small delay before navigation for better UX
      await new Promise(resolve => setTimeout(resolve, 300));
      navigate('/dashboard');
    } else {
      setError('Invalid username or password');
    }
    setIsLoading(false);
  };

  if (isPageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardContent className="p-8">
            <div className="text-center space-y-4">
              <div className="h-16 w-16 bg-gray-200 rounded-full mx-auto animate-pulse" />
              <div className="space-y-2">
                <div className="h-6 w-32 bg-gray-200 rounded mx-auto animate-pulse" />
                <div className="h-4 w-48 bg-gray-200 rounded mx-auto animate-pulse" />
              </div>
              <LoadingSpinner size="md" text="Loading..." />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-white rounded-full shadow-sm">
                <div className="h-12 w-16 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-sm">
                  REO
                </div>
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              REO Dashboard
            </CardTitle>
            <CardDescription className="text-gray-600">
              Sign in to access your dashboards
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  required
                  className="w-full"
                  aria-describedby={error ? 'login-error' : undefined}
                  aria-invalid={!!error}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="w-full pr-10"
                    aria-describedby={error ? 'login-error' : undefined}
                    aria-invalid={!!error}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              {error && (
                <Alert variant="destructive" role="alert">
                  <AlertDescription id="login-error">{error}</AlertDescription>
                </Alert>
              )}
              <Button
                type="submit"
                className="w-full flex items-center justify-center space-x-2"
                disabled={isLoading}
                aria-describedby={isLoading ? 'loading-status' : undefined}
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Sign In</span>
                )}
              </Button>
              {isLoading && (
                <div id="loading-status" className="sr-only" aria-live="polite">
                  Signing in, please wait...
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </ErrorBoundary>
  );
}
