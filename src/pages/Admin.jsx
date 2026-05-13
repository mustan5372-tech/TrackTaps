import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import useAppStore from '../store/appStore';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

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
      const querySnapshot = await getDocs(collection(db, "users"));
      const userList = [];
      let premiumCount = 0;
      let revenue = 0;

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const sub = data.subscription || { plan: 'free', status: 'inactive' };
        
        userList.push({
          uid: doc.id,
          name: data.displayName || 'Anonymous',
          email: data.email || 'No email',
          role: data.role || (sub.status === 'active' ? 'PREMIUM' : 'USER'),
          plan: sub.planType || sub.plan || 'Free',
          status: data.banned ? 'Banned' : (sub.status === 'active' ? 'Active' : 'Inactive'),
          expiry: sub.expiryDate ? new Date(sub.expiryDate).toLocaleDateString() : '-',
          amountPaid: sub.amountPaid || 0,
          banned: data.banned || false
        });

        if (sub.status === 'active' && !data.banned) {
          premiumCount++;
          revenue += (sub.amountPaid || 0);
        }
      });

      setUsers(userList);
      setStats({
        totalUsers: userList.length,
        premiumUsers: premiumCount,
        totalRevenue: revenue,
        activeSubscriptions: premiumCount
      });
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch real admin data:", error);
      if (error.code === 'permission-denied') {
        alert("🚨 Permission Denied: Please update your Firestore Security Rules to allow 'list' access for Admin accounts.");
      }
      setLoading(false);
    }
  };

  const handleAction = async (action, targetUser) => {
    if (!window.confirm(`Are you sure you want to ${action} ${targetUser.name}?`)) return;

    try {
      const userRef = doc(db, "users", targetUser.uid);
      
      if (action === 'upgrade') {
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 30); // Default 30 days manual upgrade

        await updateDoc(userRef, {
          subscription: {
            plan: 'plus',
            planType: 'monthly',
            status: 'active',
            expiryDate: expiryDate.toISOString(),
            paymentId: 'MANUAL_ADMIN_UPGRADE',
            amountPaid: 0
          }
        });
        alert(`✅ ${targetUser.name} upgraded to Premium!`);
      } else if (action === 'ban') {
        await updateDoc(userRef, { banned: true });
        alert(`🚫 ${targetUser.name} has been banned.`);
      } else if (action === 'unban') {
        await updateDoc(userRef, { banned: false });
        alert(`✅ ${targetUser.name} has been unbanned.`);
      } else if (action === 'delete') {
        if (!window.confirm("⚠️ DANGER: This will permanently delete this user's data from the cloud. Continue?")) return;
        await deleteDoc(userRef);
        alert(`🗑️ ${targetUser.name} has been deleted.`);
      }

      fetchAdminData(); // Refresh list
    } catch (error) {
      console.error("Admin action failed:", error);
      alert(`❌ Failed to ${action} user: ` + error.message);
    }
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
                      {u.banned ? (
                        <button 
                          onClick={() => handleAction('unban', u)}
                          style={{ background: 'rgba(16, 185, 129, 0.1)', border: 'none', color: '#10b981', padding: '6px 10px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}
                        >
                          Unban
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleAction('ban', u)}
                          style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#ef4444', padding: '6px 10px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}
                        >
                          Ban
                        </button>
                      )}
                      <button 
                        onClick={() => handleAction('delete', u)}
                        style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#ef4444', padding: '6px 10px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}
                      >
                        Delete
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
