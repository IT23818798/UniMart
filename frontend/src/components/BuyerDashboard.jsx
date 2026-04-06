import React, { useState, useEffect } from 'react';
import './BuyerDashboard.css';
import BuyerProducts from './BuyerProducts';
import BuyerOrders from './BuyerOrders';
import BuyerReviews from './BuyerReviews';
import ProductDetail from './ProductDetail';
import OrderDetail from './OrderDetail';
import PaymentGateway from './PaymentGateway';
import UnimartLogo from './images/Unimart logo.png';
import ChatPopup from './ChatPopup';
import ChatPage from './ChatPage';
import {
  FaUser,
  FaShoppingCart,
  FaHeart,
  FaMapMarkerAlt,
  FaStar,
  FaDollarSign,
  FaGift,
  FaBell,
  FaSearch,
  FaSignOutAlt,
  FaStore,
  FaUsers,
  FaTruck,
  FaChartBar,
  FaLeaf,
  FaBoxOpen,
  FaCreditCard,
  FaCog,
  FaHistory,
  FaMedal,
  FaPhone,
  FaEnvelope,
  FaCalendarAlt,
  FaHome,
  FaInfoCircle,
  FaFacebook,
  FaTwitter,
  FaLinkedin,
  FaInstagram,
  FaArrowUp
} from 'react-icons/fa';

const BuyerDashboard = ({ buyer: initialBuyer, onLogout }) => {
  const [buyer, setBuyer] = useState(initialBuyer);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [loading, setLoading] = useState(!initialBuyer);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [viewingProduct, setViewingProduct] = useState(null);
  const [viewingOrder, setViewingOrder] = useState(null);
  
  // Chat state
  const [chatContext, setChatContext] = useState(null); // { otherUserId, otherUserType }
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [checkoutPhone, setCheckoutPhone] = useState('');
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [showPaymentGateway, setShowPaymentGateway] = useState(false);

  // Notification counts
  const [unreadMessages, setUnreadMessages] = useState(0);

  const getBuyerRequestOptions = (extraOptions = {}) => ({
    ...extraOptions,
    credentials: 'include',
    headers: {
      ...(extraOptions.headers || {}),
      ...(localStorage.getItem('buyerToken') ? { Authorization: `Bearer ${localStorage.getItem('buyerToken')}` } : {})
    }
  });

  useEffect(() => {
    if (initialBuyer) {
      setBuyer(initialBuyer);
      fetchDashboardStats();
    } else {
      fetchBuyerData();
    }
  }, [initialBuyer]);

  const fetchBuyerData = async () => {
    try {
      setLoading(true);
      
      const [profileResponse, statsResponse] = await Promise.all([
        fetch('http://127.0.0.1:5000/api/buyer/profile', getBuyerRequestOptions()),
        fetch('http://127.0.0.1:5000/api/buyer/dashboard/stats', getBuyerRequestOptions())
      ]);

      if (!profileResponse.ok || !statsResponse.ok) {
        throw new Error('Failed to fetch buyer data');
      }

      const profileData = await profileResponse.json();
      const statsData = await statsResponse.json();

      if (profileData.success && statsData.success) {
        setBuyer(profileData.data.buyer);
        setDashboardStats(statsData.data);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching buyer data:', error);
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
      const response = await fetch('http://127.0.0.1:5000/api/buyer/dashboard/stats', getBuyerRequestOptions());

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
      await fetch('http://127.0.0.1:5000/api/buyer/logout', {
        method: 'POST',
        ...getBuyerRequestOptions()
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      if (onLogout) {
        onLogout();
      }
    }
  };

  const handleLogoError = (e) => {
    e.target.style.display = 'none';
  };

  const getLoyaltyLevelColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'diamond': return 'text-blue-600 bg-blue-100';
      case 'platinum': return 'text-gray-600 bg-gray-100';
      case 'gold': return 'text-yellow-600 bg-yellow-100';
      case 'silver': return 'text-gray-500 bg-gray-50';
      default: return 'text-orange-600 bg-orange-100';
    }
  };

  const getMembershipColor = (type) => {
    switch (type) {
      case 'vip': return 'text-purple-600 bg-purple-100';
      case 'premium': return 'text-blue-600 bg-blue-100';
      default: return 'text-green-600 bg-green-100';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading buyer dashboard...</p>
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
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: FaChartBar },
    { id: 'products', label: 'Browse Products', icon: FaSearch },
    { id: 'orders', label: 'My Orders', icon: FaShoppingCart },
    { id: 'messages', label: 'Messages', icon: FaEnvelope, badge: unreadMessages },
    { id: 'wishlist', label: 'Wishlist', icon: FaHeart },
    { id: 'addresses', label: 'Addresses', icon: FaMapMarkerAlt },
    { id: 'loyalty', label: 'Loyalty & Rewards', icon: FaMedal },
    { id: 'reviews', label: 'My Reviews', icon: FaStar },
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
      {/* Top Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 bg-white shadow-md z-40 border-b-2 border-blue-600">
        <div className="flex items-center justify-between px-6 py-3">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <img
              src={UnimartLogo}
              alt="Unimart logo"
              className="h-8 w-8 object-contain"
              onError={handleLogoError}
            />
            <span className="text-xl font-bold text-gray-900">Unimart</span>
          </div>

          {/* Center Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">
              <FaHome className="inline mr-2" />
              Home
            </a>
            <a href="#" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">
              <FaInfoCircle className="inline mr-2" />
              About
            </a>
            <a href="#" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">
              <FaCog className="inline mr-2" />
              Services
            </a>
            <a href="#" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">
              <FaPhone className="inline mr-2" />
              Contact
            </a>
          </div>

          {/* Right Side - User Info & Buttons */}
          <div className="flex items-center gap-4">
            {/* Notifications */}
            <button className="relative p-2 text-gray-400 hover:text-blue-600 transition-colors">
              <FaBell className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
            </button>

            {/* User Profile */}
            {buyer && (
              <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                <div className="bg-blue-600 rounded-full p-1.5">
                  <FaUser className="h-4 w-4 text-white" />
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">
                    {buyer.firstName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {buyer.loyaltyLevel || 'Member'}
                  </p>
                </div>
              </div>
            )}

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
            >
              <FaSignOutAlt className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Sidebar */}
      <div className="fixed left-0 w-64 bg-white shadow-lg border-r border-gray-200 z-50 top-16 bottom-0">
        <div className="flex flex-col h-full pt-4">
          {/* Buyer Info */}
          {buyer && (
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center">
                <div className="bg-blue-600 rounded-full p-2 mr-3">
                  <FaUser className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {buyer.fullName || `${buyer.firstName} ${buyer.lastName}`}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {buyer.email}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getLoyaltyLevelColor(buyer.loyaltyLevel)}`}>
                  <FaMedal className="mr-1 h-3 w-3" />
                  {buyer.loyaltyLevel || 'Bronze'}
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getMembershipColor(buyer.membership?.type || 'basic')}`}>
                  {buyer.membership?.type || 'basic'}
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
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64 mt-16">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 capitalize">
                {activeTab === 'overview' ? 'Dashboard' : activeTab.replace('_', ' ')}
              </h1>
              <p className="text-gray-600">
                Welcome back, {buyer?.firstName}! Discover fresh products from local sellers.
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button className="relative p-2 text-gray-400 hover:text-gray-600">
                <FaBell className="h-6 w-6" />
                <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
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
                  title="Total Orders"
                  value={dashboardStats.purchaseMetrics.totalOrders}
                  icon={FaShoppingCart}
                  color="bg-blue-500"
                  change={8}
                />
                <StatCard
                  title="Total Spent"
                  value={dashboardStats.purchaseMetrics.totalSpent}
                  icon={FaDollarSign}
                  color="bg-green-500"
                  prefix="Rs "
                  change={15}
                />
                <StatCard
                  title="Loyalty Points"
                  value={dashboardStats.buyerInfo.loyaltyPoints}
                  icon={FaMedal}
                  color="bg-yellow-500"
                  change={25}
                />
                <StatCard
                  title="Wishlist Items"
                  value={dashboardStats.wishlistStats.totalItems}
                  icon={FaHeart}
                  color="bg-red-500"
                  change={5}
                />
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Orders */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
                    <FaShoppingCart className="h-5 w-5 text-gray-400" />
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Pending Orders</span>
                      <span className="font-semibold text-orange-600">{dashboardStats.orderData.pendingOrders}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Delivered Orders</span>
                      <span className="font-semibold text-green-600">{dashboardStats.orderData.deliveredOrders}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Average Order Value</span>
                      <span className="font-semibold">Rs {dashboardStats.purchaseMetrics.averageOrderValue}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Monthly Spending</span>
                      <span className="font-semibold">Rs {dashboardStats.purchaseMetrics.monthlySpending}</span>
                    </div>
                  </div>
                </div>

                {/* Loyalty Status */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Loyalty Program</h3>
                    <FaMedal className="h-5 w-5 text-gray-400" />
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Current Level</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLoyaltyLevelColor(dashboardStats.buyerInfo.loyaltyLevel)}`}>
                        {dashboardStats.buyerInfo.loyaltyLevel}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Loyalty Points</span>
                      <span className="font-semibold text-yellow-600">{dashboardStats.buyerInfo.loyaltyPoints}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Membership Type</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getMembershipColor(dashboardStats.buyerInfo.membershipType)}`}>
                        {dashboardStats.buyerInfo.membershipType}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Member Since</span>
                      <span className="font-semibold">
                        {new Date(dashboardStats.buyerInfo.memberSince).toLocaleDateString()}
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
                    { label: 'Browse Products', icon: FaSearch, color: 'bg-blue-500' },
                    { label: 'Track Orders', icon: FaTruck, color: 'bg-green-500' },
                    { label: 'Wishlist', icon: FaHeart, color: 'bg-red-500' },
                    { label: 'Local Sellers', icon: FaMapMarkerAlt, color: 'bg-purple-500' },
                    { label: 'Rewards', icon: FaGift, color: 'bg-yellow-500' },
                    { label: 'Support', icon: FaPhone, color: 'bg-gray-500' }
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

              {/* Notifications Preview */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Notifications</h3>
                  <FaBell className="h-5 w-5 text-gray-400" />
                </div>
                <div className="space-y-3">
                  {dashboardStats.notifications.recent.map((notification, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="bg-blue-100 rounded-full p-2">
                        <FaBell className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{notification.message}</p>
                        <p className="text-xs text-gray-500">{new Date(notification.timestamp).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Dynamic Tabs */}
          {activeTab === 'products' && (
            <BuyerProducts buyer={buyer} onAddToCart={(product) => {
              setSelectedProduct(product);
              setOrderQuantity(1);
            }} onProductClick={(product) => {
              setViewingProduct(product);
              setActiveTab('product_detail');
            }} />
          )}

          {activeTab === 'product_detail' && viewingProduct && (
            <ProductDetail
              productId={viewingProduct._id}
              buyer={buyer}
              onBack={() => setActiveTab('products')}
              onAddToCart={(product) => {
                setSelectedProduct(product);
                setOrderQuantity(1);
              }}
              onChatWithSeller={(sellerId, prodId) => {
                setChatContext({ otherUserId: sellerId, otherUserType: 'Seller', productId: prodId });
                setIsChatOpen(true);
              }}
            />
          )}

          {activeTab === 'messages' && (
            <ChatPage 
              currentUser={buyer} 
              userType="buyer" 
            />
          )}

          {activeTab === 'orders' && (
            <BuyerOrders 
              buyer={buyer} 
              onOrderClick={(order) => {
                setViewingOrder(order);
                setActiveTab('order_detail');
              }}
            />
          )}

          {activeTab === 'reviews' && (
            <BuyerReviews
              onViewProduct={(productId) => {
                setViewingProduct({ _id: productId });
                setActiveTab('product_detail');
              }}
              onBrowseProducts={() => {
                setActiveTab('products');
              }}
            />
          )}

          {activeTab === 'order_detail' && viewingOrder && (
            <OrderDetail
              order={viewingOrder}
              onBack={() => setActiveTab('orders')}
              onOrderUpdated={setViewingOrder}
              onChatWithSeller={(sellerId, prodId) => {
                setChatContext({ otherUserId: sellerId, otherUserType: 'Seller', productId: prodId });
                setIsChatOpen(true);
              }}
            />
          )}
        </main>
      </div>

      {/* Checkout Modal */}
      {selectedProduct && !showPaymentGateway && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[110] p-4 transition-all">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto transform transition-all border border-gray-50">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
               <h2 className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-indigo-600">Checkout Options</h2>
               <button onClick={() => setSelectedProduct(null)} className="text-gray-400 hover:text-red-500 transition-colors text-xl font-bold">
                 ✕
               </button>
            </div>
            
            <div className="p-6 pb-2">
               <div className="flex items-center gap-4 bg-white border border-gray-100 p-4 rounded-xl shadow-sm mb-6">
                 <img src={selectedProduct.images[0] || 'https://via.placeholder.com/50'} alt={selectedProduct.title} className="w-16 h-16 object-cover rounded-lg border border-gray-200" />
                 <div>
                    <h3 className="font-bold text-gray-900 leading-tight">{selectedProduct.title}</h3>
                    <p className="text-indigo-600 font-extrabold text-lg mt-1">Rs {selectedProduct.price}</p>
                 </div>
               </div>
            
               <form onSubmit={(e) => {
                 e.preventDefault();
                 setShowPaymentGateway(true);
               }} className="space-y-6">
                 
                 <div>
                   <label className="flex items-center text-sm font-bold text-gray-700 mb-2">
                     <FaBoxOpen className="mr-2 text-indigo-500" /> Quantity (Max: {selectedProduct.stock})
                   </label>
                   <input 
                     type="number" 
                     min="1" 
                     max={selectedProduct.stock} 
                     value={orderQuantity} 
                     onChange={(e) => setOrderQuantity(parseInt(e.target.value) || 1)}
                     className="w-full border border-gray-300 px-4 py-3 rounded-xl text-lg font-bold text-gray-900 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow" 
                     required 
                   />
                 </div>
                 
                 <div>
                   <label className="flex items-center text-sm font-bold text-gray-700 mb-2">
                     <FaPhone className="mr-2 text-green-500" /> Contact Phone For Pickup
                   </label>
                   <div className="bg-indigo-50 border-l-4 border-indigo-500 p-3 rounded-r-lg mb-3">
                     <p className="text-xs text-indigo-800 font-medium tracking-wide">
                        In-person pickup requires a valid phone number.
                     </p>
                   </div>
                   <input 
                     type="tel" 
                     placeholder="e.g., 0712345678" 
                     value={checkoutPhone} 
                     onChange={e => setCheckoutPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} 
                     pattern="\d{10}"
                     title="Phone number must be exactly 10 digits"
                     className={`w-full border px-4 py-3 rounded-xl text-lg font-mono shadow-sm outline-none transition-shadow ${
                       checkoutPhone && checkoutPhone.length < 10 
                       ? 'border-red-400 focus:ring-red-500 focus:border-red-500 text-red-900' 
                       : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900'
                     }`}
                     autoComplete="off"
                     required 
                   />
                   {checkoutPhone && checkoutPhone.length < 10 && (
                     <p className="text-xs font-bold text-red-500 mt-2">Phone number must be exactly 10 digits to continue.</p>
                   )}
                 </div>
                 
                 <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 pb-4">
                    <button type="button" onClick={() => setSelectedProduct(null)} className="px-5 py-2.5 text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 font-bold transition-colors">
                      Cancel
                    </button>
                    <button disabled={!checkoutPhone || checkoutPhone.length !== 10} type="submit" className="px-6 py-2.5 text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg hover:-translate-y-0.5 font-bold transition-all disabled:opacity-50 disabled:transform-none disabled:cursor-not-allowed">
                      Pay Rs {(selectedProduct.price * orderQuantity).toFixed(2)}
                    </button>
                 </div>
               </form>
            </div>
          </div>
        </div>
      )}

      {/* Payment Gateway Modal */}
      {showPaymentGateway && selectedProduct && (
        <PaymentGateway 
          amount={selectedProduct.price * orderQuantity}
          product={selectedProduct}
          quantity={orderQuantity}
          contactPhone={checkoutPhone}
          onCancel={() => setShowPaymentGateway(false)}
          onPaymentSuccess={async () => {
            try {
              const response = await fetch('http://127.0.0.1:5000/api/orders/buyer', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${localStorage.getItem('buyerToken')}`
                },
                body: JSON.stringify({
                  orderItems: [{
                    product: selectedProduct._id,
                    title: selectedProduct.title,
                    image: selectedProduct.images[0] || '',
                    price: selectedProduct.price,
                    quantity: orderQuantity
                  }],
                  contactPhone: checkoutPhone
                })
              });
              const data = await response.json();
              if (data.success) {
                alert('Order placed successfully!');
                setShowPaymentGateway(false);
                setSelectedProduct(null);
                setActiveTab('orders'); // Jump to orders view
              } else {
                alert('Error placing order: ' + data.message);
                setShowPaymentGateway(false);
              }
            } catch (error) {
              console.error('Order error:', error);
              alert('Something went wrong placing the order');
              setShowPaymentGateway(false);
            }
          }}
        />
      )}

      {isChatOpen && chatContext && (
        <ChatPopup 
          currentUser={buyer}
          userType="buyer"
          otherUserId={chatContext.otherUserId}
          otherUserType={chatContext.otherUserType}
          initialProductId={chatContext.productId}
          onClose={() => setIsChatOpen(false)}
        />
      )}
    </div>
  );
};

export default BuyerDashboard;