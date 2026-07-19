import React, { Suspense, lazy, useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from "./context/AuthContext";

// Shell on critical path for authenticated Home
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import VerifyBanner from './components/VerifyBanner';
import LightLoadingHint from './shared/LightLoadingHint';
import Home from './pages/Home';
import ProtectedRoute from "./routes/ProtectedRoute";
import Maintenance from './pages/Maintenance';
import useMaintenanceMode from './hooks/useMaintenanceMode';
import StartupSplashGate from './components/StartupSplashGate';
import BackgroundRefreshHost from './components/cache/BackgroundRefreshHost';
import useBrowserBackGuard from './hooks/useBrowserBackGuard';
import PwaHost from './components/pwa/PwaHost';
import PwaShortcutHandler from './components/pwa/PwaShortcutHandler';
import GiftActivationHandler from './components/giftActivation/GiftActivationHandler';
import GiftActivationPostFlowHost from './components/giftActivation/GiftActivationPostFlowHost';
import { PwaInstallProvider } from './context/PwaInstallContext';

// Deferred — must not land in the initial Home JS graph
const NotificationListener = lazy(() => import('./components/NotificationListener'));
const AuthWelcomeEffects = lazy(() => import('./components/auth/AuthWelcomeEffects'));
const PointsFloatLayer = lazy(() => import('./components/PointsFloatLayer'));
const FloatingCodeButton = lazy(() => import('./components/FloatingCodeButton'));
const OnboardingTourHost = lazy(() => import('./components/onboarding/OnboardingTourHost'));
const Intro = lazy(() => import('./pages/Intro'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ChangePassword = lazy(() => import('./pages/ChangePassword'));
const StoreDetail = lazy(() => import('./pages/StoreDetail'));
const OfferDetail = lazy(() => import('./pages/OfferDetail'));
const StoreQuickSearch = lazy(() => import('./pages/StoreQuickSearch'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
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
  useBrowserBackGuard(isAuth);
  const splashActive = isAuth && location.pathname === '/';
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

  const [deferChrome, setDeferChrome] = useState(false);

  useEffect(() => {
    let idleId;
    let timeoutId;
    const enable = () => setDeferChrome(true);
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      idleId = window.requestIdleCallback(enable, { timeout: 1500 });
    } else {
      timeoutId = window.setTimeout(enable, 300);
    }
    return () => {
      if (idleId != null && window.cancelIdleCallback) window.cancelIdleCallback(idleId);
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, []);

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
  const showFloatingActions = isAuth
    && !offerViewerOpen
    && (location.pathname === '/' || location.pathname === '/explore');

  return (
    <StartupSplashGate active={splashActive}>
      {deferChrome && (
        <Suspense fallback={null}>
          <AuthWelcomeEffects />
        </Suspense>
      )}
      {isAuth && deferChrome && (
        <Suspense fallback={null}>
          <NotificationListener />
        </Suspense>
      )}
      {deferChrome && <BackgroundRefreshHost />}
      {isAuth && (
        <Suspense fallback={null}>
          <PointsFloatLayer />
        </Suspense>
      )}
      <div className="flex flex-col min-h-screen bg-[#f7f5f2] text-right font-body" dir="rtl">
        
        {/* الهيدر — يظهر للزوار على الصفحات العامة (استكشاف، متجر...) */}
        {showAppChrome && !hideOverlayChrome && <Header />}

        <main
          data-onboarding="current-page"
          className={`flex-grow w-full max-w-screen-xl mx-auto ${showAppChrome && !hideOverlayChrome ? 'px-4 pt-3 pb-[calc(5.1rem+env(safe-area-inset-bottom,0px))] md:pb-8' : ''}`}
        >
          {isAuth && <VerifyBanner />}
          <Routes>
            {/* التوجيه الأساسي */}
            <Route
              path="/"
              element={isAuth ? <Home /> : <LazyPage><Intro /></LazyPage>}
            />

            <Route path="/intro" element={!isAuth ? <LazyPage><Intro /></LazyPage> : <Navigate to="/" replace />} />
            <Route path="/login" element={!isAuth ? <LazyPage><Login /></LazyPage> : <Navigate to="/" />} />
            <Route path="/register" element={!isAuth ? <LazyPage><Register /></LazyPage> : <Navigate to="/" />} />
            <Route path="/verify-email" element={<LazyPage><VerifyEmail /></LazyPage>} />
            <Route path="/forgot-password" element={!isAuth ? <LazyPage><ForgotPassword /></LazyPage> : <Navigate to="/" />} />
            
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
            <Route path="/change-password" element={<ProtectedRoute><LazyPage><ChangePassword /></LazyPage></ProtectedRoute>} />
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

        {showFloatingActions && (
          <Suspense fallback={null}>
            <FloatingCodeButton />
          </Suspense>
        )}
        
        {/* شريط التنقل السفلي */}
        {isAuth && !hideBottomNav && <BottomNav />}
      </div>
      {isAuth && deferChrome && !hideOverlayChrome && (
        <Suspense fallback={null}>
          <OnboardingTourHost enabled={!offerViewerOpen && !pointsGuideOpen} />
        </Suspense>
      )}
      <PwaHost />
    </StartupSplashGate>
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

  return (
    <PwaInstallProvider>
      <AppShell />
      <PwaShortcutHandler />
      <GiftActivationHandler />
      <GiftActivationPostFlowHost />
    </PwaInstallProvider>
  );
}

export default App;
