import React, { useState, useEffect } from "react";
import "./HomePage.css";
<<<<<<< Updated upstream
import UnimartLogo from "../assests/images/Unimart logo.png";
=======
import UnimartLogo from "./images/Unimart logo.png";
>>>>>>> Stashed changes
import {
  FaSeedling,
  FaTractor,
  FaLeaf,
  FaRobot,
  FaHandsHelping,
  FaBookOpen,
  FaTools,
  FaChartLine,
  FaCloud,
  FaMobile,
  FaUsers,
  FaAward,
  FaShieldAlt,
  FaBars,
  FaTimes,
  FaHome,
  FaInfoCircle,
  FaCog,
  FaPhone,
  FaSignInAlt,
  FaEnvelope,
  FaMapMarkerAlt,
  FaFacebook,
  FaTwitter,
  FaLinkedin,
  FaInstagram,
  FaArrowUp,
  FaChevronDown,
  FaUserShield,
  FaUserTie,
  FaShoppingCart,
  FaUniversity,
  FaStore,
  FaLaptop,
  FaClock,
} from "react-icons/fa";



export default function HomePage() {
  const [scrollY, setScrollY] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLoginDropdownOpen, setIsLoginDropdownOpen] = useState(false);
  const [isRegisterDropdownOpen, setIsRegisterDropdownOpen] = useState(false);
  const [showLoginPage, setShowLoginPage] = useState(false);
  const [showRegisterPage, setShowRegisterPage] = useState(false);
  const [loginType, setLoginType] = useState('');
  const [registerType, setRegisterType] = useState('');

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleLoginDropdown = () => {
    setIsLoginDropdownOpen(!isLoginDropdownOpen);
    setIsRegisterDropdownOpen(false); // Close register dropdown when login opens
  };

  const toggleRegisterDropdown = () => {
    setIsRegisterDropdownOpen(!isRegisterDropdownOpen);
    setIsLoginDropdownOpen(false); // Close login dropdown when register opens
  };

  const handleLogin = (type) => {
    setLoginType(type);
    setShowLoginPage(true);
    setIsLoginDropdownOpen(false);
  };

  const handleRegister = (type) => {
    setRegisterType(type);
    setShowRegisterPage(true);
    setIsRegisterDropdownOpen(false);
  };

  const closeLoginPage = () => {
    setShowLoginPage(false);
    setLoginType('');
  };

  const closeRegisterPage = () => {
    setShowRegisterPage(false);
    setRegisterType('');
  };

  const handleLogoError = (event) => {
    event.currentTarget.onerror = null;
    event.currentTarget.src = '/unimart-logo-fallback.svg';
  };

  if (showLoginPage) {
    return <LoginPage loginType={loginType} onClose={closeLoginPage} />;
  }

  if (showRegisterPage) {
    return <RegisterPage registerType={registerType} onClose={closeRegisterPage} />;
  }

  return (
    <div className="modern-home">
      {/* Navigation Bar */}
      <nav className={`navbar ${isScrolled ? 'navbar-scrolled' : ''}`}>
        <div className="nav-container">
          {/* Logo */}
          <div className="nav-logo">
            <img
              src={UnimartLogo}
              alt="UniMart Marketplace logo"
              className="logo-image"
            />
<<<<<<< Updated upstream
            <span className="logo-title">Unimart</span>
=======
            <span className="logo-main">Unimart</span>
>>>>>>> Stashed changes
          </div>

          {/* Desktop Menu */}
          <div className="nav-menu">
            <a href="#home" className="nav-link active">
              <FaHome className="nav-icon" />
              Home
            </a>
            <a href="#about" className="nav-link">
              <FaInfoCircle className="nav-icon" />
              About
            </a>
            <a href="#services" className="nav-link">
              <FaCog className="nav-icon" />
              Services
            </a>
            <a href="#contact" className="nav-link">
              <FaPhone className="nav-icon" />
              Contact
            </a>
          </div>

          {/* Auth Buttons */}
          <div className="nav-auth">
            <div className="login-dropdown">
              <button className="nav-btn-secondary dropdown-trigger" onClick={toggleLoginDropdown}>
                Login
                <FaChevronDown className={`dropdown-arrow ${isLoginDropdownOpen ? 'open' : ''}`} />
              </button>
              <div className={`dropdown-menu ${isLoginDropdownOpen ? 'open' : ''}`}>
                <button className="dropdown-item" onClick={() => handleLogin('admin')}>
                  <FaUserShield className="dropdown-icon" />
                  Admin Login
                </button>
                <button className="dropdown-item" onClick={() => handleLogin('seller')}>
                  <FaUserTie className="dropdown-icon" />
                  Seller Login
                </button>
                <button className="dropdown-item" onClick={() => handleLogin('buyer')}>
                  <FaShoppingCart className="dropdown-icon" />
                  Buyer Login
                </button>
              </div>
            </div>
            <div className="register-dropdown">
              <button className="nav-btn-secondary dropdown-trigger" onClick={toggleRegisterDropdown}>
                Register
                <FaChevronDown className={`dropdown-arrow ${isRegisterDropdownOpen ? 'open' : ''}`} />
              </button>
              <div className={`dropdown-menu ${isRegisterDropdownOpen ? 'open' : ''}`}>
                <button className="dropdown-item" onClick={() => handleRegister('admin')}>
                  <FaUserShield className="dropdown-icon" />
                  Admin Register
                </button>
                <button className="dropdown-item" onClick={() => handleRegister('seller')}>
                  <FaUserTie className="dropdown-icon" />
                  Seller Register
                </button>
                <button className="dropdown-item" onClick={() => handleRegister('buyer')}>
                  <FaShoppingCart className="dropdown-icon" />
                  Buyer Register
                </button>
              </div>
            </div>
            <button className="nav-btn-primary">
              <FaSignInAlt className="btn-icon" />
              Get Started
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="nav-toggle" onClick={toggleMenu}>
            {isMenuOpen ? <FaTimes /> : <FaBars />}
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={`nav-mobile ${isMenuOpen ? 'nav-mobile-open' : ''}`}>
          <a href="#home" className="nav-mobile-link" onClick={toggleMenu}>
            <FaHome className="nav-icon" />
            Home
          </a>
          <a href="#about" className="nav-mobile-link" onClick={toggleMenu}>
            <FaInfoCircle className="nav-icon" />
            About
          </a>
          <a href="#services" className="nav-mobile-link" onClick={toggleMenu}>
            <FaCog className="nav-icon" />
            Services
          </a>
          <a href="#contact" className="nav-mobile-link" onClick={toggleMenu}>
            <FaPhone className="nav-icon" />
            Contact
          </a>
          <div className="nav-mobile-auth">
            <div className="login-dropdown-mobile">
              <button className="nav-btn-secondary dropdown-trigger" onClick={toggleLoginDropdown}>
                Login
                <FaChevronDown className={`dropdown-arrow ${isLoginDropdownOpen ? 'open' : ''}`} />
              </button>
              <div className={`dropdown-menu-mobile ${isLoginDropdownOpen ? 'open' : ''}`}>
                <button className="dropdown-item-mobile" onClick={() => handleLogin('admin')}>
                  <FaUserShield className="dropdown-icon" />
                  Admin Login
                </button>
                <button className="dropdown-item-mobile" onClick={() => handleLogin('seller')}>
                  <FaUserTie className="dropdown-icon" />
                  Seller Login
                </button>
                <button className="dropdown-item-mobile" onClick={() => handleLogin('buyer')}>
                  <FaShoppingCart className="dropdown-icon" />
                  Buyer Login
                </button>
              </div>
            </div>
            <div className="register-dropdown-mobile">
              <button className="nav-btn-secondary dropdown-trigger" onClick={toggleRegisterDropdown}>
                Register
                <FaChevronDown className={`dropdown-arrow ${isRegisterDropdownOpen ? 'open' : ''}`} />
              </button>
              <div className={`dropdown-menu-mobile ${isRegisterDropdownOpen ? 'open' : ''}`}>
                <button className="dropdown-item-mobile" onClick={() => handleRegister('admin')}>
                  <FaUserShield className="dropdown-icon" />
                  Admin Register
                </button>
                <button className="dropdown-item-mobile" onClick={() => handleRegister('seller')}>
                  <FaUserTie className="dropdown-icon" />
                  Seller Register
                </button>
                <button className="dropdown-item-mobile" onClick={() => handleRegister('buyer')}>
                  <FaShoppingCart className="dropdown-icon" />
                  Buyer Register
                </button>
              </div>
            </div>
            <button className="nav-btn-primary" onClick={toggleMenu}>
              <FaSignInAlt className="btn-icon" />
              Get Started
            </button>
          </div>
        </div>
      </nav>
      {/* Hero Section with Parallax Background */}
      <section id="home" className="hero-section" style={{transform: `translateY(${scrollY * 0.5}px)`}}>
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <div className="hero-badge">
            <FaUniversity className="hero-badge-icon" />
            <span>Trusted Campus Commerce</span>
          </div>
          <h1 className="hero-title">
            Buy, Sell, and Discover
            <span className="hero-title-accent">Everything on Campus</span>
          </h1>
          <p className="hero-subtitle">
            Unimart is your university marketplace for books, electronics, dorm essentials,
            event tickets, and more—securely traded between students and campus communities.
          </p>
          <div className="hero-buttons">
            <button className="btn-primary">
              <FaStore />
              Start Selling
            </button>
            <button className="btn-secondary">
              <FaShoppingCart />
              Browse Deals
            </button>
          </div>
          
          {/* Floating Stats */}
          <div className="floating-stats">
            <div className="stat-item">
              <span className="stat-number">5K+</span>
              <span className="stat-label">Students</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">1K+</span>
              <span className="stat-label">Items Listed</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">24/7</span>
              <span className="stat-label">Marketplace Access</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="services" className="features-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Everything You Need for Campus Trading</h2>
            <p className="section-subtitle">Simple, safe, and fast buying and selling for university life</p>
          </div>
          
          <div className="features-grid">
            <FeatureCard
              icon={<FaStore />}
              title="Quick Item Listings"
              description="Post items in minutes with images, pricing, category, and condition details."
              gradient="emerald"
            />
            <FeatureCard
              icon={<FaShoppingCart />}
              title="Smart Discovery"
              description="Find relevant items quickly by category and availability around your campus."
              gradient="blue"
            />
            <FeatureCard
              icon={<FaShieldAlt />}
              title="Verified Roles"
              description="Role-based access for admins, sellers, and buyers keeps transactions organized and secure."
              gradient="cyan"
            />
            <FeatureCard
              icon={<FaLaptop />}
              title="Student Essentials"
              description="Buy and sell textbooks, laptops, calculators, and accessories at affordable prices."
              gradient="orange"
            />
            <FeatureCard
              icon={<FaClock />}
              title="Real-Time Availability"
              description="See what is available now and connect faster to close deals before items are gone."
              gradient="purple"
            />
            <FeatureCard
              icon={<FaShieldAlt />}
              title="Safe & Reliable"
              description="Built with secure authentication and stable performance for daily campus use."
              gradient="green"
            />
          </div>
        </div>
      </section>

      {/* Info Cards Section */}
      <section id="about" className="info-section">
        <div className="container">
          <div className="info-cards-modern">
            <InfoCard
              icon={<FaBookOpen />}
              title="Academic Marketplace"
              description="Trade textbooks, notes, and study tools with students from your university community."
              stats="1000+ Listings"
            />
            <InfoCard
              icon={<FaUsers />}
              title="Student Community"
              description="Connect buyers and sellers across faculties, hostels, and student organizations."
              stats="5000+ Members"
            />
            <InfoCard
              icon={<FaAward />}
              title="Trusted Transactions"
              description="Transparent listings and clear communication help students trade with confidence."
              stats="98% Positive Feedback"
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer-section">
        <div className="container">
          {/* Footer Content */}
          <div className="footer-content">
            {/* Company Info */}
            <div className="footer-column">
              <div className="footer-logo">
                <img
                  src={UnimartLogo}
                  alt="UniMart Marketplace logo"
                  className="footer-logo-image"
                />
<<<<<<< Updated upstream
=======
                <span className="footer-logo-main">Unimart</span>
>>>>>>> Stashed changes
              </div>
              <p className="footer-description">
                Unimart helps university students buy and sell items with ease.
                From study materials to daily essentials, everything is in one trusted marketplace.
              </p>
              <div className="footer-social">
                <a href="#" className="social-link">
                  <FaFacebook />
                </a>
                <a href="#" className="social-link">
                  <FaTwitter />
                </a>
                <a href="#" className="social-link">
                  <FaLinkedin />
                </a>
                <a href="#" className="social-link">
                  <FaInstagram />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div className="footer-column">
              <h3 className="footer-heading">Quick Links</h3>
              <ul className="footer-links">
                <li><a href="#home">Home</a></li>
                <li><a href="#about">About Us</a></li>
                <li><a href="#services">Services</a></li>
                <li><a href="#contact">Contact</a></li>
                <li><a href="#pricing">Pricing</a></li>
                <li><a href="#blog">Blog</a></li>
              </ul>
            </div>

            {/* Services */}
            <div className="footer-column">
              <h3 className="footer-heading">Our Services</h3>
              <ul className="footer-links">
                <li><a href="#">Item Listings</a></li>
                <li><a href="#">Buyer Dashboard</a></li>
                <li><a href="#">Seller Dashboard</a></li>
                <li><a href="#">Admin Moderation</a></li>
                <li><a href="#">Secure Login</a></li>
                <li><a href="#">Campus Support</a></li>
              </ul>
            </div>

            {/* Contact Info */}
            <div className="footer-column">
              <h3 className="footer-heading">Contact Info</h3>
              <div className="footer-contact">
                <div className="contact-item">
                  <FaMapMarkerAlt className="contact-icon" />
                  <div>
                    <p>University Campus Center</p>
                    <p>Main Road, Student Hub</p>
                  </div>
                </div>
                <div className="contact-item">
                  <FaPhone className="contact-icon" />
                  <div>
                    <p>+1 (555) 123-4567</p>
                    <p>+1 (555) 765-4321</p>
                  </div>
                </div>
                <div className="contact-item">
                  <FaEnvelope className="contact-icon" />
                  <div>
                    <p>info@unimart.com</p>
                    <p>support@unimart.com</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Bottom */}
          <div className="footer-bottom">
            <div className="footer-bottom-content">
              <p className="footer-copyright">
                © 2025 Unimart. All rights reserved. | Privacy Policy | Terms of Service
              </p>
              <button className="back-to-top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                <FaArrowUp />
                Back to Top
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Modern Feature Card Component
const FeatureCard = ({ icon, title, description, gradient }) => (
  <div className={`feature-card-modern feature-${gradient}`}>
    <div className="feature-icon-wrapper">
      {icon}
    </div>
    <h3 className="feature-title-modern">{title}</h3>
    <p className="feature-description-modern">{description}</p>
    <div className="feature-hover-effect"></div>
  </div>
);

// Modern Info Card Component
const InfoCard = ({ icon, title, description, stats }) => (
  <div className="info-card-modern">
    <div className="info-icon-header">
      <div className="info-icon-modern">{icon}</div>
    </div>
    <div className="info-content-modern">
      <div className="info-stats">{stats}</div>
      <h3 className="info-title-modern">{title}</h3>
      <p className="info-description-modern">{description}</p>
    </div>
  </div>
);

// Login Page Component
const LoginPage = ({ loginType, onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const getLoginConfig = () => {
    switch (loginType) {
      case 'admin':
        return {
          title: 'Admin Login',
          subtitle: 'Access administrative dashboard',
          icon: <FaUserShield />,
          color: '#dc2626'
        };
      case 'seller':
        return {
          title: 'Seller Login',
          subtitle: 'Manage your campus listings',
          icon: <FaUserTie />,
          color: '#16a34a'
        };
      case 'buyer':
        return {
          title: 'Buyer Login',
          subtitle: 'Browse and purchase campus items',
          icon: <FaShoppingCart />,
          color: '#2563eb'
        };
      default:
        return {
          title: 'Login',
          subtitle: 'Access your account',
          icon: <FaSignInAlt />,
          color: '#16a34a'
        };
    }
  };

  const config = getLoginConfig();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const endpoint = loginType === 'admin' ? '/api/admin/login' : `/api/${loginType}/login`;
      
      const response = await fetch(`http://localhost:5000${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email,
          password,
          rememberMe
        })
      });

      const data = await response.json();
      console.log('Login response:', data); // Debug log

      if (response.ok && data.success && data.data) {
        // Store token in localStorage
        if (data.data.token) {
          localStorage.setItem(`${loginType}Token`, data.data.token);
        }
        
        // Handle different user types
        if (loginType === 'admin' && data.data.admin) {
          // Store admin data for immediate use
          localStorage.setItem('adminData', JSON.stringify(data.data.admin));
          
          // Use window.location.href for immediate redirect
          setTimeout(() => {
            window.location.href = '/admin-dashboard';
          }, 100);
        } else if (loginType === 'seller' && data.data.seller) {
          // Store seller data for immediate use
          localStorage.setItem('sellerData', JSON.stringify(data.data.seller));
          
          // Redirect to seller dashboard
          setTimeout(() => {
            window.location.href = '/seller-dashboard';
          }, 100);
        } else if (loginType === 'buyer' && data.data.buyer) {
          // Store buyer data for immediate use
          localStorage.setItem('buyerData', JSON.stringify(data.data.buyer));
          
          // Redirect to buyer dashboard
          setTimeout(() => {
            window.location.href = '/buyer-dashboard';
          }, 100);
        } else {
          // Handle login success but missing user data
          console.log(`${loginType} login successful but missing user data:`, data);
          setError('Login successful but user data not found. Please try again.');
        }
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <button className="login-close" onClick={onClose}>
            <FaTimes />
          </button>
        </div>
        
        <div className="login-content">
          <div className="login-form-section">
            <div className="login-form-header">
              <div className="login-icon" style={{ background: config.color }}>
                {config.icon}
              </div>
              <h2 className="login-title">{config.title}</h2>
              <p className="login-subtitle">{config.subtitle}</p>
            </div>

            <form className="login-form" onSubmit={handleSubmit}>
              {error && (
                <div className="error-message">
                  {error}
                </div>
              )}
              
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-options">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    id="rememberMe"
                    name="rememberMe"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={loading}
                  />
                  <span className="checkbox-custom"></span>
                  Remember me
                </label>
                <a href="#" className="forgot-password">Forgot Password?</a>
              </div>

              <button 
                type="submit" 
                className="login-submit" 
                style={{ background: config.color }}
                disabled={loading}
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>

            <div className="login-footer">
              <p>Don't have an account? <a href="#" style={{ color: config.color }}>Sign up here</a></p>
            </div>
          </div>

          <div className="login-image-section">
            <div className="login-image-content">
              <h3>Welcome to Unimart</h3>
              <p>Your trusted university marketplace</p>
              <div className="login-features">
                <div className="feature-item">
                  <FaStore className="feature-icon" />
                  <span>Fast Item Listings</span>
                </div>
                <div className="feature-item">
                  <FaShoppingCart className="feature-icon" />
                  <span>Easy Buying Experience</span>
                </div>
                <div className="feature-item">
                  <FaShieldAlt className="feature-icon" />
                  <span>Secure Campus Access</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Register Page Component
const RegisterPage = ({ registerType, onClose }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: '',
    businessName: '', // For seller
    businessLicense: '', // For seller
    agreeToTerms: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const getRegisterConfig = () => {
    switch (registerType) {
      case 'admin':
        return {
          title: 'Admin Registration',
          subtitle: 'Create administrative account',
          icon: <FaUserShield />,
          color: '#dc2626'
        };
      case 'seller':
        return {
          title: 'Seller Registration',
          subtitle: 'Join as a campus seller',
          icon: <FaUserTie />,
          color: '#16a34a'
        };
      case 'buyer':
        return {
          title: 'Buyer Registration',
          subtitle: 'Create your customer account',
          icon: <FaShoppingCart />,
          color: '#2563eb'
        };
      default:
        return {
          title: 'Registration',
          subtitle: 'Create your account',
          icon: <FaSignInAlt />,
          color: '#16a34a'
        };
    }
  };

  const config = getRegisterConfig();

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setError(''); // Clear error when user types
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match!');
      setLoading(false);
      return;
    }
    
    if (!formData.agreeToTerms) {
      setError('Please agree to the terms and conditions!');
      setLoading(false);
      return;
    }

    try {
      const endpoint = registerType === 'admin' ? '/api/admin/register' : `/api/${registerType}/register`;
      
      const response = await fetch(`http://localhost:5000${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          address: formData.address,
          ...(registerType === 'seller' && {
            businessName: formData.businessName,
            businessLicense: formData.businessLicense
          })
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Registration successful! You can now login.');
        
        // Store token if provided
        if (data.data && data.data.token) {
          localStorage.setItem(`${registerType}Token`, data.data.token);
          
          // Store user data for immediate use
          if (registerType === 'admin' && data.data.admin) {
            localStorage.setItem('adminData', JSON.stringify(data.data.admin));
          } else if (registerType === 'seller' && data.data.seller) {
            localStorage.setItem('sellerData', JSON.stringify(data.data.seller));
          } else if (registerType === 'buyer' && data.data.buyer) {
            localStorage.setItem('buyerData', JSON.stringify(data.data.buyer));
          }
        }

        // Reset form
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          password: '',
          confirmPassword: '',
          phone: '',
          address: '',
          businessName: '',
          businessLicense: '',
          agreeToTerms: false
        });

        // Auto close after 2 seconds
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-container">
        <div className="register-header">
          <button className="register-close" onClick={onClose}>
            <FaTimes />
          </button>
        </div>
        
        <div className="register-content">
          <div className="register-form-section">
            <div className="register-form-header">
              <div className="register-icon" style={{ background: config.color }}>
                {config.icon}
              </div>
              <h2 className="register-title">{config.title}</h2>
              <p className="register-subtitle">{config.subtitle}</p>
            </div>

            <form className="register-form" onSubmit={handleSubmit}>
              {error && (
                <div className="error-message">
                  {error}
                </div>
              )}
              
              {success && (
                <div className="success-message">
                  {success}
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="firstName">First Name</label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    placeholder="Enter your first name"
                    required
                    disabled={loading}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="lastName">Last Name</label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    placeholder="Enter your last name"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email"
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Create a password"
                    required
                    disabled={loading}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm Password</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Confirm your password"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone Number</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Enter your phone number"
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="address">Address</label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Enter your address"
                  required
                  disabled={loading}
                />
              </div>

              {registerType === 'seller' && (
                <>
                  <div className="form-group">
                    <label htmlFor="businessName">Shop/Club Name</label>
                    <input
                      type="text"
                      id="businessName"
                      name="businessName"
                      value={formData.businessName}
                      onChange={handleInputChange}
                      placeholder="Enter your shop or club name"
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="businessLicense">Student/Organization ID (Optional)</label>
                    <input
                      type="text"
                      id="businessLicense"
                      name="businessLicense"
                      value={formData.businessLicense}
                      onChange={handleInputChange}
                      placeholder="Enter student ID or organization ID"
                      disabled={loading}
                    />
                  </div>
                </>
              )}

              <div className="form-options">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    id="agreeToTerms"
                    name="agreeToTerms"
                    checked={formData.agreeToTerms}
                    onChange={handleInputChange}
                    required
                    disabled={loading}
                  />
                  <span className="checkbox-custom"></span>
                  I agree to the <a href="#" style={{ color: config.color }}>Terms & Conditions</a> and <a href="#" style={{ color: config.color }}>Privacy Policy</a>
                </label>
              </div>

              <button 
                type="submit" 
                className="register-submit" 
                style={{ background: config.color }}
                disabled={loading}
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>

            <div className="register-footer">
              <p>Already have an account? <a href="#" style={{ color: config.color }} onClick={() => {
                onClose();
                // You could add logic here to switch to login page
              }}>Sign in here</a></p>
            </div>
          </div>

          <div className="register-image-section">
            <div className="register-image-content">
              <h3>Join Unimart Today</h3>
              <p>Start selling and buying within your university community</p>
              <div className="register-benefits">
                <div className="benefit-item">
                  <FaStore className="benefit-icon" />
                  <div>
                    <h4>Sell Easily</h4>
                    <p>List your items quickly and reach student buyers</p>
                  </div>
                </div>
                <div className="benefit-item">
                  <FaUsers className="benefit-icon" />
                  <div>
                    <h4>Campus Network</h4>
                    <p>Trade with students and university clubs</p>
                  </div>
                </div>
                <div className="benefit-item">
                  <FaShoppingCart className="benefit-icon" />
                  <div>
                    <h4>Affordable Deals</h4>
                    <p>Buy quality items at student-friendly prices</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};