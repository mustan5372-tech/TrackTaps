import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import useAppStore from '../store/appStore';

function AiSemesterImport() {
  const navigate = useNavigate();
  const { addHoliday, addExamPeriod, addWorkingSaturday, setSemesterSettings, showToast } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);

  const handleSimulateAi = () => {
    setLoading(true);
    // Simulate AI extraction delay
    setTimeout(() => {
      setPreviewData({
        startDate: '2026-07-15',
        endDate: '2026-12-15',
        holidays: [
          { name: 'Independence Day', date: '2026-08-15', type: 'holiday' },
          { name: 'Ganesh Chaturthi', date: '2026-09-19', type: 'holiday' },
          { name: 'Gandhi Jayanti', date: '2026-10-02', type: 'holiday' },
          { name: 'Dussehra', date: '2026-10-24', type: 'holiday' },
          { name: 'Guru Nanak Birthday', date: '2026-11-27', type: 'restricted' }
        ],
        examPeriods: [
          { name: 'Mid-Term Exams', startDate: '2026-09-25', endDate: '2026-10-05' },
          { name: 'End-Term Exams', startDate: '2026-12-01', endDate: '2026-12-15' }
        ],
        workingSaturdays: [
          { date: '2026-08-08', followsDay: 0 }, // Mon schedule
          { date: '2026-11-14', followsDay: 4 }  // Fri schedule
        ]
      });
      setLoading(false);
      showToast("AI Extraction Complete!", "success");
    }, 2500);
  };

  const handleApply = () => {
    if (!previewData) return;
    
    setSemesterSettings({
      startDate: previewData.startDate,
      endDate: previewData.endDate
    });
    
    previewData.holidays.forEach(h => addHoliday(h));
    previewData.examPeriods.forEach(e => addExamPeriod(e));
    previewData.workingSaturdays.forEach(s => addWorkingSaturday(s));
    
    showToast("Semester Data Applied Successfully!", "success");
    navigate('/settings');
  };

  return (
    <div className="ai-import-view" style={{ maxWidth: '600px', margin: '0 auto', padding: '24px' }}>
      <header style={{ marginBottom: '32px' }}>
        <button onClick={() => navigate('/settings')} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', marginBottom: '16px' }}>← Back to Settings</button>
        <h2 style={{ fontSize: '24px', fontWeight: '800' }}>✨ AI Semester Calendar Import</h2>
        <p style={{ color: 'var(--text-dim)', fontSize: '13px' }}>Experimental Feature: Upload your academic calendar PDF or Image.</p>
      </header>

      <div className="dashboard-card" style={{ padding: '40px', textAlign: 'center', border: '2px dashed var(--primary-glow)', background: 'rgba(139, 92, 246, 0.02)' }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>📄</div>
        <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '12px' }}>Upload Academic Calendar</h3>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px' }}>Select a PDF or Image of your college's official academic schedule.</p>
        
        <input 
          type="file" 
          id="ai-upload" 
          style={{ display: 'none' }} 
          onChange={handleSimulateAi}
        />
        
        <button 
          onClick={() => document.getElementById('ai-upload').click()}
          disabled={loading}
          className="primary-btn"
          style={{ width: '100%', padding: '14px' }}
        >
          {loading ? 'AI is analyzing...' : 'Select File'}
        </button>
      </div>

      {previewData && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ marginTop: '32px' }}
        >
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>Preview Detected Dates</h3>
          <div className="dashboard-card" style={{ padding: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>START DATE</label>
                <div style={{ fontWeight: '600' }}>{previewData.startDate}</div>
              </div>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>END DATE</label>
                <div style={{ fontWeight: '600' }}>{previewData.endDate}</div>
              </div>
            </div>
            
            <div style={{ marginTop: '16px' }}>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Holidays & Restricted</label>
              <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {previewData.holidays.map((h, i) => (
                  <div key={i} style={{ background: 'rgba(255,255,255,0.03)', padding: '6px 12px', borderRadius: '8px', fontSize: '12px' }}>
                    <span style={{ color: h.type === 'restricted' ? '#f59e0b' : 'var(--text-main)' }}>{h.name}</span>
                    <span style={{ color: 'var(--text-muted)', marginLeft: '6px' }}>{h.date}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginTop: '16px' }}>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Exam Periods</label>
              <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {previewData.examPeriods.map((e, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(239, 68, 68, 0.05)', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', border: '1px solid rgba(239, 68, 68, 0.1)' }}>
                    <span style={{ color: '#fca5a5', fontWeight: '600' }}>{e.name}</span>
                    <span style={{ color: 'var(--text-dim)' }}>{e.startDate} to {e.endDate}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginTop: '16px' }}>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Working Saturdays</label>
              <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {previewData.workingSaturdays.map((s, i) => (
                  <div key={i} style={{ background: 'rgba(16, 185, 129, 0.05)', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', border: '1px solid rgba(16, 185, 129, 0.1)' }}>
                    <span style={{ color: '#6ee7b7', fontWeight: '600' }}>{s.date}</span>
                    <span style={{ color: 'var(--text-dim)', marginLeft: '6px' }}>Follows {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'][s.followsDay]}</span>
                  </div>
                ))}
              </div>
            </div>

            <button 
              onClick={handleApply}
              className="primary-btn"
              style={{ width: '100%', marginTop: '24px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
            >
              Confirm & Apply to Semester
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default AiSemesterImport;
