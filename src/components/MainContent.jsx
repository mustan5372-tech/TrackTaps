import React, { useState, useEffect } from 'react';
import MobileHeader from './MobileHeader';
import MobileNav from './MobileNav';

function MainContent({ children }) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="content-wrapper">
      {/* Mobile-only components, strictly gated by React state */}
      {isMobile && <MobileHeader />}
      {isMobile && <MobileNav />}
      
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}

export default MainContent;
