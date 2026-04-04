import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import {
  FaTachometerAlt,
  FaUsers,
  FaUserFriends,
  FaUserCheck,
  FaUserMinus,
  FaUserTimes,
  FaBoxOpen,
  FaShoppingCart,
  FaDollarSign,
  FaBell,
  FaCog,
  FaSignOutAlt,
  FaUserShield,
  FaChartLine,
  FaCalendarAlt,
  FaEye,
  FaEdit,
  FaTrash,
  FaPlus,
  FaSearch,
  FaFilter,
  FaTimes,
  FaShoppingBag,
  FaSave,
  FaStore,
  FaIndustry,
  FaPhone,
  FaMapMarkerAlt,
  FaUser,
  FaClock,
  FaSync,
  FaRobot,
  FaSpinner,
  FaDownload,
} from 'react-icons/fa';
import './AdminDashboard.css';
import './AdminProfile.css';
import Toast from './Toast';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// -----------------------------
// Reusable presentational bits
// -----------------------------

const StatCard = ({ icon, title, value, change, color }) => (
  <div className={`stat-card stat-card-${color}`}>
    <div className="stat-icon">{icon}</div>
    <div className="stat-content">
      <h3 className="stat-value">{value}</h3>
      <p className="stat-title">{title}</p>
      {change && (
        <span className={`stat-change ${String(change).startsWith('+') ? 'positive' : 'negative'}`}>
          {change}
        </span>
      )}
    </div>
  </div>
);

const PlaceholderContent = ({ title }) => (
  <div className="placeholder-content">
    <div className="placeholder-header">
      <h1>{title}</h1>
      <p>This section is under development</p>
    </div>
    <div className="placeholder-card">
      <div className="placeholder-icon">
        <FaCog />
      </div>
      <h3>Coming Soon</h3>
      <p>We're working on bringing you the best {title.toLowerCase()} management experience.</p>
    </div>
  </div>
);

// -----------------------------
// Dashboard page
// -----------------------------

const DashboardContent = ({ admin, stats }) => (
  <div className="dashboard-content">
    <div className="dashboard-header">
      <h1>Welcome back, {admin.firstName}!</h1>
      <p>Here's what's happening with your agricultural platform</p>
    </div>

    <div className="stats-grid">
      <StatCard icon={<FaUsers />} title="Total Users" value={stats.totalUsers} change="+12%" color="blue" />
      <StatCard icon={<FaBoxOpen />} title="Products" value={stats.totalProducts} change="+5%" color="green" />
      <StatCard icon={<FaShoppingCart />} title="Orders" value={stats.totalOrders} change="+18%" color="orange" />
      <StatCard
        icon={<FaDollarSign />}
        title="Revenue"
        value={`$${Number(stats.totalRevenue || 0).toLocaleString()}`}
        change="+22%"
        color="purple"
      />
    </div>

    <div className="dashboard-grid">
      <div className="dashboard-card">
        <div className="card-header">
          <h3>Recent Activities</h3>
          <button className="btn-secondary">View All</button>
        </div>
        <div className="activities-list">
          {Array.isArray(stats.recentActivities) && stats.recentActivities.length > 0 ? (
            stats.recentActivities.map((activity, index) => (
              <div key={index} className="activity-item">
                <div className="activity-icon">
                  <FaCalendarAlt />
                </div>
                <div className="activity-content">
                  <p>{activity.description}</p>
                  <span className="activity-time">{activity.time}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <p>No recent activities</p>
            </div>
          )}
        </div>
      </div>

      <div className="dashboard-card">
        <div className="card-header">
          <h3>System Status</h3>
          <div className={`status-indicator ${stats.systemStatus?.server === 'online' ? 'online' : 'offline'}`}>
            {stats.systemStatus?.server === 'online' ? 'Online' : 'Offline'}
          </div>
        </div>
        <div className="status-list">
          <div className="status-item">
            <span>Server Status</span>
            <span className={`status-value ${stats.systemStatus?.server === 'online' ? 'success' : 'error'}`}>
              {stats.systemStatus?.server || 'unknown'}
            </span>
          </div>
          <div className="status-item">
            <span>Database</span>
            <span className={`status-value ${stats.systemStatus?.database === 'connected' ? 'success' : 'error'}`}>
              {stats.systemStatus?.database || 'unknown'}
            </span>
          </div>
          <div className="status-item">
            <span>Last Backup</span>
            <span className="status-value">
              {stats.systemStatus?.lastBackup ? new Date(stats.systemStatus.lastBackup).toLocaleDateString() : '—'}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// -----------------------------
// Admin Profile page
// -----------------------------

const AdminProfileContent = ({
  admin,
  adminProfile,
  isEditingProfile,
  setIsEditingProfile,
  handleProfileInputChange,
  handleProfileUpdate,
  profileUpdateLoading,
}) => {
  const getPermissionDescription = (permission) => {
    const descriptions = {
      manage_users: 'Full access to buyer and seller management',
      manage_sellers: 'Access to seller account management and verification',
      manage_products: 'Ability to manage product listings and categories',
      manage_orders: 'Access to order management and processing',
      view_analytics: 'Access to all analytics and reporting features',
      manage_settings: 'Ability to modify system settings and configurations',
      manage_content: 'Access to content management and editing features',
    };
    return descriptions[permission] || 'System access permission';
  };

  return (
    <div className="admin-profile-content">
      <div className="profile-header">
        <div className="profile-header-content">
          <div className="profile-avatar-section">
            <div className="profile-avatar">
              {adminProfile.profileImage ? <img src={adminProfile.profileImage} alt="Admin Avatar" /> : <FaUser />}
            </div>
            <div className="profile-status">
              <span className="online-status">🟢 {adminProfile.isActive ? 'Active' : 'Inactive'}</span>
              <span className="last-login">
                Last login: {adminProfile.lastLogin ? new Date(adminProfile.lastLogin).toLocaleString() : 'Never'}
              </span>
            </div>
          </div>
          <div className="profile-info">
            <h1>
              {adminProfile.firstName} {adminProfile.lastName}
            </h1>
            <p className="profile-role">
              {adminProfile.role === 'super_admin' ? 'Super Administrator' : 'Administrator'}
            </p>
            <p className="profile-department">System Administration</p>
          </div>
          <div className="profile-actions">
            <button className="edit-profile-btn" onClick={() => setIsEditingProfile((v) => !v)}>
              <FaEdit /> {isEditingProfile ? 'Cancel Edit' : 'Edit Profile'}
            </button>
          </div>
        </div>
      </div>

      <div className="profile-body">
        <div className="profile-sections">
          {/* Personal Information */}
          <div className="profile-section">
            <div className="section-header">
              <h3>Personal Information</h3>
              <FaUser className="section-icon" />
            </div>
            <div className="profile-details">
              <div className="detail-grid">
                <div className="detail-item">
                  <label>First Name</label>
                  {isEditingProfile ? (
                    <input
                      type="text"
                      value={adminProfile.firstName}
                      onChange={(e) => handleProfileInputChange('firstName', e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key.length === 1 && /[^a-zA-Z\s]/.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      className="profile-input"
                      required
                    />
                  ) : (
                    <span>{adminProfile.firstName}</span>
                  )}
                </div>
                <div className="detail-item">
                  <label>Last Name</label>
                  {isEditingProfile ? (
                    <input
                      type="text"
                      value={adminProfile.lastName}
                      onChange={(e) => handleProfileInputChange('lastName', e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key.length === 1 && /[^a-zA-Z\s]/.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      className="profile-input"
                      required
                    />
                  ) : (
                    <span>{adminProfile.lastName}</span>
                  )}
                </div>
                <div className="detail-item">
                  <label>Email Address</label>
                  {isEditingProfile ? (
                    <input
                      type="email"
                      value={adminProfile.email}
                      onChange={(e) => handleProfileInputChange('email', e.target.value)}
                      className="profile-input"
                      required
                    />
                  ) : (
                    <span>{adminProfile.email}</span>
                  )}
                </div>
                <div className="detail-item">
                  <label>Phone Number</label>
                  {isEditingProfile ? (
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength="10"
                      value={adminProfile.phone}
                      onChange={(e) => handleProfileInputChange('phone', e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key.length === 1 && !/^[0-9]+$/.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      className="profile-input"
                      placeholder="077 123 4567"
                      required
                    />
                  ) : (
                    <span>{adminProfile.phone || 'Not provided'}</span>
                  )}
                </div>
                <div className="detail-item full-width">
                  <label>Address</label>
                  {isEditingProfile ? (
                    <textarea
                      value={adminProfile.address}
                      onChange={(e) => handleProfileInputChange('address', e.target.value)}
                      className="profile-textarea"
                      placeholder="Enter your full address..."
                      rows="2"
                      required
                    />
                  ) : (
                    <span>{adminProfile.address}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Professional Details */}
          <div className="profile-section">
            <div className="section-header">
              <h3>Professional Details</h3>
              <FaUserShield className="section-icon" />
            </div>
            <div className="profile-details">
              <div className="detail-grid">
                <div className="detail-item">
                  <label>Role</label>
                  {isEditingProfile ? (
                    <select
                      value={adminProfile.role}
                      onChange={(e) => handleProfileInputChange('role', e.target.value)}
                      className="profile-select"
                    >
                      <option value="admin">Administrator</option>
                      <option value="super_admin">Super Administrator</option>
                    </select>
                  ) : (
                    <span>{adminProfile.role === 'super_admin' ? 'Super Administrator' : 'Administrator'}</span>
                  )}
                </div>
                <div className="detail-item">
                  <label>Account Status</label>
                  <span className={`status-badge ${adminProfile.isActive ? 'active' : 'inactive'}`}>
                    {adminProfile.isActive ? '✓ Active' : '✗ Inactive'}
                  </span>
                </div>
                <div className="detail-item">
                  <label>Join Date</label>
                  <span>{new Date(adminProfile.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="detail-item">
                  <label>Admin ID</label>
                  <span className="admin-id">ADM{admin?.id || admin?._id || '001'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Permissions */}
          <div className="profile-section">
            <div className="section-header">
              <h3>System Access & Permissions</h3>
              <FaCog className="section-icon" />
            </div>
            <div className="profile-details">
              <div className="permissions-grid">
                {(adminProfile.permissions || []).map((permission, index) => (
                  <div key={index} className="permission-item">
                    <div className="permission-icon">
                      {permission === 'manage_users' && <FaUsers />}
                      {permission === 'manage_sellers' && <FaUserShield />}
                      {permission === 'manage_products' && <FaBoxOpen />}
                      {permission === 'manage_orders' && <FaShoppingCart />}
                      {permission === 'view_analytics' && <FaChartLine />}
                      {permission === 'manage_settings' && <FaCog />}
                      {permission === 'manage_content' && <FaEdit />}
                      {![
                        'manage_users',
                        'manage_sellers',
                        'manage_products',
                        'manage_orders',
                        'view_analytics',
                        'manage_settings',
                        'manage_content',
                      ].includes(permission) && <FaCog />}
                    </div>
                    <div className="permission-info">
                      <h4>{permission.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}</h4>
                      <p>{getPermissionDescription(permission)}</p>
                    </div>
                    <div className="permission-status active">✓ Active</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Save Changes */}
        {isEditingProfile && (
          <div className="profile-save-section">
            <div className="save-actions">
              <button
                className="save-btn"
                onClick={() => handleProfileUpdate(adminProfile)}
                disabled={profileUpdateLoading}
              >
                {profileUpdateLoading ? (
                  <>
                    <FaSpinner className="spinning" /> Saving...
                  </>
                ) : (
                  <>
                    <FaSave /> Save Changes
                  </>
                )}
              </button>
              <button className="cancel-btn" onClick={() => setIsEditingProfile(false)} disabled={profileUpdateLoading}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};


// -----------------------------
// Admin management (users)
// -----------------------------

const AddAdminForm = memo(function AddAdminForm({
  newAdminData,
  handleFirstNameChange,
  handleLastNameChange,
  handleEmailChange,
  handlePasswordChange,
  handlePhoneChange,
  handleRoleChange,
  handleAddressChange,
}) {
  return (
    <div className="detail-section">
      <h4>Admin Information</h4>
      <div className="detail-grid">
        <div className="detail-item">
          <label>First Name *</label>
          <input
            type="text"
            className="edit-input"
            placeholder="Enter first name"
            value={newAdminData.firstName || ''}
            onChange={handleFirstNameChange}
            autoComplete="given-name"
            required
          />
        </div>
        <div className="detail-item">
          <label>Last Name *</label>
          <input
            type="text"
            className="edit-input"
            placeholder="Enter last name"
            value={newAdminData.lastName || ''}
            onChange={handleLastNameChange}
            autoComplete="family-name"
            required
          />
        </div>
        <div className="detail-item">
          <label>Email *</label>
          <input
            type="email"
            className="edit-input"
            placeholder="Enter email address"
            value={newAdminData.email || ''}
            onChange={handleEmailChange}
            autoComplete="email"
            required
          />
        </div>
        <div className="detail-item">
          <label>Password *</label>
          <input
            type="password"
            className="edit-input"
            placeholder="Enter password (min 6 characters)"
            value={newAdminData.password || ''}
            onChange={handlePasswordChange}
            autoComplete="new-password"
            required
            minLength={6}
          />
        </div>
        <div className="detail-item">
          <label>Phone</label>
          <input
            type="tel"
            className="edit-input"
            placeholder="Enter phone number"
            value={newAdminData.phone || ''}
            onChange={handlePhoneChange}
            autoComplete="tel"
          />
        </div>
        <div className="detail-item">
          <label>Role</label>
          <select className="edit-input" value={newAdminData.role || 'admin'} onChange={handleRoleChange}>
            <option value="admin">Admin</option>
            <option value="super_admin">Super Admin</option>
          </select>
        </div>
      </div>
      <div className="detail-item full-width">
        <label>Address</label>
        <textarea
          className="edit-input"
          placeholder="Enter full address (optional)"
          value={newAdminData.address || ''}
          onChange={handleAddressChange}
          rows={3}
        />
      </div>
    </div>
  );
});

const AdminManagement = memo(function AdminManagement({
  admin,
  admins,
  setAdmins,
  adminsLoading,
  showToast,
  handleSearchInputChange,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Local edit states
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [isEditingAdmin, setIsEditingAdmin] = useState(false);
  const [editAdminData, setEditAdminData] = useState({});
  const [adminUpdateLoading, setAdminUpdateLoading] = useState(false);

  // Add new admin
  const [isAddingAdmin, setIsAddingAdmin] = useState(false);
  const [newAdminData, setNewAdminData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    address: '',
    role: 'admin',
  });
  const [addAdminLoading, setAddAdminLoading] = useState(false);

  const filteredAdmins = useMemo(() => {
    // Ensure admins is always an array
    if (!Array.isArray(admins)) {
      return [];
    }
    
    return admins.filter((adminUser) => {
      // Safety check to ensure adminUser exists and has required properties
      if (!adminUser || typeof adminUser !== 'object') {
        return false;
      }
      
      const firstName = adminUser.firstName || '';
      const lastName = adminUser.lastName || '';
      const email = adminUser.email || '';
      
      const matchesSearch =
        (firstName + ' ' + lastName).toLowerCase().includes(searchTerm.toLowerCase()) ||
        email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        filterStatus === 'all' ||
        (filterStatus === 'active' && adminUser.isActive) ||
        (filterStatus === 'inactive' && !adminUser.isActive);
      return matchesSearch && matchesStatus;
    });
  }, [admins, searchTerm, filterStatus]);

  const handleEditAdminInputChange = useCallback((field, value) => {
    if (field === 'phone') {
      let val = value.replace(/\D/g, '');
      if (val.length > 0 && val[0] !== '0') val = '0' + val;
      val = val.slice(0, 10);
      setEditAdminData((prev) => ({ ...prev, [field]: val }));
    } else if (field === 'firstName' || field === 'lastName') {
      const textOnly = value.replace(/[^a-zA-Z\s]/g, '');
      setEditAdminData((prev) => ({ ...prev, [field]: textOnly }));
    } else if (field === 'email') {
      if ((value.match(/@/g) || []).length > 1) return;
      setEditAdminData((prev) => ({ ...prev, [field]: value }));
    } else {
      setEditAdminData((prev) => ({ ...prev, [field]: value }));
    }
  }, []);

  // Individual handlers
  const handleEditAdminFirstNameChange = useCallback((e) => handleEditAdminInputChange('firstName', e.target.value), [handleEditAdminInputChange]);
  const handleEditAdminLastNameChange = useCallback((e) => handleEditAdminInputChange('lastName', e.target.value), [handleEditAdminInputChange]);
  const handleEditAdminEmailChange = useCallback((e) => handleEditAdminInputChange('email', e.target.value), [handleEditAdminInputChange]);
  const handleEditAdminPhoneChange = useCallback((e) => handleEditAdminInputChange('phone', e.target.value), [handleEditAdminInputChange]);
  const handleEditAdminRoleChange = useCallback((e) => handleEditAdminInputChange('role', e.target.value), [handleEditAdminInputChange]);
  const handleEditAdminStatusChange = useCallback((e) => handleEditAdminInputChange('isActive', e.target.value === 'active'), [handleEditAdminInputChange]);
  const handleEditAdminAddressChange = useCallback((e) => handleEditAdminInputChange('address', e.target.value), [handleEditAdminInputChange]);

  const handleInputChange = useCallback((field, value) => {
    if (field === 'phone') {
      let val = value.replace(/\D/g, '');
      if (val.length > 0 && val[0] !== '0') val = '0' + val;
      val = val.slice(0, 10);
      setNewAdminData((prev) => ({ ...prev, [field]: val }));
    } else if (field === 'firstName' || field === 'lastName') {
      const textOnly = value.replace(/[^a-zA-Z\s]/g, '');
      setNewAdminData((prev) => ({ ...prev, [field]: textOnly }));
    } else if (field === 'email') {
      if ((value.match(/@/g) || []).length > 1) return;
      setNewAdminData((prev) => ({ ...prev, [field]: value }));
    } else {
      setNewAdminData((prev) => ({ ...prev, [field]: value }));
    }
  }, []);

  const handleFirstNameChange = useCallback((e) => handleInputChange('firstName', e.target.value), [handleInputChange]);
  const handleLastNameChange = useCallback((e) => handleInputChange('lastName', e.target.value), [handleInputChange]);
  const handleEmailChange = useCallback((e) => handleInputChange('email', e.target.value), [handleInputChange]);
  const handlePasswordChange = useCallback((e) => handleInputChange('password', e.target.value), [handleInputChange]);
  const handlePhoneChange = useCallback((e) => handleInputChange('phone', e.target.value), [handleInputChange]);
  const handleRoleChange = useCallback((e) => handleInputChange('role', e.target.value), [handleInputChange]);
  const handleAddressChange = useCallback((e) => handleInputChange('address', e.target.value), [handleInputChange]);

  const startEditingAdmin = (adminUser) => {
    setIsEditingAdmin(true);
    setEditAdminData({ ...adminUser });
    setSelectedAdmin(adminUser);
    setAdminModalOpen(true);
  };

  const cancelEditingAdmin = () => {
    setIsEditingAdmin(false);
    setEditAdminData({});
    setSelectedAdmin(null);
    setAdminModalOpen(false);
  };

  const handleUpdateAdmin = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    try {
      setAdminUpdateLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`http://localhost:5000/api/admin/users/${selectedAdmin._id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(editAdminData),
      });

      if (response.ok) {
        const updatedAdmin = await response.json();
        setAdmins((prev) => prev.map((a) => (a._id === selectedAdmin._id ? updatedAdmin.admin : a)));
        cancelEditingAdmin();
        alert('Admin updated successfully!');
      } else {
        const errorData = await response.json();
        alert(`Failed to update admin: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Error updating admin:', error);
      alert('Error updating admin');
    } finally {
      setAdminUpdateLoading(false);
    }
  };

  const handleDeleteAdmin = async (adminId) => {
    if (adminId === admin._id) {
      alert('You cannot delete your own admin account!');
      return;
    }
    if (!window.confirm('Are you sure you want to delete this admin? This action cannot be undone.')) return;

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`http://localhost:5000/api/admin/users/${adminId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (response.ok) {
        setAdmins((prev) => prev.filter((u) => u._id !== adminId));
        alert('Admin deleted successfully!');
      } else {
        const errorData = await response.json();
        alert(`Failed to delete admin: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Error deleting admin:', error);
      alert('Error deleting admin');
    }
  };

  const validateAdminForm = () => {
    const errors = [];
    if (!newAdminData.firstName.trim()) errors.push('First name is required');
    if (!newAdminData.lastName.trim()) errors.push('Last name is required');
    if (!newAdminData.email.trim()) errors.push('Email is required');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newAdminData.email)) errors.push('Please enter a valid email address');
    if (!newAdminData.password.trim()) errors.push('Password is required');
    else if (newAdminData.password.length < 6) errors.push('Password must be at least 6 characters long');
    return errors;
  };

  const handleAddAdmin = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const validationErrors = validateAdminForm();
    if (validationErrors.length > 0) {
      showToast(validationErrors.join(', '), 'error');
      return;
    }

    try {
      setAddAdminLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch('http://localhost:5000/api/admin/register', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newAdminData),
      });

      if (response.ok) {
        const result = await response.json();
        setAdmins((prev) => [...prev, result.admin]);
        setIsAddingAdmin(false);
        setNewAdminData({
          firstName: '',
          lastName: '',
          email: '',
          password: '',
          phone: '',
          address: '',
          role: 'admin',
        });
        showToast('Admin added successfully!', 'success');
      } else {
        const errorData = await response.json();
        showToast(`Failed to add admin: ${errorData.message}`, 'error');
      }
    } catch (error) {
      console.error('Error adding admin:', error);
      showToast('Error adding admin. Please try again.', 'error');
    } finally {
      setAddAdminLoading(false);
    }
  };

  return (
    <div className="seller-management">
      <div className="seller-header">
        <div className="header-content">
          <h1>Admin Management</h1>
          <p>Manage administrator accounts and permissions</p>
        </div>
        <button className="add-seller-btn" onClick={() => setIsAddingAdmin(true)}>
          <FaPlus /> Add New Admin
        </button>
      </div>

      <div className="seller-controls">
        <div className="search-filter-controls">
          <div className="search-box">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search admins by name or email..."
              value={searchTerm}
              onChange={(e) => handleSearchInputChange(e.target.value, setSearchTerm, true)}
              className="search-input"
            />
          </div>
          <div className="filter-controls">
            <FaFilter className="filter-icon" />
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="filter-select">
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      <div className="seller-list">
        {adminsLoading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading admins...</p>
          </div>
        ) : filteredAdmins.length > 0 ? (
          <div className="admins-grid">
            {filteredAdmins.map((adminUser) => (
              <div key={adminUser._id} className="admin-card">
                <div className="admin-card-header">
                  <div className="admin-avatar">
                    {adminUser.profileImage ? (
                      <img src={adminUser.profileImage} alt="Admin" />
                    ) : (
                      <span>
                        {adminUser.firstName?.[0]}
                        {adminUser.lastName?.[0]}
                      </span>
                    )}
                  </div>
                  <div className="admin-info">
                    <h3 className="admin-name">
                      {adminUser.firstName} {adminUser.lastName}
                    </h3>
                    <p className="admin-email">{adminUser.email}</p>
                    <span className={`admin-status ${adminUser.isActive ? 'active' : 'inactive'}`}>
                      {adminUser.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                <div className="admin-card-details">
                  <div className="detail-row">
                    <span className="detail-label">Role:</span>
                    <span className="detail-value">{adminUser.role === 'super_admin' ? 'Super Admin' : 'Admin'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Phone:</span>
                    <span className="detail-value">{adminUser.phone || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Joined:</span>
                    <span className="detail-value">{new Date(adminUser.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Last Login:</span>
                    <span className="detail-value">
                      {adminUser.lastLogin ? new Date(adminUser.lastLogin).toLocaleDateString() : 'Never'}
                    </span>
                  </div>
                </div>

                <div className="admin-card-actions">
                  <div className="card-actions-row primary-actions">
                    <button
                      className="action-btn primary"
                      onClick={() => {
                        setSelectedAdmin(adminUser);
                        setAdminModalOpen(true);
                      }}
                      title="View Details"
                    >
                      <FaEye />
                      <span>View</span>
                    </button>
                    <button className="action-btn success" onClick={() => startEditingAdmin(adminUser)} title="Edit Admin">
                      <FaEdit />
                      <span>Edit</span>
                    </button>
                  </div>

                  {adminUser._id !== admin._id && (
                    <div className="card-actions-row secondary-actions">
                      <button className="action-btn danger" onClick={() => handleDeleteAdmin(adminUser._id)} title="Delete Admin">
                        <FaTrash />
                        <span>Delete</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-sellers">
            <FaUsers size={64} />
            <h3>No Admins Found</h3>
            <p>No administrators match your search criteria.</p>
          </div>
        )}
      </div>

      {/* Admin Modal */}
      {adminModalOpen && selectedAdmin && (
        <div className="modal-overlay" onClick={() => (!isEditingAdmin ? setAdminModalOpen(false) : null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{isEditingAdmin ? 'Edit Admin' : 'Admin Details'}</h2>
              <button className="modal-close" onClick={() => (isEditingAdmin ? cancelEditingAdmin() : setAdminModalOpen(false))}>
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-section">
                <h4>Personal Information</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>First Name</label>
                    {isEditingAdmin ? (
                      <input type="text" className="edit-input" value={editAdminData.firstName || ''} onChange={handleEditAdminFirstNameChange} />
                    ) : (
                      <span>{selectedAdmin.firstName}</span>
                    )}
                  </div>
                  <div className="detail-item">
                    <label>Last Name</label>
                    {isEditingAdmin ? (
                      <input type="text" className="edit-input" value={editAdminData.lastName || ''} onChange={handleEditAdminLastNameChange} />
                    ) : (
                      <span>{selectedAdmin.lastName}</span>
                    )}
                  </div>
                  <div className="detail-item">
                    <label>Email</label>
                    {isEditingAdmin ? (
                      <input type="email" className="edit-input" value={editAdminData.email || ''} onChange={handleEditAdminEmailChange} />
                    ) : (
                      <span>{selectedAdmin.email}</span>
                    )}
                  </div>
                  <div className="detail-item">
                    <label>Phone</label>
                    {isEditingAdmin ? (
                      <input type="tel" className="edit-input" value={editAdminData.phone || ''} onChange={handleEditAdminPhoneChange} />
                    ) : (
                      <span>{selectedAdmin.phone || 'Not provided'}</span>
                    )}
                  </div>
                  <div className="detail-item">
                    <label>Role</label>
                    {isEditingAdmin ? (
                      <select className="edit-input" value={editAdminData.role || 'admin'} onChange={handleEditAdminRoleChange}>
                        <option value="admin">Admin</option>
                        <option value="super_admin">Super Admin</option>
                      </select>
                    ) : (
                      <span>{selectedAdmin.role === 'super_admin' ? 'Super Admin' : 'Admin'}</span>
                    )}
                  </div>
                  <div className="detail-item">
                    <label>Status</label>
                    {isEditingAdmin ? (
                      <select className="edit-input" value={editAdminData.isActive ? 'active' : 'inactive'} onChange={handleEditAdminStatusChange}>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    ) : (
                      <span className={`status-badge ${selectedAdmin.isActive ? 'active' : 'inactive'}`}>
                        {selectedAdmin.isActive ? 'Active' : 'Inactive'}
                      </span>
                    )}
                  </div>
                </div>

                {isEditingAdmin && (
                  <div className="detail-item full-width">
                    <label>Address</label>
                    <textarea className="edit-input" value={editAdminData.address || ''} onChange={handleEditAdminAddressChange} rows={3} />
                  </div>
                )}
              </div>

              {isEditingAdmin && (
                <div className="modal-actions">
                  <button type="button" className="btn-cancel" onClick={cancelEditingAdmin}>
                    Cancel
                  </button>
                  <button type="button" className="btn-save" onClick={handleUpdateAdmin} disabled={adminUpdateLoading}>
                    {adminUpdateLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Admin Modal */}
      {isAddingAdmin && (
        <div
          className="modal-overlay"
          onClick={() => {
            setIsAddingAdmin(false);
            setNewAdminData({ firstName: '', lastName: '', email: '', password: '', phone: '', address: '', role: 'admin' });
          }}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Admin</h2>
              <button
                type="button"
                className="modal-close"
                onClick={() => {
                  setIsAddingAdmin(false);
                  setNewAdminData({ firstName: '', lastName: '', email: '', password: '', phone: '', address: '', role: 'admin' });
                }}
              >
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              <AddAdminForm
                newAdminData={newAdminData}
                handleFirstNameChange={handleFirstNameChange}
                handleLastNameChange={handleLastNameChange}
                handleEmailChange={handleEmailChange}
                handlePasswordChange={handlePasswordChange}
                handlePhoneChange={handlePhoneChange}
                handleRoleChange={handleRoleChange}
                handleAddressChange={handleAddressChange}
              />

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setIsAddingAdmin(false);
                    setNewAdminData({ firstName: '', lastName: '', email: '', password: '', phone: '', address: '', role: 'admin' });
                  }}
                >
                  <FaTimes /> Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleAddAdmin}
                  disabled={
                    addAdminLoading || !newAdminData.firstName || !newAdminData.lastName || !newAdminData.email || !newAdminData.password
                  }
                >
                  {addAdminLoading ? (
                    <>
                      <FaSpinner className="spinner" /> Adding...
                    </>
                  ) : (
                    <>
                      <FaPlus /> Add Admin
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

// -----------------------------
// Seller management
// -----------------------------

const SellerManagement = memo(function SellerManagement({
  sellers,
  sellersLoading,
  setSellers,
  getSellerDisplayStatus,
  showToast,
  handleSearchInputChange,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [isEditingSeller, setIsEditingSeller] = useState(false);
  const [editSellerData, setEditSellerData] = useState({});
  const [sellerUpdateLoading, setSellerUpdateLoading] = useState(false);

  const filteredSellers = useMemo(
    () => {
      // Ensure sellers is always an array
      if (!Array.isArray(sellers)) {
        return [];
      }
      
      return sellers.filter((seller) => {
        // Safety check for seller object
        if (!seller || typeof seller !== 'object') {
          return false;
        }
        
        const matchesSearch =
          (seller.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (seller.businessName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (seller.email || '').toLowerCase().includes(searchTerm.toLowerCase());
        const sellerStatus = getSellerDisplayStatus(seller);
        const matchesStatus = filterStatus === 'all' || sellerStatus === filterStatus;
        return matchesSearch && matchesStatus;
      });
    },
    [sellers, searchTerm, filterStatus, getSellerDisplayStatus]
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return '#10b981';
      case 'inactive':
        return '#f59e0b';
      case 'pending':
        return '#3b82f6';
      case 'suspended':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const handleEditSellerChange = useCallback((field, value) => {
    if (field === 'phone') {
      let val = value.replace(/\D/g, '');
      if (val.length > 0 && val[0] !== '0') {
        val = '0' + val; // Auto prepend 0 if they forgot it, or just enforce starting with 0
      }
      val = val.slice(0, 10);
      setEditSellerData((prev) => ({ ...prev, [field]: val }));
    } else if (field === 'firstName' || field === 'lastName') {
      const textOnly = value.replace(/[^a-zA-Z\s]/g, '');
      setEditSellerData((prev) => ({ ...prev, [field]: textOnly }));
    } else {
      setEditSellerData((prev) => ({ ...prev, [field]: value }));
    }
  }, []);

  const startEditingSeller = useCallback((seller) => {
    setIsEditingSeller(true);
    setEditSellerData({ ...seller });
    setSelectedSeller(seller);
  }, []);

  const cancelEditingSeller = useCallback(() => {
    setIsEditingSeller(false);
    setEditSellerData({});
    setSelectedSeller(null);
  }, []);

  const validateSellerForm = () => {
    const errors = [];
    if (!editSellerData.firstName?.trim()) errors.push('First name is required');
    if (!editSellerData.lastName?.trim()) errors.push('Last name is required');
    if (!editSellerData.email?.trim()) errors.push('Email is required');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editSellerData.email)) errors.push('Please enter a valid email address');
    if (editSellerData.phone?.trim() && !/^0\d{9}$/.test(editSellerData.phone)) errors.push('Phone number must be exactly 10 digits and start with 0');
    return errors;
  };

  const handleUpdateSeller = async () => {
    const validationErrors = validateSellerForm();
    if (validationErrors.length > 0) {
      showToast(validationErrors.join('. '), 'error');
      return;
    }
    try {
      setSellerUpdateLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`http://localhost:5000/api/admin/sellers/${selectedSeller._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        credentials: 'include',
        body: JSON.stringify(editSellerData),
      });

      if (response.ok) {
        const updatedSeller = await response.json();
        const updated = updatedSeller.data?.seller || updatedSeller;
        setSellers((prev) => prev.map((s) => (s._id === selectedSeller._id ? updated : s)));
        setSelectedSeller(updated);
        setIsEditingSeller(false);
        alert('Seller updated successfully!');
      } else {
        throw new Error('Failed to update seller');
      }
    } catch (error) {
      console.error('Error updating seller:', error);
      alert('Error updating seller. Please try again.');
    } finally {
      setSellerUpdateLoading(false);
    }
  };

  const handleDeleteSeller = async (sellerId, sellerName) => {
    if (!window.confirm(`Are you sure you want to delete seller "${sellerName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`http://localhost:5000/api/admin/sellers/${sellerId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.ok) {
        // Remove seller from the list
        setSellers(prev => prev.filter(seller => seller._id !== sellerId));
        
        // Close modal if the deleted seller was selected
        if (selectedSeller && selectedSeller._id === sellerId) {
          setSelectedSeller(null);
          setIsEditingSeller(false);
          setEditSellerData({});
        }
        
        showToast('Seller deleted successfully!', 'success');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete seller');
      }
    } catch (error) {
      console.error('Error deleting seller:', error);
      showToast(`Error deleting seller: ${error.message}`, 'error');
    }
  };

  return (
    <div className="seller-management">
      <div className="dashboard-header">
        <h2>Seller Management</h2>
        <div className="total-count">Total Sellers: {sellers.length}</div>
      </div>

      {/* Controls */}
      <div className="controls-section">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search sellers by name, email, or business..."
            value={searchTerm}
            onChange={(e) => handleSearchInputChange(e.target.value, setSearchTerm, true)}
            className="search-input"
          />
        </div>
        <div className="filter-controls">
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="filter-select">
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="pending">Pending</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      <div className="sellers-grid">
        {sellersLoading ? (
          <div className="loading-state">
            <div className="loading-spinner-elegant"></div>
            <p>Loading sellers...</p>
          </div>
        ) : filteredSellers.length === 0 ? (
          <div className="empty-state">
            <FaStore className="empty-icon" />
            <h3>No sellers found</h3>
            <p>No sellers match your current search criteria</p>
          </div>
        ) : (
          filteredSellers.map((seller) => (
            <div key={seller._id} className="seller-card">
              <div className="seller-card-header">
                <div className="seller-avatar">
                  <span>
                    {(seller.fullName || 'S').charAt(0)}
                    {(seller.businessName || '').charAt(0)}
                  </span>
                </div>
                <div className="seller-info">
                  <h3 className="seller-name">{seller.fullName || 'Unknown Seller'}</h3>
                  <p className="seller-email">{seller.email || ''}</p>
                  {seller.businessName && (
                    <p className="business-name">
                      <FaStore className="business-icon" />
                      {seller.businessName}
                    </p>
                  )}
                </div>
                <div className="card-actions">
                  <button className="btn btn-primary" onClick={() => setSelectedSeller(seller)} title="View Details">
                    <FaEye />
                    <span>View</span>
                  </button>
                  <button className="btn btn-edit" onClick={() => startEditingSeller(seller)} title="Edit Seller">
                    <FaEdit />
                    <span>Edit</span>
                  </button>
                  <button 
                    className="btn btn-danger" 
                    onClick={() => handleDeleteSeller(seller._id, seller.fullName || seller.businessName || 'Unknown Seller')} 
                    title="Delete Seller"
                  >
                    <FaTrash />
                    <span>Delete</span>
                  </button>
                </div>
              </div>

              <div className="seller-card-details">
                <div className="detail-row">
                  <FaPhone className="detail-icon" />
                  <span>{seller.phone || 'Not provided'}</span>
                </div>
                <div className="detail-row">
                  <FaMapMarkerAlt className="detail-icon" />
                  <span>{seller.address || 'Not provided'}</span>
                </div>
                <div className="detail-row">
                  <FaCalendarAlt className="detail-icon" />
                  <span>Joined {seller.createdAt ? new Date(seller.createdAt).toLocaleDateString() : 'Unknown'}</span>
                </div>
                <div className="detail-row">
                  <FaIndustry className="detail-icon" />
                  <span>{seller.businessType || 'Not specified'}</span>
                </div>
                <div className="detail-row">
                  <FaUser className="detail-icon" />
                  <span>{seller.businessLicense || 'No license provided'}</span>
                </div>
              </div>

              <div className="seller-card-footer">
                <div className="status-badges">
                  <span className={`status-badge ${seller.isActive ? 'status-active' : 'status-inactive'}`}>
                    {seller.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <span className={`status-badge status-${seller.verificationStatus || 'pending'}`}>
                    {seller.verificationStatus || 'Pending'}
                  </span>
                </div>
                <div className="user-stats">
                  <div className="stat">
                    <span className="stat-value">{seller.productCount || 0}</span>
                    <span className="stat-label">Products</span>
                  </div>
                  <div className="stat">
                    <span className="stat-value">${(seller.revenue || 0).toLocaleString()}</span>
                    <span className="stat-label">Revenue</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Summary */}
      <div className="stats-summary">
        <div className="summary-card">
          <div className="summary-icon active">
            <FaUserCheck />
          </div>
          <div className="summary-content">
            <h4>{sellers.filter((s) => getSellerDisplayStatus(s) === 'active').length}</h4>
            <p>Active Sellers</p>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon pending">
            <FaUserShield />
          </div>
          <div className="summary-content">
            <h4>{sellers.filter((s) => getSellerDisplayStatus(s) === 'pending').length}</h4>
            <p>Pending Approval</p>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon suspended">
            <FaUserTimes />
          </div>
          <div className="summary-content">
            <h4>{sellers.filter((s) => getSellerDisplayStatus(s) === 'suspended').length}</h4>
            <p>Suspended Sellers</p>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon total">
            <FaStore />
          </div>
          <div className="summary-content">
            <h4>{sellers.length}</h4>
            <p>Total Sellers</p>
          </div>
        </div>
      </div>

      {/* Edit Seller Modal */}
      {isEditingSeller && selectedSeller && (
        <div className="modal-overlay" onClick={cancelEditingSeller}>
          <div className="modal-content seller-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Seller</h3>
              <div className="header-actions">
                <button className="btn btn-success btn-sm" onClick={handleUpdateSeller} disabled={sellerUpdateLoading}>
                  {sellerUpdateLoading ? 'Saving...' : 'Save Changes'}
                </button>
                <button className="btn btn-secondary btn-sm" onClick={cancelEditingSeller} disabled={sellerUpdateLoading}>
                  Cancel
                </button>
                <button className="modal-close" onClick={cancelEditingSeller}>
                  <FaTimes />
                </button>
              </div>
            </div>
            <div className="modal-body">
              <div className="seller-details">
                <div className="detail-section">
                  <h4>Personal Information</h4>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <label>First Name:</label>
                      <input
                        type="text"
                        value={editSellerData.firstName || ''}
                        onChange={(e) => handleEditSellerChange('firstName', e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key.length === 1 && /[^a-zA-Z\s]/.test(e.key)) {
                            e.preventDefault();
                          }
                        }}
                        className="edit-input"
                      />
                    </div>
                    <div className="detail-item">
                      <label>Last Name:</label>
                      <input
                        type="text"
                        value={editSellerData.lastName || ''}
                        onChange={(e) => handleEditSellerChange('lastName', e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key.length === 1 && /[^a-zA-Z\s]/.test(e.key)) {
                            e.preventDefault();
                          }
                        }}
                        className="edit-input"
                      />
                    </div>
                    <div className="detail-item">
                      <label>Email:</label>
                      <input
                        type="email"
                        value={editSellerData.email || ''}
                        onChange={(e) => handleEditSellerChange('email', e.target.value)}
                        className="edit-input"
                      />
                    </div>
                    <div className="detail-item">
                      <label>Phone:</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength="10"
                        value={editSellerData.phone || ''}
                        onChange={(e) => handleEditSellerChange('phone', e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key.length === 1 && !/^[0-9]+$/.test(e.key)) {
                            e.preventDefault();
                          }
                        }}
                        className="edit-input"
                      />
                    </div>
                    <div className="detail-item">
                      <label>Address:</label>
                      <textarea
                        value={editSellerData.address || ''}
                        onChange={(e) => handleEditSellerChange('address', e.target.value)}
                        className="edit-input"
                        rows={2}
                      />
                    </div>
                  </div>
                </div>



                <div className="detail-section">
                  <h4>Status & Verification</h4>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <label>Account Status:</label>
                      <select
                        value={editSellerData.isActive ? 'active' : 'inactive'}
                        onChange={(e) => handleEditSellerChange('isActive', e.target.value === 'active')}
                        className="edit-input"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                    <div className="detail-item">
                      <label>Verification Status:</label>
                      <select
                        value={editSellerData.verificationStatus || 'pending'}
                        onChange={(e) => handleEditSellerChange('verificationStatus', e.target.value)}
                        className="edit-input"
                      >
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                        <option value="under_review">Under Review</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

// -----------------------------
// Buyer details modal
// -----------------------------

const BuyerDetailsModal = memo(function BuyerDetailsModal({
  selectedBuyer,
  isEditingBuyer,
  editBuyerData,
  buyerUpdateLoading,
  startEditingBuyer,
  cancelEditingBuyer,
  handleEditBuyerChange,
  handleUpdateBuyer,
  handleCloseBuyerModal,
}) {
  if (!selectedBuyer) return null;

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return '#10b981';
      case 'inactive':
        return '#f59e0b';
      case 'suspended':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not provided';
    try {
      return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      return 'Invalid date';
    }
  };

  const safeGetInitials = (firstName, lastName) => {
    const first = firstName || '';
    const last = lastName || '';
    const initials = `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
    return initials || 'U';
  };

  const safeStringify = (value, isInput = false) => {
    if (value === null || value === undefined) return isInput ? '' : 'Not provided';
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return String(value);
    if (typeof value === 'object') {
      if (value.street || value.city || value.country) {
        const parts = [];
        if (value.street) parts.push(value.street);
        if (value.city) parts.push(value.city);
        if (value.state) parts.push(value.state);
        if (value.country) parts.push(value.country);
        return parts.join(', ') || (isInput ? '' : 'Not provided');
      }
      return isInput ? '' : JSON.stringify(value) || 'Not provided';
    }
    return String(value) || (isInput ? '' : 'Not provided');
  };

  return (
    <div className="modal-overlay elegant" onClick={handleCloseBuyerModal}>
      <div className="modal-content buyer-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header elegant">
          <div className="header-left">
            <div className="buyer-avatar-large">
              <span>{safeGetInitials(selectedBuyer.firstName, selectedBuyer.lastName)}</span>
            </div>
            <div className="header-info">
              <h2>
                {safeStringify(selectedBuyer.firstName)} {safeStringify(selectedBuyer.lastName)}
              </h2>
              <p className="buyer-id-display">ID: {safeStringify(selectedBuyer._id)}</p>
              <div className="status-badge-large" style={{ backgroundColor: getStatusColor(selectedBuyer.status || 'active') }}>
                {(selectedBuyer.status || 'active').charAt(0).toUpperCase() + (selectedBuyer.status || 'active').slice(1)}
              </div>
            </div>
          </div>
          <div className="header-actions">
            {!isEditingBuyer ? (
              <button onClick={() => startEditingBuyer(selectedBuyer)} className="edit-btn elegant">
                <FaEdit />
                Edit
              </button>
            ) : (
              <div className="edit-actions">
                <button onClick={handleUpdateBuyer} className="save-btn elegant" disabled={buyerUpdateLoading}>
                  <FaSave />
                  {buyerUpdateLoading ? 'Saving...' : 'Save'}
                </button>
                <button onClick={cancelEditingBuyer} className="cancel-btn elegant" disabled={buyerUpdateLoading}>
                  <FaTimes />
                  Cancel
                </button>
              </div>
            )}
            <button
              onClick={() => {
                handleCloseBuyerModal();
              }}
              className="close-btn elegant"
            >
              <FaTimes />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="modal-body elegant">
          {!isEditingBuyer ? (
            <div className="buyer-details-grid">
              <div className="detail-section">
                <h3>Personal Information</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>First Name</label>
                    <span>{safeStringify(selectedBuyer.firstName)}</span>
                  </div>
                  <div className="detail-item">
                    <label>Last Name</label>
                    <span>{safeStringify(selectedBuyer.lastName)}</span>
                  </div>
                  <div className="detail-item">
                    <label>Email Address</label>
                    <span>{safeStringify(selectedBuyer.email)}</span>
                  </div>
                  <div className="detail-item">
                    <label>Phone Number</label>
                    <span>{safeStringify(selectedBuyer.phone)}</span>
                  </div>
                  <div className="detail-item">
                    <label>Address</label>
                    <span>{safeStringify(selectedBuyer.address)}</span>
                  </div>
                  <div className="detail-item">
                    <label>Date of Birth</label>
                    <span>{formatDate(selectedBuyer.dateOfBirth)}</span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h3>Account Information</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Registration Date</label>
                    <span>{formatDate(selectedBuyer.createdAt)}</span>
                  </div>
                  <div className="detail-item">
                    <label>Account Status</label>
                    <span className="status-display" style={{ color: getStatusColor(selectedBuyer.status || 'active') }}>
                      {(selectedBuyer.status || 'active').charAt(0).toUpperCase() + (selectedBuyer.status || 'active').slice(1)}
                    </span>
                  </div>
                  <div className="detail-item">
                    <label>Total Orders</label>
                    <span>{safeStringify(selectedBuyer.orderCount) || '0'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Last Updated</label>
                    <span>{formatDate(selectedBuyer.updatedAt || selectedBuyer.createdAt)}</span>
                  </div>
                  <div className="detail-item">
                    <label>Total Spent</label>
                    <span>${(selectedBuyer.totalSpent || 0).toLocaleString()}</span>
                  </div>
                  <div className="detail-item">
                    <label>Account ID</label>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>{safeStringify(selectedBuyer._id)}</span>
                  </div>
                </div>
              </div>

              <div className="detail-section full-width">
                <h3>Activity Overview</h3>
                <div className="activity-stats">
                  <div className="activity-stat">
                    <div className="stat-icon-small orders">
                      <FaShoppingBag />
                    </div>
                    <div className="stat-content-small">
                      <span className="stat-number">{safeStringify(selectedBuyer.orderCount) || '0'}</span>
                      <span className="stat-label">Orders Placed</span>
                    </div>
                  </div>
                  <div className="activity-stat">
                    <div className="stat-icon-small calendar">
                      <FaCalendarAlt />
                    </div>
                    <div className="stat-content-small">
                      <span className="stat-number">
                        {selectedBuyer.createdAt ? Math.floor((new Date() - new Date(selectedBuyer.createdAt)) / (1000 * 60 * 60 * 24)) : 0}
                      </span>
                      <span className="stat-label">Days Active</span>
                    </div>
                  </div>
                  <div className="activity-stat">
                    <div className="stat-icon-small orders">
                      <FaDollarSign />
                    </div>
                    <div className="stat-content-small">
                      <span className="stat-number">${(selectedBuyer.totalSpent || 0).toLocaleString()}</span>
                      <span className="stat-label">Total Spent</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Edit form
            <div className="buyer-details">
              <div className="detail-section">
                <h4>Personal Information</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>First Name:</label>
                    <input
                      type="text"
                      value={editBuyerData.firstName || ''}
                      onChange={(e) => handleEditBuyerChange('firstName', e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key.length === 1 && /[^a-zA-Z\s]/.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      className="edit-input"
                      placeholder="Enter first name"
                    />
                  </div>
                  <div className="detail-item">
                    <label>Last Name:</label>
                    <input
                      type="text"
                      value={editBuyerData.lastName || ''}
                      onChange={(e) => handleEditBuyerChange('lastName', e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key.length === 1 && /[^a-zA-Z\s]/.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      className="edit-input"
                      placeholder="Enter last name"
                    />
                  </div>
                  <div className="detail-item">
                    <label>Email:</label>
                    <input
                      type="email"
                      value={editBuyerData.email || ''}
                      onChange={(e) => handleEditBuyerChange('email', e.target.value)}
                      className="edit-input"
                      placeholder="Enter email address"
                    />
                  </div>
                  <div className="detail-item">
                    <label>Phone:</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength="10"
                      value={editBuyerData.phone || ''}
                      onChange={(e) => handleEditBuyerChange('phone', e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key.length === 1 && !/^[0-9]+$/.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      className="edit-input"
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div className="detail-item">
                    <label>Address:</label>
                    <textarea
                      value={editBuyerData.address || ''}
                      onChange={(e) => handleEditBuyerChange('address', e.target.value)}
                      className="edit-input"
                      rows={2}
                      placeholder="Enter address"
                    />
                  </div>
                  <div className="detail-item">
                    <label>Date of Birth:</label>
                    <input
                      type="date"
                      value={editBuyerData.dateOfBirth ? String(editBuyerData.dateOfBirth).split('T')[0] : ''}
                      onChange={(e) => handleEditBuyerChange('dateOfBirth', e.target.value)}
                      className="edit-input"
                    />
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h4>Account Information</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Account Status:</label>
                    <select
                      value={editBuyerData.status || 'active'}
                      onChange={(e) => handleEditBuyerChange('status', e.target.value)}
                      className="edit-input"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

// -----------------------------
// Buyer management (list)
// -----------------------------

const BuyerManagement = memo(function BuyerManagement({
  buyers,
  buyersLoading,
  handleSearchInputChange,
  handleBuyerStatusChange,
  handleDeleteBuyer,
  setSelectedBuyer,
  startEditingBuyer,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const filteredBuyers = useMemo(
    () => {
      // Ensure buyers is always an array
      if (!Array.isArray(buyers)) {
        return [];
      }
      
      return buyers.filter((buyer) => {
        // Safety check for buyer object
        if (!buyer || typeof buyer !== 'object') {
          return false;
        }
        
        const matchesSearch =
          (buyer.firstName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (buyer.lastName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (buyer.email || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' || (buyer.status || 'active') === filterStatus;
        return matchesSearch && matchesStatus;
      });
    },
    [buyers, searchTerm, filterStatus]
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return '#10b981';
      case 'inactive':
        return '#f59e0b';
      case 'suspended':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  return (
    <div className="buyer-management-container">
      <div className="buyer-header">
        <div className="header-content">
          <div className="header-left">
            <h1 className="page-title">
              <FaUserFriends className="title-icon" />
              Buyer Management
            </h1>
            <p className="page-description">Manage and monitor all registered buyers</p>
          </div>
          <div className="header-stats">
            <div className="stat-card mini">
              <div className="stat-number">{buyers.length}</div>
              <div className="stat-label">Total Buyers</div>
            </div>
            <div className="stat-card mini">
              <div className="stat-number">{buyers.filter((b) => (b.status || 'active') === 'active').length}</div>
              <div className="stat-label">Active</div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="controls-section">
        <div className="search-filter-container">
          <div className="search-input-wrapper">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search buyers by name or email..."
              value={searchTerm}
              onChange={(e) => handleSearchInputChange(e.target.value, setSearchTerm, true)}
              className="search-input-elegant"
            />
          </div>
          <div className="filter-wrapper">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="status-filter-elegant"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="buyers-grid">
        {buyersLoading ? (
          <div className="loading-state">
            <div className="loading-spinner-elegant"></div>
            <p>Loading buyers...</p>
          </div>
        ) : filteredBuyers.length === 0 ? (
          <div className="empty-state">
            <FaUsers className="empty-icon" />
            <h3>No buyers found</h3>
            <p>No buyers match your current search criteria</p>
          </div>
        ) : (
          filteredBuyers.map((buyer) => (
            <div key={buyer._id} className="buyer-card">
              <div className="buyer-card-header">
                <div className="buyer-avatar">
                  <span>
                    {(buyer.firstName || '').charAt(0)}
                    {(buyer.lastName || '').charAt(0)}
                  </span>
                </div>
                <div className="buyer-info">
                  <h3 className="buyer-name">
                    {buyer.firstName || ''} {buyer.lastName || ''}
                  </h3>
                  <p className="buyer-email">{buyer.email || ''}</p>
                </div>
                <div className="status-indicator" style={{ backgroundColor: getStatusColor(buyer.status || 'active') }}>
                  <span className="status-text">{(buyer.status || 'active').replace(/^\w/, (c) => c.toUpperCase())}</span>
                </div>
              </div>

              <div className="buyer-card-details">
                <div className="detail-row">
                  <span className="detail-label">Phone:</span>
                  <span className="detail-value">
                    {typeof buyer.phone === 'string' ? buyer.phone : buyer.phone || 'Not provided'}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Joined:</span>
                  <span className="detail-value">
                    {buyer.createdAt ? new Date(buyer.createdAt).toLocaleDateString() : 'Unknown'}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Orders:</span>
                  <span className="detail-value">{buyer.orderCount || 0}</span>
                </div>
              </div>

              <div className="buyer-card-actions">
                <div className="card-actions-row primary-actions">
                  <button onClick={() => setSelectedBuyer(buyer)} className="action-btn primary" title="View Details">
                    <FaEye />
                    <span>Details</span>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedBuyer(buyer);
                      startEditingBuyer(buyer);
                    }}
                    className="action-btn secondary"
                    title="Edit Buyer"
                  >
                    <FaEdit />
                    <span>Edit</span>
                  </button>

                  {(buyer.status || 'active') === 'active' ? (
                    <button
                      onClick={() => handleBuyerStatusChange(buyer._id, 'inactive')}
                      className="action-btn warning"
                      title="Deactivate Buyer"
                    >
                      <FaUserMinus />
                      <span>Deactivate</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleBuyerStatusChange(buyer._id, 'active')}
                      className="action-btn success"
                      title="Activate Buyer"
                    >
                      <FaUserCheck />
                      <span>Activate</span>
                    </button>
                  )}
                </div>

                <div className="card-actions-row secondary-actions">
                  <button
                    onClick={() => handleBuyerStatusChange(buyer._id, 'suspended')}
                    className="action-btn danger"
                    title="Suspend Buyer"
                    disabled={(buyer.status || 'active') === 'suspended'}
                  >
                    <FaUserTimes />
                    <span>Suspend</span>
                  </button>

                  <button onClick={() => handleDeleteBuyer(buyer._id)} className="action-btn danger-outline" title="Delete Buyer">
                    <FaTrash />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Summary */}
      <div className="stats-summary">
        <div className="summary-card">
          <div className="summary-icon active">
            <FaUserCheck />
          </div>
          <div className="summary-content">
            <h4>{buyers.filter((b) => (b.status || 'active') === 'active').length}</h4>
            <p>Active Buyers</p>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon inactive">
            <FaUserMinus />
          </div>
          <div className="summary-content">
            <h4>{buyers.filter((b) => (b.status || 'active') === 'inactive').length}</h4>
            <p>Inactive Buyers</p>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon suspended">
            <FaUserTimes />
          </div>
          <div className="summary-content">
            <h4>{buyers.filter((b) => (b.status || 'active') === 'suspended').length}</h4>
            <p>Suspended Buyers</p>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon total">
            <FaUsers />
          </div>
          <div className="summary-content">
            <h4>{buyers.length}</h4>
            <p>Total Buyers</p>
          </div>
        </div>
      </div>
    </div>
  );
});

// -----------------------------
// Main AdminDashboard (container)
// -----------------------------

const AdminDashboard = ({ admin, onLogout }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    recentActivities: [],
    systemStatus: { server: 'online', database: 'connected', lastBackup: new Date().toISOString() },
  });
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [toast, setToast] = useState({ show: false, message: '', type: 'warning' });

  const showToast = (message, type = 'warning') => setToast({ show: true, message, type });
  const hideToast = () => setToast({ show: false, message: '', type: 'warning' });

  // Input validation
  const validateSearchInput = useCallback((value, allowEmail = false) => {
    if (allowEmail) return value.replace(/[^a-zA-Z0-9\s@.]/g, '');
    return value.replace(/[^a-zA-Z0-9\s]/g, '');
  }, []);

  const handleSearchInputChange = (value, setter, allowEmail = false) => {
    const originalLength = value.length;
    const validatedValue = validateSearchInput(value, allowEmail);
    if (originalLength > validatedValue.length) {
      const filteredCount = originalLength - validatedValue.length;
      showToast(`${filteredCount} invalid character${filteredCount > 1 ? 's' : ''} removed from search`, 'warning');
    }
    setter(validatedValue);
  };

  // Sellers
  const [sellers, setSellers] = useState([]);
  const [sellersLoading, setSellersLoading] = useState(false);
  const fetchingRef = React.useRef(false);

  // Admins
  const [admins, setAdmins] = useState([]);
  const [adminsLoading, setAdminsLoading] = useState(false);
  const adminFetchingRef = React.useRef(false);

  // Buyers
  const [buyers, setBuyers] = useState([]);
  const [buyersLoading, setBuyersLoading] = useState(false);
  const buyerFetchingRef = React.useRef(false);

  // Buyer edit modal (shared)
  const [selectedBuyer, setSelectedBuyer] = useState(null);
  const [isEditingBuyer, setIsEditingBuyer] = useState(false);
  const [editBuyerData, setEditBuyerData] = useState({});
  const [buyerUpdateLoading, setBuyerUpdateLoading] = useState(false);

  // Admin profile
  const [adminProfile, setAdminProfile] = useState({
    firstName: admin?.firstName || '',
    lastName: admin?.lastName || '',
    email: admin?.email || '',
    phone: admin?.phone || '',
    address: admin?.address || '',
    role: admin?.role || 'admin',
    profileImage: admin?.profileImage || '',
    isActive: admin?.isActive !== undefined ? admin.isActive : true,
    lastLogin: admin?.lastLogin || null,
    permissions: admin?.permissions || [],
    createdAt: admin?.createdAt || new Date().toISOString(),
  });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileUpdateLoading, setProfileUpdateLoading] = useState(false);

  // Effects
  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (admin) {
      setAdminProfile({
        firstName: admin.firstName || '',
        lastName: admin.lastName || '',
        email: admin.email || '',
        phone: admin.phone || '',
        address: admin.address || '',
        role: admin.role || 'admin',
        profileImage: admin.profileImage || '',
        isActive: admin.isActive !== undefined ? admin.isActive : true,
        lastLogin: admin.lastLogin || null,
        permissions: admin.permissions || [],
        createdAt: admin.createdAt || new Date().toISOString(),
      });
    }
  }, [admin]);

  useEffect(() => {
    if (activeTab === 'sellers') fetchSellers();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'admins') fetchAdmins();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'buyers') fetchBuyers();
  }, [activeTab]);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('http://localhost:5000/api/admin/dashboard', {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats || data.data?.stats || {});
      } else {
        const errorData = await response.json();
        console.error('Failed to fetch dashboard data:', errorData.message);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      await fetch('http://localhost:5000/api/admin/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      localStorage.removeItem('adminToken');
      onLogout();
    } catch (error) {
      console.error('Logout error:', error);
      localStorage.removeItem('adminToken');
      onLogout();
    }
  };

  // Sellers
  const fetchSellers = async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    setSellersLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        setSellers([]);
        return;
      }
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      const response = await fetch('http://localhost:5000/api/admin/sellers', {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        credentials: 'include',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (response.ok) {
        const data = await response.json();
        setSellers(data.data?.sellers || []);
      } else {
        const err = await response.json();
        console.log('Sellers fetch error:', err);
        setSellers([]);
      }
    } catch (error) {
      console.log('Fetch sellers error:', error);
      setSellers([]);
    } finally {
      fetchingRef.current = false;
      setSellersLoading(false);
    }
  };

  // Admins
  const fetchAdmins = async () => {
    if (adminFetchingRef.current) return;
    adminFetchingRef.current = true;
    setAdminsLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        setAdmins([]);
        return;
      }
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      const response = await fetch('http://localhost:5000/api/admin/users', {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        credentials: 'include',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (response.ok) {
        const data = await response.json();
        const adminUsers = (Array.isArray(data) ? data : data?.users || []).filter(
          (u) => u.role === 'admin' || u.role === 'super_admin'
        );
        setAdmins(adminUsers || []);
      } else {
        setAdmins([]);
      }
    } catch (error) {
      console.error('Error fetching admins:', error);
      setAdmins([]);
    } finally {
      adminFetchingRef.current = false;
      setAdminsLoading(false);
    }
  };

  // Buyers
  const fetchBuyers = async () => {
    if (buyerFetchingRef.current) return;
    buyerFetchingRef.current = true;
    setBuyersLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        setBuyers([]);
        return;
      }
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      const response = await fetch('http://localhost:5000/api/admin/buyers', {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        credentials: 'include',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (response.ok) {
        const data = await response.json();
        setBuyers(data.data?.buyers || []);
      } else {
        setBuyers([]);
      }
    } catch (error) {
      setBuyers([]);
    } finally {
      buyerFetchingRef.current = false;
      setBuyersLoading(false);
    }
  };

  const handleBuyerStatusChange = async (buyerId, newStatus) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`http://localhost:5000/api/admin/buyers/${buyerId}/status`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus }),
      });
      if (response.ok) {
        setBuyers((prev) =>
          prev.map((b) => (b._id === buyerId ? { ...b, isActive: newStatus === 'active', status: newStatus } : b))
        );
        alert(`Buyer ${newStatus} successfully!`);
      } else {
        alert('Failed to update buyer status');
      }
    } catch (error) {
      console.error('Error updating buyer status:', error);
      alert('Error updating buyer status');
    }
  };

  const handleDeleteBuyer = async (buyerId) => {
    if (!window.confirm('Are you sure you want to delete this buyer?')) return;
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`http://localhost:5000/api/admin/buyers/${buyerId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (response.ok) {
        setBuyers((prev) => prev.filter((b) => b._id !== buyerId));
        alert('Buyer deleted successfully!');
      } else {
        alert('Failed to delete buyer');
      }
    } catch (error) {
      console.error('Error deleting buyer:', error);
      alert('Error deleting buyer');
    }
  };

  // Buyer edit form helpers
  const handleEditBuyerChange = useCallback((field, value) => {
    if (field === 'firstName' || field === 'lastName') {
      const textOnly = value.replace(/[^a-zA-Z\s]/g, '');
      setEditBuyerData((prev) => ({ ...prev, [field]: textOnly }));
    } else if (field === 'phone') {
      let val = value.replace(/\D/g, '');
      if (val.length > 0 && val[0] !== '0') {
        val = '0' + val;
      }
      val = val.slice(0, 10);
      setEditBuyerData((prev) => ({ ...prev, [field]: val }));
    } else {
      setEditBuyerData((prev) => ({ ...prev, [field]: value }));
    }
  }, []);

  const startEditingBuyer = (buyer) => {
    setIsEditingBuyer(true);
    setEditBuyerData({
      firstName: buyer.firstName || '',
      lastName: buyer.lastName || '',
      email: buyer.email || '',
      phone: buyer.phone || '',
      address: buyer.address || '',
      dateOfBirth: buyer.dateOfBirth ? buyer.dateOfBirth.split('T')[0] : '',
      status: buyer.status || 'active',
    });
  };

  const cancelEditingBuyer = () => {
    setIsEditingBuyer(false);
    setEditBuyerData({});
  };

  const handleCloseBuyerModal = useCallback(() => {
    setSelectedBuyer(null);
    setIsEditingBuyer(false);
    setEditBuyerData({});
  }, []);

  const validateBuyerForm = () => {
    const errors = [];
    if (!editBuyerData.firstName?.trim()) errors.push('First name is required');
    if (!editBuyerData.lastName?.trim()) errors.push('Last name is required');
    if (!editBuyerData.email?.trim()) errors.push('Email is required');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editBuyerData.email)) errors.push('Please enter a valid email address');
    if (editBuyerData.phone?.trim() && !/^0\d{9}$/.test(editBuyerData.phone)) errors.push('Phone number must be exactly 10 digits and start with 0');
    return errors;
  };

  const handleUpdateBuyer = async () => {
    if (!selectedBuyer) return;
    const validationErrors = validateBuyerForm();
    if (validationErrors.length > 0) {
      showToast(validationErrors.join('. '), 'error');
      return;
    }
    setBuyerUpdateLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`http://localhost:5000/api/admin/buyers/${selectedBuyer._id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(editBuyerData),
      });
      if (response.ok) {
        const data = await response.json();
        const updated = data.data?.buyer || data.buyer || data;
        setBuyers((prev) => prev.map((b) => (b._id === selectedBuyer._id ? updated : b)));
        setSelectedBuyer(updated);
        setIsEditingBuyer(false);
        setEditBuyerData({});
        alert('Buyer updated successfully!');
      } else {
        const errorData = await response.json();
        alert(`Failed to update buyer: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Error updating buyer:', error);
      alert('Error updating buyer');
    } finally {
      setBuyerUpdateLoading(false);
    }
  };

  // Permissions
  const sidebarItems = [
    { id: 'dashboard', icon: <FaTachometerAlt />, label: 'Dashboard', permission: 'view_analytics' },
    { id: 'admins', icon: <FaUsers />, label: 'Admins', permission: 'manage_users' },
    { id: 'buyers', icon: <FaUserFriends />, label: 'Buyers', permission: 'manage_users' },
    { id: 'sellers', icon: <FaUserShield />, label: 'Sellers', permission: 'manage_sellers' },
    { id: 'products', icon: <FaBoxOpen />, label: 'Products', permission: 'manage_products' },
    { id: 'orders', icon: <FaShoppingCart />, label: 'Orders', permission: 'manage_orders' },
    { id: 'profile', icon: <FaUser />, label: 'Profile', permission: 'view_analytics' },
    { id: 'settings', icon: <FaCog />, label: 'Settings', permission: 'manage_settings' },
  ];

  const hasPermission = (permission) => {
    if (admin.role === 'admin' || admin.role === 'super_admin') return true;
    if (!admin.permissions || !Array.isArray(admin.permissions)) return false;
    return admin.permissions.includes(permission);
  };

  const adminInitials = `${admin.firstName?.charAt(0) || ''}${admin.lastName?.charAt(0) || ''}`.toUpperCase() || 'AD';

  const renderContent = () => {
    if (loading) {
      return (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      );
    }
    switch (activeTab) {
      case 'dashboard':
        return <DashboardContent admin={admin} stats={stats} />;
      case 'admins':
        return (
          <AdminManagement
            admin={admin}
            admins={admins}
            setAdmins={setAdmins}
            adminsLoading={adminsLoading}
            showToast={showToast}
            handleSearchInputChange={handleSearchInputChange}
          />
        );
      case 'buyers':
        return (
          <BuyerManagement
            buyers={buyers}
            buyersLoading={buyersLoading}
            handleSearchInputChange={handleSearchInputChange}
            handleBuyerStatusChange={handleBuyerStatusChange}
            handleDeleteBuyer={handleDeleteBuyer}
            setSelectedBuyer={setSelectedBuyer}
            startEditingBuyer={startEditingBuyer}
          />
        );
      case 'sellers':
        return (
          <SellerManagement
            sellers={sellers}
            sellersLoading={sellersLoading}
            setSellers={setSellers}
            getSellerDisplayStatus={(seller) => {
              if (!seller.isActive) return 'inactive';
              if (seller.verificationStatus === 'approved') return 'active';
              if (seller.verificationStatus === 'pending' || seller.verificationStatus === 'under_review') return 'pending';
              if (seller.verificationStatus === 'rejected') return 'suspended';
              return 'inactive';
            }}
            showToast={showToast}
            handleSearchInputChange={handleSearchInputChange}
          />
        );
      case 'products':
        return <PlaceholderContent title="Product Management" />;
      case 'orders':
        return <PlaceholderContent title="Order Management" />;
      case 'profile':
        return (
          <AdminProfileContent
            admin={admin}
            adminProfile={adminProfile}
            isEditingProfile={isEditingProfile}
            setIsEditingProfile={setIsEditingProfile}
            handleProfileInputChange={(field, value) => {
              if (field === 'firstName' || field === 'lastName') {
                const textOnly = value.replace(/[^a-zA-Z\s]/g, '');
                setAdminProfile((prev) => ({ ...prev, [field]: textOnly }));
              } else if (field === 'phone') {
                let val = value.replace(/\D/g, '');
                if (val.length > 0 && val[0] !== '0') val = '0' + val;
                val = val.slice(0, 10);
                setAdminProfile((prev) => ({ ...prev, [field]: val }));
              } else if (field === 'email') {
                if ((value.match(/@/g) || []).length > 1) return;
                setAdminProfile((prev) => ({ ...prev, [field]: value }));
              } else {
                setAdminProfile((prev) => ({ ...prev, [field]: value }));
              }
            }}
            handleProfileUpdate={async (updatedData) => {
              if (updatedData.phone?.trim() && !/^0\d{9}$/.test(updatedData.phone)) {
                alert('Phone number must be exactly 10 digits and start with 0');
                return;
              }
              setProfileUpdateLoading(true);
              try {
                const token = localStorage.getItem('adminToken');
                const response = await fetch('http://localhost:5000/api/admin/profile', {
                  method: 'PUT',
                  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                  credentials: 'include',
                  body: JSON.stringify(updatedData),
                });
                if (response.ok) {
                  setAdminProfile((prev) => ({ ...prev, ...updatedData }));
                  setIsEditingProfile(false);
                  alert('Profile updated successfully!');
                } else {
                  throw new Error('Failed to update profile');
                }
              } catch (error) {
                console.error('Error updating profile:', error);
                alert('Error updating profile. Changes saved locally.');
                setAdminProfile((prev) => ({ ...prev, ...updatedData }));
                setIsEditingProfile(false);
              } finally {
                setProfileUpdateLoading(false);
              }
            }}
            profileUpdateLoading={profileUpdateLoading}
          />
        );
      case 'settings':
        return <PlaceholderContent title="Settings" />;
      default:
        return <DashboardContent admin={admin} stats={stats} />;
    }
  };

  return (
    <div className="admin-dashboard">
      {/* Sidebar */}
      <div className="admin-sidebar">
        <div className="sidebar-header">
          <div className="sidebar-brand-card">
            <div className="logo">
              <FaUserShield />
              <div className="brand-text">
                <span className="brand-title">Unimart Command</span>
                <span className="brand-subtitle">Marketplace Control</span>
              </div>
            </div>
            <button className="brand-home-btn" onClick={() => setActiveTab('dashboard')} title="Back to dashboard">
              <FaTachometerAlt />
            </button>
          </div>
        </div>

        <div className="admin-profile">
          <div className="sidebar-profile-avatar">{adminInitials}</div>
          <div className="sidebar-profile-info">
            <h4>{admin.fullName || `${admin.firstName || ''} ${admin.lastName || ''}`.trim() || 'Administrator'}</h4>
            <p>{admin.email || 'admin@unimart.lk'}</p>
            <span className="role-badge">{admin.role === 'super_admin' ? 'Super Admin' : 'Admin'}</span>
          </div>
        </div>

        <p className="sidebar-section-label">Menu</p>
        <nav className="sidebar-nav">
          {sidebarItems.map(
            (item) =>
              hasPermission(item.permission) && (
                <button
                  key={item.id}
                  className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(item.id)}
                >
                  <span className="nav-item-icon">{item.icon}</span>
                  <span>{item.label}</span>
                  <span className="nav-item-chevron">›</span>
                </button>
              )
          )}
        </nav>

        <p className="sidebar-section-label">Quick Actions</p>
        <div className="quick-actions">
          <button className="quick-action-btn" onClick={() => setActiveTab('profile')}>
            <FaUser /> My Profile
          </button>
          <button className="quick-action-btn" onClick={() => setActiveTab('analytics')}>
            <FaChartLine /> Analytics View
          </button>
        </div>

        <div className="sidebar-footer">
          <div className="sidebar-footer-tag">Unimart Admin</div>
          <button className="logout-btn" onClick={handleLogout}>
            <FaSignOutAlt />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="admin-main">
        <div className="main-header">
          <div className="header-left">
            <h2>Admin Dashboard</h2>
          </div>
          <div className="header-right">
            <button className="notification-btn">
              <FaBell />
              {notifications.length > 0 && <span className="notification-badge">{notifications.length}</span>}
            </button>
            <div className="admin-info">
              <span>Welcome, {admin.firstName}</span>
            </div>
          </div>
        </div>

        <div className="main-content">{renderContent()}</div>
      </div>

      {/* Buyer Details Modal */}
      <BuyerDetailsModal
        selectedBuyer={selectedBuyer}
        isEditingBuyer={isEditingBuyer}
        editBuyerData={editBuyerData}
        buyerUpdateLoading={buyerUpdateLoading}
        startEditingBuyer={startEditingBuyer}
        cancelEditingBuyer={cancelEditingBuyer}
        handleEditBuyerChange={handleEditBuyerChange}
        handleUpdateBuyer={handleUpdateBuyer}
        handleCloseBuyerModal={handleCloseBuyerModal}
      />

      {/* Toast */}
      <Toast message={toast.message} type={toast.type} show={toast.show} onClose={hideToast} />
    </div>
  );
};

export default AdminDashboard;
