import React from 'react';
import useAppStore from '../store/appStore';

function History() {
  // Get history from Zustand store
  const { history } = useAppStore();

  const getActionIcon = (type) => {
    const icons = {
      'subject_added': '📚',
      'subject_updated': '✏️',
      'subject_deleted': '🗑️',
      'timetable_updated': '🕒',
      'attendance_marked': '✓',
      'attendance_bulk_marked': '✓✓',
      'attendance_cleared': '✗',
      'podai_synced': '🔗',
      'ai_import': '🤖'
    };
    return icons[type] || '📝';
  };

  const getActionColor = (type) => {
    if (type.includes('added') || type.includes('marked')) return '#10b981';
    if (type.includes('deleted') || type.includes('cleared')) return '#ef4444';
    if (type.includes('updated')) return '#f59e0b';
    if (type.includes('synced') || type.includes('import')) return 'var(--primary-light)';
    return 'var(--text-dim)';
  };

  const formatTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="history-view" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <header className="view-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-main)' }}>Attendance History</h2>
        <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>{history.length} entries</span>
      </header>

      <div id="history-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {history.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '48px 32px',
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(168, 85, 247, 0.04) 100%)',
            border: '1px solid rgba(139, 92, 246, 0.15)',
            borderRadius: '16px',
            color: 'var(--text-dim)'
          }}>
            <p style={{ fontSize: '16px', marginBottom: '8px' }}>No history yet</p>
            <p style={{ fontSize: '13px' }}>Your actions will appear here</p>
          </div>
        ) : (
          history.map((entry) => (
            <div
              key={entry.id}
              style={{
                background: 'linear-gradient(135deg, var(--primary-glow) 0%, rgba(168, 85, 247, 0.05) 100%)',
                border: '1px solid var(--primary-glow)',
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                gap: '16px',
                alignItems: 'flex-start'
              }}
            >
              <div style={{
                fontSize: '24px',
                minWidth: '40px',
                textAlign: 'center'
              }}>
                {getActionIcon(entry.type)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{
                  color: 'var(--text-main)',
                  fontWeight: '600',
                  marginBottom: '4px'
                }}>
                  {entry.description}
                </div>
                {entry.subject && (
                  <div style={{
                    fontSize: '12px',
                    color: 'var(--primary-light)',
                    marginBottom: '4px'
                  }}>
                    Subject: {entry.subject}
                  </div>
                )}
                <div style={{
                  fontSize: '11px',
                  color: 'var(--text-muted)'
                }}>
                  {formatDate(entry.timestamp)} at {formatTime(entry.timestamp)}
                </div>
              </div>
              <div style={{
                background: getActionColor(entry.type),
                color: 'var(--text-main)',
                padding: '4px 12px',
                borderRadius: '6px',
                fontSize: '10px',
                fontWeight: '600',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap'
              }}>
                {entry.type.replace(/_/g, ' ')}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default History;
