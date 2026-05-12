import React from 'react';
import logo from '../../icon.png';

function MobileHeader() {
  return (
    <header className="mobile-header">
      <img src={logo} alt="TrackTaps" className="mobile-header-logo" />
    </header>
  );
}

export default MobileHeader;
