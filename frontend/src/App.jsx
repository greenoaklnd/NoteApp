import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/home';
import DailyView from './pages/dailyView';
import TopicHistoryView from './pages/TopicHistoryView';


export default function App() {
  return (
    <Router>
      <nav style={{ padding: '1rem', background: '#f0f0f0' }}>
        <Link to="/" style={{ marginRight: '1rem' }}>Home</Link>
        <Link to="/daily">Daily View</Link>
        <Link to="/history">Topic History </Link>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/daily" element={<DailyView />} />
        <Route path="/history" element={<TopicHistoryView />} />
      </Routes>
    </Router>
  );
}
