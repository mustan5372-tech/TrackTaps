import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

function FloatingChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      type: 'assistant',
      content: "Hello! I'm your TrackTaps Assistant. How can I help you with your attendance or schedule today?",
      time: 'Just now'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const location = useLocation();

  // Hide chatbot on settings and about pages
  const isHidden = location.pathname === '/settings' || location.pathname === '/about';

  const handleSendMessage = () => {
    if (inputValue.trim()) {
      setMessages([
        ...messages,
        { type: 'user', content: inputValue, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
      ]);
      setInputValue('');

      // Simulate assistant response
      setTimeout(() => {
        setMessages(prev => [
          ...prev,
          { type: 'assistant', content: 'I understand. Let me help you with that.', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
        ]);
      }, 500);
    }
  };

  return (
    <div id="ai-assistant-wrapper" className={`chatbot-wrapper ${isHidden ? 'hidden-on-page' : ''}`}>
      <button
        id="ai-fab"
        className="ai-fab"
        title="Ask TrackTaps AI"
        onClick={() => setIsOpen(!isOpen)}
        style={{ pointerEvents: 'auto' }}
      >
        <div className="ai-fab-glow"></div>
        <img src="assets/ai-logo.png" alt="AI" className="ai-fab-logo" />
      </button>

      {isOpen && (
        <div id="ai-chat-window" className="ai-chat-window active" style={{ pointerEvents: 'auto' }}>
          <header className="ai-chat-header">
            <div className="ai-header-info">
              <span className="ai-status-dot"></span>
              <img src="assets/ai-logo.png" alt="Logo" style={{ width: '24px', height: '24px', borderRadius: '50%', marginRight: '8px' }} />
              <h3>TrackTaps AI</h3>
            </div>
            <button
              className="ai-close-btn"
              onClick={() => setIsOpen(false)}
              style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '24px', cursor: 'pointer' }}
            >
              ×
            </button>
          </header>

          <div className="ai-chat-messages">
            {messages.map((msg, idx) => (
              <div key={idx} className={`ai-message ${msg.type}`}>
                <div className="message-content">{msg.content}</div>
                <span className="message-time">{msg.time}</span>
              </div>
            ))}
          </div>

          <div className="ai-chat-footer">
            <div className="ai-suggestion-chips">
              <button className="suggestion-chip">Can I skip tomorrow?</button>
              <button className="suggestion-chip">Lowest subject?</button>
              <button className="suggestion-chip">Today's classes?</button>
              <button className="suggestion-chip">Attendance summary</button>
            </div>
            <div className="ai-input-wrapper">
              <input
                type="text"
                placeholder="Type a message..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                autoComplete="off"
              />
              <button className="ai-send-btn" onClick={handleSendMessage}>
                <span className="send-icon">🚀</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FloatingChatbot;
