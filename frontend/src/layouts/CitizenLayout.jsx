import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import {
  Home,
  FileText,
  ClipboardList,
  Bell,
  MessageCircle,
  User,
  LogOut,
  Shield,
} from "lucide-react";

export default function CitizenLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navItems = [
    { to: "/citizen", icon: Home, label: "Home", end: true },
    { to: "/citizen/report", icon: FileText, label: "Report" },
    { to: "/citizen/my-reports", icon: ClipboardList, label: "My Reports" },
    { to: "/citizen/alerts", icon: Bell, label: "Alerts" },
    { to: "/citizen/chat", icon: MessageCircle, label: "Chat" },
    { to: "/citizen/profile", icon: User, label: "Profile" },
  ];

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Shield size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">NeighborWatch</h1>
              <p className="text-xs text-slate-400">Community Safety</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-white">
                {user?.name || "Anonymous User"}
              </p>
              <p className="text-xs text-slate-400">{user?.email || "Guest"}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-red-400 transition-colors"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-4">
          <Outlet />
        </div>
      </main>

      {/* Bottom Navigation (Mobile) */}
      <nav className="bg-slate-800 border-t border-slate-700 px-4 py-2 sm:hidden">
        <div className="flex justify-around">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `
                flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors
                ${
                  isActive
                    ? "text-blue-500"
                    : "text-slate-400 hover:text-slate-300"
                }
              `}
            >
              <item.icon size={20} />
              <span className="text-xs font-medium">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Side Navigation (Desktop) */}
      <nav className="hidden sm:block fixed left-0 top-16 bottom-0 w-64 bg-slate-800 border-r border-slate-700 p-4">
        <div className="space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-slate-300 hover:bg-slate-700"
                }
              `}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Spacer for desktop sidebar */}
      <div className="hidden sm:block w-64" />
    </div>
  );
}
