import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import '@/app/globals.css';
import { ThemeProvider } from '@/context/ThemeContext';
import { SmoothScroll } from '@/components/SmoothScroll';
import LoginPage from '@/app/page';
import TechnicianDashboardPage from '@/app/technician-dashboard/page';
import ManagerPortalPage from '@/app/manager-portal/page';
import SuperAdminPage from '@/app/super-admin/page';
import SupportPage from '@/app/support/page';

import { ProtectedRoute } from '@/components/ProtectedRoute';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <SmoothScroll>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route 
              path="/technician-dashboard" 
              element={
                <ProtectedRoute allowedRoles={['technician']}>
                  <TechnicianDashboardPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/manager-portal" 
              element={
                <ProtectedRoute allowedRoles={['manager']}>
                  <ManagerPortalPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/super-admin" 
              element={
                <ProtectedRoute allowedRoles={['super_admin']}>
                  <SuperAdminPage />
                </ProtectedRoute>
              } 
            />
            <Route path="/support" element={<SupportPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Toaster 
            position="bottom-right" 
            toastOptions={{
              style: {
                background: 'var(--card)',
                border: '1px solid var(--border)',
                color: 'var(--foreground)',
              },
            }}
          />
        </BrowserRouter>
      </SmoothScroll>
    </ThemeProvider>
  </React.StrictMode>
);
