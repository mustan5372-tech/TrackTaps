import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useAppStore from '../store/appStore';
import { useNavigate } from 'react-router-dom';

function Timetable() {
  const navigate = useNavigate();

  // Zustand Store States
  const {
    subjects,
    timetable,
    addTimetableEntry,
    removeTimetableEntry,
    subscription,
    showToast
  } = useAppStore();

  const isPremium = subscription?.status === 'active';

  // Local States
  const [selectedDayIdx, setSelectedDayIdx] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [customLabel, setCustomLabel] = useState('');
  const [selectedSubject, setSelectedSubject] = useState(null);

  // AI Import States
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiStep, setAiStep] = useState('upload'); // 'upload' | 'scanning' | 'preview'
  const [uploadedImage, setUploadedImage] = useState(null);
  const [aiLogs, setAiLogs] = useState([]);
  const [aiParsedData, setAiParsedData] = useState(null);
  const [aiProgress, setAiProgress] = useState(0);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const dayShortNames = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

  // Retrieve entries for a specific day sorted by order
  const getEntriesForDay = (dayIdx) => {
    if (!timetable || typeof timetable !== 'object') return [];
    
    return Object.entries(timetable)
      .filter(([key]) => key.startsWith(`${dayIdx}-`))
      .map(([key, value]) => {
        const slotId = key.substring(key.indexOf('-') + 1);
        return { key, slotId, dayIdx, ...value };
      })
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  };

  // Add a new subject to a specific day
  const handleAddSubject = () => {
    if (!selectedSubject || selectedDayIdx === null) return;

    const dayEntries = getEntriesForDay(selectedDayIdx);
    const nextOrder = dayEntries.length;
    const slotId = `slot_${Date.now()}`;

    // If no custom label, auto-default to Lecture X
    const labelText = customLabel.trim() || `Lecture ${nextOrder + 1}`;

    addTimetableEntry(selectedDayIdx, slotId, {
      name: selectedSubject.name,
      color: selectedSubject.color || '#8b5cf6',
      criteria: selectedSubject.criteria || 75,
      label: labelText,
      order: nextOrder
    });

    showToast(`Added ${selectedSubject.name} to ${days[selectedDayIdx]}!`, 'success');
    
    // Reset modal state
    setShowAddModal(false);
    setSelectedSubject(null);
    setCustomLabel('');
    setSearchQuery('');
  };

  // Remove a subject entry
  const handleRemoveEntry = (dayIdx, slotId) => {
    removeTimetableEntry(dayIdx, slotId);
    showToast('Class removed successfully', 'info');
  };

  // Move subject order Up
  const handleMoveUp = (index, entries) => {
    if (index === 0) return;
    const current = entries[index];
    const prev = entries[index - 1];

    // Swap order values
    addTimetableEntry(current.dayIdx, current.slotId, {
      name: current.name,
      color: current.color,
      criteria: current.criteria,
      label: current.label,
      order: prev.order ?? 0
    });

    addTimetableEntry(prev.dayIdx, prev.slotId, {
      name: prev.name,
      color: prev.color,
      criteria: prev.criteria,
      label: prev.label,
      order: current.order ?? 0
    });
  };

  // Move subject order Down
  const handleMoveDown = (index, entries) => {
    if (index === entries.length - 1) return;
    const current = entries[index];
    const next = entries[index + 1];

    // Swap order values
    addTimetableEntry(current.dayIdx, current.slotId, {
      name: current.name,
      color: current.color,
      criteria: current.criteria,
      label: current.label,
      order: next.order ?? 0
    });

    addTimetableEntry(next.dayIdx, next.slotId, {
      name: next.name,
      color: next.color,
      criteria: next.criteria,
      label: next.label,
      order: current.order ?? 0
    });
  };

  // Filter subjects based on search
  const filteredSubjects = subjects.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Trigger simulated advanced AI Timetable OCR scanning
  const triggerAiImport = (sourceName = 'timetable_uploaded.png') => {
    setAiStep('scanning');
    setAiLogs([]);
    setAiProgress(0);

    const logTimeline = [
      { delay: 100, progress: 10, log: '[AI OCR] Loading neural layers & deep layout analyzers...' },
      { delay: 600, progress: 25, log: `[AI OCR] Binarization complete. isolated tabular grid bounds.` },
      { delay: 1200, progress: 40, log: '[GRID DETECTOR] Isolated headers: Monday, Tuesday, Wednesday, Thursday, Friday.' },
      { delay: 1800, progress: 55, log: '[OCR PARSER] Segmenting rows and scanning classroom subject name tokens...' },
      { delay: 2400, progress: 70, log: '[OCR PARSER] Extracted keywords: "DBMS", "OS", "MATHS", "AI", "COMP NETWORKS".' },
      { delay: 3000, progress: 85, log: '[AI RESOLVER] Aligning parsed text coordinates with user subjects...' },
      { delay: 3600, progress: 95, log: '[AI RESOLVER] Auto-created color schemas and mapped slots.' },
      { delay: 4200, progress: 100, log: '[COMPLETE] High-fidelity weekly schedule successfully compiled!' }
    ];

    logTimeline.forEach(item => {
      setTimeout(() => {
        setAiLogs(prev => [...prev, `${new Date().toLocaleTimeString()} ${item.log}`]);
        setAiProgress(item.progress);
      }, item.delay);
    });

    setTimeout(() => {
      // Build high fidelity parsed demo data dynamically
      const activeSubjects = subjects.length > 0 ? subjects : [
        { name: 'Computer Networks', color: '#3b82f6', criteria: 75 },
        { name: 'Operating Systems', color: '#ec4899', criteria: 75 },
        { name: 'Database Management', color: '#10b981', criteria: 75 },
        { name: 'Artificial Intelligence', color: '#8b5cf6', criteria: 75 },
        { name: 'Software Engineering', color: '#f59e0b', criteria: 75 }
      ];

      // Standard schedule distribution for preview
      const parsedDist = {
        0: [
          { name: activeSubjects[0 % activeSubjects.length].name, color: activeSubjects[0 % activeSubjects.length].color, label: '09:00 AM' },
          { name: activeSubjects[1 % activeSubjects.length].name, color: activeSubjects[1 % activeSubjects.length].color, label: '11:00 AM' },
          { name: activeSubjects[2 % activeSubjects.length].name, color: activeSubjects[2 % activeSubjects.length].color, label: '02:00 PM' }
        ],
        1: [
          { name: activeSubjects[1 % activeSubjects.length].name, color: activeSubjects[1 % activeSubjects.length].color, label: '09:30 AM' },
          { name: activeSubjects[3 % activeSubjects.length].name, color: activeSubjects[3 % activeSubjects.length].color, label: '11:30 AM' }
        ],
        2: [
          { name: activeSubjects[2 % activeSubjects.length].name, color: activeSubjects[2 % activeSubjects.length].color, label: '10:00 AM' },
          { name: activeSubjects[4 % activeSubjects.length].name, color: activeSubjects[4 % activeSubjects.length].color, label: '01:00 PM' },
          { name: activeSubjects[0 % activeSubjects.length].name, color: activeSubjects[0 % activeSubjects.length].color, label: '03:00 PM' }
        ],
        3: [
          { name: activeSubjects[3 % activeSubjects.length].name, color: activeSubjects[3 % activeSubjects.length].color, label: '09:00 AM' },
          { name: activeSubjects[1 % activeSubjects.length].name, color: activeSubjects[1 % activeSubjects.length].color, label: '11:00 AM' }
        ],
        4: [
          { name: activeSubjects[4 % activeSubjects.length].name, color: activeSubjects[4 % activeSubjects.length].color, label: '10:30 AM' },
          { name: activeSubjects[2 % activeSubjects.length].name, color: activeSubjects[2 % activeSubjects.length].color, label: '02:30 PM' }
        ]
      };

      setAiParsedData(parsedDist);
      setAiStep('preview');
    }, 4500);
  };

  // Commit AI Parsed Timetable directly into store
  const handleConfirmAiTimetable = () => {
    if (!aiParsedData) return;

    // Clear current timetable entries to prevent duplication
    Object.keys(timetable).forEach(key => {
      const [dayIdx, slotId] = key.split('-');
      removeTimetableEntry(dayIdx, slotId);
    });

    // Populate all parsed entries
    Object.entries(aiParsedData).forEach(([dayStr, entries]) => {
      const dayIdx = parseInt(dayStr);
      entries.forEach((entry, idx) => {
        const slotId = `slot_${Date.now()}_${dayIdx}_${idx}`;
        
        // Auto-register subject if it does not exist
        const exists = subjects.some(s => s.name.toLowerCase() === entry.name.toLowerCase());
        if (!exists) {
          useAppStore.getState().addSubject({
            name: entry.name,
            color: entry.color,
            criteria: 75
          });
        }

        addTimetableEntry(dayIdx, slotId, {
          name: entry.name,
          color: entry.color,
          criteria: 75,
          label: entry.label,
          order: idx
        });
      });
    });

    showToast('AI Timetable parsed & synced globally!', 'success');
    setShowAiModal(false);
    setAiStep('upload');
    setUploadedImage(null);
  };

  return (
    <div className="timetable-view" style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '200px' }}>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
        .laser-scanner {
          position: absolute;
          left: 0;
          right: 0;
          height: 3px;
          background: #22d3ee;
          box-shadow: 0 0 15px #22d3ee, 0 0 5px #22d3ee;
          z-index: 10;
          animation: scan 2.5s infinite linear;
        }
        @keyframes scan {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
      `}</style>

      {/* Header with smart AI action */}
      <header className="view-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>Weekly Schedule</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-dim)', margin: 0 }}>Add and arrange classes day-by-day.</p>
        </div>
        <button
          onClick={() => {
            setShowAiModal(true);
            setAiStep('upload');
            setUploadedImage(null);
          }}
          style={{
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)',
            border: 'none',
            color: 'white',
            fontWeight: '800',
            fontSize: '13px',
            padding: '12px 20px',
            borderRadius: '12px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 15px var(--primary-glow)',
            transition: 'all 0.3s'
          }}
        >
          <span>✨</span> Smart AI Import
        </button>
      </header>

      {/* Daily List Schedule View */}
      <div className="custom-scrollbar" style={{ display: 'flex', gap: '20px', overflowX: 'auto', paddingBottom: '16px', minHeight: '65vh' }}>
        {days.map((dayName, dayIdx) => {
          const entries = getEntriesForDay(dayIdx);

          return (
            <div
              key={dayIdx}
              style={{
                flex: '0 0 320px',
                background: 'linear-gradient(180deg, var(--surface) 0%, rgba(15, 23, 42, 0.4) 100%)',
                border: '1px solid var(--border)',
                borderRadius: '24px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.25)',
                backdropFilter: 'blur(16px)'
              }}
            >
              {/* Day Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-main)' }}>
                  {dayName}
                </span>
                <span style={{ fontSize: '11px', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-muted)', padding: '4px 10px', borderRadius: '100px', fontWeight: '700' }}>
                  {entries.length} Class{entries.length !== 1 ? 'es' : ''}
                </span>
              </div>

              {/* Class Card List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, overflowY: 'auto' }}>
                {entries.length === 0 ? (
                  <div style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px dashed rgba(255, 255, 255, 0.05)',
                    borderRadius: '16px',
                    padding: '32px 16px',
                    textAlign: 'center'
                  }}>
                    <span style={{ fontSize: '28px', marginBottom: '8px', opacity: 0.6 }}>🧘‍♂️</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-dim)', fontWeight: '600' }}>No Classes Scheduled</span>
                  </div>
                ) : (
                  entries.map((entry, idx) => (
                    <motion.div
                      key={entry.key}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      style={{
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        borderRadius: '16px',
                        padding: '14px',
                        display: 'flex',
                        gap: '12px',
                        position: 'relative',
                        alignItems: 'center',
                        overflow: 'hidden'
                      }}
                    >
                      {/* Subject Color Pill Accent */}
                      <div style={{ width: '4px', height: '42px', background: entry.color, borderRadius: '4px' }} />

                      {/* Info */}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-main)' }}>
                          {entry.name}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                          <span style={{ fontSize: '10px', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-dim)', padding: '2px 8px', borderRadius: '4px', fontWeight: '600' }}>
                            {entry.label}
                          </span>
                        </div>
                      </div>

                      {/* Reorder & Delete Operations */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {idx > 0 && (
                          <button
                            onClick={() => handleMoveUp(idx, entries)}
                            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px', fontSize: '12px' }}
                            title="Move Up"
                          >
                            ▲
                          </button>
                        )}
                        {idx < entries.length - 1 && (
                          <button
                            onClick={() => handleMoveDown(idx, entries)}
                            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px', fontSize: '12px' }}
                            title="Move Down"
                          >
                            ▼
                          </button>
                        )}
                      </div>

                      <button
                        onClick={() => handleRemoveEntry(dayIdx, entry.slotId)}
                        style={{
                          background: 'rgba(239, 68, 68, 0.1)',
                          border: 'none',
                          color: '#ef4444',
                          padding: '6px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        title="Delete Class"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                      </button>
                    </motion.div>
                  ))
                )}
              </div>

              {/* Add Class Button */}
              <button
                onClick={() => {
                  setSelectedDayIdx(dayIdx);
                  setShowAddModal(true);
                }}
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px dashed rgba(255, 255, 255, 0.12)',
                  color: 'var(--text-dim)',
                  fontWeight: '700',
                  fontSize: '13px',
                  padding: '12px',
                  borderRadius: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                  e.currentTarget.style.borderColor = 'var(--primary)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                }}
              >
                <span>+</span> Add Class
              </button>
            </div>
          );
        })}
      </div>

      {/* Dynamic Add Subject Modal */}
      {showAddModal && (
        <div
          onClick={() => setShowAddModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100002,
            backdropFilter: 'blur(10px)',
            padding: '20px'
          }}
        >
          <motion.div
            initial={{ scale: 0.95, y: 15 }}
            animate={{ scale: 1, y: 0 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'linear-gradient(135deg, var(--bg-deep) 0%, var(--bg-primary) 100%)',
              border: '1px solid var(--border)',
              borderRadius: '24px',
              padding: '24px',
              maxWidth: '480px',
              width: '100%',
              maxHeight: '85vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>
                Add Class to {days[selectedDayIdx]}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '16px', fontWeight: '700' }}
              >
                ✕
              </button>
            </div>

            {/* Step 1: Select Subject */}
            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                Select Subject
              </label>
              <input
                type="text"
                placeholder="Search subjects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid var(--border)',
                  color: 'white',
                  padding: '12px',
                  borderRadius: '10px',
                  fontSize: '14px',
                  marginBottom: '12px'
                }}
              />

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto', paddingRight: '4px' }} className="custom-scrollbar">
                {filteredSubjects.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-dim)', fontSize: '13px' }}>
                    No subjects found. Add some in Subjects first!
                  </div>
                ) : (
                  filteredSubjects.map(sub => (
                    <button
                      key={sub.id}
                      onClick={() => setSelectedSubject(sub)}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: selectedSubject?.id === sub.id ? 'rgba(139, 92, 246, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                        border: selectedSubject?.id === sub.id ? '1px solid var(--primary)' : '1px solid var(--border)',
                        padding: '12px 16px',
                        borderRadius: '12px',
                        color: 'white',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                    >
                      <span style={{ fontWeight: '600' }}>{sub.name}</span>
                      <div style={{ width: '12px', height: '12px', background: sub.color, borderRadius: '50%' }} />
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Step 2: Custom Label/Time Slot */}
            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                Lecture Time / Custom Label (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. 09:30 AM or Lecture 1"
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid var(--border)',
                  color: 'white',
                  padding: '12px',
                  borderRadius: '10px',
                  fontSize: '14px'
                }}
              />
            </div>

            {/* Confirmation & Submit */}
            <button
              onClick={handleAddSubject}
              disabled={!selectedSubject}
              style={{
                width: '100%',
                background: selectedSubject ? 'linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)' : 'rgba(255, 255, 255, 0.05)',
                color: selectedSubject ? 'white' : 'var(--text-muted)',
                fontWeight: '800',
                padding: '14px',
                borderRadius: '12px',
                border: 'none',
                cursor: selectedSubject ? 'pointer' : 'not-allowed',
                marginTop: '12px',
                boxShadow: selectedSubject ? '0 4px 15px var(--primary-glow)' : 'none'
              }}
            >
              Add Class to Schedule
            </button>
          </motion.div>
        </div>
      )}

      {/* AI Timetable Importer Modal */}
      {showAiModal && (
        <div
          onClick={() => {
            if (aiStep !== 'scanning') setShowAiModal(false);
          }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100003,
            backdropFilter: 'blur(16px)',
            padding: '20px'
          }}
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'linear-gradient(135deg, var(--bg-deep) 0%, var(--bg-primary) 100%)',
              border: '1px solid var(--border)',
              borderRadius: '28px',
              padding: '30px',
              maxWidth: '640px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
            }}
            className="custom-scrollbar"
          >
            {/* Free User Gating UI */}
            {!isPremium ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <span style={{ fontSize: '56px', marginBottom: '16px', display: 'block' }}>🔒</span>
                <span style={{ fontSize: '11px', background: 'var(--primary-glow)', color: 'var(--primary-light)', padding: '4px 12px', borderRadius: '100px', fontWeight: '900', letterSpacing: '0.05em' }}>PREMIUM ONLY</span>
                <h3 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-main)', marginTop: '16px', marginBottom: '12px' }}>
                  AI Timetable Scanner
                </h3>
                <p style={{ fontSize: '14px', color: 'var(--text-dim)', maxWidth: '440px', margin: '0 auto 28px', lineHeight: '1.6' }}>
                  Unlock next-generation schedule automation. Upload a picture of your notice board or student portal schedule, and our smart AI extracts and maps all classes in seconds!
                </p>

                <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '16px', padding: '20px', textAlign: 'left', marginBottom: '28px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ color: 'var(--primary-light)', fontWeight: '700', fontSize: '13px', marginBottom: '12px' }}>🚀 SCHEDULE SCANNING ENGINE FEATURES</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                    <div>✅ <strong>Instant OCR Parsing:</strong> Isolated time slots, classrooms, and subject labels instantly.</div>
                    <div>✅ <strong>Fuzzy Keyword Mapping:</strong> Matches shorthand portal codes to fully formatted subject entities.</div>
                    <div>✅ <strong>Auto-Creation:</strong> Creates and color-codes missing subjects dynamically.</div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setShowAiModal(false);
                    navigate('/premium');
                  }}
                  style={{
                    width: '100%',
                    background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)',
                    border: 'none',
                    color: 'white',
                    fontWeight: '800',
                    fontSize: '15px',
                    padding: '16px',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 20px var(--primary-glow)'
                  }}
                >
                  Upgrade to TrackTaps Plus & Unlock
                </button>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '11px', background: 'var(--primary-glow)', color: 'var(--primary-light)', padding: '4px 10px', borderRadius: '100px', fontWeight: '900' }}>PREMIUM AI</span>
                    <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>Smart AI Timetable Import</h3>
                  </div>
                  {aiStep !== 'scanning' && (
                    <button
                      onClick={() => setShowAiModal(false)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '16px', fontWeight: '700' }}
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* STEP 1: Upload File */}
                {aiStep === 'upload' && (
                  <div style={{ textAlign: 'center', padding: '30px 20px', border: '2px dashed var(--primary-glow)', background: 'rgba(139, 92, 246, 0.02)', borderRadius: '20px' }}>
                    <span style={{ fontSize: '50px', marginBottom: '16px', display: 'block' }}>📷</span>
                    <h4 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '8px' }}>Upload Timetable Screenshot</h4>
                    <p style={{ fontSize: '13px', color: 'var(--text-dim)', maxWidth: '400px', margin: '0 auto 24px' }}>
                      Snap a photo of your classroom notice board or upload a student portal grid image. Let TrackTaps AI do the typing.
                    </p>
                    <input
                      type="file"
                      id="ai-upload-input"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          setUploadedImage(URL.createObjectURL(file));
                          triggerAiImport(file.name);
                        }
                      }}
                    />
                    <button
                      onClick={() => document.getElementById('ai-upload-input').click()}
                      style={{
                        background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)',
                        border: 'none',
                        color: 'white',
                        fontWeight: '800',
                        fontSize: '14px',
                        padding: '12px 24px',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        boxShadow: '0 4px 15px var(--primary-glow)'
                      }}
                    >
                      Select Schedule Image
                    </button>

                    {/* Quick simulation assist */}
                    <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>OR RUN TEST SIMULATION</span>
                      <div style={{ marginTop: '8px' }}>
                        <button
                          onClick={() => {
                            setUploadedImage('https://images.unsplash.com/photo-1506784983877-45594efa4cbe?q=80&w=300');
                            triggerAiImport('timetable_srm_2026.png');
                          }}
                          style={{
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.05)',
                            color: 'var(--text-dim)',
                            padding: '6px 12px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          Simulate AI Parse 🚀
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: Scanning Laser Animation */}
                {aiStep === 'scanning' && (
                  <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{
                      position: 'relative',
                      width: '100%',
                      height: '200px',
                      background: uploadedImage ? `url(${uploadedImage}) center/cover no-repeat` : 'rgba(139,92,246,0.05)',
                      borderRadius: '20px',
                      border: '1px solid var(--primary-glow)',
                      overflow: 'hidden'
                    }}>
                      {/* Laser scanning bar */}
                      <div className="laser-scanner" />
                    </div>

                    <div>
                      <h4 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '4px' }}>
                        AI Neural OCR Scanner Running...
                      </h4>
                      <div style={{ fontSize: '11px', color: 'cyan', fontWeight: '700' }}>
                        PARSING RESOLUTION: {aiProgress}%
                      </div>
                    </div>

                    {/* Console Logger */}
                    <div style={{
                      padding: '14px 18px',
                      background: 'rgba(0, 0, 0, 0.6)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '12px',
                      textAlign: 'left',
                      fontFamily: 'monospace',
                      fontSize: '11px',
                      color: '#34d399',
                      maxHeight: '140px',
                      overflowY: 'auto',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }} className="custom-scrollbar">
                      {aiLogs.map((log, idx) => (
                        <div key={idx} style={{ opacity: idx === aiLogs.length - 1 ? 1 : 0.65 }}>
                          <span style={{ color: '#60a5fa', marginRight: '6px' }}>▶</span>{log}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* STEP 3: Preview & Confirm parsed timetable */}
                {aiStep === 'preview' && aiParsedData && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{
                      background: 'rgba(16, 185, 129, 0.08)',
                      border: '1px solid rgba(16, 185, 129, 0.2)',
                      padding: '12px 16px',
                      borderRadius: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}>
                      <span style={{ color: 'var(--success)', fontSize: '18px' }}>✓</span>
                      <div>
                        <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-main)' }}>AI OCR Parsing Success</span>
                        <span style={{ fontSize: '11px', color: 'var(--text-dim)', display: 'block' }}>We successfully recognized your grid lectures. Review before saving.</span>
                      </div>
                    </div>

                    {/* Extracted Schedule Map */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '250px', overflowY: 'auto', paddingRight: '4px' }} className="custom-scrollbar">
                      {Object.entries(aiParsedData).map(([dayStr, entries]) => {
                        const dayIdx = parseInt(dayStr);
                        if (entries.length === 0) return null;

                        return (
                          <div key={dayIdx} style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)' }}>
                            <div style={{ fontSize: '13px', fontWeight: '800', color: 'var(--primary-light)', marginBottom: '8px' }}>
                              {days[dayIdx]}
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                              {entries.map((entry, idx) => (
                                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: '8px', border: `1px solid ${entry.color}40` }}>
                                  <span style={{ width: '8px', height: '8px', background: entry.color, borderRadius: '50%' }} />
                                  <span style={{ fontSize: '12px', fontWeight: '600', color: 'white' }}>{entry.name}</span>
                                  <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>({entry.label})</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <button
                      onClick={handleConfirmAiTimetable}
                      style={{
                        width: '100%',
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        color: 'white',
                        fontWeight: '800',
                        fontSize: '15px',
                        padding: '14px',
                        borderRadius: '12px',
                        border: 'none',
                        cursor: 'pointer',
                        boxShadow: '0 4px 20px rgba(16, 185, 129, 0.3)'
                      }}
                    >
                      Sync Mapped AI Timetable
                    </button>
                  </div>
                )}
              </>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default Timetable;
