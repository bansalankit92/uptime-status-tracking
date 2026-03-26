import { NavLink, Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../lib/auth.js';

const navItems = [
  { to: '/', label: 'Dashboard', icon: '◉' },
  { to: '/monitors', label: 'Monitors', icon: '◎' },
  { to: '/incidents', label: 'Incidents', icon: '⚡' },
  { to: '/notifications', label: 'Notifications', icon: '🔔' },
  { to: '/status-page', label: 'Status Page', icon: '◈' },
];

export function Layout() {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed top-0 left-0 w-56 h-full bg-white border-r border-gray-200 flex flex-col z-30">
        <div className="p-5 border-b border-gray-100">
          <h1 className="text-lg font-bold text-gray-900">Uptime Monitor</h1>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="text-xs text-gray-500 mb-2">{user.email}</div>
          <button
            onClick={logout}
            className="text-xs text-red-600 hover:text-red-800 transition-colors"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-56 min-h-screen">
        <div className="p-6 max-w-6xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
