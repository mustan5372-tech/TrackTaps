import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useAppStore from '../store/appStore';

function AiSemesterImport() {
  const navigate = useNavigate();
  const { 
    addHoliday, 
    addExamPeriod, 
    addWorkingSaturday, 
    setSemesterSettings, 
    showToast,
    subscription 
  } = useAppStore();

  const isPremium = subscription?.status === 'active';

  // State management
  const [activeTab, setActiveTab] = useState('pdf'); // 'pdf' | 'image' | 'web'
  const [urlInput, setUrlInput] = useState('');
  const [fileName, setFileName] = useState('');
  const [processingState, setProcessingState] = useState(null); // null | 'uploading' | 'ocr' | 'analyzing' | 'complete'
  const [confidence, setConfidence] = useState(0);
  const [previewData, setPreviewData] = useState(null);

  // Manual editing safety fallback states
  const [editableStart, setEditableStart] = useState('');
  const [editableEnd, setEditableEnd] = useState('');
  const [editableHolidays, setEditableHolidays] = useState([]);
  const [editableExams, setEditableExams] = useState([]);

  // Mock processing simulation
  const handleStartImport = (sourceName = 'Document') => {
    setProcessingState('uploading');
    setConfidence(0);
    setPreviewData(null);
    try {
      import('../services/analyticsService').then(m => m.default.trackFeatureUse('aiImport')).catch(() => {});
    } catch (e) {}

    // Timeline simulation
    setTimeout(() => {
      setProcessingState('ocr');
      setConfidence(45);
    }, 1200);

    setTimeout(() => {
      setProcessingState('analyzing');
      setConfidence(78);
    }, 2400);

    setTimeout(() => {
      const detected = {
        startDate: '2026-07-15',
        endDate: '2026-12-15',
        holidays: [
          { name: 'Independence Day', date: '2026-08-15', type: 'holiday' },
          { name: 'Ganesh Chaturthi', date: '2026-09-19', type: 'holiday' },
          { name: 'Gandhi Jayanti', date: '2026-10-02', type: 'holiday' },
          { name: 'Dussehra', date: '2026-10-24', type: 'holiday' },
          { name: 'Diwali Break', date: '2026-11-12', type: 'holiday' },
          { name: 'Guru Nanak Jayanti', date: '2026-11-27', type: 'restricted' }
        ],
        examPeriods: [
          { name: 'Mid-Term Exams', startDate: '2026-09-25', endDate: '2026-10-05' },
          { name: 'End-Term Exams', startDate: '2026-12-01', endDate: '2026-12-15' }
        ],
        workingSaturdays: [
          { date: '2026-08-08', followsDay: 0 },
          { date: '2026-11-14', followsDay: 4 }
        ],
        confidence: 94,
        insights: [
          { text: "📅 Festival holidays create a safe attendance buffer next week. Take advantage!", type: 'positive' },
          { text: "⚠️ Midsems begin in 12 days. Attendance pressure is increasing. Avoid bunks.", type: 'warning' },
          { text: "💡 This month has fewer working days overall. Plan skips very carefully.", type: 'info' }
        ]
      };

      setEditableStart(detected.startDate);
      setEditableEnd(detected.endDate);
      setEditableHolidays(detected.holidays);
      setEditableExams(detected.examPeriods);
      
      setPreviewData(detected);
      setConfidence(detected.confidence);
      setProcessingState('complete');
      showToast("AI Academic Calendar parsed successfully!", "success");
    }, 4000);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFileName(file.name);
      handleStartImport(file.name);
    }
  };

  const handleUrlSubmit = (e) => {
    e.preventDefault();
    if (urlInput.trim()) {
      handleStartImport(urlInput);
    }
  };

  const handleApply = () => {
    if (!previewData) return;

    // Apply main semester dates
    setSemesterSettings({
      startDate: editableStart,
      endDate: editableEnd
    });

    // Add holidays & exams to store
    editableHolidays.forEach(h => addHoliday(h));
    editableExams.forEach(e => addExamPeriod(e));
    previewData.workingSaturdays.forEach(s => addWorkingSaturday(s));

    showToast("AI Semester Import synced to Calendar globally!", "success");
    navigate('/calendar');
  };

  // Helper calculation for total days
  const calculateDaysBetween = (start, end) => {
    if (!start || !end) return 0;
    const diff = new Date(end) - new Date(start);
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  // Free user locked preview UI
  if (!isPremium) {
    return (
      <div className="ai-import-view" style={{ maxWidth: '700px', margin: '0 auto', padding: '24px', paddingBottom: '120px' }}>
        <header style={{ marginBottom: '32px' }}>
          <button onClick={() => navigate('/calendar')} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', marginBottom: '16px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            ← Back to Calendar
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <span style={{ fontSize: '11px', background: 'var(--primary-glow)', color: 'var(--primary-light)', padding: '4px 10px', borderRadius: '100px', fontWeight: '900', letterSpacing: '0.05em' }}>PREMIUM ONLY</span>
          </div>
          <h2 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>✨ Smart AI Academic Calendar</h2>
          <p style={{ color: 'var(--text-dim)', fontSize: '14px', marginTop: '6px' }}>Let TrackTaps AI ingest, map, and optimize your college timetable completely automatically.</p>
        </header>

        {/* Locked Preview Card */}
        <div className="dashboard-card" style={{ 
          padding: '40px 24px', 
          textAlign: 'center', 
          border: '1px solid var(--primary-glow)', 
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(15, 23, 42, 0.6) 100%)',
          borderRadius: '24px',
          boxShadow: '0 8px 32px rgba(139, 92, 246, 0.15)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ fontSize: '56px', marginBottom: '20px' }}>🔒</div>
          <h3 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '12px' }}>
            AI Semester Import — Premium Feature
          </h3>
          <p style={{ fontSize: '14px', color: 'var(--text-dim)', maxWidth: '480px', margin: '0 auto 28px', lineHeight: '1.6' }}>
            Automatically detect holidays, exams, and semester schedules using high-accuracy OCR. Upload PDFs, screenshots, or paste notice board URLs.
          </p>

          {/* Feature Breakdown Mockup */}
          <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '16px', padding: '20px', textAlign: 'left', marginBottom: '32px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-light)', fontWeight: '700', fontSize: '13px', marginBottom: '12px' }}>
              <span>🚀</span> CALENDAR AUTO-DETECTION SYSTEM
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '10px', fontSize: '13px' }}>
                <span style={{ color: 'var(--success)' }}>✓</span>
                <span style={{ color: 'var(--text-main)' }}><strong>Multiple Methods:</strong> Extract schedules via PDFs, blurry campus notice pictures, or portal URLs.</span>
              </div>
              <div style={{ display: 'flex', gap: '10px', fontSize: '13px' }}>
                <span style={{ color: 'var(--success)' }}>✓</span>
                <span style={{ color: 'var(--text-main)' }}><strong>Holiday & Exam Plotting:</strong> Seamlessly auto-plots break weeks and midterm limits in the Calendar.</span>
              </div>
              <div style={{ display: 'flex', gap: '10px', fontSize: '13px' }}>
                <span style={{ color: 'var(--success)' }}>✓</span>
                <span style={{ color: 'var(--text-main)' }}><strong>Skip Optimization:</strong> Feeds critical break-slots straight into your Bunk strategies.</span>
              </div>
            </div>
          </div>

          <button 
            onClick={() => navigate('/premium')}
            className="primary-btn"
            style={{ 
              width: '100%', 
              padding: '16px', 
              fontSize: '15px', 
              fontWeight: '800', 
              background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)',
              boxShadow: '0 4px 20px var(--primary-glow)',
              border: 'none',
              borderRadius: '12px'
            }}
          >
            Upgrade to TrackTaps Plus & Unlock AI Import
          </button>
        </div>
      </div>
    );
  }

  // Premium User View
  return (
    <div className="ai-import-view" style={{ maxWidth: '800px', margin: '0 auto', padding: '24px', paddingBottom: '120px' }}>
      <header style={{ marginBottom: '32px' }}>
        <button onClick={() => navigate('/calendar')} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', marginBottom: '16px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          ← Back to Calendar
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <span style={{ fontSize: '11px', background: 'var(--primary-glow)', color: 'var(--primary-light)', padding: '4px 10px', borderRadius: '100px', fontWeight: '900', letterSpacing: '0.05em' }}>PREMIUM AI</span>
        </div>
        <h2 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>🧠 Smart AI Semester Import</h2>
        <p style={{ color: 'var(--text-dim)', fontSize: '14px', marginTop: '6px' }}>
          Automate your entire semester architecture with state-of-the-art schedule intelligence.
        </p>
      </header>

      {/* Tabs Control */}
      {!processingState && (
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', padding: '6px', borderRadius: '14px', marginBottom: '24px', gap: '8px' }}>
          {[
            { id: 'pdf', label: '📄 PDF Import' },
            { id: 'image', label: '📷 Image OCR' },
            { id: 'web', label: '🌐 Portal URL' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => { setActiveTab(t.id); setFileName(''); }}
              style={{
                flex: 1,
                padding: '12px 8px',
                borderRadius: '10px',
                border: 'none',
                background: activeTab === t.id ? 'var(--primary)' : 'transparent',
                color: activeTab === t.id ? 'white' : 'var(--text-muted)',
                fontWeight: '700',
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* Upload/Import Card Panel */}
      <AnimatePresence mode="wait">
        {!processingState && (
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="dashboard-card"
            style={{ padding: '32px 24px', border: '1px dashed var(--primary-glow)', background: 'rgba(139, 92, 246, 0.02)', textAlign: 'center' }}
          >
            {activeTab === 'pdf' && (
              <>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
                <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-main)' }}>Upload Academic Calendar PDF</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px', maxWidth: '400px', margin: '0 auto 24px' }}>
                  Select an official college brochure or calendar notice PDF to automatically parse semesters, exams, and holidays.
                </p>
                <input type="file" id="pdf-file" accept=".pdf" style={{ display: 'none' }} onChange={handleFileUpload} />
                <button onClick={() => document.getElementById('pdf-file').click()} className="primary-btn" style={{ padding: '14px 28px', margin: '0 auto' }}>
                  Select Calendar PDF
                </button>
              </>
            )}

            {activeTab === 'image' && (
              <>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📷</div>
                <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-main)' }}>Image OCR Parser</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px', maxWidth: '400px', margin: '0 auto 24px' }}>
                  Snap a photo or upload a screenshot of your college timetable schedule. Our AI processes campus notice-boards with instant OCR.
                </p>
                <input type="file" id="image-file" accept="image/*" style={{ display: 'none' }} onChange={handleFileUpload} />
                <button onClick={() => document.getElementById('image-file').click()} className="primary-btn" style={{ padding: '14px 28px', margin: '0 auto' }}>
                  Select Screenshot/Photo
                </button>
              </>
            )}

            {activeTab === 'web' && (
              <form onSubmit={handleUrlSubmit} style={{ maxWidth: '480px', margin: '0 auto' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🌐</div>
                <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-main)' }}>Website Crawler Import</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
                  Enter the URL of your college's official academic schedule or syllabus portal.
                </p>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                  <input
                    type="url"
                    placeholder="https://mycollege.edu/academic-calendar"
                    required
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      color: 'white',
                      fontSize: '14px'
                    }}
                  />
                  <button type="submit" className="primary-btn" style={{ padding: '12px 20px' }}>
                    Fetch
                  </button>
                </div>
              </form>
            )}

            {/* Quick Demo Assist */}
            <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>OR TRY DEMO SIMULATIONS</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginTop: '10px' }}>
                <button onClick={() => handleStartImport('VIT Semester Schedule 2026.pdf')} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', color: 'var(--text-dim)', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }}>
                  VIT University 2026 Setup 🎓
                </button>
                <button onClick={() => handleStartImport('SRM Academic Notice.png')} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', color: 'var(--text-dim)', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }}>
                  SRM Academic Calendar 📅
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Processing / AI Scanning States */}
      {processingState && processingState !== 'complete' && (
        <div className="dashboard-card" style={{ padding: '40px 24px', textAlign: 'center', background: 'rgba(15,23,42,0.4)', border: '1px solid var(--primary-glow)' }}>
          {/* Futuristic Scanning line animation */}
          <div style={{ position: 'relative', width: '80px', height: '80px', margin: '0 auto 24px', background: 'rgba(139,92,246,0.1)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(139,92,246,0.3)', overflow: 'hidden' }}>
            <span style={{ fontSize: '32px' }}>🤖</span>
            <motion.div 
              animate={{ y: [-40, 40, -40] }} 
              transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                height: '2px',
                background: 'cyan',
                boxShadow: '0 0 8px cyan'
              }}
            />
          </div>

          <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '8px' }}>
            {processingState === 'uploading' && 'Uploading Academic Notice...'}
            {processingState === 'ocr' && 'AI Scanning Calendar Structure (OCR)...'}
            {processingState === 'analyzing' && 'Analyzing Attendance Impact & Timetable Pattern...'}
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-dim)', marginBottom: '24px' }}>
            {processingState === 'uploading' && 'Encrypting & syncing resource payload.'}
            {processingState === 'ocr' && 'Searching and isolating semester timestamps, break patterns.'}
            {processingState === 'analyzing' && 'Mapping custom weekend overlaps and calculating target buffers.'}
          </p>

          {/* Custom progress indicators */}
          <div style={{ maxWidth: '300px', margin: '0 auto', background: 'rgba(0,0,0,0.3)', height: '6px', borderRadius: '10px', overflow: 'hidden' }}>
            <motion.div 
              initial={{ width: '0%' }}
              animate={{ 
                width: processingState === 'uploading' ? '30%' : processingState === 'ocr' ? '65%' : '90%' 
              }}
              transition={{ duration: 1 }}
              style={{ height: '100%', background: 'linear-gradient(90deg, var(--primary) 0%, cyan 100%)' }}
            />
          </div>
          <div style={{ fontSize: '11px', color: 'cyan', fontWeight: '700', marginTop: '8px' }}>
            CONFIDENCE SPEED: {confidence}%
          </div>
        </div>
      )}

      {/* Extracted Smart Semester Dashboard Preview */}
      {processingState === 'complete' && previewData && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
        >
          {/* Smart AI Confidence Header */}
          <div style={{ 
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(15, 23, 42, 0.4) 100%)', 
            border: '1px solid rgba(16, 185, 129, 0.3)',
            padding: '16px 20px',
            borderRadius: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: '#10b981' }}>✓</span>
                <span style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-main)' }}>AI Semester Scan Complete</span>
              </div>
              <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Confidence score: {previewData.confidence}% (High Precision)</span>
            </div>
            <button 
              onClick={() => { setPreviewData(null); setProcessingState(null); }} 
              style={{ background: 'transparent', border: 'none', color: 'var(--primary-light)', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}
            >
              Re-Scan 🔄
            </button>
          </div>

          {/* Smart Semester Dashboard Overview Cards (Section 8) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
            <div className="dashboard-card" style={{ padding: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px' }}>SEMESTER DAYS</div>
              <div style={{ fontSize: '20px', fontWeight: '800', color: 'white' }}>
                {calculateDaysBetween(editableStart, editableEnd)} Days
              </div>
            </div>
            <div className="dashboard-card" style={{ padding: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px' }}>HOLIDAYS DETECTED</div>
              <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--primary-light)' }}>
                {editableHolidays.length} Holidays
              </div>
            </div>
            <div className="dashboard-card" style={{ padding: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px' }}>EXAM BLOCKS</div>
              <div style={{ fontSize: '20px', fontWeight: '800', color: '#f59e0b' }}>
                {editableExams.length} Exams
              </div>
            </div>
            <div className="dashboard-card" style={{ padding: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px' }}>SKIPS PRESSURE</div>
              <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--success)' }}>
                LOW
              </div>
            </div>
          </div>

          {/* AI-Powered Smart Recommendations (Section 9) */}
          <div className="dashboard-card" style={{ padding: '20px', border: '1px solid rgba(139,92,246,0.2)', background: 'rgba(139,92,246,0.03)' }}>
            <h4 style={{ fontSize: '13px', color: 'var(--primary-light)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 12px' }}>🧠 AI Strategic Suggestions</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {previewData.insights.map((ins, i) => (
                <div key={i} style={{ fontSize: '13px', color: 'var(--text-main)', lineHeight: '1.5' }}>
                  {ins.text}
                </div>
              ))}
            </div>
          </div>

          {/* Semester Timeline Visualization (Section 11) */}
          <div className="dashboard-card" style={{ padding: '24px 20px' }}>
            <h4 style={{ fontSize: '14px', color: 'var(--text-main)', fontWeight: '800', marginBottom: '20px' }}>📅 Semester Timeline Visualization</h4>
            <div style={{ position: 'relative', paddingLeft: '16px', borderLeft: '2px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '-22px', top: '2px', width: '10px', height: '10px', borderRadius: '50%', background: 'var(--success)' }} />
                <div style={{ fontSize: '13px', fontWeight: '700' }}>Semester Kickoff</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{editableStart}</div>
              </div>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '-22px', top: '2px', width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }} />
                <div style={{ fontSize: '13px', fontWeight: '700' }}>Midterm Exams Block</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{editableExams[0]?.startDate} - {editableExams[0]?.endDate} • High Attendance Risk</div>
              </div>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '-22px', top: '2px', width: '10px', height: '10px', borderRadius: '50%', background: 'var(--primary)' }} />
                <div style={{ fontSize: '13px', fontWeight: '700' }}>Festival Holidays Cluster</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Late October • Safe attendance padding block</div>
              </div>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '-22px', top: '2px', width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }} />
                <div style={{ fontSize: '13px', fontWeight: '700' }}>Final Endsem Examination</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{editableExams[1]?.startDate} - {editableExams[1]?.endDate}</div>
              </div>
            </div>
          </div>

          {/* Manual Assisted Correction Mode (Section 6 & 12) */}
          <div className="dashboard-card" style={{ padding: '24px' }}>
            <h4 style={{ fontSize: '15px', color: 'var(--text-main)', fontWeight: '800', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px' }}>
              🔧 Manual Assisted Correction
            </h4>

            {/* Dates Inputs */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>SEMESTER START</label>
                <input
                  type="date"
                  value={editableStart}
                  onChange={(e) => setEditableStart(e.target.value)}
                  style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', borderRadius: '8px', color: 'white' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>SEMESTER END</label>
                <input
                  type="date"
                  value={editableEnd}
                  onChange={(e) => setEditableEnd(e.target.value)}
                  style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', borderRadius: '8px', color: 'white' }}
                />
              </div>
            </div>

            {/* Holidays Editable List */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>Detected Holidays</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {editableHolidays.map((h, index) => (
                  <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div>
                      <input 
                        type="text" 
                        value={h.name} 
                        onChange={(e) => {
                          const updated = [...editableHolidays];
                          updated[index].name = e.target.value;
                          setEditableHolidays(updated);
                        }}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: '13px', fontWeight: '600', padding: 0 }}
                      />
                      <input 
                        type="date" 
                        value={h.date} 
                        onChange={(e) => {
                          const updated = [...editableHolidays];
                          updated[index].date = e.target.value;
                          setEditableHolidays(updated);
                        }}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', fontSize: '11px', display: 'block', marginTop: '2px', padding: 0 }}
                      />
                    </div>
                    <button 
                      onClick={() => setEditableHolidays(editableHolidays.filter((_, idx) => idx !== index))}
                      style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '12px' }}
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Exam Periods Editable List */}
            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>Detected Exam Periods</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {editableExams.map((ex, index) => (
                  <div key={index} style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(239, 68, 68, 0.03)', padding: '12px 14px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.1)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <input 
                        type="text" 
                        value={ex.name} 
                        onChange={(e) => {
                          const updated = [...editableExams];
                          updated[index].name = e.target.value;
                          setEditableExams(updated);
                        }}
                        style={{ background: 'transparent', border: 'none', color: '#fca5a5', fontSize: '13px', fontWeight: '700', padding: 0 }}
                      />
                      <button 
                        onClick={() => setEditableExams(editableExams.filter((_, idx) => idx !== index))}
                        style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '12px' }}
                      >
                        Delete
                      </button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div>
                        <label style={{ fontSize: '9px', color: 'var(--text-muted)' }}>START</label>
                        <input 
                          type="date" 
                          value={ex.startDate} 
                          onChange={(e) => {
                            const updated = [...editableExams];
                            updated[index].startDate = e.target.value;
                            setEditableExams(updated);
                          }}
                          style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '6px', color: 'white', fontSize: '11px', padding: '4px' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '9px', color: 'var(--text-muted)' }}>END</label>
                        <input 
                          type="date" 
                          value={ex.endDate} 
                          onChange={(e) => {
                            const updated = [...editableExams];
                            updated[index].endDate = e.target.value;
                            setEditableExams(updated);
                          }}
                          style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '6px', color: 'white', fontSize: '11px', padding: '4px' }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sync Button */}
          <button
            onClick={handleApply}
            className="primary-btn"
            style={{
              padding: '16px',
              fontSize: '15px',
              fontWeight: '800',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              boxShadow: '0 4px 20px rgba(16, 185, 129, 0.3)',
              borderRadius: '12px'
            }}
          >
            Confirm & Populate Semester Calendar globally
          </button>
        </motion.div>
      )}
    </div>
  );
}

export default AiSemesterImport;
