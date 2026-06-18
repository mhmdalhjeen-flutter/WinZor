import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import Home from './pages/Home';
import Wallet from './pages/Wallet';
import Draws from './pages/Draws';
import Profile from './pages/Profile';

function App() {
  return (
    <Router>
      <div className="mobile-container overflow-x-hidden">
        {/* رأس الصفحة الثابت */}
        <Header />

        {/* محتوى الصفحات */}
        <main className="px-4 pt-4">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/wallet" element={<Wallet />} />
            <Route path="/draws" element={<Draws />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </main>

        {/* شريط التنقل السفلي الثابت */}
        <BottomNav />
      </div>
    </Router>
  );
}

export default App;
