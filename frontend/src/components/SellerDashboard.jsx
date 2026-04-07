import React, { useState, useEffect, Suspense, lazy } from 'react';
import './SellerDashboard.css';
import {
  FaUser,
  FaChartLine,
  FaBox,
  FaShoppingCart,
  FaStar,
  FaDollarSign,
  FaEye,
  FaHeart,
  FaCog,
  FaSignOutAlt,
  FaStore,
  FaUsers,
  FaTruck,
  FaChartBar,
  FaLeaf,
  FaWarehouse,
  FaBell,
  FaCertificate,
  FaGlobe,
  FaEnvelope
} from 'react-icons/fa';

const SellerProducts = lazy(() => import('./SellerProducts'));
const SellerOrders = lazy(() => import('./SellerOrders'));
const SellerReviews = lazy(() => import('./SellerReviews'));
const ChatPage = lazy(() => import('./ChatPage'));

const SectionFallback = () => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center text-gray-500">
    Loading section...
  </div>
);

const SellerDashboard = ({ seller: initialSeller, onLogout }) => {
  const [seller, setSeller] = useState(initialSeller);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [loading, setLoading] = useState(!initialSeller);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (initialSeller) {
      setSeller(initialSeller);
      fetchDashboardStats();
    } else {
      fetchSellerData();
    }
  }, [initialSeller]);

  const fetchSellerData = async () => {
    try {
      setLoading(true);
      
      const [profileResponse, statsResponse] = await Promise.all([
        fetch('http://localhost:5000/api/seller/profile', { credentials: 'include' }),
        fetch('http://localhost:5000/api/seller/dashboard/stats', { credentials: 'include' })
      ]);

      if (!profileResponse.ok || !statsResponse.ok) {
        throw new Error('Failed to fetch seller data');
      }

      const profileData = await profileResponse.json();
      const statsData = await statsResponse.json();

      if (profileData.success && statsData.success) {
        setSeller(profileData.data.seller);
        setDashboardStats(statsData.data);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching seller data:', error);
      setError('Failed to load dashboard data');
      // If unauthorized, trigger logout
      if (error.message.includes('401') || error.message.includes('unauthorized')) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/seller/dashboard/stats', { credentials: 'include' });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setDashboardStats(data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('http://localhost:5000/api/seller/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      if (onLogout) {
        onLogout();
      }
    }
  };

  const getVerificationStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'under_review': return 'text-blue-600 bg-blue-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getSubscriptionColor = (plan) => {
    switch (plan) {
      case 'enterprise': return 'text-purple-600 bg-purple-100';
      case 'premium': return 'text-blue-600 bg-blue-100';
      case 'basic': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading seller dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: FaChartLine },
    { id: 'products', label: 'Products', icon: FaBox },
    { id: 'orders', label: 'Orders', icon: FaShoppingCart },
    { id: 'messages', label: 'Messages', icon: FaEnvelope },
    { id: 'reviews', label: 'Reviews', icon: FaStar },
    { id: 'customers', label: 'Customers', icon: FaUsers },
    { id: 'analytics', label: 'Analytics', icon: FaChartBar },
    { id: 'inventory', label: 'Inventory', icon: FaWarehouse },
    { id: 'profile', label: 'Profile', icon: FaUser },
    { id: 'settings', label: 'Settings', icon: FaCog }
  ];

  const StatCard = ({ title, value, icon: Icon, color, change, prefix = '', suffix = '' }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">
            {prefix}{value}{suffix}
          </p>
          {change && (
            <p className={`text-sm mt-1 ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {change >= 0 ? '↗' : '↘'} {Math.abs(change)}% from last month
            </p>
          )}
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg border-r border-gray-200 z-50">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center px-6 py-4 border-b border-gray-200">
            <FaStore className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">Unimart</h1>
              <p className="text-sm text-gray-500">Seller Portal</p>
            </div>
          </div>

          {/* Seller Info */}
          {seller && (
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center">
                <div className="bg-green-600 rounded-full p-2 mr-3">
                  <FaUser className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {seller.businessName}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {seller.fullName || `${seller.firstName} ${seller.lastName}`}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getVerificationStatusColor(seller.verificationStatus)}`}>
                  <FaCertificate className="mr-1 h-3 w-3" />
                  {seller.verificationStatus}
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSubscriptionColor(seller.subscription?.plan || 'free')}`}>
                  {seller.subscription?.plan || 'free'}
                </span>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center px-3 py-2 mb-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === item.id
                    ? 'bg-green-100 text-green-700 border border-green-200'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.label}
              </button>
            ))}
          </nav>

          {/* Logout Button */}
          <div className="px-3 py-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <FaSignOutAlt className="mr-3 h-5 w-5" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 capitalize">
                {activeTab} Dashboard
              </h1>
              <p className="text-gray-600">
                Welcome back, {seller?.firstName}! Here's your business overview.
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button className="relative p-2 text-gray-400 hover:text-gray-600">
                <FaBell className="h-6 w-6" />
                <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
              </button>
              <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                <FaLeaf className="inline mr-2 h-4 w-4" />
                Quick Actions
              </button>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-6">
          {activeTab === 'overview' && dashboardStats && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                  title="Total Products"
                  value={dashboardStats.businessMetrics.totalProducts}
                  icon={FaBox}
                  color="bg-blue-500"
                  change={5}
                />
                <StatCard
                  title="Total Sales"
                  value={dashboardStats.businessMetrics.totalSales}
                  icon={FaDollarSign}
                  color="bg-green-500"
                  prefix="Rs "
                  change={12}
                />
                <StatCard
                  title="Customer Rating"
                  value={dashboardStats.businessMetrics.averageRating.toFixed(1)}
                  icon={FaStar}
                  color="bg-yellow-500"
                  suffix="/5.0"
                  change={0.2}
                />
                <StatCard
                  title="Total Reviews"
                  value={dashboardStats.businessMetrics.totalReviews}
                  icon={FaEye}
                  color="bg-purple-500"
                  change={8}
                />
              </div>

              {/* Business Metrics */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Sales Overview */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Sales Overview</h3>
                    <FaChartLine className="h-5 w-5 text-gray-400" />
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Total Revenue</span>
                      <span className="font-semibold">Rs {dashboardStats.salesData.totalRevenue}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Monthly Revenue</span>
                      <span className="font-semibold">Rs {dashboardStats.salesData.monthlyRevenue}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Pending Orders</span>
                      <span className="font-semibold">{dashboardStats.salesData.pendingOrders}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Completed Orders</span>
                      <span className="font-semibold text-green-600">{dashboardStats.salesData.completedOrders}</span>
                    </div>
                  </div>
                </div>

                {/* Business Status */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Business Status</h3>
                    <FaCertificate className="h-5 w-5 text-gray-400" />
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Verification Status</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getVerificationStatusColor(dashboardStats.sellerInfo.verificationStatus)}`}>
                        {dashboardStats.sellerInfo.verificationStatus}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Seller Score</span>
                      <span className="font-semibold text-green-600">{dashboardStats.sellerInfo.sellerScore}/100</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Subscription Plan</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSubscriptionColor(dashboardStats.businessMetrics.subscriptionPlan)}`}>
                        {dashboardStats.businessMetrics.subscriptionPlan}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Member Since</span>
                      <span className="font-semibold">
                        {new Date(dashboardStats.sellerInfo.memberSince).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {[
                    { label: 'Add Product', icon: FaBox, color: 'bg-blue-500' },
                    { label: 'View Orders', icon: FaShoppingCart, color: 'bg-green-500' },
                    { label: 'Manage Inventory', icon: FaWarehouse, color: 'bg-purple-500' },
                    { label: 'Customer Support', icon: FaUsers, color: 'bg-yellow-500' },
                    { label: 'Analytics', icon: FaChartBar, color: 'bg-red-500' },
                    { label: 'Settings', icon: FaCog, color: 'bg-gray-500' }
                  ].map((action, index) => (
                    <button
                      key={index}
                      className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className={`p-2 rounded-full ${action.color} mb-2`}>
                        <action.icon className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">{action.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <Suspense fallback={<SectionFallback />}>
            {activeTab === 'products' && (
              <SellerProducts seller={seller} />
            )}

            {activeTab === 'orders' && (
              <SellerOrders seller={seller} />
            )}

            {activeTab === 'reviews' && (
              <SellerReviews seller={seller} />
            )}
          </Suspense>

          {activeTab === 'profile' && seller && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
               {/* Purple Banner */}
               <div className="bg-gradient-to-r from-purple-500 to-indigo-600 h-32 w-full relative">
                 <div className="absolute -bottom-12 left-6 border-4 border-white rounded-full bg-white">
                   <div className="bg-purple-100 rounded-full h-24 w-24 flex items-center justify-center text-purple-600 text-3xl">
                     <FaUser />
                   </div>
                 </div>
                 <div className="absolute bottom-4 right-6 text-white text-right">
                   <p className="text-sm opacity-80">Seller Dashboard</p>
                   <p className="font-semibold text-lg">{seller.businessName}</p>
                 </div>
               </div>

               <div className="pt-16 pb-6 px-6">
                 <div className="flex justify-between items-start mb-8">
                   <div>
                     <h2 className="text-2xl font-bold text-gray-900">{seller.fullName || `${seller.firstName} ${seller.lastName}`}</h2>
                     <p className="text-gray-500 mt-1">ID: {seller._id}</p>
                   </div>
                   <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getVerificationStatusColor(seller.verificationStatus)}`}>
                      <FaCertificate className="mr-1 h-4 w-4" />
                      {seller.verificationStatus}
                   </span>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   {/* Personal Information */}
                   <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
                     <div className="flex items-center mb-4 text-purple-700">
                       <FaUser className="mr-2" />
                       <h3 className="text-lg font-semibold">Personal Information</h3>
                     </div>
                     <div className="space-y-4">
                       <div>
                         <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">First Name</p>
                         <p className="text-gray-900 font-medium bg-white px-3 py-2 rounded border border-gray-200">{seller.firstName}</p>
                       </div>
                       <div>
                         <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Last Name</p>
                         <p className="text-gray-900 font-medium bg-white px-3 py-2 rounded border border-gray-200">{seller.lastName}</p>
                       </div>
                       <div>
                         <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Email Address</p>
                         <p className="text-gray-900 font-medium bg-white px-3 py-2 rounded border border-gray-200">{seller.email}</p>
                       </div>
                       <div>
                         <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Phone Number</p>
                         <p className="text-gray-900 font-medium bg-white px-3 py-2 rounded border border-gray-200">{seller.phone || 'Not provided'}</p>
                       </div>
                       <div>
                         <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Address</p>
                         <div className="text-gray-900 font-medium bg-white px-3 py-2 rounded border border-gray-200 min-h-[42px]">{seller.address || 'Not provided'}</div>
                       </div>
                     </div>
                   </div>

                   {/* Business Details */}
                   <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
                     <div className="flex items-center mb-4 text-purple-700">
                       <FaStore className="mr-2" />
                       <h3 className="text-lg font-semibold">Business Details</h3>
                     </div>
                     <div className="space-y-4">
                       <div>
                         <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Account State</p>
                         <p className={`font-medium px-3 py-2 rounded border flex items-center ${seller.isActive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                           {seller.isActive ? '✅ Active' : '🚫 Inactive'}
                         </p>
                       </div>
                     </div>
                   </div>
                 </div>
               </div>
            </div>
          )}

          {activeTab === 'messages' && (
            <ChatPage 
              currentUser={seller} 
              userType="seller" 
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default SellerDashboard;