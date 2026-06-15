import React from 'react';
import { Navigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'ADMIN' | 'PRO';
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole = 'PRO',
}) => {
  const { isAuthenticated, role, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(135deg, #1a0800, #3d1400)',
      }}>
        <div style={{ textAlign: 'center', color: 'rgba(255,180,120,0.8)' }}>
          <div style={{
            width: '40px', height: '40px', border: '3px solid rgba(255,107,0,0.3)',
            borderTopColor: '#ff6b00', borderRadius: '50%',
            animation: 'spin 0.8s linear infinite', margin: '0 auto 16px',
          }} />
          <p style={{ fontSize: '14px', fontFamily: 'Inter, sans-serif' }}>Loading…</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Not authenticated → go to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Wrong role → go to login (access denied)
  if (requiredRole && role !== requiredRole) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
