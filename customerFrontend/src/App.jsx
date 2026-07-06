import React, { useEffect, useState, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from "./context/AuthContext";

// Components
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import FloatingCodeButton from './components/FloatingCodeButton';
import VerifyBanner from './components/VerifyBanner';
import NotificationListener from './components/NotificationListener';
import PointsFloatLayer from './components/PointsFloatLayer';
import AuthWelcomeEffects from './components/auth/AuthWelcomeEffects';
import LightLoadingHint from './shared/LightLoadingHint';

// Pages (خفيفة — تحميل مباشر)
import Intro from './pages/Intro';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ChangePassword from './pages/ChangePassword';
import ProtectedRoute from "./routes/ProtectedRoute";
import Maintenance from './pages/Maintenance';
import useMaintenanceMode from './hooks/useMaintenanceMode';

// Pages (متوسطة — lazy load)
const StoreDetail = lazy(() => import('./pages/StoreDetail'));
const OfferDetail = lazy(() => import('./pages/OfferDetail'));
const StoreQuickSearch = lazy(() => import('./pages/StoreQuickSearch'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));

// Pages (كبيرة — lazy load)
const Draws = lazy(() => import('./pages/Draws'));
const UserCenter = lazy(() => import('./pages/UserCenter'));
const TreasureChests = lazy(() => import('./pages/TreasureChests'));
const HonorBoard = lazy(() => import('./pages/HonorBoard'));
const Inventory = lazy(() => import('./pages/Inventory'));
const Explore = lazy(() => import('./pages/Explore'));
const LuckyWheel = lazy(() => import('./pages/LuckyWheel'));
const Marketplace = lazy(() => import('./pages/Marketplace'));
const BazaarDetail = lazy(() => import('./pages/BazaarDetail'));
const Chats = lazy(() => import('./pages/Chats'));
const Favorites = lazy(() => import('./pages/Favorites'));
const Cart = lazy(() => import('./pages/Cart'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Competitions = lazy(() => import('./pages/Competitions'));
const CompetitionDetail = lazy(() => import('./pages/CompetitionDetail'));

const LazyPage = ({ children }) => (
  <Suspense fallback={<LightLoadingHint />}>{children}</Suspense>
);

function AppShell() {
  const { isAuth } = useAuth();
  const [isFirstVisit, setIsFirstVisit] = useState(false);

  useEffect(() => {
    const firstVisit = localStorage.getItem('firstVisit');
    if (firstVisit === null) {
      setIsFirstVisit(true);
    }
  }, []);

  return (
    <Router>
      <AuthWelcomeEffects />
      {isAuth && <NotificationListener />}
      {isAuth && <PointsFloatLayer />}
      <div className="flex flex-col min-h-screen bg-gray-50 text-right font-['Cairo']" dir="rtl">
        
        {/* الهيدر */}
        {isAuth && <Header />}

        <main className={`flex-grow w-full max-w-screen-xl mx-auto ${isAuth ? 'px-4 pt-4 pb-28 md:pb-8' : ''}`}>
          {isAuth && <VerifyBanner />}
          <Routes>
            {/* التوجيه الأساسي */}
            <Route 
              path="/" 
              element={
                isFirstVisit && !isAuth ? (
                  <Navigate to="/intro" />
                ) : isAuth ? (
                  <Home />
                ) : (
                  <Navigate to="/login" />
                )
              } 
            />
            
            <Route path="/intro" element={!isAuth ? <Intro /> : <Navigate to="/" />} />
            <Route path="/login" element={!isAuth ? <Login /> : <Navigate to="/" />} />
            <Route path="/register" element={!isAuth ? <Register /> : <Navigate to="/" />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/forgot-password" element={!isAuth ? <ForgotPassword /> : <Navigate to="/" />} />
            
            <Route path="/explore" element={<LazyPage><Explore /></LazyPage>} />
            <Route path="/stores/search" element={<LazyPage><StoreQuickSearch /></LazyPage>} />
            <Route path="/product/:id" element={<LazyPage><ProductDetail /></LazyPage>} />
            <Route path="/marketplace" element={<LazyPage><Marketplace /></LazyPage>} />
            <Route path="/marketplace/:id" element={<LazyPage><BazaarDetail /></LazyPage>} />
            <Route path="/store/:id" element={<LazyPage><StoreDetail /></LazyPage>} />
            <Route path="/offer/:id" element={<LazyPage><OfferDetail /></LazyPage>} />

            {/* المسارات المحمية */}
            <Route path="/draws" element={<ProtectedRoute><LazyPage><Draws /></LazyPage></ProtectedRoute>} />
            <Route path="/wheel" element={<ProtectedRoute><LazyPage><LuckyWheel /></LazyPage></ProtectedRoute>} />
            <Route path="/chests" element={<ProtectedRoute><LazyPage><TreasureChests /></LazyPage></ProtectedRoute>} />
            <Route path="/honor" element={<ProtectedRoute><LazyPage><HonorBoard /></LazyPage></ProtectedRoute>} />
            <Route path="/inventory" element={<ProtectedRoute><LazyPage><Inventory /></LazyPage></ProtectedRoute>} />
            <Route path="/center" element={<ProtectedRoute><LazyPage><UserCenter /></LazyPage></ProtectedRoute>} />
            <Route path="/change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />
            <Route path="/profile" element={<Navigate to="/center" replace />} />
            <Route path="/wallet" element={<Navigate to="/center" replace />} />
            <Route path="/personalization" element={<Navigate to="/center" replace />} />
            <Route path="/favorites" element={<ProtectedRoute><LazyPage><Favorites /></LazyPage></ProtectedRoute>} />
            <Route path="/cart" element={<ProtectedRoute><LazyPage><Cart /></LazyPage></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><LazyPage><Notifications /></LazyPage></ProtectedRoute>} />
            <Route path="/competitions" element={<ProtectedRoute><LazyPage><Competitions /></LazyPage></ProtectedRoute>} />
            <Route path="/competitions/:id" element={<ProtectedRoute><LazyPage><CompetitionDetail /></LazyPage></ProtectedRoute>} />
            <Route path="/chat" element={<ProtectedRoute><LazyPage><Chats /></LazyPage></ProtectedRoute>} />
            <Route path="/chat/:convId" element={<ProtectedRoute><LazyPage><Chats /></LazyPage></ProtectedRoute>} />
            <Route path="/spinWheel" element={<ProtectedRoute><LazyPage><LuckyWheel /></LazyPage></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>

        {/* زر الكود العائم */}
        {isAuth && <FloatingCodeButton />}
        
        {/* شريط التنقل السفلي */}
        {isAuth && <BottomNav />}
      </div>
    </Router>
  );
}

function App() {
  const { maintenance } = useMaintenanceMode();

  if (maintenance.enabled) {
    return (
      <Router>
        <Routes>
          <Route path="/maintenance" element={<Maintenance message={maintenance.message} />} />
          <Route path="*" element={<Navigate to="/maintenance" replace />} />
        </Routes>
      </Router>
    );
  }

  return <AppShell />;
}

export default App;
