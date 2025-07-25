import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminNavbar from './AdminNavbar';

const AdminLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  // Removed unused user variable

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col">
      {/* Top Navbar */}
      <AdminNavbar 
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
      />

      {/* Sidebar and Main Content */}
      <div className="flex flex-1 overflow-hidden">
        <aside className={`min-h-screen w-64 flex flex-col transition-all duration-300 ease-in-out ${sidebarOpen ? '' : 'hidden'}`}>
          <AdminSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        </aside>
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout; 