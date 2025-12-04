import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import {
  LayoutDashboard,
  Users,
  Settings,
  LogOut,
  Crown,
  Shield,
  ShieldAlert,
} from "lucide-react";

export default function AdminLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navItems = [
    { to: "/admin", icon: LayoutDashboard, label: "Dashboard", end: true },
    { to: "/admin/users", icon: Users, label: "Users" },
    { to: "/admin/abuse", icon: ShieldAlert, label: "Abuse Analytics" },
    { to: "/admin/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <div className="min-h-screen bg-slate-900 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col">
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-600 rounded-lg flex items-center justify-center">
              <Shield size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">TrustBond</h1>
              <p className="text-xs text-slate-400">Admin Panel</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                ${
                  isActive
                    ? "bg-amber-600 text-white"
                    : "text-slate-300 hover:bg-slate-700"
                }
              `}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-600 rounded-full flex items-center justify-center text-white font-semibold">
                AD
              </div>
              <div>
                <p className="text-sm font-medium text-white">Administrator</p>
                <p className="text-xs text-slate-400">Super Admin</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-red-400 transition-colors"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
