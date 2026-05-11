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

function App() {
  useEffect(() => {
    // Initialize theme and other global settings
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.body.className = `${savedTheme}-mode`;
  }, []);

  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/timetable" element={<Timetable />} />
          <Route path="/subjects" element={<Subjects />} />
          <Route path="/insights" element={<Insights />} />
          <Route path="/history" element={<History />} />
          <Route path="/about" element={<About />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  );
}

export default App;
