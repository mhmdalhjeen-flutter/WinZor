import React, { Suspense, lazy, useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
const PointsProgramStores = lazy(() => import('./pages/PointsProgramStores'));
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

const AUTH_SHELL_ROUTES = ['/login', '/register', '/intro', '/forgot-password'];

function AppShell() {
  const { isAuth } = useAuth();
  const location = useLocation();
  const isGuestIntro =
    !isAuth && (location.pathname === '/' || location.pathname === '/intro');
  const isAuthShell = AUTH_SHELL_ROUTES.some(
    (path) => location.pathname === path || location.pathname.startsWith(`${path}/`)
  ) || isGuestIntro;
  const showAppChrome = isAuth || !isAuthShell;

  const [offerViewerOpen, setOfferViewerOpen] = useState(
    () => typeof document !== 'undefined' && document.body.classList.contains('offer-viewer-open')
  );
  const [pointsGuideOpen, setPointsGuideOpen] = useState(
    () => typeof document !== 'undefined' && document.body.classList.contains('points-guide-open')
  );

  useEffect(() => {
    const sync = () => {
      setOfferViewerOpen(document.body.classList.contains('offer-viewer-open'));
      setPointsGuideOpen(document.body.classList.contains('points-guide-open'));
    };
    const obs = new MutationObserver(sync);
    obs.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    sync();
    return () => obs.disconnect();
  }, []);

  const hideOverlayChrome = offerViewerOpen || pointsGuideOpen;
  const hideBottomNav = hideOverlayChrome || location.pathname === '/stores/search';

  return (
    <>
      <AuthWelcomeEffects />
      {isAuth && <NotificationListener />}
      {isAuth && <PointsFloatLayer />}
      <div className="flex flex-col min-h-screen bg-[#f7f5f2] text-right font-body" dir="rtl">
        
        {/* الهيدر — يظهر للزوار على الصفحات العامة (استكشاف، متجر...) */}
        {showAppChrome && !hideOverlayChrome && <Header />}

        <main className={`flex-grow w-full max-w-screen-xl mx-auto ${showAppChrome && !hideOverlayChrome ? 'px-4 pt-3 pb-[calc(5.1rem+env(safe-area-inset-bottom,0px))] md:pb-8' : ''}`}>
          {isAuth && <VerifyBanner />}
          <Routes>
            {/* التوجيه الأساسي */}
            <Route
              path="/"
              element={isAuth ? <Home /> : <Intro />}
            />

            <Route path="/intro" element={!isAuth ? <Intro /> : <Navigate to="/" replace />} />
            <Route path="/login" element={!isAuth ? <Login /> : <Navigate to="/" />} />
            <Route path="/register" element={!isAuth ? <Register /> : <Navigate to="/" />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/forgot-password" element={!isAuth ? <ForgotPassword /> : <Navigate to="/" />} />
            
            <Route path="/explore" element={<LazyPage><Explore /></LazyPage>} />
            <Route path="/stores/points" element={<LazyPage><PointsProgramStores /></LazyPage>} />
            <Route path="/stores/points-program" element={<Navigate to="/stores/points" replace />} />
            <Route path="/stores/search" element={<LazyPage><StoreQuickSearch /></LazyPage>} />
            <Route path="/product/:id" element={<LazyPage><ProductDetail /></LazyPage>} />
            <Route path="/marketplace" element={<LazyPage><Marketplace /></LazyPage>} />
            <Route path="/marketplace/:id" element={<LazyPage><BazaarDetail /></LazyPage>} />
            <Route path="/store/:id" element={<LazyPage><StoreDetail /></LazyPage>} />
            <Route path="/stores/:id" element={<LazyPage><StoreDetail /></LazyPage>} />
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
        {isAuth && !offerViewerOpen && <FloatingCodeButton />}
        
        {/* شريط التنقل السفلي */}
        {isAuth && !hideBottomNav && <BottomNav />}
      </div>
    </>
  );
}

function App() {
  const { maintenance } = useMaintenanceMode();

  if (maintenance.enabled) {
    return (
      <Routes>
        <Route path="/maintenance" element={<Maintenance message={maintenance.message} />} />
        <Route path="*" element={<Navigate to="/maintenance" replace />} />
      </Routes>
    );
  }

  return <AppShell />;
}

export default App;
