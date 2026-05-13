import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppShell from './components/AppShell';
import Home from './pages/Home';
import Calendar from './pages/Calendar';
import Timetable from './pages/Timetable';
import Subjects from './pages/Subjects';
import Insights from './pages/Insights';
import History from './pages/History';
import About from './pages/About';
import Settings from './pages/Settings';
import Pod from './pages/Pod';
import Premium from './pages/Premium';
import Admin from './pages/Admin';
import useAppStore from './store/appStore';

function App() {
  useEffect(() => {
    // Initialize theme and other global settings
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.body.className = `${savedTheme}-mode`;

    // Initialize Auth
    const { initAuth } = useAppStore.getState();
    const unsubscribe = initAuth();
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/pod" element={<Pod />} />
        <Route path="/" element={<AppShell><Home /></AppShell>} />
        <Route path="/calendar" element={<AppShell><Calendar /></AppShell>} />
        <Route path="/timetable" element={<AppShell><Timetable /></AppShell>} />
        <Route path="/subjects" element={<AppShell><Subjects /></AppShell>} />
        <Route path="/insights" element={<AppShell><Insights /></AppShell>} />
        <Route path="/history" element={<AppShell><History /></AppShell>} />
        <Route path="/about" element={<AppShell><About /></AppShell>} />
        <Route path="/settings" element={<AppShell><Settings /></AppShell>} />
        <Route path="/premium" element={<AppShell><Premium /></AppShell>} />
        <Route path="/admin" element={<AppShell><Admin /></AppShell>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
