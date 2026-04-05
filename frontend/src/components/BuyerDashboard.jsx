import React, { useDeferredValue, useEffect, useMemo, useState } from 'react';
import './BuyerDashboard.css';
import BuyerProducts from './BuyerProducts';
import BuyerOrders from './BuyerOrders';
import ProductDetail from './ProductDetail';
import OrderDetail from './OrderDetail';
import UnimartLogo from './images/Unimart logo.png';
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
  FaArrowUp,
  FaEdit,
  FaTrash
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
  const [checkoutPhone, setCheckoutPhone] = useState('');
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [buyerReviews, setBuyerReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState('');
  const [reviewSearchTerm, setReviewSearchTerm] = useState('');
  const deferredReviewSearchTerm = useDeferredValue(reviewSearchTerm);
  const [ordersRefreshKey, setOrdersRefreshKey] = useState(0);
  const [ordersCache, setOrdersCache] = useState([]);

  const buyerReviewAverage = useMemo(() => {
    const ratedReviews = buyerReviews.filter((review) => Number(review.rating || 0) > 0);

    if (ratedReviews.length === 0) {
      return 0;
    }

    return ratedReviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / ratedReviews.length;
  }, [buyerReviews]);

  const renderRatingStars = (rating, sizeClass = 'h-3.5 w-3.5') => {
    const value = Math.max(0, Math.min(5, Number(rating) || 0));

    return (
      <div className="inline-flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, index) => {
          const fill = Math.max(0, Math.min(1, value - index));

          return (
            <span key={index} className="relative inline-flex">
              <FaStar className={`${sizeClass} text-gray-300`} />
              <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                <FaStar className={`${sizeClass} text-yellow-400`} />
              </span>
            </span>
          );
        })}
      </div>
    );
  };

  useEffect(() => {
    if (initialBuyer) {
      setBuyer(initialBuyer);
      fetchDashboardStats();
    } else {
      fetchBuyerData();
    }
  }, [initialBuyer]);

  useEffect(() => {
    if (activeTab === 'reviews' && buyer) {
      fetchBuyerReviews();
    }
  }, [activeTab, buyer]);

  useEffect(() => {
    if (activeTab === 'orders') {
      setOrdersRefreshKey((value) => value + 1);
    }
  }, [activeTab]);

  const fetchBuyerData = async () => {
    try {
      setLoading(true);
      
      const [profileResponse, statsResponse] = await Promise.all([
        fetch('http://localhost:5000/api/buyer/profile', { credentials: 'include' }),
        fetch('http://localhost:5000/api/buyer/dashboard/stats', { credentials: 'include' })
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
      const response = await fetch('http://localhost:5000/api/buyer/dashboard/stats', { credentials: 'include' });

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
      await fetch('http://localhost:5000/api/buyer/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear buyer-specific search and filter data from localStorage
      localStorage.removeItem('unimart-product-search-history');
      localStorage.removeItem('unimart-saved-product-filters');
      
      if (onLogout) {
        onLogout();
      }
    }
  };

  const handleLogoError = (e) => {
    e.target.style.display = 'none';
  };

  const fetchBuyerReviews = async () => {
    try {
      setReviewsLoading(true);
      setReviewsError('');

      const buyerId = String(buyer?._id || buyer?.id || '');
      const buyerName = `${buyer?.firstName || ''} ${buyer?.lastName || ''}`.trim().toLowerCase();

      if (!buyerId && !buyerName) {
        setBuyerReviews([]);
        setReviewsError('Could not identify buyer account to load reviews.');
        return;
      }

      const response = await fetch('http://localhost:5000/api/products');
      const data = await response.json();

      if (!data.success || !Array.isArray(data.data)) {
        throw new Error('Failed to load products for reviews.');
      }

      const reviews = data.data.flatMap((product) => {
        const productReviews = Array.isArray(product.reviews) ? product.reviews : [];

        return productReviews
          .filter((review) => {
            const reviewUserId = typeof review.user === 'object'
              ? String(review.user?._id || review.user?.id || '')
              : String(review.user || '');
            const reviewName = String(review.name || '').trim().toLowerCase();

            return (buyerId && reviewUserId === buyerId) || (buyerName && reviewName === buyerName);
          })
          .map((review) => ({
            id: review._id || `${product._id}-${review.createdAt || review.comment || 'review'}`,
            reviewId: review._id || null,
            rating: Number(review.rating || 0),
            comment: review.comment || '',
            createdAt: review.createdAt || null,
            product: {
              _id: product._id,
              title: product.title,
              image: Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : '',
              price: product.price,
              seller: product.seller,
              category: product.category,
            },
          }));
      });

      reviews.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      setBuyerReviews(reviews);
    } catch (error) {
      console.error('Error loading buyer reviews:', error);
      setReviewsError('Failed to load your reviews. Please try again.');
      setBuyerReviews([]);
    } finally {
      setReviewsLoading(false);
    }
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

  const filteredBuyerReviews = useMemo(() => {
    const query = deferredReviewSearchTerm.trim().toLowerCase();
    if (!query) return buyerReviews;

    return buyerReviews.filter((review) => {
      const searchable = [
        review.product?.title,
        review.product?.category,
        review.product?.seller?.businessName,
        review.product?.seller?.firstName,
        review.product?.seller?.lastName,
        review.comment,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchable.includes(query);
    });
  }, [buyerReviews, deferredReviewSearchTerm]);

  const handleEditReviewFromList = async (review) => {
    if (!review.reviewId) {
      alert('This review cannot be edited right now.');
      return;
    }

    const currentComment = review.comment || '';
    const nextComment = window.prompt('Edit your review comment:', currentComment);
    if (nextComment === null) return;

    const nextRatingInput = window.prompt('Update rating (1 to 5):', String(Math.round(review.rating || 5)));
    if (nextRatingInput === null) return;

    const parsedRating = Number(nextRatingInput);
    const rating = Math.min(5, Math.max(1, parsedRating));

    if (!Number.isFinite(rating)) {
      alert('Please enter a valid rating between 1 and 5.');
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/products/${review.product._id}/reviews/${review.reviewId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('buyerToken')}`
        },
        body: JSON.stringify({
          rating,
          comment: nextComment.trim()
        })
      });

      const data = await response.json();
      if (!data.success) {
        alert(data.message || 'Failed to update review.');
        return;
      }

      fetchBuyerReviews();
    } catch (error) {
      console.error('Error updating review from list:', error);
      alert('Failed to connect to server.');
    }
  };

  const handleDeleteReviewFromList = async (review) => {
    if (!review.reviewId) {
      alert('This review cannot be deleted right now.');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this review?')) return;

    try {
      const response = await fetch(`http://localhost:5000/api/products/${review.product._id}/reviews/${review.reviewId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('buyerToken')}`
        }
      });

      const data = await response.json();
      if (!data.success) {
        alert(data.message || 'Failed to delete review.');
        return;
      }

      fetchBuyerReviews();
    } catch (error) {
      console.error('Error deleting review from list:', error);
      alert('Failed to connect to server.');
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
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 premium-reviews-header">
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
            />
          )}

          {activeTab === 'orders' && (
            <BuyerOrders 
              key={`buyer-orders-${ordersRefreshKey}`}
              buyer={buyer}
              initialOrders={ordersCache}
              refreshKey={ordersRefreshKey}
              onOrderClick={(order) => {
                setViewingOrder(order);
                setActiveTab('order_detail');
              }}
            />
          )}

          {activeTab === 'order_detail' && viewingOrder && (
            <OrderDetail
              order={viewingOrder}
              onBack={() => setActiveTab('orders')}
              onOrderUpdated={setViewingOrder}
            />
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">My Product Reviews</h3>
                      <p className="text-gray-600 text-sm">Track the feedback you have shared with sellers.</p>
                    </div>
                    <button
                      type="button"
                      onClick={fetchBuyerReviews}
                      className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                    >
                      Refresh Reviews
                    </button>
                  </div>

                  <div className="max-w-md">
                    <input
                      type="text"
                      value={reviewSearchTerm}
                      onChange={(e) => setReviewSearchTerm(e.target.value)}
                      placeholder="Search reviews by product, seller, or comment..."
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {reviewsLoading && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center text-gray-600">
                  Loading your reviews...
                </div>
              )}

              {!reviewsLoading && reviewsError && (
                <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6 text-center">
                  <p className="text-red-600 mb-4">{reviewsError}</p>
                  <button
                    type="button"
                    onClick={fetchBuyerReviews}
                    className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              )}

              {!reviewsLoading && !reviewsError && buyerReviews.length === 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
                  <div className="text-5xl mb-3">⭐</div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">No reviews yet</h4>
                  <p className="text-gray-600 mb-4">You can review products after placing orders.</p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('products')}
                    className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Browse Products
                  </button>
                </div>
              )}

              {!reviewsLoading && !reviewsError && buyerReviews.length > 0 && (
                <>
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-6 py-4 flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                      Showing: <span className="font-semibold text-gray-900">{filteredBuyerReviews.length}</span>
                      <span className="text-gray-400"> / {buyerReviews.length}</span>
                    </p>
                    <p className="text-sm text-gray-600">
                      Avg rating: <span className="font-semibold text-gray-900">
                        {buyerReviewAverage > 0 ? `${buyerReviewAverage.toFixed(1)} / 5` : 'No rate'}
                      </span>
                    </p>
                  </div>

                  {filteredBuyerReviews.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">No matching reviews</h4>
                      <p className="text-gray-600 mb-4">Try a different search keyword.</p>
                      <button
                        type="button"
                        onClick={() => setReviewSearchTerm('')}
                        className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Clear Search
                      </button>
                    </div>
                  ) : (
                  <div className="space-y-4">
                    {filteredBuyerReviews.map((review) => (
                      <div key={review.id} className="premium-review-card">
                        <div className="premium-review-content">
                          <div className="premium-review-top">
                            <img
                              src={review.product.image || 'https://via.placeholder.com/80x80?text=No+Image'}
                              alt={review.product.title}
                              className="premium-review-image"
                              loading="lazy"
                            />
                            <div className="flex-1 min-w-0 premium-review-main">
                              <button
                                type="button"
                                onClick={() => {
                                  setViewingProduct(review.product);
                                  setActiveTab('product_detail');
                                }}
                                className="premium-review-title"
                                title={review.product.title}
                              >
                                {review.product.title}
                              </button>
                              {(review.product?.seller?.businessName || review.product?.seller?.firstName || review.product?.seller?.lastName) && (
                                <p className="premium-review-seller">
                                  Seller: {review.product?.seller?.businessName || `${review.product?.seller?.firstName || ''} ${review.product?.seller?.lastName || ''}`.trim()}
                                </p>
                              )}
                              <p className="premium-review-price">Rs {review.product.price}</p>
                              <div className="premium-review-stars-row">
                                {renderRatingStars(review.rating)}
                                <span className="premium-rating-chip">
                                  {Number(review.rating || 0) > 0 ? `${Number(review.rating || 0).toFixed(1)} / 5` : 'No rate'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="premium-review-message-pane">
                            <p className="premium-review-comment">
                              {review.comment || 'No comment provided.'}
                            </p>
                          </div>
                        </div>

                        <div className="premium-review-footer">
                          <span className="premium-review-date">
                            {review.createdAt ? `Reviewed on ${new Date(review.createdAt).toLocaleDateString()}` : 'Date unavailable'}
                          </span>
                          <div className="premium-review-actions">
                            <button
                              type="button"
                              className="premium-show-product-btn"
                              onClick={() => {
                                setViewingProduct(review.product);
                                setActiveTab('product_detail');
                              }}
                            >
                              Show Product
                            </button>
                            <button
                              type="button"
                              className="premium-icon-btn premium-icon-btn-edit"
                              onClick={() => handleEditReviewFromList(review)}
                              title="Edit review"
                              aria-label="Edit review"
                            >
                              <FaEdit className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              className="premium-icon-btn premium-icon-btn-delete"
                              onClick={() => handleDeleteReviewFromList(review)}
                              title="Delete review"
                              aria-label="Delete review"
                            >
                              <FaTrash className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Other tabs content placeholder */}
          {activeTab !== 'overview' && activeTab !== 'products' && activeTab !== 'orders' && activeTab !== 'product_detail' && activeTab !== 'order_detail' && activeTab !== 'reviews' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
              <div className="text-gray-400 text-6xl mb-4">🚧</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {sidebarItems.find(item => item.id === activeTab)?.label} Section
              </h3>
              <p className="text-gray-600 mb-4">
                This section is under development. More features coming soon!
              </p>
              <button
                onClick={() => setActiveTab('overview')}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Checkout Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Complete Your Order</h2>
            <div className="mb-4 flex items-center gap-4">
               <img src={selectedProduct.images[0] || 'https://via.placeholder.com/50'} alt={selectedProduct.title} className="w-16 h-16 object-cover rounded" />
               <div>
                  <h3 className="font-semibold text-gray-800">{selectedProduct.title}</h3>
                  <p className="text-blue-600 font-bold">Rs {selectedProduct.price}</p>
               </div>
            </div>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                const response = await fetch('http://localhost:5000/api/orders/buyer', {
                  method: 'POST',
                  credentials: 'include',
                  headers: {
                    'Content-Type': 'application/json',
                    ...(localStorage.getItem('buyerToken')
                      ? { 'Authorization': `Bearer ${localStorage.getItem('buyerToken')}` }
                      : {})
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

                  let refreshedOrders = [];
                  try {
                    const ordersResponse = await fetch(`http://localhost:5000/api/orders/buyer?ts=${Date.now()}`, {
                      cache: 'no-store',
                      credentials: 'include',
                      headers: {
                        ...(localStorage.getItem('buyerToken')
                          ? { 'Authorization': `Bearer ${localStorage.getItem('buyerToken')}` }
                          : {})
                      }
                    });

                    if (ordersResponse.ok) {
                      const ordersData = await ordersResponse.json();
                      if (ordersData.success && Array.isArray(ordersData.data)) {
                        refreshedOrders = ordersData.data;
                      }
                    }
                  } catch (ordersError) {
                    console.error('Error refreshing buyer orders after checkout:', ordersError);
                  }

                  if (refreshedOrders.length > 0) {
                    setOrdersCache(refreshedOrders);
                  } else if (data.data) {
                    setOrdersCache((currentOrders) => {
                      const getOrderId = (order) => String(order?._id || order?.id || '');
                      const combined = [data.data, ...currentOrders];
                      return combined.filter((order, index, array) => {
                        const currentId = getOrderId(order);
                        if (!currentId) return index === array.indexOf(order);
                        return array.findIndex((item) => getOrderId(item) === currentId) === index;
                      });
                    });
                  }

                  setSelectedProduct(null);
                  setOrdersRefreshKey((value) => value + 1);
                  setActiveTab('orders'); // Jump to orders view
                } else {
                  alert('Error placing order: ' + data.message);
                }
              } catch (error) {
                console.error('Order error:', error);
                alert('Something went wrong placing the order');
              }
            }}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Quantity (Max: {selectedProduct.stock})</label>
                <input 
                  type="number" 
                  min="1" 
                  max={selectedProduct.stock} 
                  value={orderQuantity} 
                  onChange={(e) => setOrderQuantity(parseInt(e.target.value) || 1)}
                  className="w-full border p-2 rounded" 
                  required 
                />
              </div>
              <h4 className="font-semibold mb-2">Pickup Details</h4>
              <div className="space-y-4 mb-6 text-sm">
                <div className="bg-blue-50 p-3 rounded-md text-blue-800 border border-blue-200">
                  <p><strong>Note:</strong> This order is for in-person pickup. You will collect the item directly from the seller.</p>
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Contact Phone Number</label>
                  <input 
                    type="tel" 
                    placeholder="Enter your phone number" 
                    value={checkoutPhone} 
                    onChange={e => setCheckoutPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} 
                    pattern="\d{10}"
                    title="Phone number must be exactly 10 digits"
                    className="w-full border p-2 rounded" 
                    autoComplete="off"
                    required 
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-3 pt-4 border-t">
                 <button type="button" onClick={() => setSelectedProduct(null)} className="px-4 py-2 text-gray-600 bg-gray-100 rounded hover:bg-gray-200">Cancel</button>
                 <button type="submit" className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700">Confirm Order (Rs {(selectedProduct.price * orderQuantity).toFixed(2)})</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BuyerDashboard;