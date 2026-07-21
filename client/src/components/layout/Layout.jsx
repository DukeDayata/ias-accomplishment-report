import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';
import {
  LayoutDashboard,
  FileSpreadsheet,
  ClipboardCheck,
  Users,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { cn } from '../../lib/utils';

export default function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['IAS', 'Regional'] },
    { name: 'Accomplishments', path: '/accomplishments', icon: FileSpreadsheet, roles: ['Regional'] },
    { name: 'Report Reviews', path: '/reviews', icon: ClipboardCheck, roles: ['IAS'] },
    { name: 'User Management', path: '/users', icon: Users, roles: ['IAS Super Administrator'] },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:static inset-y-0 left-0 z-50 w-64 bg-sidebar text-white flex flex-col transition-transform duration-300 shadow-2xl no-print",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="p-4 flex items-center justify-between border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center font-bold text-gov-blue shadow-sm">IAS</div>
            <div>
              <h2 className="text-sm font-bold leading-tight">Region IZN Reports</h2>
              <span className="text-[10px] text-gov-gold uppercase tracking-widest font-semibold">System</span>
            </div>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
          {navItems.filter(item => item.roles.some(r => user?.role?.includes(r))).map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsSidebarOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-300",
                location.pathname.startsWith(item.path)
                  ? "bg-gov-blue text-white shadow-md border-l-4 border-gov-gold translate-x-1"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              )}
            >
              <item.icon size={18} />
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-700/50">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-200">
              {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate">{user?.firstName} {user?.lastName}</p>
              <p className="text-[10px] text-gov-gold truncate">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium text-gov-red-light hover:bg-gov-red hover:text-white rounded-lg transition-colors"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-dashboard-bg">
        {/* Top Navbar */}
        <header className="h-16 bg-white/90 backdrop-blur-sm border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 z-30 sticky top-0 no-print transition-all duration-300">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 rounded-md text-slate-500 hover:bg-slate-100 transition-colors"
            >
              <Menu size={20} />
            </button>
            <h1 className="text-base font-extrabold text-slate-900 tracking-tight">
              {navItems.find(i => location.pathname.startsWith(i.path))?.name || 'Portal'}
            </h1>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-4 lg:p-8 bg-slate-50/50">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
