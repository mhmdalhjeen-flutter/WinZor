import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Stores from './pages/Stores';
import PromoCodes from './pages/PromoCodes';
import Categories from './pages/Categories';
import Draws from './pages/Draws';
import ActivityPage from './pages/Activity'; // تم الاستيراد
import AdminLayout from './components/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        {/* بوابة الدخول العامة */}
        <Route path="/login" element={<Login />} />
        
        {/* المسارات المحمية (مركز القيادة) */}
        <Route path="/" element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="stores" element={<Stores />} />
          <Route path="promo-codes" element={<PromoCodes />} />
          <Route path="categories" element={<Categories />} />
          <Route path="draws" element={<Draws />} />
          <Route path="activity" element={<ActivityPage />} />
          
          {/* سنقوم ببناء الصفحات التالية تباعاً */}
          <Route path="settings" element={<div className="text-white p-8">قريباً: الإعدادات</div>} />
        </Route>

        {/* توجيه أي رابط غير معروف */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
