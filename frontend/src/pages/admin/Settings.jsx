import { useState, useEffect } from "react";
import {
  Settings,
  RefreshCw,
  Database,
  Shield,
  Clock,
  Save,
  AlertTriangle,
  CheckCircle,
  List,
  Plus,
  Trash2,
  Activity,
} from "lucide-react";
import { clustersAPI, adminAPI } from "../../services/api";

export default function AdminSettings() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [refreshing, setRefreshing] = useState(false);

  // Incident Categories
  const [categories, setCategories] = useState([
    "Theft",
    "Vandalism",
    "Accident",
    "Fire",
    "Assault",
    "Suspicious Activity",
    "Public Disturbance",
    "Traffic Hazard",
    "Other",
  ]);
  const [newCategory, setNewCategory] = useState("");

  // Cluster Settings (display only - actual config is backend)
  const [clusterSettings, setClusterSettings] = useState({
    refreshInterval: 30, // minutes
    minSamples: 3,
    epsilon: 0.005,
  });

  // System Stats
  const [stats, setStats] = useState({
    totalReports: 0,
    totalUsers: 0,
    activeClusters: 0,
    lastClusterRun: null,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await adminAPI.getStats();
      if (response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error("Failed to load stats:", error);
    }
  };

  const triggerClusterRefresh = async () => {
    try {
      setRefreshing(true);
      setMessage({ type: "", text: "" });
      await clustersAPI.refresh();
      setMessage({
        type: "success",
        text: "Cluster analysis triggered successfully!",
      });
      loadStats();
    } catch (error) {
      setMessage({
        type: "error",
        text: "Failed to trigger cluster analysis",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const addCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      setCategories([...categories, newCategory.trim()]);
      setNewCategory("");
      setMessage({ type: "success", text: "Category added successfully!" });
    }
  };

  const removeCategory = (cat) => {
    if (categories.length > 1) {
      setCategories(categories.filter((c) => c !== cat));
      setMessage({ type: "success", text: "Category removed!" });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Settings size={28} />
          System Configuration
        </h1>
      </div>

      {/* Message */}
      {message.text && (
        <div
          className={`flex items-center gap-2 p-4 rounded-lg ${
            message.type === "success"
              ? "bg-green-500/10 border border-green-500/30 text-green-400"
              : "bg-red-500/10 border border-red-500/30 text-red-400"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle size={18} />
          ) : (
            <AlertTriangle size={18} />
          )}
          {message.text}
        </div>
      )}

      {/* System Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Activity size={20} className="text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {stats.totalReports || 0}
              </p>
              <p className="text-slate-400 text-sm">Total Reports</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <Shield size={20} className="text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {stats.totalUsers || 0}
              </p>
              <p className="text-slate-400 text-sm">Total Users</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
              <Database size={20} className="text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {stats.activeClusters || 0}
              </p>
              <p className="text-slate-400 text-sm">Active Clusters</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <Clock size={20} className="text-purple-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">
                {formatDate(stats.lastClusterRun)}
              </p>
              <p className="text-slate-400 text-sm">Last Cluster Run</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Manual Cluster Refresh */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <RefreshCw size={20} />
            Cluster Analysis
          </h2>
          <p className="text-slate-400 text-sm mb-4">
            The DBSCAN clustering algorithm runs automatically every{" "}
            {clusterSettings.refreshInterval} minutes. You can also trigger it
            manually here.
          </p>

          <div className="bg-slate-700/50 rounded-lg p-4 mb-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-400">Refresh Interval:</span>
                <span className="text-white ml-2">
                  {clusterSettings.refreshInterval} minutes
                </span>
              </div>
              <div>
                <span className="text-slate-400">Min Samples:</span>
                <span className="text-white ml-2">
                  {clusterSettings.minSamples}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Epsilon (radius):</span>
                <span className="text-white ml-2">
                  {clusterSettings.epsilon} (~500m)
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={triggerClusterRefresh}
            disabled={refreshing}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white rounded-lg font-medium"
          >
            <RefreshCw size={18} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Running Analysis..." : "Trigger Manual Refresh"}
          </button>
        </div>

        {/* Incident Categories */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <List size={20} />
            Incident Categories
          </h2>
          <p className="text-slate-400 text-sm mb-4">
            Manage the categories available for incident reports.
          </p>

          {/* Add New Category */}
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="New category name..."
              className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => e.key === "Enter" && addCategory()}
            />
            <button
              onClick={addCategory}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
            >
              <Plus size={18} />
            </button>
          </div>

          {/* Categories List */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {categories.map((cat) => (
              <div
                key={cat}
                className="flex items-center justify-between px-3 py-2 bg-slate-700/50 rounded-lg"
              >
                <span className="text-white">{cat}</span>
                <button
                  onClick={() => removeCategory(cat)}
                  className="p-1 hover:bg-slate-600 rounded text-slate-400 hover:text-red-400"
                  disabled={categories.length <= 1}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* System Info */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Database size={20} />
          System Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="text-slate-400 text-sm mb-2">Platform</h3>
            <p className="text-white">NeighborWatch Connect</p>
            <p className="text-slate-500 text-sm">Version 1.0.0</p>
          </div>
          <div>
            <h3 className="text-slate-400 text-sm mb-2">Backend</h3>
            <p className="text-white">FastAPI + MongoDB</p>
            <p className="text-slate-500 text-sm">Railway Deployment</p>
          </div>
          <div>
            <h3 className="text-slate-400 text-sm mb-2">Frontend</h3>
            <p className="text-white">React + Vite</p>
            <p className="text-slate-500 text-sm">Vercel Deployment</p>
          </div>
        </div>
      </div>
    </div>
  );
}
