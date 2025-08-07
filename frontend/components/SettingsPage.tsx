import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useDashboards, Dashboard } from '../contexts/DashboardContext';
import { useSettings } from '../contexts/SettingsContext';
import { useDashboardHealth } from '../hooks/useDashboardHealth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X,
  ExternalLink,
  Settings,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { ErrorBoundary } from './ErrorBoundary';
import { SettingsPageSkeleton, DashboardListSkeleton } from './SkeletonLoader';
import { LoadingSpinner } from './LoadingSpinner';

interface DashboardForm {
  name: string;
  url: string;
}

interface FormErrors {
  name?: string;
  url?: string;
}

const rotationOptions = [
  { value: 30, label: '30 seconds' },
  { value: 60, label: '1 minute' },
  { value: 120, label: '2 minutes' },
  { value: 300, label: '5 minutes' },
];

export default function SettingsPage() {
  const { isAuthenticated } = useAuth();
  const { dashboards, addDashboard, updateDashboard, deleteDashboard } = useDashboards();
  const { settings, updateSettings } = useSettings();
  const { healthStatus, checkHealth, isChecking } = useDashboardHealth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<DashboardForm>({ name: '', url: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isDashboardsLoading, setIsDashboardsLoading] = useState(false);
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);

  React.useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  React.useEffect(() => {
    // Simulate initial loading
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  React.useEffect(() => {
    if (!isInitialLoading) {
      // Check health of all dashboards on mount
      setIsDashboardsLoading(true);
      const timer = setTimeout(() => {
        dashboards.forEach(dashboard => {
          checkHealth(dashboard.id, dashboard.url);
        });
        setIsDashboardsLoading(false);
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [dashboards, checkHealth, isInitialLoading]);

  const validateForm = (data: DashboardForm): FormErrors => {
    const errors: FormErrors = {};

    // Validate name
    if (!data.name.trim()) {
      errors.name = 'Dashboard name is required';
    } else if (data.name.trim().length < 3) {
      errors.name = 'Dashboard name must be at least 3 characters';
    } else if (data.name.trim().length > 50) {
      errors.name = 'Dashboard name must be less than 50 characters';
    }

    // Validate URL
    if (!data.url.trim()) {
      errors.url = 'Dashboard URL is required';
    } else {
      try {
        const url = new URL(data.url);
        if (!['http:', 'https:'].includes(url.protocol)) {
          errors.url = 'URL must use HTTP or HTTPS protocol';
        }
      } catch {
        errors.url = 'Please enter a valid URL';
      }
    }

    // Check for duplicate names (excluding current item when editing)
    const existingDashboard = dashboards.find(d => 
      d.name.toLowerCase() === data.name.trim().toLowerCase() && 
      d.id !== editingId
    );
    if (existingDashboard) {
      errors.name = 'A dashboard with this name already exists';
    }

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedData = {
      name: formData.name.trim(),
      url: formData.url.trim(),
    };

    const validationErrors = validateForm(trimmedData);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length === 0) {
      setIsFormSubmitting(true);
      
      // Simulate form submission delay
      await new Promise(resolve => setTimeout(resolve, 500));

      if (editingId) {
        updateDashboard(editingId, trimmedData);
        toast({
          title: "Dashboard Updated",
          description: `"${trimmedData.name}" has been updated successfully.`,
        });
        setEditingId(null);
      } else {
        const newDashboard = addDashboard(trimmedData);
        // Check health of new dashboard
        setTimeout(() => {
          checkHealth(newDashboard.id, newDashboard.url);
        }, 100);
        toast({
          title: "Dashboard Added",
          description: `"${trimmedData.name}" has been added successfully.`,
        });
        setIsAddingNew(false);
      }
      setFormData({ name: '', url: '' });
      setIsFormSubmitting(false);
    }
  };

  const handleEdit = (dashboard: Dashboard) => {
    setEditingId(dashboard.id);
    setFormData({ name: dashboard.name, url: dashboard.url });
    setErrors({});
    setIsAddingNew(false);
  };

  const handleDelete = async (dashboard: Dashboard) => {
    if (window.confirm(`Are you sure you want to delete "${dashboard.name}"?`)) {
      setDeletingId(dashboard.id);
      
      // Simulate deletion delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      deleteDashboard(dashboard.id);
      toast({
        title: "Dashboard Deleted",
        description: `"${dashboard.name}" has been deleted.`,
        variant: "destructive",
      });
      setDeletingId(null);
    }
  };

  const handleCancel = () => {
    setIsAddingNew(false);
    setEditingId(null);
    setFormData({ name: '', url: '' });
    setErrors({});
  };

  const handleAddNew = () => {
    setIsAddingNew(true);
    setEditingId(null);
    setFormData({ name: '', url: '' });
    setErrors({});
  };

  const handleRotationIntervalChange = (value: string) => {
    updateSettings({ rotationInterval: parseInt(value) });
    toast({
      title: "Settings Updated",
      description: `Rotation interval set to ${rotationOptions.find(opt => opt.value === parseInt(value))?.label}.`,
    });
  };

  const handleBackToDashboard = () => {
    setIsNavigating(true);
    setTimeout(() => {
      navigate('/dashboard');
    }, 200);
  };

  const getHealthStatusIcon = (dashboardId: string) => {
    const status = healthStatus[dashboardId];
    if (!status) {
      return <Clock className="h-4 w-4 text-gray-400" aria-label="Status unknown" />;
    }

    switch (status.status) {
      case 'online':
        return <CheckCircle className="h-4 w-4 text-green-600" aria-label="Online" />;
      case 'offline':
        return <XCircle className="h-4 w-4 text-red-600" aria-label="Offline" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" aria-label="Error" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" aria-label="Checking" />;
    }
  };

  const getHealthStatusText = (dashboardId: string) => {
    const status = healthStatus[dashboardId];
    if (!status) return 'Unknown';
    
    switch (status.status) {
      case 'online':
        return 'Online';
      case 'offline':
        return 'Offline';
      case 'error':
        return `Error: ${status.error}`;
      default:
        return 'Checking...';
    }
  };

  const handleRefreshHealth = () => {
    setIsDashboardsLoading(true);
    setTimeout(() => {
      dashboards.forEach(dashboard => {
        checkHealth(dashboard.id, dashboard.url);
      });
      setIsDashboardsLoading(false);
    }, 200);
    
    toast({
      title: "Health Check Started",
      description: "Checking the status of all dashboards...",
    });
  };

  if (!isAuthenticated) {
    return null;
  }

  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm border-b border-gray-200 p-4">
          <div className="flex items-center space-x-4">
            <div className="h-8 w-20 bg-gray-200 rounded animate-pulse" />
            <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
          </div>
        </nav>
        <SettingsPageSkeleton />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        {/* Navigation Bar */}
        <nav 
          className="bg-white shadow-sm border-b border-gray-200 p-4"
          role="navigation"
          aria-label="Settings navigation"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBackToDashboard}
                className="flex items-center space-x-2"
                aria-label="Return to dashboard"
                disabled={isNavigating}
              >
                {isNavigating ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <ArrowLeft className="h-4 w-4" />
                )}
                <span>Back to Dashboard</span>
              </Button>
              
              <div className="flex items-center space-x-3">
                <div className="h-8 w-12 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-xs">
                  REO
                </div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Dashboard Settings
                </h1>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto p-6" role="main">
          {/* General Settings */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>General Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Label htmlFor="rotation-interval" className="text-sm font-medium text-gray-700 min-w-0 flex-shrink-0">
                    Auto-rotation interval:
                  </Label>
                  <Select 
                    value={settings.rotationInterval.toString()} 
                    onValueChange={handleRotationIntervalChange}
                  >
                    <SelectTrigger 
                      className="w-48"
                      id="rotation-interval"
                      aria-label="Select rotation interval"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {rotationOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value.toString()}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dashboard Management */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
                  <Settings className="h-6 w-6" />
                  <span>Manage Dashboards</span>
                </h2>
                <p className="text-gray-600 mt-1">
                  Add, edit, or remove Power BI dashboard URLs
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefreshHealth}
                  disabled={isChecking || isDashboardsLoading}
                  className="flex items-center space-x-2"
                  aria-label="Refresh health status of all dashboards"
                >
                  <RefreshCw className={`h-4 w-4 ${(isChecking || isDashboardsLoading) ? 'animate-spin' : ''}`} />
                  <span>Check Health</span>
                </Button>
                <Button
                  onClick={handleAddNew}
                  disabled={isAddingNew || editingId !== null || isFormSubmitting}
                  className="flex items-center space-x-2"
                  aria-label="Add new dashboard"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Dashboard</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Add/Edit Form */}
          {(isAddingNew || editingId) && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>
                  {editingId ? 'Edit Dashboard' : 'Add New Dashboard'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="dashboard-name">Dashboard Name *</Label>
                      <Input
                        id="dashboard-name"
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., Sales Dashboard"
                        className={errors.name ? 'border-red-500' : ''}
                        aria-describedby={errors.name ? 'name-error' : undefined}
                        aria-invalid={!!errors.name}
                        disabled={isFormSubmitting}
                      />
                      {errors.name && (
                        <p id="name-error" className="text-sm text-red-600" role="alert">
                          {errors.name}
                        </p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="dashboard-url">Dashboard URL *</Label>
                      <Input
                        id="dashboard-url"
                        type="url"
                        value={formData.url}
                        onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                        placeholder="https://app.powerbi.com/view?r=..."
                        className={errors.url ? 'border-red-500' : ''}
                        aria-describedby={errors.url ? 'url-error' : undefined}
                        aria-invalid={!!errors.url}
                        disabled={isFormSubmitting}
                      />
                      {errors.url && (
                        <p id="url-error" className="text-sm text-red-600" role="alert">
                          {errors.url}
                        </p>
                      )}
                    </div>
                  </div>

                  <Alert>
                    <AlertDescription>
                      <strong>Tip:</strong> To get the Power BI dashboard URL, open your dashboard in Power BI, 
                      click "File" → "Embed" → "Website or portal" and copy the URL from the embed code.
                    </AlertDescription>
                  </Alert>

                  <div className="flex items-center space-x-2">
                    <Button 
                      type="submit" 
                      className="flex items-center space-x-2"
                      disabled={isFormSubmitting}
                    >
                      {isFormSubmitting ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      <span>{editingId ? 'Update' : 'Add'} Dashboard</span>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancel}
                      className="flex items-center space-x-2"
                      disabled={isFormSubmitting}
                    >
                      <X className="h-4 w-4" />
                      <span>Cancel</span>
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Dashboard List */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Current Dashboards ({dashboards.length})
            </h3>
            
            {isDashboardsLoading ? (
              <DashboardListSkeleton />
            ) : dashboards.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Dashboards</h3>
                  <p className="text-gray-600 mb-4">
                    Get started by adding your first Power BI dashboard.
                  </p>
                  <Button 
                    onClick={handleAddNew} 
                    className="flex items-center space-x-2"
                    aria-label="Add your first dashboard"
                    disabled={isAddingNew || editingId !== null}
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Your First Dashboard</span>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {dashboards.map((dashboard) => (
                  <Card 
                    key={dashboard.id} 
                    className={`${editingId === dashboard.id ? 'ring-2 ring-blue-500' : ''} ${deletingId === dashboard.id ? 'opacity-50' : ''}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-medium text-gray-900">{dashboard.name}</h4>
                            <div className="flex items-center space-x-1">
                              {getHealthStatusIcon(dashboard.id)}
                              <Badge 
                                variant={
                                  healthStatus[dashboard.id]?.status === 'online' 
                                    ? 'default' 
                                    : healthStatus[dashboard.id]?.status === 'offline' || healthStatus[dashboard.id]?.status === 'error'
                                    ? 'destructive'
                                    : 'secondary'
                                }
                                className="text-xs"
                                aria-label={`Dashboard status: ${getHealthStatusText(dashboard.id)}`}
                              >
                                {getHealthStatusText(dashboard.id)}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <p className="text-sm text-gray-600 truncate max-w-md">
                              {dashboard.url}
                            </p>
                            <a
                              href={dashboard.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800"
                              aria-label={`Open ${dashboard.name} in new tab`}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => checkHealth(dashboard.id, dashboard.url)}
                            disabled={isChecking || deletingId === dashboard.id}
                            className="flex items-center space-x-1"
                            aria-label={`Check health status of ${dashboard.name}`}
                          >
                            <RefreshCw className={`h-4 w-4 ${isChecking ? 'animate-spin' : ''}`} />
                            <span>Check</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(dashboard)}
                            disabled={isAddingNew || (editingId !== null && editingId !== dashboard.id) || isFormSubmitting || deletingId === dashboard.id}
                            className="flex items-center space-x-1"
                            aria-label={`Edit ${dashboard.name}`}
                          >
                            <Edit className="h-4 w-4" />
                            <span>Edit</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(dashboard)}
                            disabled={isAddingNew || editingId !== null || isFormSubmitting || deletingId !== null}
                            className="flex items-center space-x-1 text-red-600 hover:text-red-800"
                            aria-label={`Delete ${dashboard.name}`}
                          >
                            {deletingId === dashboard.id ? (
                              <LoadingSpinner size="sm" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                            <span>Delete</span>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </ErrorBoundary>
  );
}
