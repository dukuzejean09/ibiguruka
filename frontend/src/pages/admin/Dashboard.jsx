import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  FileText,
  AlertTriangle,
  MessageCircle,
  TrendingUp,
  Clock,
  Shield,
  UserCheck,
  Activity,
  BarChart3,
} from "lucide-react";
import { adminAPI } from "../../services/api";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await adminAPI.getStats();
      setStats(response.data);
    } catch (error) {
      console.error("Failed to load stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
        <p className="text-slate-400 text-sm">
          Last updated: {new Date().toLocaleTimeString()}
        </p>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => navigate("/admin/users")}
          className="bg-slate-800 rounded-lg p-5 border border-slate-700 cursor-pointer hover:border-blue-500 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Total Users</p>
              <p className="text-3xl font-bold text-white mt-1">
                {stats?.totalUsers || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center">
              <Users className="text-blue-500" size={24} />
            </div>
          </div>
          {stats?.users?.pendingPolice > 0 && (
            <p className="text-amber-400 text-xs mt-2">
              {stats.users.pendingPolice} pending approval
            </p>
          )}
        </div>

        <div className="bg-slate-800 rounded-lg p-5 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Total Reports</p>
              <p className="text-3xl font-bold text-white mt-1">
                {stats?.totalReports || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center">
              <FileText className="text-green-500" size={24} />
            </div>
          </div>
          <p className="text-green-400 text-xs mt-2">
            +{stats?.reports?.today || 0} today
          </p>
        </div>

        <div className="bg-slate-800 rounded-lg p-5 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Active Clusters</p>
              <p className="text-3xl font-bold text-white mt-1">
                {stats?.activeClusters || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center">
              <Activity className="text-purple-500" size={24} />
            </div>
          </div>
          <p className="text-slate-400 text-xs mt-2">
            Last run: {formatDate(stats?.lastClusterRun)}
          </p>
        </div>

        <div className="bg-slate-800 rounded-lg p-5 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Active Chats</p>
              <p className="text-3xl font-bold text-white mt-1">
                {stats?.totalChats || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-amber-600/20 rounded-lg flex items-center justify-center">
              <MessageCircle className="text-amber-500" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Breakdown */}
        <div className="bg-slate-800 rounded-lg p-5 border border-slate-700">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Users size={20} />
            User Breakdown
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-slate-300">Citizens</span>
              </div>
              <span className="text-white font-semibold">
                {stats?.users?.citizens || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                <span className="text-slate-300">Police Officers</span>
              </div>
              <span className="text-white font-semibold">
                {stats?.users?.police || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span className="text-slate-300">Administrators</span>
              </div>
              <span className="text-white font-semibold">
                {stats?.users?.admins || 0}
              </span>
            </div>
            {stats?.users?.pendingPolice > 0 && (
              <div className="flex items-center justify-between pt-2 border-t border-slate-700">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-amber-500 rounded-full animate-pulse"></div>
                  <span className="text-amber-400">
                    Pending Police Approval
                  </span>
                </div>
                <span className="text-amber-400 font-semibold">
                  {stats.users.pendingPolice}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Report Status */}
        <div className="bg-slate-800 rounded-lg p-5 border border-slate-700">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <BarChart3 size={20} />
            Report Status
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-slate-300">New</span>
              </div>
              <span className="text-white font-semibold">
                {stats?.reports?.new || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                <span className="text-slate-300">Investigating</span>
              </div>
              <span className="text-white font-semibold">
                {stats?.reports?.investigating || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-slate-300">Resolved</span>
              </div>
              <span className="text-white font-semibold">
                {stats?.reports?.resolved || 0}
              </span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-700">
              <div className="flex items-center gap-2">
                <TrendingUp size={16} className="text-blue-400" />
                <span className="text-slate-300">This Week</span>
              </div>
              <span className="text-blue-400 font-semibold">
                {stats?.reports?.thisWeek || 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Categories */}
      {stats?.topCategories?.length > 0 && (
        <div className="bg-slate-800 rounded-lg p-5 border border-slate-700">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <AlertTriangle size={20} />
            Top Incident Categories
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {stats.topCategories.map((cat, idx) => (
              <div
                key={idx}
                className="bg-slate-700 rounded-lg p-3 text-center"
              >
                <p className="text-2xl font-bold text-white">{cat.count}</p>
                <p className="text-slate-400 text-sm mt-1">{cat.category}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-slate-800 rounded-lg p-5 border border-slate-700">
        <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => navigate("/admin/users")}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg transition-colors"
          >
            <UserCheck size={18} />
            <span>Manage Users</span>
          </button>
          <button
            onClick={() => navigate("/admin/settings")}
            className="flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white py-3 px-4 rounded-lg transition-colors"
          >
            <Activity size={18} />
            <span>Refresh Clusters</span>
          </button>
          <button
            onClick={() => navigate("/police/reports")}
            className="flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white py-3 px-4 rounded-lg transition-colors"
          >
            <FileText size={18} />
            <span>View Reports</span>
          </button>
          <button
            onClick={() => navigate("/police/broadcast")}
            className="flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white py-3 px-4 rounded-lg transition-colors"
          >
            <AlertTriangle size={18} />
            <span>Send Alert</span>
          </button>
        </div>
      </div>
    </div>
  );
}
