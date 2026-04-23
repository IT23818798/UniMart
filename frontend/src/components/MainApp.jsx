import React, { useState, useEffect, Suspense, lazy } from 'react';

const HomePage = lazy(() => import('./HomePage'));
const AdminDashboard = lazy(() => import('./AdminDashboard'));
const SellerDashboard = lazy(() => import('./SellerDashboard'));
const BuyerDashboard = lazy(() => import('./BuyerDashboard'));

const RouteFallback = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    background: '#f8fafc',
    fontFamily: 'Inter, system-ui, sans-serif'
  }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{
        width: '40px',
        height: '40px',
        border: '3px solid #e2e8f0',
        borderTop: '3px solid #16a34a',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        margin: '0 auto 1rem'
      }} />
      <p style={{ color: '#64748b' }}>Loading...</p>
    </div>
  </div>
);

const MainApp = () => {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState(null);

  useEffect(() => {
    checkAuthAndRoute();
    
    // Listen for URL changes
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
      checkAuthAndRoute();
    };
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const checkAuthAndRoute = async () => {
    setLoading(true);
    const path = window.location.pathname;

    try {
      if (path === '/admin-dashboard') {
        await checkAdminAuth();
      } else if (path === '/seller-dashboard') {
        await checkSellerAuth();
      } else if (path === '/buyer-dashboard') {
        await checkBuyerAuth();
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setLoading(false);
    }
  };

  const checkAdminAuth = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const storedData = localStorage.getItem('adminData');

      if (!token && !storedData) {
        redirectToHome();
        return;
      }

      if (storedData) {
        const adminData = JSON.parse(storedData);
        setUser(adminData);
        setUserType('admin');
        setLoading(false);

        if (token) {
          void (async () => {
            try {
              const response = await fetch('http://localhost:5000/api/admin/profile', {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                },
                credentials: 'include'
              });

              if (response.ok) {
                const data = await response.json();
                setUser(data.data.admin);
                setUserType('admin');
              }
            } catch (backgroundError) {
              console.error('Admin background auth check failed:', backgroundError);
            }
          })();
        }
        return;
      }

      if (storedData && !token) {
        return; // User authenticated with stored data only
      }

      if (token) {
        const response = await fetch('http://127.0.0.1:5000/api/admin/profile', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data.data.admin);
          setUserType('admin');
        } else {
          if (!storedData) {
            clearAuth('admin');
            redirectToHome();
            return;
          }
        }
      }
    } catch (error) {
      const storedData = localStorage.getItem('adminData');
      if (!storedData) {
        clearAuth('admin');
        redirectToHome();
      }
    } finally {
      setLoading(false);
    }
  };

  const checkSellerAuth = async () => {
    try {
      const token = localStorage.getItem('sellerToken');
      const storedData = localStorage.getItem('sellerData');

      if (!token && !storedData) {
        redirectToHome();
        return;
      }

      if (storedData) {
        const sellerData = JSON.parse(storedData);
        setUser(sellerData);
        setUserType('seller');
        setLoading(false);

        if (token) {
          void (async () => {
            try {
              const response = await fetch('http://localhost:5000/api/seller/profile', {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                },
                credentials: 'include'
              });

              if (response.ok) {
                const data = await response.json();
                setUser(data.data.seller);
                setUserType('seller');
              }
            } catch (backgroundError) {
              console.error('Seller background auth check failed:', backgroundError);
            }
          })();
        }
        return;
      }

      if (storedData && !token) {
        return; // User authenticated with stored data only
      }

      if (token) {
        const response = await fetch('http://127.0.0.1:5000/api/seller/profile', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data.data.seller);
          setUserType('seller');
        } else {
          if (!storedData) {
            clearAuth('seller');
            redirectToHome();
            return;
          }
        }
      }
    } catch (error) {
      const storedData = localStorage.getItem('sellerData');
      if (!storedData) {
        clearAuth('seller');
        redirectToHome();
      }
    } finally {
      setLoading(false);
    }
  };

  const checkBuyerAuth = async () => {
    try {
      const token = localStorage.getItem('buyerToken');
      const storedData = localStorage.getItem('buyerData');
      
      console.log('Buyer auth check - Token:', !!token, 'StoredData:', !!storedData);

      if (!token && !storedData) {
        console.log('No buyer token or stored data found, redirecting to home');
        redirectToHome();
        return;
      }

      // Set user from stored data first (immediate display)
      if (storedData) {
        const buyerData = JSON.parse(storedData);
        console.log('Setting buyer from stored data:', buyerData.firstName);
        setUser(buyerData);
        setUserType('buyer');
        setLoading(false);

        if (token) {
          void (async () => {
            try {
              const response = await fetch('http://localhost:5000/api/buyer/profile', {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                },
                credentials: 'include'
              });

              if (response.ok) {
                const data = await response.json();
                setUser(data.data.buyer);
                setUserType('buyer');
              } else {
                // Stale/invalid token should not keep user on protected route.
                clearAuth('buyer');
                redirectToHome();
              }
            } catch (backgroundError) {
              console.error('Buyer background auth check failed:', backgroundError);
              clearAuth('buyer');
              redirectToHome();
            }
          })();
        }
        return;
      }

      // Buyer dashboard is protected; stored data alone is not enough.
      if (storedData && !token) {
        console.log('Stored buyer data found without token, redirecting to login');
        clearAuth('buyer');
        redirectToHome();
        return;
      }

      // If we have a token, verify it with the API
      if (token) {
        console.log('Verifying buyer token with API');
        const response = await fetch('http://127.0.0.1:5000/api/buyer/profile', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });

        if (response.ok) {
          const data = await response.json();
          console.log('Buyer profile API response successful');
          setUser(data.data.buyer);
          setUserType('buyer');
        } else {
          console.log('Buyer profile API response failed:', response.status);
          // Only redirect if we also don't have stored data
          if (!storedData) {
            clearAuth('buyer');
            redirectToHome();
            return;
          } else {
            console.log('API failed but using stored data');
          }
        }
      }
    } catch (error) {
      console.error('Buyer auth error:', error);
      // Only redirect if we don't have stored data to fall back on
      const storedData = localStorage.getItem('buyerData');
      if (!storedData) {
        clearAuth('buyer');
        redirectToHome();
      } else {
        console.log('Auth error but using stored data');
      }
    } finally {
      setLoading(false);
    }
  };

  const clearAuth = (type) => {
    localStorage.removeItem(`${type}Token`);
    localStorage.removeItem(`${type}Data`);
    setUser(null);
    setUserType(null);
  };

  const redirectToHome = () => {
    setTimeout(() => {
      window.location.href = '/';
    }, 100);
  };

  const handleLogout = (type) => {
    clearAuth(type);
    window.location.href = '/';
  };

  if (loading) {
    return <RouteFallback />;
  }

  // Route based on current path
  if (currentPath === '/admin-dashboard') {
    if (user && userType === 'admin') {
      return (
        <Suspense fallback={<RouteFallback />}>
          <AdminDashboard admin={user} onLogout={() => handleLogout('admin')} />
        </Suspense>
      );
    } else {
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

  if (currentPath === '/seller-dashboard') {
    if (user && userType === 'seller') {
      return (
        <Suspense fallback={<RouteFallback />}>
          <SellerDashboard seller={user} onLogout={() => handleLogout('seller')} />
        </Suspense>
      );
    } else {
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

  if (currentPath === '/buyer-dashboard') {
    if (user && userType === 'buyer') {
      return (
        <Suspense fallback={<RouteFallback />}>
          <BuyerDashboard buyer={user} onLogout={() => handleLogout('buyer')} />
        </Suspense>
      );
    } else {
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

  // Default to HomePage
  return (
    <Suspense fallback={<RouteFallback />}>
      <HomePage />
    </Suspense>
  );
};

export default MainApp;