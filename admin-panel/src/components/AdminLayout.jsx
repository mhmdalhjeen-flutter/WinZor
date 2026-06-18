import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const AdminLayout = () => {
    return (
        <div className="min-h-screen bg-gray-900 flex" dir="rtl">
            <Sidebar />
            <main className="flex-1 mr-64 p-8">
                <Outlet />
            </main>
        </div>
    );
};

export default AdminLayout;
