import React from 'react';
import Sidebar from './Sidebar';
import MainContent from './MainContent';
import FloatingChatbot from './FloatingChatbot';

function AppShell({ children }) {
  return (
    <div className="app-container">
      <Sidebar />
      <MainContent>{children}</MainContent>
      <FloatingChatbot />
    </div>
  );
}

export default AppShell;
