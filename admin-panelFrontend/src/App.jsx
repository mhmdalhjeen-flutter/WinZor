import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import AdminLayout from './components/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';
import SensitiveGate from './components/SensitiveGate';
import LightLoadingHint from './shared/LightLoadingHint';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Users = lazy(() => import('./pages/Users'));
const Stores = lazy(() => import('./pages/Stores'));
const Categories = lazy(() => import('./pages/Categories'));
const Regions = lazy(() => import('./pages/Regions'));
const Competitions = lazy(() => import('./pages/Competitions'));
const CompetitionParticipants = lazy(() => import('./pages/CompetitionParticipants'));
const ActivityPage = lazy(() => import('./pages/Activity'));
const SecurityLogs = lazy(() => import('./pages/SecurityLogs'));
const Settings = lazy(() => import('./pages/Settings'));
const HonorManagement = lazy(() => import('./pages/HonorManagement'));
const CodeGeneratorPage = lazy(() => import('./pages/CodeGeneratorPage'));
const WheelManagement = lazy(() => import('./pages/WheelManagement'));
const WheelWinners = lazy(() => import('./pages/WheelWinners'));
const BazaarApprovals = lazy(() => import('./pages/BazaarApprovals'));
const AchievementManagement = lazy(() => import('./pages/AchievementManagement'));
const UserSuggestions = lazy(() => import('./pages/UserSuggestions'));
const Analytics = lazy(() => import('./pages/Analytics'));
const HeatMaps = lazy(() => import('./pages/HeatMaps'));
const AdminChats = lazy(() => import('./pages/AdminChats'));
const PromoCodes = lazy(() => import('./pages/PromoCodes'));

const LazyPage = ({ children }) => (
  <Suspense fallback={<LightLoadingHint />}>{children}</Suspense>
);

const CodeGeneratorProtected = () => (
  <SensitiveGate title="مفاتيح تفعيل الحسابات">
    <LazyPage><CodeGeneratorPage /></LazyPage>
  </SensitiveGate>
);

const PromoCodesProtected = () => (
  <SensitiveGate title="Promo Codes">
    <LazyPage><PromoCodes /></LazyPage>
  </SensitiveGate>
);


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        
        <Route path="/" element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<LazyPage><Dashboard /></LazyPage>} />
          <Route path="analytics" element={<LazyPage><Analytics /></LazyPage>} />
          <Route path="heatmaps" element={<LazyPage><HeatMaps /></LazyPage>} />
          <Route path="users" element={<LazyPage><Users /></LazyPage>} />
          <Route path="chats" element={<LazyPage><AdminChats /></LazyPage>} />
          <Route path="chats/user/:userId" element={<LazyPage><AdminChats /></LazyPage>} />
          <Route path="stores" element={<LazyPage><Stores /></LazyPage>} />
          <Route path="promo-codes" element={<PromoCodesProtected />} />
          <Route path="categories" element={<LazyPage><Categories /></LazyPage>} />
          <Route path="regions" element={<LazyPage><Regions /></LazyPage>} />
          <Route path="competitions" element={<LazyPage><Competitions /></LazyPage>} />
          <Route path="competitions/:id/participants" element={<LazyPage><CompetitionParticipants /></LazyPage>} />
          <Route path="honor" element={<LazyPage><HonorManagement /></LazyPage>} />
          <Route path="activity" element={<LazyPage><ActivityPage /></LazyPage>} />
          <Route path="security" element={<LazyPage><SecurityLogs /></LazyPage>} />
          <Route path="settings" element={<LazyPage><Settings /></LazyPage>} />
          <Route path="code-generator" element={<CodeGeneratorProtected />} />
          <Route path="wheel-management" element={<LazyPage><WheelManagement /></LazyPage>} />
          <Route path="wheel-winners" element={<LazyPage><WheelWinners /></LazyPage>} />
          <Route path="bazaar-approvals" element={<LazyPage><BazaarApprovals /></LazyPage>} />
          <Route path="achievements" element={<LazyPage><AchievementManagement /></LazyPage>} />
          <Route path="suggestions" element={<LazyPage><UserSuggestions /></LazyPage>} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
