import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useAppStore from '../store/appStore';
import { auth, db, storage } from '../services/firebase';
import { doc, setDoc, deleteDoc, collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateProfile } from 'firebase/auth';

function AccountDrawer() {
  const {
    user,
    role,
    subscription,
    isAccountDrawerOpen,
    setAccountDrawerOpen,
    theme,
    setTheme,
    logout,
    pushToCloud,
    pullFromCloud,
    attendanceSettings,
    setAttendanceSettings,
    semesterSettings,
    setSemesterSettings,
    podaiSyncStatus
  } = useAppStore();

  const [activePage, setActivePage] = useState('menu'); // 'menu', 'edit-profile', 'appearance', 'notifications', 'subscription', 'privacy', 'about', 'help', 'rate', 'feedback', 'downloads', 'security'
  const [profileData, setProfileData] = useState({
    displayName: '',
    phone: '',
    college: '',
    branch: '',
    semester: '',
    studentId: '',
    bio: ''
  });

  // Local Toggles / Selectors
  const [localNotifs, setLocalNotifs] = useState({
    attendanceReminder: true,
    timetableReminder: true,
    podaiAlerts: true,
    premiumNotifs: true,
    communityNotifs: true,
    updates: true,
    announcements: true
  });

  const [localAppearance, setLocalAppearance] = useState({
    accentColor: 'purple',
    animationSpeed: '1x',
    compactMode: false,
    largeText: false
  });

  // Upload/Crop States
  const [uploading, setUploading] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState(null);
  const [cropScale, setCropScale] = useState(1);
  const cropImageRef = useRef(null);
  const cropContainerRef = useRef(null);
  const fileInputRef = useRef(null);

  // Other dynamic states
  const [saveLoading, setSaveLoading] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);
  const [ratingVal, setRatingVal] = useState(0);
  const [ratingSuccess, setRatingSuccess] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [cropPosition, setCropPosition] = useState({ x: 0, y: 0 });

  // Sync user state on load/update
  useEffect(() => {
    if (user) {
      setProfileData({
        displayName: user.displayName || '',
        phone: user.phoneNumber || localStorage.getItem(`tt_phone_${user.uid}`) || '',
        college: localStorage.getItem(`tt_college_${user.uid}`) || '',
        branch: localStorage.getItem(`tt_branch_${user.uid}`) || '',
        semester: semesterSettings?.currentSemester || localStorage.getItem(`tt_semester_${user.uid}`) || 'Semester 1',
        studentId: localStorage.getItem(`tt_student_id_${user.uid}`) || '',
        bio: localStorage.getItem(`tt_bio_${user.uid}`) || ''
      });
    }
  }, [user, semesterSettings]);

  // Load localStorage sub-settings
  useEffect(() => {
    if (user) {
      const savedNotifs = localStorage.getItem(`tt_notifs_${user.uid}`);
      if (savedNotifs) setLocalNotifs(JSON.parse(savedNotifs));

      const savedAppearance = localStorage.getItem(`tt_appearance_${user.uid}`);
      if (savedAppearance) setLocalAppearance(JSON.parse(savedAppearance));
    }
  }, [user]);

  if (!user) return null;

  const isPremium = subscription?.status === 'active' || role === 'owner' || role === 'core_admin';

  // --- Profile Edit Save ---
  const handleSaveProfile = async () => {
    if (!profileData.displayName.trim()) {
      alert("Name is required!");
      return;
    }
    setSaveLoading(true);
    try {
      // 1. Update Firebase Auth displayName
      await updateProfile(auth.currentUser, { displayName: profileData.displayName });
      
      // 2. Save custom profile fields in LocalStorage
      localStorage.setItem(`tt_phone_${user.uid}`, profileData.phone);
      localStorage.setItem(`tt_college_${user.uid}`, profileData.college);
      localStorage.setItem(`tt_branch_${user.uid}`, profileData.branch);
      localStorage.setItem(`tt_semester_${user.uid}`, profileData.semester);
      localStorage.setItem(`tt_student_id_${user.uid}`, profileData.studentId);
      localStorage.setItem(`tt_bio_${user.uid}`, profileData.bio);

      // Sync semester settings if altered
      if (profileData.semester !== semesterSettings?.currentSemester) {
        setSemesterSettings({ currentSemester: profileData.semester });
      }

      // 3. Save to Firestore
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        displayName: profileData.displayName,
        phoneNumber: profileData.phone,
        collegeName: profileData.college,
        branch: profileData.branch,
        currentSemester: profileData.semester,
        studentId: profileData.studentId,
        bio: profileData.bio,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      // Trigger appStore sync
      pushToCloud();
      setShowSaveSuccess(true);
      setTimeout(() => {
        setShowSaveSuccess(false);
        setActivePage('menu');
      }, 1500);
    } catch (e) {
      console.error(e);
      alert("Failed to save profile details.");
    } finally {
      setSaveLoading(false);
    }
  };

  // --- Notifications Preferences Save ---
  const handleToggleNotif = (key) => {
    const updated = { ...localNotifs, [key]: !localNotifs[key] };
    setLocalNotifs(updated);
    localStorage.setItem(`tt_notifs_${user.uid}`, JSON.stringify(updated));
    // Push changes in background
    const userRef = doc(db, 'users', user.uid);
    setDoc(userRef, { notificationSettings: updated }, { merge: true }).catch(() => {});
  };

  // --- Appearance Preferences Save ---
  const handleUpdateAppearance = (key, val) => {
    const updated = { ...localAppearance, [key]: val };
    setLocalAppearance(updated);
    localStorage.setItem(`tt_appearance_${user.uid}`, JSON.stringify(updated));
    
    // Apply changes instantly
    if (key === 'accentColor') {
      const hueMap = { purple: '270', blue: '210', lavender: '255', pink: '320' };
      document.documentElement.style.setProperty('--custom-hue', hueMap[val]);
      localStorage.setItem('tracktaps_custom_hue', hueMap[val]);
    }
    if (key === 'animationSpeed') {
      const durationMap = { '0.5x': '0.15s', '1x': '0.3s', '1.5x': '0.45s' };
      document.documentElement.style.setProperty('--animation-duration', durationMap[val]);
    }
    
    const userRef = doc(db, 'users', user.uid);
    setDoc(userRef, { appearanceSettings: updated }, { merge: true }).catch(() => {});
  };

  // --- Photo Handling ---
  const handlePhotoSelected = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCropImageSrc(reader.result);
      setCropScale(1);
      setCropPosition({ x: 0, y: 0 });
    };
    reader.readAsDataURL(file);
  };

  const handleCropAndUpload = async () => {
    if (!cropImageRef.current || !cropContainerRef.current) return;
    setUploading(true);
    try {
      const img = cropImageRef.current;
      const container = cropContainerRef.current;
      const containerRect = container.getBoundingClientRect();
      const imgRect = img.getBoundingClientRect();

      // Calculation of crops
      const scaleX = img.naturalWidth / imgRect.width;
      const scaleY = img.naturalHeight / imgRect.height;
      const left = imgRect.left - containerRect.left;
      const top = imgRect.top - containerRect.top;

      const canvas = document.createElement('canvas');
      canvas.width = 250;
      canvas.height = 250;
      const ctx = canvas.getContext('2d');

      const sx = -left * scaleX;
      const sy = -top * scaleY;
      const sWidth = containerRect.width * scaleX;
      const sHeight = containerRect.height * scaleY;

      ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, 250, 250);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

      // Convert to blob
      const res = await fetch(dataUrl);
      const blob = await res.blob();

      let downloadURL = dataUrl; // Fallback to base64 if storage fails

      try {
        if (storage && storage.app) {
          const storageRef = ref(storage, `profile_pictures/${user.uid}.jpg`);
          await uploadBytes(storageRef, blob);
          downloadURL = await getDownloadURL(storageRef);
        }
      } catch (storageErr) {
        console.warn("⚠️ Firebase Storage failed or locked. Falling back to compressed base64 Firestore store.", storageErr);
      }

      // Update Firebase auth profile photo
      await updateProfile(auth.currentUser, { photoURL: downloadURL });

      // Save to Firestore
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, { photoURL: downloadURL }, { merge: true });

      // Update state instantly by changing photoURL on local user object
      user.photoURL = downloadURL;
      pushToCloud();

      setCropImageSrc(null);
      alert("Profile picture updated successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to crop and upload image.");
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!window.confirm("Are you sure you want to remove your profile picture?")) return;
    setUploading(true);
    try {
      await updateProfile(auth.currentUser, { photoURL: '' });
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, { photoURL: '' }, { merge: true });
      user.photoURL = '';
      pushToCloud();
      alert("Profile picture removed.");
    } catch (e) {
      console.error(e);
      alert("Failed to remove photo.");
    } finally {
      setUploading(false);
    }
  };

  // --- Feedback Submit ---
  const handleSendFeedback = async () => {
    if (!feedbackText.trim()) return;
    try {
      await addDoc(collection(db, "feedback"), {
        userId: user.uid,
        userName: user.displayName,
        email: user.email,
        feedback: feedbackText,
        createdAt: new Date().toISOString()
      });
      setFeedbackSuccess(true);
      setFeedbackText('');
      setTimeout(() => setFeedbackSuccess(false), 3000);
    } catch (e) {
      alert("Error sending feedback: " + e.message);
    }
  };

  // --- Rating Submit ---
  const handleSendRating = async () => {
    if (ratingVal === 0) return;
    try {
      await addDoc(collection(db, "ratings"), {
        userId: user.uid,
        userName: user.displayName,
        rating: ratingVal,
        createdAt: new Date().toISOString()
      });
      setRatingSuccess(true);
      setTimeout(() => {
        setRatingSuccess(false);
        setActivePage('menu');
      }, 2000);
    } catch (e) {
      alert("Failed to submit rating.");
    }
  };

  // --- Delete Account ---
  const handleDeleteAccount = async () => {
    try {
      const userRef = doc(db, 'users', user.uid);
      await deleteDoc(userRef);
      await auth.currentUser.delete();
      logout();
      setAccountDrawerOpen(false);
      window.location.reload();
    } catch (e) {
      alert("To delete account, you must have logged in recently. Please re-authenticate and try again.");
    }
  };

  const handleShareApp = () => {
    const shareUrl = "https://www.tracktaps.online";
    if (navigator.share) {
      navigator.share({
        title: 'TrackTaps',
        text: 'Keep track of your college attendance and schedules beautifully with TrackTaps!',
        url: shareUrl
      });
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert("TrackTaps link copied to clipboard!");
    }
  };

  return (
    <AnimatePresence>
      {isAccountDrawerOpen && (
        <>
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setAccountDrawerOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(2, 6, 23, 0.7)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              zIndex: 100000
            }}
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              bottom: 0,
              width: '80%',
              maxWidth: '420px',
              background: theme === 'light' ? 'rgba(255, 255, 255, 0.75)' : 'rgba(15, 23, 42, 0.45)',
              backdropFilter: 'blur(35px) saturate(180%)',
              WebkitBackdropFilter: 'blur(35px) saturate(180%)',
              borderLeft: theme === 'light' ? '1px solid rgba(0, 0, 0, 0.08)' : '1px solid rgba(255, 255, 255, 0.12)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1), -10px 0 40px rgba(0,0,0,0.4)',
              zIndex: 100001,
              display: 'flex',
              flexDirection: 'column',
              color: theme === 'light' ? '#0f172a' : '#f8fafc',
              overflow: 'hidden'
            }}
          >
            {/* Header / Top actions */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '20px',
              borderBottom: '1px solid rgba(255,255,255,0.06)'
            }}>
              {activePage !== 'menu' ? (
                <button
                  onClick={() => setActivePage('menu')}
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: 'none',
                    borderRadius: '100px',
                    padding: '6px 12px',
                    color: 'inherit',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  ◀ Back
                </button>
              ) : (
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '850' }}>🔮 Account Ecosystem</h3>
              )}
              <button
                onClick={() => setAccountDrawerOpen(false)}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '28px',
                  height: '28px',
                  color: 'inherit',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ✕
              </button>
            </div>

            {/* Scrollable body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
              <AnimatePresence mode="wait">
                {/* 1. MAIN MENU PAGE */}
                {activePage === 'menu' && (
                  <motion.div
                    key="menu"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                  >
                    {/* User info Header */}
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      textAlign: 'center',
                      gap: '12px',
                      marginBottom: '24px'
                    }}>
                      <div style={{ position: 'relative' }}>
                        <img
                          src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(profileData.displayName || 'User')}&background=8b5cf6&color=fff`}
                          alt="Avatar"
                          style={{
                            width: '90px',
                            height: '90px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            border: '3px solid var(--primary)',
                            boxShadow: '0 0 20px rgba(139, 92, 246, 0.3)'
                          }}
                        />
                        {isPremium && (
                          <div style={{
                            position: 'absolute',
                            bottom: '0',
                            right: '0',
                            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                            borderRadius: '50%',
                            width: '24px',
                            height: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px',
                            border: '2px solid #0f172a'
                          }}>
                            👑
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <h2 style={{ fontSize: '20px', fontWeight: '850', margin: '0 0 4px 0' }}>
                          {profileData.displayName || 'TrackTaps Member'}
                        </h2>
                        <p style={{ color: 'var(--text-dim)', fontSize: '13px', margin: '0 0 8px 0' }}>
                          {user.email}
                        </p>
                        
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <span style={{
                            fontSize: '10px',
                            fontWeight: '900',
                            padding: '4px 10px',
                            background: isPremium ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255,255,255,0.05)',
                            color: isPremium ? '#f59e0b' : 'var(--text-dim)',
                            border: isPremium ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '100px',
                            textTransform: 'uppercase'
                          }}>
                            {isPremium ? '👑 Premium' : 'Free Tier'}
                          </span>
                          
                          <span style={{
                            fontSize: '10px',
                            fontWeight: '800',
                            padding: '4px 10px',
                            background: 'rgba(139, 92, 246, 0.12)',
                            color: 'var(--primary-light)',
                            border: '1px solid rgba(139, 92, 246, 0.2)',
                            borderRadius: '100px'
                          }}>
                            {profileData.semester}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Account Details Glass Card */}
                    <div style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: '20px',
                      padding: '16px',
                      marginBottom: '24px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '8px' }}>
                        <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>College</span>
                        <span style={{ fontSize: '12px', fontWeight: '700' }}>{profileData.college || 'Not set'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '8px' }}>
                        <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Branch</span>
                        <span style={{ fontSize: '12px', fontWeight: '700' }}>{profileData.branch || 'Not set'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '8px' }}>
                        <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Phone</span>
                        <span style={{ fontSize: '12px', fontWeight: '700' }}>{profileData.phone || 'Not set'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Bio</span>
                        <span style={{ fontSize: '12px', fontWeight: '500', fontStyle: 'italic', maxWidth: '70%', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          {profileData.bio || 'Add a bio...'}
                        </span>
                      </div>
                    </div>

                    {/* Menu items grid */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {[
                        { label: '✏️ Edit Profile', page: 'edit-profile' },
                        { label: '🎨 Appearance', page: 'appearance' },
                        { label: '🔔 Notifications', page: 'notifications' },
                        { label: '💳 Subscription', page: 'subscription' },
                        { label: '🔐 Privacy & Sync', page: 'privacy' },
                        { label: '❓ Help Center', page: 'help' },
                        { label: '📤 Share TrackTaps', action: handleShareApp },
                        { label: '⭐ Rate TrackTaps', page: 'rate' },
                        { label: '💬 Send Feedback', page: 'feedback' },
                        { label: 'ℹ️ About TrackTaps', page: 'about' },
                        { label: '🚪 Logout', action: () => setShowLogoutConfirm(true), color: '#ef4444' }
                      ].map((item, idx) => (
                        <motion.button
                          key={idx}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            if (item.page) setActivePage(item.page);
                            if (item.action) item.action();
                          }}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            width: '100%',
                            padding: '12px 18px',
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.05)',
                            borderRadius: '12px',
                            color: item.color || 'inherit',
                            fontWeight: '600',
                            fontSize: '14px',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.2s'
                          }}
                        >
                          <span>{item.label}</span>
                          <span style={{ opacity: 0.5 }}>❯</span>
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* 2. EDIT PROFILE PAGE */}
                {activePage === 'edit-profile' && (
                  <motion.div
                    key="edit-profile"
                    initial={{ opacity: 0, x: 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -15 }}
                    style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
                  >
                    <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                      <div style={{ position: 'relative', display: 'inline-block' }}>
                        <img
                          src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(profileData.displayName || 'User')}&background=8b5cf6&color=fff`}
                          alt="Avatar"
                          style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover' }}
                        />
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          style={{
                            position: 'absolute',
                            bottom: 0,
                            right: 0,
                            background: 'var(--primary)',
                            border: 'none',
                            color: 'white',
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            cursor: 'pointer',
                            fontSize: '11px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          title="Change Photo"
                        >
                          📷
                        </button>
                      </div>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handlePhotoSelected}
                        accept="image/*"
                        style={{ display: 'none' }}
                      />
                      
                      {user.photoURL && (
                        <button
                          onClick={handleRemovePhoto}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#ef4444',
                            fontSize: '11px',
                            fontWeight: '600',
                            marginTop: '8px',
                            cursor: 'pointer'
                          }}
                        >
                          Remove Photo
                        </button>
                      )}
                    </div>

                    {/* Inputs */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {[
                        { label: 'Display Name', key: 'displayName', type: 'text' },
                        { label: 'Phone Number', key: 'phone', type: 'tel' },
                        { label: 'College', key: 'college', type: 'text' },
                        { label: 'Branch', key: 'branch', type: 'text' },
                        { label: 'Student ID', key: 'studentId', type: 'text' }
                      ].map((field) => (
                        <div key={field.key} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <label style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: '700' }}>
                            {field.label}
                          </label>
                          <input
                            type={field.type}
                            value={profileData[field.key]}
                            onChange={(e) => setProfileData({ ...profileData, [field.key]: e.target.value })}
                            style={{
                              background: 'rgba(255,255,255,0.04)',
                              border: '1px solid rgba(255,255,255,0.08)',
                              borderRadius: '10px',
                              padding: '10px 14px',
                              color: 'inherit',
                              fontSize: '14px'
                            }}
                          />
                        </div>
                      ))}

                      {/* Semester Dropdown */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: '700' }}>Semester</label>
                        <select
                          value={profileData.semester}
                          onChange={(e) => setProfileData({ ...profileData, semester: e.target.value })}
                          style={{
                            background: 'rgba(15, 23, 42, 0.8)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: '10px',
                            padding: '10px 14px',
                            color: 'inherit',
                            fontSize: '14px'
                          }}
                        >
                          {Array.from({ length: 8 }).map((_, i) => (
                            <option key={i} value={`Semester ${i + 1}`}>Semester {i + 1}</option>
                          ))}
                        </select>
                      </div>

                      {/* Bio Textarea */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: '700' }}>Bio</label>
                        <textarea
                          rows={2}
                          value={profileData.bio}
                          onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                          style={{
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: '10px',
                            padding: '10px 14px',
                            color: 'inherit',
                            fontSize: '14px',
                            resize: 'none'
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                      <button
                        onClick={() => setActivePage('menu')}
                        style={{
                          flex: 1,
                          padding: '12px',
                          borderRadius: '10px',
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          color: 'inherit',
                          fontWeight: '700',
                          cursor: 'pointer'
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveProfile}
                        disabled={saveLoading}
                        style={{
                          flex: 1,
                          padding: '12px',
                          borderRadius: '10px',
                          background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)',
                          border: 'none',
                          color: 'white',
                          fontWeight: '700',
                          cursor: 'pointer',
                          boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)'
                        }}
                      >
                        {saveLoading ? 'Saving...' : 'Save changes'}
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* 3. APPEARANCE PAGE */}
                {activePage === 'appearance' && (
                  <motion.div
                    key="appearance"
                    initial={{ opacity: 0, x: 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -15 }}
                    style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
                  >
                    {/* Theme Mode Toggle */}
                    <div>
                      <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', fontWeight: '800' }}>🌙 Display Mode</h4>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '100px',
                        padding: '4px'
                      }}>
                        {['default', 'light'].map((t) => (
                          <button
                            key={t}
                            onClick={() => setTheme(t)}
                            style={{
                              background: theme === t ? 'rgba(139, 92, 246, 0.25)' : 'transparent',
                              border: 'none',
                              borderRadius: '100px',
                              padding: '8px',
                              color: 'inherit',
                              fontWeight: '700',
                              cursor: 'pointer',
                              textTransform: 'capitalize'
                            }}
                          >
                            {t === 'default' ? 'Dark' : 'Light'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Accent Colors */}
                    <div>
                      <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', fontWeight: '800' }}>🎨 Accent Color</h4>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        {[
                          { id: 'purple', color: '#8b5cf6' },
                          { id: 'blue', color: '#3b82f6' },
                          { id: 'lavender', color: '#a78bfa' },
                          { id: 'pink', color: '#ec4899' }
                        ].map((c) => (
                          <button
                            key={c.id}
                            onClick={() => handleUpdateAppearance('accentColor', c.id)}
                            style={{
                              flex: 1,
                              height: '40px',
                              borderRadius: '8px',
                              background: c.color,
                              border: localAppearance.accentColor === c.id ? '2px solid white' : 'none',
                              cursor: 'pointer',
                              boxShadow: localAppearance.accentColor === c.id ? `0 0 15px ${c.color}` : 'none'
                            }}
                            title={c.id}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Animation speed */}
                    <div>
                      <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', fontWeight: '800' }}>⚡ Animation Speed</h4>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {['0.5x', '1x', '1.5x'].map((speed) => (
                          <button
                            key={speed}
                            onClick={() => handleUpdateAppearance('animationSpeed', speed)}
                            style={{
                              flex: 1,
                              padding: '8px',
                              borderRadius: '8px',
                              background: localAppearance.animationSpeed === speed ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255,255,255,0.03)',
                              border: localAppearance.animationSpeed === speed ? '1px solid var(--primary-light)' : '1px solid rgba(255,255,255,0.05)',
                              color: 'inherit',
                              fontWeight: '700',
                              cursor: 'pointer'
                            }}
                          >
                            {speed}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Layout Toggles */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <p style={{ margin: 0, fontSize: '14px', fontWeight: '700' }}>📐 Compact Mode</p>
                          <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-dim)' }}>Reduce card padding for dense layout</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={localAppearance.compactMode}
                          onChange={(e) => handleUpdateAppearance('compactMode', e.target.checked)}
                          style={{ width: '38px', height: '20px', accentColor: 'var(--primary)' }}
                        />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <p style={{ margin: 0, fontSize: '14px', fontWeight: '700' }}>🔤 Large Typography</p>
                          <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-dim)' }}>Increase dashboard font readability</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={localAppearance.largeText}
                          onChange={(e) => handleUpdateAppearance('largeText', e.target.checked)}
                          style={{ width: '38px', height: '20px', accentColor: 'var(--primary)' }}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* 4. NOTIFICATIONS PAGE */}
                {activePage === 'notifications' && (
                  <motion.div
                    key="notifications"
                    initial={{ opacity: 0, x: 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -15 }}
                    style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
                  >
                    {[
                      { label: '🔔 Attendance Reminders', desc: 'Trigger prompts to update daily attendance', key: 'attendanceReminder' },
                      { label: '🕒 Timetable Schedule Alerts', desc: 'Notify classes 10 mins before grid hours', key: 'timetableReminder' },
                      { label: '🤖 Pod.ai Sync alerts', desc: 'Alert when auto import fetches details', key: 'podaiAlerts' },
                      { label: '👑 Premium exclusive updates', desc: 'Alerts relating to Elite billing benefits', key: 'premiumNotifs' },
                      { label: '🌍 Community threads notifications', desc: 'Alerts when people reply to your posts', key: 'communityNotifs' },
                      { label: '🚀 Software Updates', desc: 'Popup notifications on new APK features', key: 'updates' },
                      { label: '📢 Broadcast announcements', desc: 'Receive notices from founders and core admins', key: 'announcements' }
                    ].map((item) => (
                      <div key={item.key} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.04)',
                        padding: '12px 16px',
                        borderRadius: '12px'
                      }}>
                        <div style={{ flex: 1, paddingRight: '12px' }}>
                          <p style={{ margin: 0, fontSize: '14px', fontWeight: '700' }}>{item.label}</p>
                          <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-dim)' }}>{item.desc}</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={localNotifs[item.key]}
                          onChange={() => handleToggleNotif(item.key)}
                          style={{ width: '38px', height: '20px', accentColor: 'var(--primary)', cursor: 'pointer' }}
                        />
                      </div>
                    ))}
                  </motion.div>
                )}

                {/* 5. SUBSCRIPTION PAGE */}
                {activePage === 'subscription' && (
                  <motion.div
                    key="subscription"
                    initial={{ opacity: 0, x: 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -15 }}
                    style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
                  >
                    {/* Current Plan Overview */}
                    <div style={{
                      background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(234, 179, 8, 0.05) 100%)',
                      border: '1px solid rgba(234, 179, 8, 0.3)',
                      borderRadius: '20px',
                      padding: '20px',
                      textAlign: 'center',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
                    }}>
                      <span style={{ fontSize: '32px' }}>👑</span>
                      <h4 style={{ margin: '8px 0', fontSize: '20px', fontWeight: '850', color: '#f59e0b' }}>
                        {isPremium ? 'TrackTaps Plus Elite' : 'TrackTaps Free Tier'}
                      </h4>
                      <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: 'var(--text-dim)' }}>
                        {isPremium ? 'Lifetime Cloud Protection Active' : 'Basic Local Attendance Tracking'}
                      </p>
                      
                      {isPremium && (
                        <div style={{
                          background: 'rgba(255,255,255,0.04)',
                          borderRadius: '8px',
                          padding: '6px',
                          fontSize: '11px',
                          color: 'var(--text-main)',
                          display: 'inline-block'
                        }}>
                          🔒 Expiry: Permanent Lifetime Access
                        </div>
                      )}
                    </div>

                    {/* Features List */}
                    <div>
                      <h5 style={{ margin: '0 0 10px 0', fontSize: '12px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                        Included Benefits
                      </h5>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {[
                          { text: '☁️ Unlimited Secure Cloud Backups', ok: true },
                          { text: '📱 Cross-Device Synchronized Portal', ok: true },
                          { text: '🤖 Pod.ai Automatic background sync', ok: true },
                          { text: '🎨 Complete Premium Theme Engine Access', ok: true },
                          { text: '📊 Unlimited Bunk/Predictor intelligence runs', ok: true },
                          { text: '✨ Custom Brand accent coloring system', ok: isPremium },
                          { text: '🚀 Zero Ads / High-Performance local builds', ok: true }
                        ].map((b, idx) => (
                          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                            <span>{b.ok ? '✅' : '🔒'}</span>
                            <span style={{ opacity: b.ok ? 1 : 0.5 }}>{b.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {!isPremium && (
                      <button
                        onClick={() => {
                          setAccountDrawerOpen(false);
                          window.location.href = '/premium';
                        }}
                        style={{
                          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                          color: 'white',
                          border: 'none',
                          padding: '14px',
                          borderRadius: '12px',
                          fontWeight: '800',
                          cursor: 'pointer',
                          boxShadow: '0 4px 20px rgba(245, 158, 11, 0.4)',
                          textAlign: 'center'
                        }}
                      >
                        💎 Upgrade to Premium Plus
                      </button>
                    )}
                  </motion.div>
                )}

                {/* 6. PRIVACY PAGE */}
                {activePage === 'privacy' && (
                  <motion.div
                    key="privacy"
                    initial={{ opacity: 0, x: 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -15 }}
                    style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
                  >
                    {/* Database status cards */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        padding: '16px'
                      }}>
                        <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: 'var(--text-dim)' }}>Firebase Connectivity</p>
                        <p style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#10b981' }}>
                          🟢 Fully Synced & Connected
                        </p>
                      </div>

                      <div style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        padding: '16px'
                      }}>
                        <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: 'var(--text-dim)' }}>Last Backup Timestamp</p>
                        <p style={{ margin: 0, fontSize: '14px', fontWeight: '700' }}>
                          {localStorage.getItem('tracktaps_last_local_update') ? new Date(localStorage.getItem('tracktaps_last_local_update')).toLocaleString() : 'Never synced'}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <button
                        onClick={() => pushToCloud(true)}
                        style={{
                          background: 'rgba(139, 92, 246, 0.12)',
                          border: '1px solid rgba(139, 92, 246, 0.25)',
                          color: 'var(--primary-light)',
                          padding: '12px',
                          borderRadius: '100px',
                          fontWeight: '700',
                          cursor: 'pointer'
                        }}
                      >
                        📤 Trigger Manual Backup Now
                      </button>

                      <button
                        onClick={() => pullFromCloud(true)}
                        style={{
                          background: 'rgba(16, 185, 129, 0.1)',
                          border: '1px solid rgba(16, 185, 129, 0.25)',
                          color: '#10b981',
                          padding: '12px',
                          borderRadius: '100px',
                          fontWeight: '700',
                          cursor: 'pointer'
                        }}
                      >
                        📥 Force Restore from Cloud
                      </button>

                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        style={{
                          background: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid rgba(239, 68, 68, 0.25)',
                          color: '#ef4444',
                          padding: '12px',
                          borderRadius: '100px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          marginTop: '20px'
                        }}
                      >
                        ⚠️ Request Account Deletion
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* 7. HELP CENTER PAGE */}
                {activePage === 'help' && (
                  <motion.div
                    key="help"
                    initial={{ opacity: 0, x: 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -15 }}
                    style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
                  >
                    {[
                      { q: 'How does geofencing auto attendance work?', a: 'TrackTaps utilizes network base triangulation and geofences in the background. It auto registers attendance checkins when you step inside defined university polygon boundaries.' },
                      { q: 'Why is my Pod.ai sync failing?', a: 'Check if you have linked the correct university credentials. Pod.ai requests may fail if your university portals require secondary authentication cards.' },
                      { q: 'How to bunk safely?', a: 'Our bunk predictor calculates threshold limits using criteria weights. If a card is glowing yellow/red, bunking will violate safety thresholds.' },
                      { q: 'Contact Founders', a: 'Reach us directly via contact portal or support emails: mustan5372@gmail.com' }
                    ].map((item, idx) => (
                      <div key={idx} style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        padding: '14px',
                        borderRadius: '12px'
                      }}>
                        <p style={{ margin: '0 0 6px 0', fontSize: '13px', fontWeight: '800', color: 'var(--primary-light)' }}>
                          Q: {item.q}
                        </p>
                        <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-dim)', lineHeight: '1.4' }}>
                          {item.a}
                        </p>
                      </div>
                    ))}
                  </motion.div>
                )}

                {/* 8. RATING PAGE */}
                {activePage === 'rate' && (
                  <motion.div
                    key="rate"
                    initial={{ opacity: 0, x: 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -15 }}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '20px' }}
                  >
                    <span>⭐</span>
                    <h4 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>Enjoying TrackTaps?</h4>
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-dim)' }}>
                      Your ratings motivate our core developers to deliver higher speed performance builds!
                    </p>

                    {ratingSuccess ? (
                      <div style={{ color: '#10b981', fontWeight: '800', fontSize: '15px' }}>
                        🎉 Thank you for your support!
                      </div>
                    ) : (
                      <>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          {Array.from({ length: 5 }).map((_, i) => (
                            <button
                              key={i}
                              onClick={() => setRatingVal(i + 1)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                fontSize: '32px',
                                cursor: 'pointer',
                                filter: ratingVal > i ? 'grayscale(0)' : 'grayscale(1)'
                              }}
                            >
                              ⭐
                            </button>
                          ))}
                        </div>
                        <button
                          onClick={handleSendRating}
                          disabled={ratingVal === 0}
                          style={{
                            width: '100%',
                            background: ratingVal === 0 ? 'rgba(255,255,255,0.05)' : 'var(--primary)',
                            color: 'white',
                            border: 'none',
                            padding: '12px',
                            borderRadius: '100px',
                            fontWeight: '700',
                            cursor: ratingVal === 0 ? 'not-allowed' : 'pointer'
                          }}
                        >
                          Submit Rating
                        </button>
                      </>
                    )}
                  </motion.div>
                )}

                {/* 9. FEEDBACK PAGE */}
                {activePage === 'feedback' && (
                  <motion.div
                    key="feedback"
                    initial={{ opacity: 0, x: 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -15 }}
                    style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
                  >
                    <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '800' }}>💬 Send Feedback</h4>
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-dim)' }}>
                      Encountered an issue or have a feature recommendation? Write to us directly!
                    </p>
                    
                    <textarea
                      rows={5}
                      placeholder="Write details..."
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '12px',
                        padding: '14px',
                        color: 'inherit',
                        fontSize: '14px',
                        resize: 'none'
                      }}
                    />

                    {feedbackSuccess && (
                      <div style={{ color: '#10b981', fontWeight: '600', fontSize: '13px' }}>
                        ✅ Feedback successfully submitted to administrator queue. Thank you!
                      </div>
                    )}

                    <button
                      onClick={handleSendFeedback}
                      disabled={!feedbackText.trim()}
                      style={{
                        background: 'var(--primary)',
                        color: 'white',
                        border: 'none',
                        padding: '12px',
                        borderRadius: '100px',
                        fontWeight: '700',
                        cursor: 'pointer'
                      }}
                    >
                      Send Message
                    </button>
                  </motion.div>
                )}

                {/* 10. ABOUT PAGE */}
                {activePage === 'about' && (
                  <motion.div
                    key="about"
                    initial={{ opacity: 0, x: 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -15 }}
                    style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'center' }}
                  >
                    <img
                      src="/logo.png"
                      alt="TrackTaps Logo"
                      style={{ width: '80px', margin: '0 auto', filter: 'drop-shadow(0 0 10px rgba(139, 92, 246, 0.3))' }}
                      onError={(e) => {
                        e.target.style.display = 'none'; // Fallback
                      }}
                    />
                    <div>
                      <h4 style={{ margin: '4px 0', fontSize: '18px', fontWeight: '850' }}>TrackTaps</h4>
                      <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-dim)' }}>Version 2.0.0 (Production Core)</p>
                    </div>

                    <div style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.05)',
                      borderRadius: '16px',
                      padding: '16px',
                      textAlign: 'left',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                      fontSize: '13px'
                    }}>
                      <div>
                        <strong>Founder:</strong> Mustansir Sanawadwala
                      </div>
                      <div>
                        <strong>CMO:</strong> Purandar Yadav
                      </div>
                      <div>
                        <strong>Marketing Lead:</strong> PG XD
                      </div>
                      <div>
                        <strong>Ecosystem:</strong> React, Firebase, Capacitor Bridge
                      </div>
                    </div>

                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                      TrackTaps was built to help university students optimize attendance bunks and sync calendars without logging into slow, legacy portals.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Draggable Custom Crop Overlay Modal */}
          {cropImageSrc && (
            <div style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(2, 6, 23, 0.92)',
              zIndex: 100002,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px'
            }}>
              <h3 style={{ color: 'white', marginBottom: '8px', fontSize: '16px', fontWeight: '800' }}>📐 Position & Crop Photo</h3>
              <p style={{ color: '#94a3b8', fontSize: '12px', margin: '0 0 20px 0', textAlign: 'center' }}>
                Drag the image to center it inside the circle, and adjust the scale slider.
              </p>

              {/* Crop Container Viewport */}
              <div
                ref={cropContainerRef}
                style={{
                  width: '240px',
                  height: '240px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  position: 'relative',
                  border: '3px solid var(--primary)',
                  boxShadow: '0 0 30px rgba(139, 92, 246, 0.4)',
                  background: '#0f172a'
                }}
              >
                <motion.img
                  ref={cropImageRef}
                  src={cropImageSrc}
                  alt="Source"
                  drag
                  dragMomentum={false}
                  style={{
                    position: 'absolute',
                    cursor: 'move',
                    touchAction: 'none',
                    transformOrigin: 'center center',
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain'
                  }}
                  animate={{
                    scale: cropScale
                  }}
                  transition={{ duration: 0.1 }}
                />
              </div>

              {/* Zoom Slider */}
              <div style={{ width: '240px', marginTop: '24px' }}>
                <label style={{ color: 'white', fontSize: '11px', display: 'block', marginBottom: '6px', fontWeight: '700' }}>
                  🔍 ZOOM SCALE
                </label>
                <input
                  type="range"
                  min="1"
                  max="4"
                  step="0.05"
                  value={cropScale}
                  onChange={(e) => setCropScale(parseFloat(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--primary)' }}
                />
              </div>

              {/* Crop Actions */}
              <div style={{ display: 'flex', gap: '12px', width: '280px', marginTop: '30px' }}>
                <button
                  onClick={() => setCropImageSrc(null)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '100px',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'white',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCropAndUpload}
                  disabled={uploading}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '100px',
                    background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)',
                    border: 'none',
                    color: 'white',
                    fontWeight: '700',
                    cursor: 'pointer',
                    boxShadow: '0 4px 15px rgba(139, 92, 246, 0.4)'
                  }}
                >
                  {uploading ? 'Processing...' : 'Apply Photo'}
                </button>
              </div>
            </div>
          )}

          {/* Confirm Dialog: Logout */}
          {showLogoutConfirm && (
            <div style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.75)',
              zIndex: 100003,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
              backdropFilter: 'blur(4px)'
            }}>
              <div style={{
                background: '#0f172a',
                border: '1px solid rgba(255,255,255,0.1)',
                padding: '24px',
                borderRadius: '20px',
                maxWidth: '340px',
                width: '100%',
                textAlign: 'center'
              }}>
                <h4 style={{ color: 'white', margin: '0 0 10px 0', fontSize: '18px', fontWeight: '800' }}>🚪 Logout?</h4>
                <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 20px 0' }}>
                  Are you sure you want to end your active TrackTaps session?
                </p>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => setShowLogoutConfirm(false)}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '8px',
                      background: 'rgba(255,255,255,0.06)',
                      border: 'none',
                      color: 'white',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      setShowLogoutConfirm(false);
                      setAccountDrawerOpen(false);
                      await logout();
                      window.location.reload();
                    }}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '8px',
                      background: '#ef4444',
                      border: 'none',
                      color: 'white',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Confirm Dialog: Delete Account */}
          {showDeleteConfirm && (
            <div style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.85)',
              zIndex: 100003,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
              backdropFilter: 'blur(8px)'
            }}>
              <div style={{
                background: '#0f172a',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                padding: '24px',
                borderRadius: '20px',
                maxWidth: '340px',
                width: '100%',
                textAlign: 'center',
                boxShadow: '0 0 24px rgba(239, 68, 68, 0.2)'
              }}>
                <h4 style={{ color: '#ef4444', margin: '0 0 10px 0', fontSize: '18px', fontWeight: '800' }}>⚠️ Delete Account?</h4>
                <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 20px 0', lineHeight: '1.4' }}>
                  This will permanently wipe your cloud database collections, attendance metrics, and billing indicators. This action is irreversible.
                </p>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '8px',
                      background: 'rgba(255,255,255,0.06)',
                      border: 'none',
                      color: 'white',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '8px',
                      background: '#ef4444',
                      border: 'none',
                      color: 'white',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    Delete Forever
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </AnimatePresence>
  );
}

export default AccountDrawer;
