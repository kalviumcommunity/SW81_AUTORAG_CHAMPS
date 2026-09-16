'use client';

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Array<'technician' | 'manager' | 'super_admin'>;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const location = useLocation();

  let userRole: string | null = null;
  let userObj: any = null;

  try {
    const savedUser = sessionStorage.getItem('aura_user') || localStorage.getItem('aura_user');
    const savedRole = sessionStorage.getItem('aura_role') || localStorage.getItem('aura_role');
    if (savedUser) {
      userObj = JSON.parse(savedUser);
      userRole = userObj?.role || savedRole;
    } else if (savedRole) {
      userRole = savedRole;
    }
  } catch (e) {}

  // Super Admin page handles its own secret PIN (8899) authentication and state
  const isSuperAdminAuth = sessionStorage.getItem('aura_super_admin_auth') === 'true';
  if (location.pathname === '/super-admin' || isSuperAdminAuth) {
    return <>{children}</>;
  }

  if (!userRole || !userObj) {
    toast.error('⚠️ Authentication required: Please sign in to access this workspace.');
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(userRole as any)) {
    toast.error(`⚠️ Access Denied: Your account role (${userRole}) does not have permission for this section.`);
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
