import { memo, useMemo, useState } from 'react';
import { Menu } from 'lucide-react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';
import AdminSidebar from './AdminSidebar';
import { adminNavItems } from './admin.constants';

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);

  const activeLabel = useMemo(() => {
    return (
      adminNavItems.find((item) => location.pathname.startsWith(item.to))?.label ||
      'Admin Panel'
    );
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <AdminSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={handleLogout}
      />

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-zinc-800 bg-zinc-950/95 px-3 py-2.5 backdrop-blur">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="inline-flex items-center justify-center rounded-md border border-zinc-800 bg-zinc-900 p-1.5 text-zinc-300 lg:hidden"
              aria-label="Open sidebar"
            >
              <Menu className="h-4 w-4" />
            </button>
            <p className="truncate text-sm font-semibold text-zinc-100">{activeLabel}</p>
          </div>
        </header>

        <main className="p-3 sm:p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default memo(AdminLayout);
