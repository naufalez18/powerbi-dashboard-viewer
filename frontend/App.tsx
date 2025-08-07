import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import DashboardPage from './components/DashboardPage';
import SettingsPage from './components/SettingsPage';
import { AuthProvider } from './contexts/AuthContext';
import { DashboardProvider } from './contexts/DashboardContext';
import { Toaster } from '@/components/ui/toaster';

export default function App() {
  return (
    <AuthProvider>
      <DashboardProvider>
        <Router>
          <div className="min-h-screen bg-gray-100">
            <Routes>
              <Route path="/" element={<LoginPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
            <Toaster />
          </div>
        </Router>
      </DashboardProvider>
    </AuthProvider>
  );
}
