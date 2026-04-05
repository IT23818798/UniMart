import React, { useState, useEffect } from 'react';
import './BuyerDashboard.css';
import BuyerProducts from './BuyerProducts';
import BuyerOrders from './BuyerOrders';
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
  const [livePoints, setLivePoints] = useState(0);
  const [pointsHistory, setPointsHistory] = useState([]);
  const [isClaiming, setIsClaiming] = useState(false);
  const [nextClaimDate, setNextClaimDate] = useState(null);
  const [timeToNextClaim, setTimeToNextClaim] = useState('');

  const ASIA_OFFSET = 5.5 * 60 * 60 * 1000;

  // Initialize reward state from history
  useEffect(() => {
    if (pointsHistory.length > 0) {
      const dailyRewards = pointsHistory.filter(t => t.description === 'Daily Reward' && t.type === 'bonus');
      if (dailyRewards.length > 0) {
        const lastReward = new Date(dailyRewards[0].createdAt);
        
        // Calculate start of current day in Asia (UTC+5:30)
        const now = new Date();
        const localNow = new Date(now.getTime() + ASIA_OFFSET);
        const startOfDayLocal = new Date(localNow);
        startOfDayLocal.setUTCHours(0, 0, 0, 0);
        const startOfDayUTC = new Date(startOfDayLocal.getTime() - ASIA_OFFSET);

        if (lastReward >= startOfDayUTC) {
          // Already claimed today, set next midnight
          const nextMidnightLocal = new Date(startOfDayLocal);
          nextMidnightLocal.setUTCDate(nextMidnightLocal.getUTCDate() + 1);
          setNextClaimDate(new Date(nextMidnightLocal.getTime() - ASIA_OFFSET));
        }
      }
    }
  }, [pointsHistory]);

  // Notification counts
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    if (initialBuyer) {
      setBuyer(initialBuyer);
      fetchDashboardStats();
      fetchPointsHistory();
      fetchLivePoints();
    } else {
      fetchBuyerData();
    }
  }, [initialBuyer]);

  const fetchBuyerData = async () => {
    try {
      setLoading(true);
      
      const headers = {
        'Authorization': `Bearer ${localStorage.getItem('buyerToken')}`
      };
      
      const [profileResponse, statsResponse] = await Promise.all([
        fetch('http://localhost:5000/api/buyer/profile', { headers, credentials: 'include' }),
        fetch('http://localhost:5000/api/buyer/dashboard/stats', { headers, credentials: 'include' })
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
      const response = await fetch('http://localhost:5000/api/buyer/dashboard/stats', { 
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('buyerToken')}`
        },
        credentials: 'include' 
      });

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

  // Fetch fresh buyer profile to update purchaseStats (points balance)
  const fetchBuyerProfile = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/buyer/profile', { 
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('buyerToken')}`
        },
        credentials: 'include' 
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setBuyer(data.data.buyer);
        }
      }
    } catch (error) {
      console.error('Error refreshing buyer profile:', error);
    }
  };

  // Fetch the most up-to-date points balance from a dedicated lightweight endpoint
  const fetchLivePoints = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/buyer/points', { 
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('buyerToken')}`
        },
        credentials: 'include' 
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setLivePoints(data.data.loyaltyPoints);
          return data.data.loyaltyPoints;
        }
      }
    } catch (error) {
      console.error('Error fetching live points:', error);
    }
    return dashboardStats?.buyerInfo?.loyaltyPoints ?? buyer?.purchaseStats?.loyaltyPoints ?? 0;
  };

  const fetchPointsHistory = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/buyer/points/history', { 
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('buyerToken')}`
        },
        credentials: 'include' 
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setPointsHistory(data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching points history:', error);
    }
  };

  const claimTestPoints = async () => {
    try {
      setIsClaiming(true);
      const response = await fetch('http://localhost:5000/api/buyer/points/test-add', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('buyerToken')}`
        },
        credentials: 'include',
        body: JSON.stringify({ amount: 1, reason: 'Daily Reward' })
      });
      const data = await response.json();
      if (data.success) {
        alert('1 Star Point claimed successfully!');
        await Promise.all([fetchLivePoints(), fetchPointsHistory(), fetchDashboardStats(), fetchBuyerProfile()]);
      } else if (data.nextClaimDate) {
        setNextClaimDate(new Date(data.nextClaimDate));
        alert(data.message);
      } else {
        alert(data.message || 'Error claiming points');
      }
    } catch (error) {
      console.error('Error claiming points:', error);
    } finally {
      setIsClaiming(false);
    }
  };

  // Timer for cooldown
  useEffect(() => {
    if (!nextClaimDate) return;

    const interval = setInterval(() => {
      const now = new Date();
      const distance = nextClaimDate - now;

      if (distance < 0) {
        setNextClaimDate(null);
        setTimeToNextClaim('');
        clearInterval(interval);
        return;
      }

      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeToNextClaim(`${hours}h ${minutes}m ${seconds}s`);
    }, 1000);

    return () => clearInterval(interval);
  }, [nextClaimDate]);

  const handleLogout = async () => {
    try {
      await fetch('http://localhost:5000/api/buyer/logout', {
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

  const StatCard = ({ title, value, icon: Icon, color, change, prefix = '', suffix = '', iconBg = 'bg-blue-600' }) => (
    <div className="stat-card-premium group relative overflow-hidden bg-white/80 backdrop-blur-md rounded-xl p-4 border border-white scroll-mt-24 transition-all duration-500 hover:-translate-y-1 hover:shadow-xl">
      <div className="absolute top-0 right-0 w-24 h-24 -mr-12 -mt-12 bg-gradient-to-br from-white/10 to-transparent rounded-full transition-transform duration-700 group-hover:scale-150"></div>
      
      <div className="flex items-start justify-between relative z-10 gap-3">
        <div className="space-y-2">
          <div className="flex flex-col">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">{title}</span>
            <div className="flex items-baseline gap-0.5">
              <span className="text-xl font-black text-slate-900 tracking-tight">
                {prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}
              </span>
            </div>
          </div>
          
          {change !== undefined && (
            <div className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-bold ${change >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
              {change >= 0 ? '↗' : '↘'} {Math.abs(change)}%
            </div>
          )}
        </div>

        <div className={`p-2.5 rounded-xl shadow-lg shadow-blue-900/10 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 ${iconBg}`}>
          <Icon className="h-4 w-4 text-white" />
        </div>
      </div>
      
      <div className="mt-3 pt-3 border-t border-slate-50 flex items-center justify-between text-[8px] font-bold text-slate-300 uppercase tracking-wider relative z-10">
         <span>Details</span>
         <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
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
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                <FaSearch className="inline mr-2 h-4 w-4" />
                Browse Products
              </button>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-6">
          {activeTab === 'overview' && dashboardStats && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <StatCard
                  title="Orders"
                  value={dashboardStats?.purchaseMetrics?.totalOrders || 0}
                  icon={FaShoppingCart}
                  iconBg="bg-blue-600"
                />
                <StatCard
                  title="Spent"
                  value={dashboardStats?.purchaseMetrics?.totalSpent || 0}
                  icon={FaDollarSign}
                  iconBg="bg-slate-900"
                  prefix="Rs "
                />
                <StatCard
                  title="Wishlist"
                  value={dashboardStats?.wishlistStats?.totalItems || 0}
                  icon={FaHeart}
                  iconBg="bg-rose-500"
                />
                <StatCard
                  title="All-Time Earned"
                  value={dashboardStats?.purchaseMetrics?.totalPointsEarned || 0}
                  icon={FaMedal}
                  iconBg="bg-emerald-500"
                  suffix=" pts"
                />
                <StatCard
                  title="Points Redeemed"
                  value={dashboardStats?.purchaseMetrics?.totalPointsUsed || 0}
                  icon={FaChartBar}
                  iconBg="bg-rose-600"
                  suffix=" pts"
                />
                <StatCard
                  title="Balance"
                  value={dashboardStats?.buyerInfo?.loyaltyPoints || 0}
                  icon={FaStar}
                  iconBg="bg-amber-400"
                  suffix=" pts"
                />
              </div>

              {/* Star Points Banner Condensed */}
              <div className="loyalty-banner-modern relative overflow-hidden rounded-[1.5rem] p-6 text-white shadow-xl group transition-all duration-700 hover:shadow-blue-500/20">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-700 via-indigo-600 to-blue-900"></div>
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/5 rounded-full -mr-48 -mt-48 blur-[80px] animate-pulse"></div>
                
                {/* Standard History Button: Top Right */}
                <button 
                   onClick={() => setActiveTab('loyalty')} 
                   className="absolute top-4 right-4 z-20 p-2 bg-white/10 hover:bg-white/20 rounded-lg backdrop-blur-sm transition-all"
                   title="View History Ledger"
                >
                   <FaHistory className="text-white text-sm" />
                </button>

                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex-1 space-y-3 text-center md:text-left">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm">
                      <FaMedal className="text-amber-400 text-[10px]" />
                      <span className="text-[8px] font-black uppercase tracking-widest text-blue-100">Loyalty Status</span>
                    </div>
                    
                    <div className="space-y-0.5">
                       <h2 className="text-3xl md:text-4xl font-black tracking-tight leading-none">
                          {livePoints.toLocaleString()}
                          <span className="text-lg font-bold ml-2 text-blue-200/80">Star Points</span>
                       </h2>
                       <div className="flex items-center justify-center md:justify-start gap-3 mt-1">
                          <p className="text-sm text-blue-100/70 font-medium">
                             ≈ <span className="text-white font-bold">Rs {livePoints.toLocaleString()}</span> Credit
                          </p>
                          <div className="h-4 w-px bg-white/20" />
                          <p className="text-[10px] text-emerald-300 font-bold flex items-center gap-1">
                             <span className="p-0.5 rounded-full bg-emerald-500/20 text-[8px]">↑</span>
                             EARNED: {(dashboardStats?.purchaseMetrics?.totalPointsEarned || 0).toLocaleString()} pts
                          </p>
                          <div className="h-4 w-px bg-white/20" />
                          <p className="text-[10px] text-rose-300 font-bold flex items-center gap-1">
                             <span className="p-0.5 rounded-full bg-rose-500/20 text-[8px]">↓</span>
                             REDEEMED: {(dashboardStats?.purchaseMetrics?.totalPointsUsed || 0).toLocaleString()} pts
                          </p>
                       </div>
                    </div>

                    {/* Proactive Action Button */}
                    <div className="pt-2">
                       <button 
                          onClick={claimTestPoints}
                          disabled={isClaiming || !!nextClaimDate}
                          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-xs shadow-lg transition-all ${
                             (isClaiming || !!nextClaimDate) 
                             ? 'bg-white/20 text-white/40 cursor-not-allowed cursor-not-allowed border border-white/10' 
                             : 'bg-white text-blue-700 hover:bg-yellow-400 hover:text-white hover:scale-105 active:scale-95'
                          }`}
                       >
                          <FaGift className={isClaiming ? 'animate-bounce' : nextClaimDate ? '' : 'animate-pulse text-amber-400'} />
                          {isClaiming ? 'CLAIMING...' : nextClaimDate ? `NEXT CLAIM: ${timeToNextClaim || '...'}` : 'CLAIM DAILY REWARD'}
                       </button>
                    </div>
                  </div>

                  <div className="bg-white/5 backdrop-blur-md border border-white/10 p-5 rounded-[1.5rem] max-w-[260px] relative overflow-hidden group">
                     <div className="absolute top-0 right-0 w-16 h-16 bg-white/5 rounded-full -mr-8 -mt-8 animate-pulse"></div>
                     <p className="text-[9px] font-black text-blue-200 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-400"></span>
                        How Points Work
                     </p>
                     <div className="space-y-2">
                        <p className="text-xs font-bold flex items-center gap-2 text-white/90">
                           <span className="text-lg">🛒</span> Earn 10% back on orders
                        </p>
                        <p className="text-xs font-bold flex items-center gap-2 text-white/90">
                           <span className="text-lg">💳</span> 1 Point = 1 LKR Credit
                        </p>
                        <div className="pt-2 mt-2 border-t border-white/5">
                           <p className="text-[9px] font-black text-yellow-400 uppercase tracking-widest leading-tight">
                              Use points at checkout to pay fully!
                           </p>
                        </div>
                     </div>
                  </div>
                </div>
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

          {activeTab === 'loyalty' && (
            <div className="space-y-8 animate-in fade-in duration-500">
               {/* Points Overview Card */}
               <div className="bg-gradient-to-br from-indigo-700 via-blue-600 to-indigo-800 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
                  <div className="relative z-10">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                      <div>
                        <p className="text-blue-100 font-bold uppercase tracking-widest text-sm mb-2">Available Balance</p>
                        <h2 className="text-6xl font-black flex items-baseline gap-3">
                          {livePoints.toLocaleString()} 
                          <span className="text-2xl font-bold text-blue-200">Star Points</span>
                        </h2>
                        <p className="mt-4 text-blue-100/80 font-medium flex items-center gap-2">
                           <FaCheckCircle className="text-green-400" /> 1 Star Point = 1 LKR Purchasing Power
                        </p>
                      </div>
                      <button 
                        onClick={claimTestPoints}
                        disabled={isClaiming}
                        className={`group px-8 py-4 rounded-2xl font-black text-lg shadow-lg transition-all flex items-center gap-3 ${
                          isClaiming ? 'bg-white/50 cursor-wait' : 'bg-white text-indigo-700 hover:bg-yellow-400 hover:text-white hover:-translate-y-1'
                        }`}
                      >
                         <FaGift className={isClaiming ? 'animate-bounce' : 'group-hover:rotate-12 transition-transform'} />
                         {isClaiming ? 'Processing...' : 'Claim Daily Reward'}
                      </button>
                    </div>
                  </div>
               </div>

               {/* Split Columns */}
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left: How it works */}
                  <div className="lg:col-span-1 space-y-6">
                     <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                        <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                           <FaInfoCircle className="text-blue-500" /> How to Earn
                        </h3>
                        <div className="space-y-6">
                           <div className="flex gap-4">
                              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
                                 <FaShoppingCart className="text-green-600" />
                              </div>
                              <div>
                                 <p className="font-bold text-gray-800">Shop & Earn</p>
                                 <p className="text-sm text-gray-500">Get 10% back in points on every single purchase automatically.</p>
                              </div>
                           </div>
                           <div className="flex gap-4">
                              <div className="w-10 h-10 bg-yellow-50 rounded-lg flex items-center justify-center flex-shrink-0">
                                 <FaMedal className="text-yellow-600" />
                              </div>
                              <div>
                                 <p className="font-bold text-gray-800">Tier Up</p>
                                 <p className="text-sm text-gray-500">Higher loyalty levels unlock bonus point multipliers!</p>
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* Right: History Ledger */}
                  <div className="lg:col-span-2">
                     <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden min-h-[400px]">
                        <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                           <h3 className="font-bold text-gray-900 flex items-center gap-2">
                              <FaHistory className="text-gray-400" /> Points History Ledger
                           </h3>
                           <button onClick={fetchPointsHistory} className="text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors">Refresh</button>
                        </div>
                        <div className="overflow-x-auto">
                           <table className="w-full text-left">
                              <thead>
                                 <tr className="bg-gray-50/50 text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-100">
                                    <th className="px-6 py-4">Transaction</th>
                                    <th className="px-6 py-4">Description</th>
                                    <th className="px-6 py-4 text-right">Amount</th>
                                 </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-50">
                                 {pointsHistory.length > 0 ? pointsHistory.map(tx => (
                                    <tr key={tx._id} className="hover:bg-gray-50/50 transition-colors">
                                       <td className="px-6 py-4 uppercase text-[10px] font-bold text-gray-400">
                                          {new Date(tx.createdAt).toLocaleDateString()}
                                       </td>
                                       <td className="px-6 py-4">
                                          <p className="font-bold text-gray-800 text-sm">{tx.description}</p>
                                          <p className="text-[10px] font-medium text-gray-400 capitalize">{tx.type}</p>
                                       </td>
                                       <td className={`px-6 py-4 text-right font-black ${tx.amount > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                          {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()} pts
                                       </td>
                                    </tr>
                                 )) : (
                                    <tr>
                                       <td colSpan="3" className="px-6 py-12 text-center text-gray-400">
                                          <FaHistory className="text-4xl mx-auto mb-4 opacity-10" />
                                          <p className="font-bold">No transactions recorded yet.</p>
                                          <p className="text-sm">Points earned from orders will appear here.</p>
                                       </td>
                                    </tr>
                                 )}
                              </tbody>
                           </table>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
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
            
               <form onSubmit={async (e) => {
                 e.preventDefault();
                 await fetchLivePoints();
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
          buyerPoints={livePoints !== null ? livePoints : (dashboardStats?.buyerInfo?.loyaltyPoints ?? buyer?.purchaseStats?.loyaltyPoints ?? 0)}
          onCancel={() => setShowPaymentGateway(false)}
          onPaymentSuccess={async ({ paymentMethod, pointsUsed }) => {
            try {
              const response = await fetch('http://localhost:5000/api/orders/buyer', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${localStorage.getItem('buyerToken')}`
                },
                credentials: 'include',
                body: JSON.stringify({
                  orderItems: [{
                    product: selectedProduct._id,
                    title: selectedProduct.title,
                    image: selectedProduct.images[0] || '',
                    price: selectedProduct.price,
                    quantity: orderQuantity
                  }],
                  contactPhone: checkoutPhone,
                  paymentMethod,
                  pointsUsed: pointsUsed || 0
                })
              });
              const data = await response.json();
              if (data.success) {
                setShowPaymentGateway(false);
                setSelectedProduct(null);
                // Refresh everything so points sync immediately
                await Promise.all([
                   fetchBuyerProfile(), 
                   fetchDashboardStats(), 
                   fetchLivePoints(),
                   fetchPointsHistory()
                ]);
                setActiveTab('orders');
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