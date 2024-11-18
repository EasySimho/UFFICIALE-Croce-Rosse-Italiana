import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { LoginPage } from './components/LoginPage';
import { Dashboard } from './components/Dashboard';
import { StoragePage } from './components/StoragePage';
import { PrivateRoute } from './components/PrivateRoute';
import { useAuth } from './contexts/AuthContext';

function AuthenticatedRoute({ children }: { children: React.ReactNode }) {
  const { userRole } = useAuth();
  const location = useLocation();

  if (userRole === 'operator' && location.pathname === '/storage') {
    return <Navigate to="/dashboard" replace />;
  }
  
  if (userRole === 'storage' && location.pathname === '/dashboard') {
    return <Navigate to="/storage" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <AuthenticatedRoute>
                    <Dashboard />
                  </AuthenticatedRoute>
                </PrivateRoute>
              }
            />
            <Route
              path="/storage"
              element={
                <PrivateRoute>
                  <AuthenticatedRoute>
                    <StoragePage />
                  </AuthenticatedRoute>
                </PrivateRoute>
              }
            />
            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;