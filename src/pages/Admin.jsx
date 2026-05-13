import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import useAppStore from '../store/appStore';
import { useNavigate } from 'react-router-dom';

function Admin() {
  const navigate = useNavigate();
  const { user, role } = useAppStore();
  const [stats, setStats] = useState({
    totalUsers: 0,
    premiumUsers: 0,
    totalRevenue: 0,
    activeSubscriptions: 0
  });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Redirect if not admin
  useEffect(() => {
    if (role !== 'ADMIN_OWNER') {
      navigate('/');
    } else {
      fetchAdminData();
    }
  }, [role, navigate]);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      // In a real app, this would fetch from /api/admin/users
      // Since we are using Firestore directly in some parts, we'd ideally have an admin API
      // For now, let's simulate with some mock data for the UI
      setTimeout(() => {
        setUsers([
          { uid: '1', name: 'Mustan', email: 'mustan5372@gmail.com', role: 'ADMIN_OWNER', plan: 'Yearly', status: 'Active', expiry: '2027-05-13' },
          { uid: '2', name: 'John Doe', email: 'john@example.com', role: 'PREMIUM', plan: 'Monthly', status: 'Active', expiry: '2026-06-13' },
          { uid: '3', name: 'Jane Smith', email: 'jane@example.com', role: 'USER', plan: 'Free', status: 'Inactive', expiry: '-' },
        ]);
        setStats({
          totalUsers: 154,
          premiumUsers: 42,
          totalRevenue: 842,
          activeSubscriptions: 38
        });
        setLoading(false);
      }, 800);
    } catch (error) {
      console.error("Failed to fetch admin data:", error);
      setLoading(false);
    }
  };

  const handleAction = (action, user) => {
    alert(`Admin Action: ${action} for ${user.name}`);
    // Here you would call /api/admin/update-user
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (role !== 'ADMIN_OWNER') return null;

  return (
    <div className="admin-view" style={{ padding: '24px', color: '#f8fafc' }}>
      <header style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '8px' }}>Admin <span style={{ color: '#a78bfa' }}>Dashboard</span></h2>
          <p style={{ color: '#94a3b8' }}>Manage users, subscriptions, and platform growth.</p>
        </div>
        <button 
          onClick={fetchAdminData}
          style={{ 
            padding: '10px 20px', 
            background: 'rgba(139, 92, 246, 0.1)', 
            border: '1px solid rgba(139, 92, 246, 0.3)',
            borderRadius: '12px',
            color: '#a78bfa',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          Refresh Data
        </button>
      </header>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '40px' }}>
        {[
          { label: 'Total Users', value: stats.totalUsers, icon: '👥', color: '#8b5cf6' },
          { label: 'Premium Users', value: stats.premiumUsers, icon: '👑', color: '#d946ef' },
          { label: 'Active Subs', value: stats.activeSubscriptions, icon: '📅', color: '#10b981' },
          { label: 'Total Revenue', value: `₹${stats.totalRevenue}`, icon: '💰', color: '#f59e0b' }
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="dashboard-card"
            style={{ padding: '24px', textAlign: 'center' }}
          >
            <div style={{ fontSize: '24px', marginBottom: '12px' }}>{stat.icon}</div>
            <div style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '4px' }}>{stat.label}</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: stat.color }}>{stat.value}</div>
          </motion.div>
        ))}
      </div>

      {/* User Management */}
      <div className="dashboard-card" style={{ padding: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '20px', fontWeight: '700' }}>User Management</h3>
          <input 
            type="text" 
            placeholder="Search users..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ 
              background: 'rgba(15, 23, 42, 0.6)', 
              border: '1px solid rgba(139, 92, 246, 0.2)', 
              color: '#f8fafc',
              padding: '10px 16px',
              borderRadius: '10px',
              width: '300px',
              fontFamily: 'inherit'
            }}
          />
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <th style={{ padding: '16px', color: '#64748b', fontSize: '12px', textTransform: 'uppercase' }}>User</th>
                <th style={{ padding: '16px', color: '#64748b', fontSize: '12px', textTransform: 'uppercase' }}>Role</th>
                <th style={{ padding: '16px', color: '#64748b', fontSize: '12px', textTransform: 'uppercase' }}>Plan</th>
                <th style={{ padding: '16px', color: '#64748b', fontSize: '12px', textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '16px', color: '#64748b', fontSize: '12px', textTransform: 'uppercase' }}>Expiry</th>
                <th style={{ padding: '16px', color: '#64748b', fontSize: '12px', textTransform: 'uppercase' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading user data...</td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>No users found.</td></tr>
              ) : filteredUsers.map((u, i) => (
                <tr key={u.uid} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }}>
                  <td style={{ padding: '16px' }}>
                    <div style={{ fontWeight: '600' }}>{u.name}</div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>{u.email}</div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span style={{ 
                      fontSize: '10px', 
                      padding: '2px 8px', 
                      borderRadius: '4px', 
                      background: u.role === 'ADMIN_OWNER' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(100, 116, 139, 0.1)',
                      color: u.role === 'ADMIN_OWNER' ? '#a78bfa' : '#94a3b8',
                      fontWeight: '700'
                    }}>
                      {u.role}
                    </span>
                  </td>
                  <td style={{ padding: '16px', fontSize: '14px' }}>{u.plan}</td>
                  <td style={{ padding: '16px' }}>
                    <span style={{ color: u.status === 'Active' ? '#10b981' : '#64748b', fontSize: '14px' }}>● {u.status}</span>
                  </td>
                  <td style={{ padding: '16px', fontSize: '14px', color: '#94a3b8' }}>{u.expiry}</td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        onClick={() => handleAction('upgrade', u)}
                        style={{ background: 'rgba(16, 185, 129, 0.1)', border: 'none', color: '#10b981', padding: '6px 10px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}
                      >
                        Upgrade
                      </button>
                      <button 
                        onClick={() => handleAction('ban', u)}
                        style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#ef4444', padding: '6px 10px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}
                      >
                        Ban
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Admin;
