import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import useAppStore from '../store/appStore';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import syncService from '../services/syncService';

function Admin() {
  const navigate = useNavigate();
  const { user, role, isAuthLoading } = useAppStore();
  const isOwner = role === 'ADMIN_OWNER';
  const isCore = role === 'CORE_MEMBER';
  const canAccess = isOwner || isCore;

  // STRICT SECURITY: Role-based access control
  useEffect(() => {
    if (!canAccess) {
      navigate('/');
    } else {
      fetchAdminData();
      fetchReports();
    }
  }, [user, role, navigate]);

  const [reports, setReports] = useState([]);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    totalUsers: 0,
    premiumUsers: 0,
    totalRevenue: 0,
    activeSubscriptions: 0
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'reports'

  const fetchReports = async () => {
    try {
      const reportList = await syncService.fetchReports();
      setReports(reportList);
    } catch (err) {
      console.error("Failed to fetch reports:", err);
    }
  };

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
        
        // Map internal plan IDs to attractive names
        const planMap = {
          'monthly': 'Starter',
          'half_yearly': 'Super Saver',
          'yearly': 'Mega Saver',
          'lifetime': 'Lifetime (Owner)',
          'plus': 'Plus'
        };

        const planName = planMap[sub.planType] || planMap[sub.plan] || sub.planType || sub.plan || 'Free';

        userList.push({
          uid: doc.id,
          name: data.displayName || data.phoneNumber || 'Anonymous',
          email: data.email || (data.phoneNumber ? `Phone: ${data.phoneNumber}` : 'No email'),
          role: data.role || (sub.status === 'active' ? 'PREMIUM' : 'USER'),
          plan: planName,
          status: data.banned ? 'Banned' : (sub.status === 'active' ? 'Active' : 'Inactive'),
          expiry: sub.expiryDate ? new Date(sub.expiryDate).toLocaleDateString() : '-',
          rawExpiry: sub.expiryDate || null,
          amountPaid: sub.amountPaid || 0,
          paymentSource: sub.paymentSource || (sub.amountPaid > 0 ? 'razorpay' : 'unknown'),
          banned: data.banned || false
        });

        if (sub.status === 'active' && !data.banned) {
          premiumCount++;
          // REVENUE RULE: Only count successful Razorpay payments towards total revenue
          if (sub.paymentSource === 'razorpay') {
            revenue += (Number(sub.amountPaid) || 0);
          }
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

  const handleAction = async (action, targetUser, customPlan = null) => {
    const actionMsg = customPlan ? `assign ${customPlan.name} to` : action;
    if (!window.confirm(`Are you sure you want to ${actionMsg} ${targetUser.name}?`)) return;

    try {
      const userRef = doc(db, "users", targetUser.uid);
      
      if (action === 'assign_plan' && customPlan) {
        let expiryDate = new Date();
        
        // If extending, start from current expiry if it's in the future
        if (action === 'extend' && targetUser.rawExpiry) {
          const currentExpiry = new Date(targetUser.rawExpiry);
          if (currentExpiry > expiryDate) {
            expiryDate = currentExpiry;
          }
        }

        if (customPlan.id === 'lifetime') {
          expiryDate = new Date('2099-12-31');
        } else {
          expiryDate.setDate(expiryDate.getDate() + customPlan.days);
        }

        await updateDoc(userRef, {
          subscription: {
            plan: 'plus',
            planType: customPlan.id,
            status: 'active',
            expiryDate: expiryDate.toISOString(),
            paymentId: 'MANUAL_ADMIN_ASSIGNMENT',
            amountPaid: 0,
            paymentSource: 'admin',
            assignedBy: user.email,
            lastAssigned: new Date().toISOString()
          },
          role: customPlan.id === 'lifetime' ? 'ADMIN_OWNER' : 'PREMIUM'
        });
        alert(`✅ ${targetUser.name}'s plan updated to ${customPlan.name}!`);
      } else if (action === 'remove_premium') {
        await updateDoc(userRef, {
          subscription: { plan: 'free', status: 'inactive' },
          role: 'USER'
        });
        alert(`📉 ${targetUser.name} downgraded to Free.`);
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

  const planOptions = [
    { id: 'monthly', name: 'Monthly', days: 30 },
    { id: 'half_yearly', name: '6-Month', days: 180 },
    { id: 'yearly', name: 'Yearly', days: 365 },
    { id: 'lifetime', name: 'Lifetime', days: 99999 }
  ];

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isAuthLoading || loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh', color: 'var(--text-dim)' }}>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} style={{ marginRight: '12px' }}>⌛</motion.div>
        Initializing Admin Tools...
      </div>
    );
  }

  if (!canAccess) return null;

  return (
    <div className="admin-view" style={{ padding: '24px', color: 'var(--text-main)' }}>
      <header className="admin-header" style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <h2 style={{ fontSize: 'clamp(24px, 5vw, 32px)', fontWeight: '800', marginBottom: '8px' }}>Admin <span style={{ color: 'var(--primary-light)' }}>Dashboard</span></h2>
          <p style={{ color: 'var(--text-dim)', fontSize: '14px' }}>Manage users and platform growth.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={() => setActiveTab('users')}
            style={{ 
              padding: '10px 20px', 
              background: activeTab === 'users' ? 'var(--primary)' : 'var(--surface-glass)', 
              border: '1px solid var(--primary-glow)',
              borderRadius: '12px',
              color: activeTab === 'users' ? 'white' : 'var(--text-dim)',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            Users
          </button>
          <button 
            onClick={() => setActiveTab('reports')}
            style={{ 
              padding: '10px 20px', 
              background: activeTab === 'reports' ? 'var(--primary)' : 'var(--surface-glass)', 
              border: '1px solid var(--primary-glow)',
              borderRadius: '12px',
              color: activeTab === 'reports' ? 'white' : 'var(--text-dim)',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            Reports {reports.filter(r => r.status === 'pending').length > 0 && `(${reports.filter(r => r.status === 'pending').length})`}
          </button>
          <button 
            onClick={() => { fetchAdminData(); fetchReports(); }}
            style={{ 
              padding: '10px', 
              background: 'var(--surface-glass)', 
              border: '1px solid var(--primary-glow)',
              borderRadius: '12px',
              cursor: 'pointer'
            }}
          >
            🔄
          </button>
        </div>
      </header>

      {activeTab === 'users' ? (
        <>
          {/* Stats Grid - OWNER ONLY */}
          {isOwner && (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', 
              gap: '16px', 
              marginBottom: '32px' 
            }}>
              {[
                { label: 'Total Users', value: stats.totalUsers, icon: '👥', color: 'var(--primary)' },
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
                  style={{ padding: '20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
                >
                  <div style={{ fontSize: '20px', marginBottom: '8px' }}>{stat.icon}</div>
                  <div style={{ color: 'var(--text-dim)', fontSize: '11px', marginBottom: '4px', textTransform: 'uppercase', fontWeight: '700' }}>{stat.label}</div>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: stat.color }}>{stat.value}</div>
                </motion.div>
              ))}
            </div>
          )}

      {/* User Management */}
      <div className="dashboard-card" style={{ padding: 'clamp(16px, 4vw, 32px)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '700' }}>User Management</h3>
          <input 
            type="text" 
            placeholder="Search users..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ 
              background: 'rgba(15, 23, 42, 0.6)', 
              border: '1px solid var(--primary-glow)', 
              color: 'var(--text-main)',
              padding: '10px 16px',
              borderRadius: '10px',
              width: '100%',
              maxWidth: '300px',
              fontFamily: 'inherit'
            }}
          />
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <th style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase' }}>User</th>
                <th style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase' }}>Role</th>
                <th style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase' }}>Plan</th>
                <th style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase' }}>Status</th>
                {isOwner && <th style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase' }}>Expiry</th>}
                {isOwner && <th style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase' }}>Source</th>}
                <th style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading user data...</td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No users found.</td></tr>
              ) : filteredUsers.map((u, i) => (
                <tr key={u.uid} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }}>
                  <td style={{ padding: '16px' }}>
                    <div style={{ fontWeight: '600' }}>{u.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{u.email}</div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span style={{ 
                      fontSize: '10px', 
                      padding: '2px 8px', 
                      borderRadius: '4px', 
                      background: u.role === 'ADMIN_OWNER' ? 'var(--primary-glow)' : 'rgba(100, 116, 139, 0.1)',
                      color: u.role === 'ADMIN_OWNER' ? 'var(--primary-light)' : 'var(--text-dim)',
                      fontWeight: '700'
                    }}>
                      {u.role}
                    </span>
                  </td>
                  <td style={{ padding: '16px', fontSize: '14px' }}>{u.plan}</td>
                  <td style={{ padding: '16px' }}>
                    <span style={{ color: u.status === 'Active' ? '#10b981' : 'var(--text-muted)', fontSize: '14px' }}>● {u.status}</span>
                  </td>
                  {isOwner && <td style={{ padding: '16px', fontSize: '14px', color: 'var(--text-dim)' }}>{u.expiry}</td>}
                  {isOwner && (
                    <td style={{ padding: '16px' }}>
                      {u.paymentSource === 'razorpay' || u.amountPaid > 0 ? (
                        <span style={{ fontSize: '10px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '4px 8px', borderRadius: '4px', fontWeight: '700' }}>💰 PAID</span>
                      ) : u.status === 'Active' ? (
                        <span style={{ fontSize: '10px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', padding: '4px 8px', borderRadius: '4px', fontWeight: '700' }}>🛠️ ADMIN</span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>-</span>
                      )}
                    </td>
                  )}
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {/* Premium Plan Management - OWNER ONLY */}
                      {isOwner && (
                        <div style={{ 
                          display: 'flex', 
                          flexDirection: 'column', 
                          gap: '8px', 
                          background: 'rgba(255,255,255,0.02)', 
                          padding: '12px', 
                          borderRadius: '12px',
                          border: '1px solid rgba(255,255,255,0.05)'
                        }}>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Plan Control</div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <select 
                              id={`plan-select-${u.uid}`}
                              defaultValue="monthly"
                              style={{ 
                                background: 'rgba(15, 23, 42, 0.8)', 
                                color: 'var(--text-main)', 
                                border: '1px solid var(--primary-glow)', 
                                borderRadius: '8px', 
                                fontSize: '12px', 
                                padding: '6px 10px',
                                flex: 1
                              }}
                            >
                              {planOptions.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                              ))}
                            </select>
                            <button 
                              onClick={() => {
                                const select = document.getElementById(`plan-select-${u.uid}`);
                                const plan = planOptions.find(p => p.id === select.value);
                                handleAction('assign_plan', u, plan);
                              }}
                              style={{ 
                                background: 'var(--primary-glow)', 
                                border: 'none', 
                                color: 'var(--primary-light)', 
                                padding: '6px 12px', 
                                borderRadius: '8px', 
                                fontSize: '11px', 
                                cursor: 'pointer', 
                                fontWeight: '800',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {u.status === 'Active' ? 'Change' : 'Assign'}
                            </button>
                            {u.status === 'Active' && (
                              <button 
                                onClick={() => {
                                  const select = document.getElementById(`plan-select-${u.uid}`);
                                  const plan = planOptions.find(p => p.id === select.value);
                                  handleAction('extend', u, plan);
                                }}
                                style={{ 
                                  background: 'rgba(16, 185, 129, 0.1)', 
                                  border: '1px solid rgba(16, 185, 129, 0.2)', 
                                  color: '#10b981', 
                                  padding: '6px 12px', 
                                  borderRadius: '8px', 
                                  fontSize: '11px', 
                                  cursor: 'pointer', 
                                  fontWeight: '800'
                                }}
                              >
                                Extend
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Report System - BOTH */}
                      <button 
                        onClick={() => {
                          const reason = window.prompt("Reason for reporting this user?");
                          if (reason) {
                            syncService.reportUser({
                              reportedUserId: u.uid,
                              reportedUserName: u.name,
                              reportedUserEmail: u.email,
                              reportedBy: user.email,
                              reason
                            });
                            alert("✅ Report submitted to moderation queue.");
                          }
                        }}
                        style={{ background: 'rgba(245, 158, 11, 0.1)', border: 'none', color: '#f59e0b', padding: '6px 10px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}
                      >
                        ⚠️ Report
                      </button>

                      {u.status === 'Active' && (
                        <button 
                          onClick={() => handleAction('remove_premium', u)}
                          style={{ background: 'rgba(245, 158, 11, 0.1)', border: 'none', color: '#f59e0b', padding: '6px 10px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}
                        >
                          Remove
                        </button>
                      )}

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
                        style={{ background: 'rgba(239, 68, 68, 0.05)', border: 'none', color: '#ef4444', padding: '6px 10px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', opacity: 0.6 }}
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
    </>
  ) : (
        <div className="dashboard-card" style={{ padding: '32px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '24px' }}>Moderation Queue</h3>
          <div style={{ display: 'grid', gap: '16px' }}>
            {reports.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>No reports found.</p>
            ) : reports.map(report => (
              <div key={report.id} style={{ 
                background: 'rgba(255,255,255,0.02)', 
                border: '1px solid rgba(255,255,255,0.05)', 
                borderRadius: '16px', 
                padding: '20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '4px 10px', borderRadius: '100px', fontWeight: '800' }}>REPORTED</span>
                    <span style={{ color: 'var(--text-main)', fontWeight: '700' }}>{report.reportedUserName}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>({report.reportedUserEmail})</span>
                  </div>
                  <p style={{ color: 'var(--text-dim)', fontSize: '14px', margin: '8px 0' }}>Reason: <span style={{ color: 'var(--text-main)' }}>{report.reason}</span></p>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Reported by {report.reportedBy} • {report.createdAt?.toDate ? report.createdAt.toDate().toLocaleString() : 'Just now'}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button 
                    onClick={() => handleAction('ban', { uid: report.reportedUserId, name: report.reportedUserName })}
                    style={{ background: '#ef4444', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                  >
                    Ban User
                  </button>
                  {isOwner && (
                    <button 
                      onClick={() => handleAction('delete', { uid: report.reportedUserId, name: report.reportedUserName })}
                      style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-dim)', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                    >
                      Delete Account
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Admin;
