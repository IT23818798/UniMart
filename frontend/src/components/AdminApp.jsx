//frontend/src/components/AdminApp.jsx
import React, { useState, useEffect } from 'react';
import AdminDashboard from './AdminDashboard';
import HomePage from './HomePage';

const AdminApp = () => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    checkAuthStatus();
    
    // Listen for URL changes
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      
      if (!token) {
        // Check if we have stored admin data from recent login
        const storedAdminData = localStorage.getItem('adminData');
        if (storedAdminData && currentPath === '/admin-dashboard') {
          // Try to verify with server
          const response = await fetch('http://localhost:5000/api/admin/profile', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            credentials: 'include'
          });
          
          if (!response.ok) {
            localStorage.removeItem('adminData');
          }
        }
        setLoading(false);
        return;
      }

      const response = await fetch('http://localhost:5000/api/admin/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setAdmin(data.admin);
      } else {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminData');
      }
    } catch (error) {
      console.error('Auth check error:', error);
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminData');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    setAdmin(null);
    window.location.href = '/';
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#f8fafc',
        fontFamily: 'Inter, system-ui, sans-serif'
      }}>
        <div style={{
          textAlign: 'center'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid #e2e8f0',
            borderTop: '3px solid #dc2626',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          <p style={{ color: '#64748b' }}>Loading...</p>
        </div>
      </div>
    );
  }

  // Check if current path is admin dashboard
  const isAdminDashboard = currentPath === '/admin-dashboard';

  if (isAdminDashboard) {
    if (admin) {
      return <AdminDashboard admin={admin} onLogout={handleLogout} />;
    } else {
      // Check if we have stored admin data for immediate access
      const storedAdminData = localStorage.getItem('adminData');
      if (storedAdminData) {
        try {
          const adminData = JSON.parse(storedAdminData);
          return <AdminDashboard admin={adminData} onLogout={handleLogout} />;
        } catch (error) {
          console.error('Error parsing stored admin data:', error);
        }
      }
      
      // Redirect to home if not authenticated
      setTimeout(() => {
        window.location.href = '/';
      }, 100);
      return (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          background: '#f8fafc',
          fontFamily: 'Inter, system-ui, sans-serif'
        }}>
          <p style={{ color: '#64748b' }}>Redirecting to login...</p>
        </div>
      );
    }
  }

  return <HomePage />;
};

export default AdminApp;