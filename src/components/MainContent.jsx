import React from 'react';
import MobileHeader from './MobileHeader';
import MobileNav from './MobileNav';

function MainContent({ children }) {
  return (
    <div className="content-wrapper">
      <MobileHeader />
      <MobileNav />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}

export default MainContent;
