import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export interface Dashboard {
  id: string;
  name: string;
  url: string;
}

interface DashboardContextType {
  dashboards: Dashboard[];
  addDashboard: (dashboard: Omit<Dashboard, 'id'>) => void;
  updateDashboard: (id: string, dashboard: Omit<Dashboard, 'id'>) => void;
  deleteDashboard: (id: string) => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function useDashboards() {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboards must be used within a DashboardProvider');
  }
  return context;
}

interface DashboardProviderProps {
  children: ReactNode;
}

const defaultDashboards: Dashboard[] = [
  {
    id: 'dashboard-1',
    name: 'Sales Dashboard',
    url: 'https://app.powerbi.com/view?r=eyJrIjoiNTFkN2Q4ODEtMzVjZi00YTZlLWI5MDEtZjZkOTE5NjY3ODgwIiwidCI6IjRiZGJiZTdkLTYzZGYtNGU1Yy05NTNlLTkyODYzMTY4OTVlNiIsImMiOjEwfQ%3D%3D',
  },
  {
    id: 'dashboard-2',
    name: 'Marketing Dashboard',
    url: 'https://app.powerbi.com/view?r=eyJrIjoiN2U5YThjNGYtOGFjMi00M2FjLWI4OWUtNDYzNjNhOTMzZGQ5IiwidCI6IjRiZGJiZTdkLTYzZGYtNGU1Yy05NTNlLTkyODYzMTY4OTVlNiIsImMiOjEwfQ%3D%3D&pageName=5d09de0a920dc3d03aa6',
  },
  {
    id: 'dashboard-3',
    name: 'Financial Dashboard',
    url: 'https://app.powerbi.com/view?r=eyJrIjoiMzZhYmJmODMtMDRhNC00OTMwLWI0OWYtNTc5OWIzY2I1Yjc1IiwidCI6IjRiZGJiZTdkLTYzZGYtNGU1Yy05NTNlLTkyODYzMTY4OTVlNiIsImMiOjEwfQ%3D%3D',
  },
];

export function DashboardProvider({ children }: DashboardProviderProps) {
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);

  // Load dashboards from localStorage on mount
  useEffect(() => {
    const savedDashboards = localStorage.getItem('powerbi-dashboards');
    if (savedDashboards) {
      try {
        setDashboards(JSON.parse(savedDashboards));
      } catch (error) {
        console.error('Error parsing saved dashboards:', error);
        setDashboards(defaultDashboards);
      }
    } else {
      setDashboards(defaultDashboards);
    }
  }, []);

  // Save dashboards to localStorage whenever they change
  useEffect(() => {
    if (dashboards.length > 0) {
      localStorage.setItem('powerbi-dashboards', JSON.stringify(dashboards));
    }
  }, [dashboards]);

  const addDashboard = (dashboard: Omit<Dashboard, 'id'>) => {
    const newDashboard: Dashboard = {
      ...dashboard,
      id: `dashboard-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
    setDashboards(prev => [...prev, newDashboard]);
  };

  const updateDashboard = (id: string, updatedDashboard: Omit<Dashboard, 'id'>) => {
    setDashboards(prev => 
      prev.map(dashboard => 
        dashboard.id === id 
          ? { ...updatedDashboard, id }
          : dashboard
      )
    );
  };

  const deleteDashboard = (id: string) => {
    setDashboards(prev => prev.filter(dashboard => dashboard.id !== id));
  };

  return (
    <DashboardContext.Provider value={{
      dashboards,
      addDashboard,
      updateDashboard,
      deleteDashboard,
    }}>
      {children}
    </DashboardContext.Provider>
  );
}
