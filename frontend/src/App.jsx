import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import Home from './pages/Home';
import Wallet from './pages/Wallet';
import Draws from './pages/Draws';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Register from './pages/Register';
import StoreDetail from './pages/StoreDetail';
import Inventory from './pages/Inventory'; 
import TreasureChests from './pages/TreasureChests'; 

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

function App() {
  // ميزة التعرف التلقائي: بقاء المستخدم متصلاً
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (token && user) {
      console.log("Welcome back:", JSON.parse(user).name);
    }
  }, []);

  return (
    <Router>
      <div className="mobile-container overflow-x-hidden bg-gray-50 min-h-screen">
        <Header />
        <main className="px-4 pt-4 pb-24">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/store/:id" element={<StoreDetail />} />
            
            {/* المسارات المحمية */}
            <Route path="/chests" element={<ProtectedRoute><TreasureChests /></ProtectedRoute>} />
            <Route path="/wallet" element={<ProtectedRoute><Wallet /></ProtectedRoute>} />
            <Route path="/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
            <Route path="/draws" element={<ProtectedRoute><Draws /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          </Routes>
        </main>
        <BottomNav />
      </div>
    </Router>
  );
}

export default App;
