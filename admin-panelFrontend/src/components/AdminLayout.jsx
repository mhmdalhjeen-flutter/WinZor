import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { BRAND_NAME } from '../utils/brandAssets';
import AdminHeader from './AdminHeader';
import Sidebar from './Sidebar';

const AdminLayout = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.classList.toggle('admin-sidebar-open', menuOpen);
    return () => document.body.classList.remove('admin-sidebar-open');
  }, [menuOpen]);

  const toggleMenu = () => setMenuOpen((open) => !open);

  return (
    <div className="min-h-screen bg-[#0a0c12] flex flex-col font-['Cairo'] relative overflow-x-hidden" dir="rtl">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />

      <AdminHeader menuOpen={menuOpen} onToggleMenu={toggleMenu} />

      <div className="flex flex-1">
        <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />

        <main className="flex-1 pr-0 lg:pr-64 pt-[115px] pb-12 px-6 sm:px-12 max-w-[1800px] mx-auto w-full relative z-10 animate-in fade-in slide-in-from-bottom-10 duration-1000">
          <Outlet />
        </main>
      </div>

      <footer className="py-8 pr-0 lg:pr-64 border-t border-white/5 bg-[#111827]/50 backdrop-blur-md relative z-10">
        <div className="max-w-[1550px] mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col items-center md:items-start">
            <p className="text-[11px] font-black tracking-[4px] text-primary uppercase mb-1">Command Center</p>
            <p className="text-muted text-[11px] font-bold">© {new Date().getFullYear()} {BRAND_NAME} | v6.0.1</p>
          </div>

          <div className="flex gap-8 text-[11px] font-black uppercase tracking-widest text-muted">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-success rounded-full shadow-[0_0_10px_#22c55e] animate-pulse" />
              <span>الخادم: متصل</span>
            </div>
            <span className="hover:text-primary cursor-pointer transition-all">الدعم الفني</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AdminLayout;
