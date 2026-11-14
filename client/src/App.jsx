import React, { useState } from 'react';
import Header from './components/Header';
import Home from './components/Home';
import Demo1Basics from './components/Demo1Basics';
import Demo2ClientServer from './components/Demo2ClientServer';

export default function App() {
  const [currentView, setCurrentView] = useState('home');

  return (
    <div className="app-container">
      <Header
        currentView={currentView}
        onNavigateHome={() => setCurrentView('home')}
      />

      <main>
        {currentView === 'home' && (
          <Home onSelectDemo={(demo) => setCurrentView(demo)} />
        )}
        {currentView === 'demo1' && <Demo1Basics />}
        {currentView === 'demo2' && <Demo2ClientServer />}
      </main>
    </div>
  );
}

