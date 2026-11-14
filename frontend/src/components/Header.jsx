import React from 'react';

export default function Header({ currentView, onNavigateHome }) {
  return (
    <header className="flex items-center justify-between pb-4 mb-8 border-b border-gray-200">
      <div className="flex items-center space-x-2">
        <span className="text-xs font-semibold tracking-wider text-gray-500 uppercase">
          Microsoft SEAL • CKKS Homomorphic Encryption
        </span>
      </div>
      {currentView !== 'home' && (
        <button
          onClick={onNavigateHome}
          className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:text-gray-900 transition-colors"
        >
          ← Back to Playground
        </button>
      )}
    </header>
  );
}
