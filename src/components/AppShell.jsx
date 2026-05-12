import React from 'react';
import Sidebar from './Sidebar';
import MainContent from './MainContent';
import DownloadAPK from './DownloadAPK';

function AppShell({ children }) {
  return (
    <div className="app-container">
      <Sidebar />
      <MainContent>{children}</MainContent>
      <DownloadAPK />
    </div>
  );
}

export default AppShell;
