import React, { useState } from 'react';
import Header from './components/Header';
import Home from './pages/Home';
import CKKSBasics from './pages/CKKSBasics';
import ClientServerDemo from './pages/ClientServerDemo';

export default function App() {
  const [currentView, setCurrentView] = useState('home');

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans antialiased">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <Header
          currentView={currentView}
          onNavigateHome={() => setCurrentView('home')}
        />

        <main>
          {currentView === 'home' && (
            <Home onSelectDemo={(demo) => setCurrentView(demo)} />
          )}
          {currentView === 'demo1' && <CKKSBasics />}
          {currentView === 'demo2' && <ClientServerDemo />}
        </main>
      </div>
    </div>
  );
}
