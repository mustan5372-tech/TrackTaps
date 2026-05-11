import React from 'react';
import Sidebar from './Sidebar';
import MainContent from './MainContent';

function AppShell({ children }) {
  return (
    <div className="app-container">
      <Sidebar />
      <MainContent>{children}</MainContent>
    </div>
  );
}

export default AppShell;
