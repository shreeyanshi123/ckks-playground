import React from 'react';

export default function Header({ currentView, onNavigateHome }) {
  return (
    <header className="top-nav">
      <div className="brand-title">Microsoft SEAL • CKKS FHE</div>
      {currentView !== 'home' && (
        <button className="back-btn" onClick={onNavigateHome}>
          ← Back to Playground
        </button>
      )}
    </header>
  );
}

