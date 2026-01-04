import React, { useState, useEffect } from 'react';
import { LandingPage } from './components/LandingPage';
import { WorkflowBuilder } from './components/WorkflowBuilder';

export default function App() {
  const [showBuilder, setShowBuilder] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  if (showBuilder) {
    return <WorkflowBuilder />;
  }

  return <LandingPage onLaunch={() => setShowBuilder(true)} theme={theme} toggleTheme={toggleTheme} />;
}