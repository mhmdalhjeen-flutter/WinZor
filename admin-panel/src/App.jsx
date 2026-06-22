import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Stores from './pages/Stores';
import PromoCodes from './pages/PromoCodes';
import Categories from './pages/Categories';
import Draws from './pages/Draws';
import ActivityPage from './pages/Activity';
import SecurityLogs from './pages/SecurityLogs';
import Prizes from './pages/Prizes';
import Settings from './pages/Settings';
import HonorManagement from './pages/HonorManagement';
import CardManagement from './pages/CardManagement'; // واجهة البطاقات
import BoxManagement from './pages/BoxManagement';   // واجهة الصناديق
import AdminLayout from './components/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="users" element={<Users />} />
          <Route path="stores" element={<Stores />} />
          <Route path="promo-codes" element={<PromoCodes />} />
          <Route path="categories" element={<Categories />} />
          <Route path="draws" element={<Draws />} />
          <Route path="prizes" element={<Prizes />} />
          <Route path="cards" element={<CardManagement />} /> {/* مسار البطاقات */}
          <Route path="boxes" element={<BoxManagement />} />  {/* مسار الصناديق */}
          <Route path="honor" element={<HonorManagement />} />
          <Route path="activity" element={<ActivityPage />} />
          <Route path="security" element={<SecurityLogs />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
