import React from 'react';
import MobileHeader from './MobileHeader';
import MobileNav from './MobileNav';

function MainContent({ children }) {
  return (
    <div className="content-wrapper">
      {/* Render unconditionally - CSS media queries govern visibility with 100% reliability */}
      <MobileHeader />
      <MobileNav />
      
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}

export default MainContent;
