import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

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
// import StoreDashboard from './pages/StoreDashboard';
import ProtectedRoute from "./routes/ProtectedRoute";
import { useAuth } from "./context/AuthContext";


function App() {
  const { loading } = useAuth();
   useEffect(() => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || "null");
    

    if (token && user) {
      console.log("Welcome back:", user.name);
    }
  }, []);
    if (loading) {
      return <div>Loading...</div>;
    }

 

  return (
    
    <Router>
      <div className="mobile-container bg-gray-50 min-h-screen">
        <Header />

        <main className="px-4 pt-4 pb-24">
          <Routes>

            {/* public */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            {/* <Route path="/register" element={<ChooseAccount />} /> */}
            <Route path="/store/:id" element={<StoreDetail />} />

            {/* protected */}
            <Route path="/wallet" element={
              <ProtectedRoute>
                <Wallet />
              </ProtectedRoute>
            } />

            <Route path="/inventory" element={
              <ProtectedRoute>
                <Inventory />
              </ProtectedRoute>
            } />

            <Route path="/chests" element={
              <ProtectedRoute>
                <TreasureChests />
              </ProtectedRoute>
            } />

            <Route path="/draws" element={
              <ProtectedRoute>
                <Draws />
              </ProtectedRoute>
            } />

            {/* role-based */}
            <Route path="/profile" element={
              <ProtectedRoute allowedRoles={["customer", "store","supplier", "admin"]}>
                <Profile />
              </ProtectedRoute>
            } />


            {/* <Route path="/store-dashboard" element={
              <ProtectedRoute allowedRoles={["store"]}>
                <StoreDashboard />
              </ProtectedRoute>
            } /> */}
            {/* <Route path="/supplier-dashboard" element={
            <ProtectedRoute allowedRoles={["supplier"]}>
              <SupplierDashboard />
            </ProtectedRoute>
          } /> */}

          </Routes>
        </main>

        <BottomNav />
      </div>
    </Router>
  );
}

export default App;