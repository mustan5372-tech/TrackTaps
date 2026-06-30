import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAppStore from '../store/appStore';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../services/firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

function MegaSaver() {
  const navigate = useNavigate();
  const { user, subscription, subjects, subjectStats, role } = useAppStore();
  const isPremium = subscription?.status === 'active' || role === 'owner' || role === 'core_admin';

  const [activeGroup, setActiveGroup] = useState(null);
  const [pinInput, setPinInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [groupId, setGroupId] = useState(() => {
    return localStorage.getItem('tracktaps_sync_group_id') || '';
  });

  // Leave / Disconnect from study sync group
  const handleLeaveGroup = () => {
    localStorage.removeItem('tracktaps_sync_group_id');
    setGroupId('');
    setActiveGroup(null);
    triggerToast("🔌 Left Bunk Group successfully!");
  };

  // Helper: Toast Notifications
  const triggerToast = (msg) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3500);
  };

  // Helper: Calculate attendance percentage exactly like subjects page
  const getAttendancePercentage = (subject, stats) => {
    if (stats && stats.total > 0) {
      return Math.round((stats.present / stats.total) * 100) || 0;
    }
    if (subject.podaiPercentage) return Math.round(Number(subject.podaiPercentage));
    const present = Number(subject.initialPresent || subject.present || 0);
    const total = Number(subject.initialTotal || subject.total || 0);
    return total > 0 ? Math.round((present / total) * 100) : 0;
  };

  // Helper: Prepare real member payload with active subjects & attendance stats
  const prepareMemberPayload = () => {
    const realSubjects = (subjects || []).map(sub => {
      const stats = subjectStats?.[sub.id];
      const percentage = getAttendancePercentage(sub, stats);
      return {
        id: sub.id,
        name: sub.name,
        criteria: sub.criteria || 75,
        present: stats?.present ?? Number(sub.initialPresent || sub.present || 0),
        total: stats?.total ?? Number(sub.initialTotal || sub.total || 0),
        percentage
      };
    });

    return {
      uid: user?.uid,
      name: user?.displayName || user?.email || 'Anonymous Scholar',
      avatar: ['🦁', '🐙', '🐻', '🐸', '🐼', '🦊'][Math.floor((user?.uid?.charCodeAt(0) || 0) % 6)],
      subjects: realSubjects,
      updatedAt: new Date().toISOString()
    };
  };

  // Unique Group PIN Generator: alphanumeric 6 chars
  const generateUniquePin = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `TAPS-${result}`;
  };

  // Create real group in Firestore
  const handleCreateGroup = async () => {
    if (!isPremium) {
      navigate('/premium');
      return;
    }
    if (!user) {
      triggerToast("⚠️ You must be logged in to create a group!");
      return;
    }

    setLoading(true);
    try {
      const newPin = generateUniquePin();
      const groupRef = doc(db, 'sync_groups', newPin);
      
      const hostPayload = prepareMemberPayload();
      const initialGroup = {
        groupId: newPin,
        name: `${user.displayName || 'My'}'s Bunk Group`,
        hostUid: user.uid,
        createdAt: new Date().toISOString(),
        members: {
          [user.uid]: hostPayload
        }
      };

      await setDoc(groupRef, initialGroup);
      setGroupId(newPin);
      localStorage.setItem('tracktaps_sync_group_id', newPin);
      triggerToast(`✨ Bunk Group ${newPin} created successfully!`);
    } catch (err) {
      console.error("Firestore creation error:", err);
      triggerToast("❌ Failed to create study group in cloud database.");
    } finally {
      setLoading(false);
    }
  };

  // Join real group in Firestore
  const handleJoinGroup = async () => {
    if (!isPremium) {
      navigate('/premium');
      return;
    }
    if (!user) {
      triggerToast("⚠️ You must be logged in to join a group!");
      return;
    }
    const cleanPin = pinInput.trim().toUpperCase();
    if (!cleanPin) {
      triggerToast("⚠️ Please enter a valid Invite Code!");
      return;
    }

    setLoading(true);
    try {
      const groupRef = doc(db, 'sync_groups', cleanPin);
      const snap = await getDoc(groupRef);

      if (!snap.exists()) {
        triggerToast("🔍 Invite Code not found. Double-check your spelling!");
        setLoading(false);
        return;
      }

      const myPayload = prepareMemberPayload();
      const currentData = snap.data();
      
      // Update Firestore with merged member data
      await setDoc(groupRef, {
        members: {
          ...currentData.members,
          [user.uid]: myPayload
        }
      }, { merge: true });

      setGroupId(cleanPin);
      localStorage.setItem('tracktaps_sync_group_id', cleanPin);
      triggerToast(`🔗 Joined Bunk Group ${cleanPin} successfully!`);
    } catch (err) {
      console.error("Firestore join error:", err);
      triggerToast("❌ Failed to join study group. Try again!");
    } finally {
      setLoading(false);
    }
  };

  const handleShareGroup = async () => {
    const activePin = activeGroup?.groupId || groupId || pinInput;
    if (!activePin) {
      triggerToast("⚠️ No active group to share!");
      return;
    }

    const shareData = {
      title: 'TrackTaps Bunk Together Invite',
      text: `Join my TrackTaps Bunk Together group!\n\nWe'll coordinate attendance together, discover safe bunks using AI, and avoid attendance shortages.\n\nInvite Code:\n${activePin}\n\nDownload TrackTaps\ntracktaps.online`,
      url: 'https://www.tracktaps.online'
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        triggerToast("📢 Invite shared successfully!");
      } catch (err) {
        console.log("Web Share cancelled or failed", err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareData.text);
        triggerToast("📋 Invite message copied to clipboard! Share it with your classmates.");
      } catch (err) {
        console.error("Failed to copy", err);
        triggerToast("❌ Failed to share or copy invite.");
      }
    }
  };

  // Real-time Firestore document listener
  useEffect(() => {
    if (!groupId || !db) return;

    console.log(`📡 [MegaSaver] Listening to Firestore group: ${groupId}`);
    const groupRef = doc(db, 'sync_groups', groupId);

    const unsubscribe = onSnapshot(groupRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        // Convert members map into array
        const membersList = Object.values(data.members || {});
        
        // Dynamic Coordinated recommendations based on REAL synced subjects!
        const recommendations = [];
        
        // Get all unique subject names across all group members
        const allSubjectNames = Array.from(
          new Set(membersList.flatMap(m => (m.subjects || []).map(s => s.name)))
        );

        allSubjectNames.forEach(subName => {
          // Find members who have this subject
          const matchingMembers = membersList.filter(m => 
            (m.subjects || []).some(s => s.name === subName)
          );

          // Check if any matching member is below target criteria for this subject
          const criticalMembers = matchingMembers.filter(m => {
            const sub = m.subjects.find(s => s.name === subName);
            return sub && sub.percentage < sub.criteria;
          });

          if (criticalMembers.length > 0) {
            recommendations.push({
              day: 'High Alert',
              action: 'Attend Together',
              label: `High Risk for ${criticalMembers.map(m => m.name.split(' ')[0]).join(', ')}`,
              class: subName,
              savings: 'Attendance criteria not met! Attendance recommended.'
            });
          } else {
            recommendations.push({
              day: 'Safe skip',
              action: 'Safe Group Bunk',
              label: 'All Members Safe',
              class: subName,
              savings: 'Everyone is above their target criteria. Safe skip window!'
            });
          }
        });

        // Update local React state with Firestore real-time updates!
        setActiveGroup({
          ...data,
          members: membersList,
          recommendations
        });
      } else {
        triggerToast("⚠️ Group session has expired or been terminated.");
        setActiveGroup(null);
        setGroupId('');
      }
    }, (err) => {
      console.error("Firestore onSnapshot error:", err);
    });

    return () => unsubscribe();
  }, [groupId]);

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
            <h2 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>🤝 Bunk Together</h2>
            <span style={{ fontSize: '10px', background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)', color: 'white', padding: '3px 10px', borderRadius: '100px', fontWeight: '950', letterSpacing: '0.05em' }}>✨ Exclusive Feature</span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-dim)', margin: 0 }}>Plan smarter. Bunk together. Stay safe.</p>
        </div>
      </header>

      {/* Access Gatekeeper for Non-Premium / Non-Mega Users */}
      {!isPremium ? (
        <div className="dashboard-card" style={{ padding: '48px 32px', textAlign: 'center', background: 'rgba(139, 92, 246, 0.05)', border: '1.5px dashed rgba(139, 92, 246, 0.3)', borderRadius: '28px', backdropFilter: 'blur(20px)' }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>🤝</div>
          <h3 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '8px' }}>Unlock Bunk Together</h3>
          <p style={{ color: 'var(--text-dim)', fontSize: '14px', maxWidth: '550px', margin: '0 auto 24px', lineHeight: 1.6 }}>
            Plan smarter. Bunk together. Stay safe.<br /><br />
            Create a private class group, sync attendance in real time, and discover how many lectures everyone can safely skip together.
          </p>
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: '0 0 25px rgba(139, 92, 246, 0.3)' }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/premium')}
            style={{
              background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)',
              color: 'white',
              border: 'none',
              padding: '14px 32px',
              borderRadius: '100px',
              fontSize: '14px',
              fontWeight: '800',
              cursor: 'pointer'
            }}
          >
            Upgrade to Premium Plan 👑
          </motion.button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Top Panel: Create or Join Group */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            
            {/* Create Group Box */}
            <div className="dashboard-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>✨</span> Create Your Bunk Group
              </h4>
              <p style={{ color: 'var(--text-dim)', fontSize: '12.5px', margin: 0, lineHeight: 1.5 }}>
                Generate a secure invite code and start planning safe bunks with your classmates.
              </p>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCreateGroup}
                disabled={loading}
                style={{
                  background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '12px',
                  borderRadius: '100px',
                  fontSize: '13px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  opacity: loading ? 0.6 : 1
                }}
              >
                {loading ? 'Initializing...' : 'Create Bunk Group 👥'}
              </motion.button>
            </div>

            {/* Join Group Box */}
            <div className="dashboard-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>🔗</span> Join a Bunk Group
              </h4>
              <p style={{ color: 'var(--text-dim)', fontSize: '12.5px', margin: 0, lineHeight: 1.5 }}>
                Enter your friend's invite code to synchronize attendance and unlock AI-powered group bunk planning.
              </p>
              
              <input
                type="text"
                placeholder="Enter Invite Code (e.g. TAPS-ABC123)"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                style={{
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '100px',
                  padding: '12px 24px',
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
                disabled={loading}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: 'var(--text-main)',
                  padding: '12px',
                  borderRadius: '100px',
                  fontSize: '13px',
                  fontWeight: '750',
                  cursor: 'pointer',
                  opacity: loading ? 0.6 : 1
                }}
              >
                {loading ? 'Connecting...' : 'Join Bunk Group'}
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
              <div className="dashboard-card" style={{ padding: '24px', background: 'rgba(139, 92, 246, 0.08)', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: 'var(--text-main)' }}>👥 {activeGroup.name}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                        Invite Code: <strong style={{ color: 'var(--primary-light)', fontSize: '14px', letterSpacing: '0.5px' }}>{activeGroup.groupId}</strong>
                      </span>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleShareGroup}
                        style={{
                          background: 'rgba(139, 92, 246, 0.12)',
                          border: '1px solid rgba(139, 92, 246, 0.3)',
                          color: 'var(--primary-light)',
                          padding: '4px 12px',
                          borderRadius: '100px',
                          fontSize: '11px',
                          fontWeight: '800',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: 'var(--shadow-sm)'
                        }}
                      >
                        📢 Share Invite Code
                      </motion.button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '11px', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', color: 'var(--success)', padding: '4px 12px', borderRadius: '100px', fontWeight: '800' }}>
                      🟢 Bunk Crew Online
                    </span>
                    <button
                      onClick={handleLeaveGroup}
                      style={{
                        background: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        color: 'var(--text-dim)',
                        padding: '4px 12px',
                        borderRadius: '100px',
                        fontSize: '11px',
                        fontWeight: '750',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseOver={(e) => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.borderColor = '#ef4444'; }}
                      onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-dim)'; e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)'; }}
                    >
                      Leave Group
                    </button>
                  </div>
                </div>
              </div>

              {/* Members List */}
              <div className="dashboard-card" style={{ padding: '24px' }}>
                <h4 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: '800' }}>👥 Bunk Crew ({activeGroup.members.length})</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                  {activeGroup.members.map((member, idx) => (
                    <div 
                      key={idx} 
                      style={{ 
                        background: 'rgba(255, 255, 255, 0.04)', 
                        border: '1px solid rgba(255, 255, 255, 0.1)', 
                        borderRadius: '24px', 
                        padding: '20px', 
                        display: 'flex', 
                        flexDirection: 'column',
                        gap: '12px',
                        backdropFilter: 'blur(10px)',
                        WebkitBackdropFilter: 'blur(10px)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '32px' }}>{member.avatar}</span>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-main)' }}>{member.name}</div>
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Updated: {new Date(member.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>

                      {/* Synced Real Subjects & Percentages */}
                      <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '750', textTransform: 'uppercase' }}>Real Subjects Sync</div>
                        {(member.subjects || []).length === 0 ? (
                          <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>No active subjects listed</div>
                        ) : (
                          member.subjects.map((sub, sIdx) => (
                            <div key={sIdx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                              <span style={{ color: 'var(--text-dim)' }}>{sub.name}</span>
                              <span style={{ 
                                fontWeight: '800', 
                                color: sub.percentage >= sub.criteria ? 'var(--success)' : 'var(--danger)' 
                              }}>
                                {sub.percentage}%
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {activeGroup.members.length <= 1 && (
                  <div style={{ textAlign: 'center', padding: '24px', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '20px', marginTop: '16px' }}>
                    <p style={{ color: 'var(--text-dim)', fontSize: '13px', margin: 0 }}>
                      No classmates have joined your Bunk Group yet. Share your invite code and start planning smarter together.
                    </p>
                  </div>
                )}
              </div>

              {/* Coordinated Smart Calendar Overlays */}
              <div className="dashboard-card" style={{ padding: '24px' }}>
                <h4 style={{ margin: '0 0 8px', fontSize: '15px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>🤖</span> AI Bunk Recommendations
                </h4>
                <p style={{ color: 'var(--text-dim)', fontSize: '12.5px', marginTop: 0, marginBottom: '16px', lineHeight: 1.5 }}>
                  Our AI analyzes everyone's attendance and recommends the safest lectures to bunk—or attend together—to maximize attendance without crossing the minimum threshold.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {activeGroup.recommendations.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-dim)', fontSize: '12px' }}>
                      Add matching subjects to view AI Bunk recommendations.
                    </div>
                  ) : (
                    activeGroup.recommendations.map((rec, idx) => (
                      <div 
                        key={idx} 
                        style={{ 
                          background: 'rgba(255, 255, 255, 0.04)', 
                          border: '1px solid rgba(255, 255, 255, 0.1)', 
                          borderRadius: '24px', 
                          padding: '20px', 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center', 
                          flexWrap: 'wrap', 
                          gap: '12px',
                          backdropFilter: 'blur(10px)',
                          WebkitBackdropFilter: 'blur(10px)'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ 
                                fontSize: '11px', 
                                background: rec.action === 'Attend Together' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(139, 92, 246, 0.15)', 
                                color: rec.action === 'Attend Together' ? 'var(--danger)' : 'var(--primary-light)', 
                                padding: '2px 8px', 
                                borderRadius: '100px', 
                                fontWeight: '800', 
                                textTransform: 'uppercase' 
                              }}>
                                {rec.day}
                              </span>
                            <span style={{ fontSize: '12px', color: 'var(--text-dim)', fontWeight: '700' }}>{rec.label}</span>
                          </div>
                          <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-main)', marginTop: '8px' }}>{rec.class}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{rec.savings}</div>
                        </div>

                        <div style={{ 
                            background: rec.action === 'Attend Together' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)', 
                            border: `1.5px solid ${rec.action === 'Attend Together' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                            borderRadius: '100px', 
                            padding: '10px 20px',
                            color: rec.action === 'Attend Together' ? 'var(--danger)' : 'var(--success)',
                            fontWeight: '800',
                            fontSize: '13px'
                          }}>
                          {rec.action}
                        </div>
                      </div>
                    ))
                  )}
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
