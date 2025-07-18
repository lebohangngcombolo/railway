import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminNavbar from './AdminNavbar';
import { useAuth } from '../hooks/useAuth';
import ProfileDropdown from './ProfileDropdown';
import { Menu, Bell } from 'lucide-react';

const AdminLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col">
      {/* Top Navbar */}
      <AdminNavbar 
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
        showAdminName={false}
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