import { memo } from 'react';
import { LogOut, X } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { adminNavItems } from './admin.constants';

const sidebarLinkClass = ({ isActive }) =>
  `flex items-center gap-2 rounded-md px-2.5 py-2 text-sm transition-colors ${
    isActive
      ? 'bg-zinc-100 text-zinc-950'
      : 'text-zinc-300 hover:bg-zinc-900 hover:text-zinc-100'
  }`;

const AdminSidebar = ({ open, onClose, onLogout }) => {
  return (
    <>
      {open ? (
        <button
          type="button"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/55 lg:hidden"
          aria-label="Close sidebar overlay"
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 border-r border-zinc-800 bg-zinc-950/95 p-3 transition-transform duration-200 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="mb-3 flex items-center justify-between">
          <p className="truncate text-sm font-semibold text-zinc-100">Admin Control</p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-zinc-800 p-1 text-zinc-400 lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="space-y-1 overflow-y-auto pb-20">
          {adminNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink key={item.to} to={item.to} className={sidebarLinkClass} onClick={onClose}>
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={onLogout}
          className="absolute bottom-3 left-3 right-3 inline-flex items-center justify-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 transition-colors hover:bg-zinc-800"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </aside>
    </>
  );
};

export default memo(AdminSidebar);
