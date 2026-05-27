import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAppStore from '../store/appStore';
import { motion, AnimatePresence } from 'framer-motion';

function MegaSaver() {
  const navigate = useNavigate();
  const { user, subscription, subjects, timetable } = useAppStore();
  const isPremium = subscription?.status === 'active';
  
  // Custom mock data for high-fidelity Coordinated Timetable Sync
  const [syncPin, setSyncPin] = useState('');
  const [activeGroup, setActiveGroup] = useState(null);
  const [pinInput, setPinInput] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Auto-generate a Sync PIN if premium
  useEffect(() => {
    if (isPremium && !syncPin) {
      setSyncPin(`TAPS-${Math.floor(1000 + Math.random() * 9000)}`);
    }
  }, [isPremium, syncPin]);

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleCreateGroup = () => {
    if (!isPremium) {
      navigate('/premium');
      return;
    }
    setActiveGroup({
      name: "Engineering Study Batch B",
      pin: syncPin,
      members: [
        { name: `${user?.displayName || 'You'} (Host)`, attendance: '82%', avatar: '🦁', status: 'Safe' },
        { name: 'Aarav Patel', attendance: '79%', avatar: '🦊', status: 'Safe' },
        { name: 'Meera Sharma', attendance: '68%', avatar: '🐼', status: 'Critical' },
        { name: 'Rohit Verma', attendance: '88%', avatar: '🦁', status: 'Safe' }
      ],
      recommendations: [
        { day: 'Monday', action: 'Coordinated Library Study', label: 'Recommended Skip Slot', class: 'Applied Mathematics (10:00 AM)', savings: '+$5.50 fuel saved' },
        { day: 'Wednesday', action: 'Attend Class Together', label: 'High Risk for Meera', class: 'Data Structures Lab (02:00 PM)', savings: 'Mandatory attendance' },
        { day: 'Friday', action: 'Coordinated Semester Bunk', label: 'Perfect Skip Window', class: 'Digital Electronics (09:00 AM)', savings: '+$4.00 commute saved' }
      ]
    });
    triggerToast("✨ Study Group Created successfully!");
  };

  const handleJoinGroup = () => {
    if (!isPremium) {
      navigate('/premium');
      return;
    }
    if (!pinInput.trim()) {
      triggerToast("⚠️ Please enter a valid Sync PIN!");
      return;
    }
    setActiveGroup({
      name: "CS Main Core Sync Group",
      pin: pinInput.toUpperCase(),
      members: [
        { name: 'Kabir Dev (Host)', attendance: '85%', avatar: '🐸', status: 'Safe' },
        { name: `${user?.displayName || 'You'} (Joined)`, attendance: '78%', avatar: '🦁', status: 'Safe' },
        { name: 'Siddharth Sen', attendance: '74%', avatar: '🐻', status: 'Warning' },
        { name: 'Riya Paul', attendance: '61%', avatar: '🐙', status: 'Critical' }
      ],
      recommendations: [
        { day: 'Tuesday', action: 'Coordinated Semester Bunk', label: 'All Members Safe', class: 'Computer Networks (11:00 AM)', savings: 'Perfect skip window' },
        { day: 'Thursday', action: 'Attend Class Together', label: 'High Risk for Riya & Siddharth', class: 'Operating Systems (01:00 PM)', savings: 'Required for all' }
      ]
    });
    triggerToast(`🔗 Linked to Group ${pinInput.toUpperCase()} successfully!`);
  };

  return (
    <div className="mega-saver-view" style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '120px', color: 'var(--text-main)' }}>
      
      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
              position: 'fixed',
              top: '24px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'var(--primary-glow)',
              border: '1px solid var(--primary)',
              borderRadius: '12px',
              padding: '12px 24px',
              color: 'white',
              fontSize: '14px',
              fontWeight: '700',
              zIndex: 100000,
              boxShadow: '0 8px 32px rgba(139, 92, 246, 0.25)'
            }}
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      <header className="view-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>Mega Saver Sync</h2>
            <span style={{ fontSize: '10px', background: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)', color: 'white', padding: '3px 10px', borderRadius: '100px', fontWeight: '950', letterSpacing: '0.05em' }}>MEGA EXCLUSIVE</span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-dim)', margin: 0 }}>Coordinated Bunk Planning & Classmate Timetable Overlays</p>
        </div>
      </header>

      {/* Access Gatekeeper for Non-Premium / Non-Mega Users */}
      {!isPremium ? (
        <div className="dashboard-card" style={{ padding: '48px 32px', textAlign: 'center', background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(139, 92, 246, 0.05) 100%)', border: '1px dashed var(--primary-glow)', borderRadius: '28px' }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>🔒</div>
          <h3 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '8px' }}>Unlock Coordinated Timetable Sync</h3>
          <p style={{ color: 'var(--text-dim)', fontSize: '14px', maxWidth: '500px', margin: '0 auto 24px', lineHeight: 1.6 }}>
            Upgrade to the **Mega Saver Plan** to sync timetables, coordinate skip days safely with friends, plan joint study sessions, and track cumulative group attendance!
          </p>
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: '0 0 25px rgba(245, 158, 11, 0.3)' }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/premium')}
            style={{
              background: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)',
              color: 'white',
              border: 'none',
              padding: '14px 32px',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '800',
              cursor: 'pointer'
            }}
          >
            Upgrade to Mega Saver Plan 👑
          </motion.button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Top Panel: Create or Join Group */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            
            {/* Create Group Box */}
            <div className="dashboard-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>✨</span> Start Coordinated study Group
              </h4>
              <p style={{ color: 'var(--text-dim)', fontSize: '12.5px', margin: 0, lineHeight: 1.5 }}>
                Generate a secure Sync PIN, share it with your classmates, and sync your timetables directly.
              </p>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(0,0,0,0.2)', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '700' }}>YOUR PIN:</span>
                <span style={{ fontSize: '18px', fontWeight: '900', color: 'var(--primary-light)', letterSpacing: '2px' }}>{syncPin}</span>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCreateGroup}
                style={{
                  background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '12px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: '800',
                  cursor: 'pointer'
                }}
              >
                Create Study Sync Group
              </motion.button>
            </div>

            {/* Join Group Box */}
            <div className="dashboard-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>🔗</span> Join Classmate's Sync Group
              </h4>
              <p style={{ color: 'var(--text-dim)', fontSize: '12.5px', margin: 0, lineHeight: 1.5 }}>
                Paste the unique Sync PIN provided by your group host to import their schedule overlay.
              </p>
              
              <input
                type="text"
                placeholder="Enter PIN (e.g. TAPS-1234)"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                style={{
                  background: 'rgba(0,0,0,0.2)',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  padding: '12px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}
              />

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleJoinGroup}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-main)',
                  padding: '12px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: '750',
                  cursor: 'pointer'
                }}
              >
                Join Sync Group
              </motion.button>
            </div>

          </div>

          {/* Group Sync Dashboard */}
          {activeGroup && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
            >
              
              {/* Group Overview Banner */}
              <div className="dashboard-card" style={{ padding: '24px', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(15, 23, 42, 0.6) 100%)', border: '1px solid var(--primary-glow)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: 'var(--text-main)' }}>👥 {activeGroup.name}</h3>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>Active Session PIN: **{activeGroup.pin}**</span>
                  </div>
                  <span style={{ fontSize: '11px', background: 'var(--success)20', border: '1px solid var(--success)', color: 'var(--success)', padding: '4px 12px', borderRadius: '100px', fontWeight: '800' }}>
                    ● LIVE SYNC ACTIVE
                  </span>
                </div>
              </div>

              {/* Members List */}
              <div className="dashboard-card" style={{ padding: '24px' }}>
                <h4 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: '800' }}>👥 Study Group Members ({activeGroup.members.length})</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                  {activeGroup.members.map((member, idx) => (
                    <div 
                      key={idx} 
                      style={{ 
                        background: 'rgba(255,255,255,0.02)', 
                        border: '1px solid var(--border)', 
                        borderRadius: '16px', 
                        padding: '16px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '12px' 
                      }}
                    >
                      <span style={{ fontSize: '28px' }}>{member.avatar}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: '750', color: 'var(--text-main)' }}>{member.name}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Attendance:</span>
                          <span style={{ fontSize: '12px', fontWeight: '800', color: member.status === 'Critical' ? 'var(--danger)' : 'var(--success)' }}>
                            {member.attendance}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Coordinated Smart Calendar Overlays */}
              <div className="dashboard-card" style={{ padding: '24px' }}>
                <h4 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>🔮</span> AI Coordinated Group Recommendations
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {activeGroup.recommendations.map((rec, idx) => (
                    <div 
                      key={idx} 
                      style={{ 
                        background: 'rgba(0,0,0,0.15)', 
                        border: '1px solid var(--border)', 
                        borderRadius: '16px', 
                        padding: '20px', 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        flexWrap: 'wrap', 
                        gap: '12px' 
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '11px', background: 'var(--primary-glow)', color: 'var(--primary-light)', padding: '2px 8px', borderRadius: '100px', fontWeight: '800', textTransform: 'uppercase' }}>
                            {rec.day}
                          </span>
                          <span style={{ fontSize: '12px', color: 'var(--text-dim)', fontWeight: '700' }}>{rec.label}</span>
                        </div>
                        <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-main)', marginTop: '8px' }}>{rec.class}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{rec.savings}</div>
                      </div>

                      <div style={{ 
                        background: rec.action === 'Attend Class Together' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', 
                        border: `1.5px solid ${rec.action === 'Attend Class Together' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                        borderRadius: '12px', 
                        padding: '10px 20px',
                        color: rec.action === 'Attend Class Together' ? 'var(--danger)' : 'var(--success)',
                        fontWeight: '800',
                        fontSize: '13px'
                      }}>
                        {rec.action}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </motion.div>
          )}

        </div>
      )}

    </div>
  );
}

export default MegaSaver;
