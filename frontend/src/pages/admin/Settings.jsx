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
  Sliders,
  Loader2,
} from "lucide-react";
import { clustersAPI, adminAPI } from "../../services/api";

export default function AdminSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [refreshing, setRefreshing] = useState(false);

  // Incident Categories
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState("");

  // Cluster Settings
  const [clusterSettings, setClusterSettings] = useState({
    refreshInterval: 30,
    minSamples: 3,
    epsilon: 0.005,
    enabled: true
  });

  // System Stats
  const [stats, setStats] = useState({
    totalReports: 0,
    totalUsers: 0,
    activeClusters: 0,
    lastClusterRun: null,
  });

  useEffect(() => {
    loadConfig();
    loadStats();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getConfig();
      if (response.data) {
        setCategories(response.data.categories || []);
        if (response.data.clustering) {
          setClusterSettings({
            refreshInterval: response.data.clustering.refreshInterval || 30,
            minSamples: response.data.clustering.minSamples || 3,
            epsilon: response.data.clustering.epsilon || 0.005,
            enabled: response.data.clustering.enabled !== false
          });
        }
      }
    } catch (error) {
      console.error("Failed to load config:", error);
      // Use defaults
      setCategories([
        "Theft", "Vandalism", "Accident", "Fire", "Assault",
        "Suspicious Activity", "Public Disturbance", "Traffic Hazard", "Other"
      ]);
    } finally {
      setLoading(false);
    }
  };

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

  const saveConfig = async () => {
    try {
      setSaving(true);
      setMessage({ type: "", text: "" });
      
      await adminAPI.updateConfig({
        categories,
        clustering: {
          refreshInterval: clusterSettings.refreshInterval,
          minSamples: clusterSettings.minSamples,
          epsilon: clusterSettings.epsilon,
          enabled: clusterSettings.enabled
        }
      });
      
      setMessage({
        type: "success",
        text: "Configuration saved successfully!"
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: "Failed to save configuration: " + (error.response?.data?.detail || error.message)
      });
    } finally {
      setSaving(false);
    }
  };

  const triggerClusterRefresh = async () => {
    try {
      setRefreshing(true);
      setMessage({ type: "", text: "" });
      const response = await clustersAPI.refresh();
      setMessage({
        type: "success",
        text: `Cluster analysis completed! ${response.data?.clusters || 0} clusters identified from ${response.data?.reports_analyzed || 0} reports.`
      });
      loadStats();
    } catch (error) {
      setMessage({
        type: "error",
        text: "Failed to trigger cluster analysis"
      });
    } finally {
      setRefreshing(false);
    }
  };

  const addCategory = () => {
    const trimmed = newCategory.trim();
    if (trimmed && !categories.includes(trimmed)) {
      setCategories([...categories, trimmed]);
      setNewCategory("");
    }
  };

  const removeCategory = (cat) => {
    if (categories.length > 1) {
      setCategories(categories.filter((c) => c !== cat));
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

  // Convert epsilon to approximate meters for display
  const epsilonToMeters = (eps) => Math.round(eps * 111000);
  const metersToEpsilon = (meters) => meters / 111000;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-2 text-white">Loading configuration...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Settings size={28} />
          System Configuration
        </h1>
        <button
          onClick={saveConfig}
          disabled={saving}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 text-white rounded-lg font-medium flex items-center gap-2"
        >
          {saving ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Save size={18} />
          )}
          {saving ? "Saving..." : "Save All Changes"}
        </button>
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
        {/* DBSCAN Clustering Settings */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Sliders size={20} />
            DBSCAN Clustering Parameters
          </h2>
          <p className="text-slate-400 text-sm mb-4">
            Adjust the clustering algorithm parameters. Changes take effect on the next cluster refresh.
          </p>

          <div className="space-y-6">
            {/* Enable/Disable */}
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-slate-300">Clustering Enabled</label>
                <p className="text-xs text-slate-500">Turn automatic clustering on or off</p>
              </div>
              <button
                onClick={() => setClusterSettings(prev => ({ ...prev, enabled: !prev.enabled }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  clusterSettings.enabled ? "bg-blue-600" : "bg-slate-600"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    clusterSettings.enabled ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {/* Epsilon (Radius) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-300">
                  Cluster Radius (Epsilon)
                </label>
                <span className="text-sm text-blue-400 font-mono">
                  ~{epsilonToMeters(clusterSettings.epsilon)}m
                </span>
              </div>
              <input
                type="range"
                min="100"
                max="2000"
                step="50"
                value={epsilonToMeters(clusterSettings.epsilon)}
                onChange={(e) => setClusterSettings(prev => ({
                  ...prev,
                  epsilon: metersToEpsilon(parseInt(e.target.value))
                }))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>100m (Dense Urban)</span>
                <span>2000m (Rural)</span>
              </div>
            </div>

            {/* Min Samples */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-300">
                  Minimum Reports per Cluster
                </label>
                <span className="text-sm text-blue-400 font-mono">
                  {clusterSettings.minSamples}
                </span>
              </div>
              <input
                type="range"
                min="2"
                max="10"
                value={clusterSettings.minSamples}
                onChange={(e) => setClusterSettings(prev => ({
                  ...prev,
                  minSamples: parseInt(e.target.value)
                }))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>2 (More Sensitive)</span>
                <span>10 (Less Sensitive)</span>
              </div>
            </div>

            {/* Refresh Interval */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-300">
                  Auto-Refresh Interval
                </label>
                <span className="text-sm text-blue-400 font-mono">
                  {clusterSettings.refreshInterval} min
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="60"
                step="5"
                value={clusterSettings.refreshInterval}
                onChange={(e) => setClusterSettings(prev => ({
                  ...prev,
                  refreshInterval: parseInt(e.target.value)
                }))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>5 min</span>
                <span>60 min</span>
              </div>
            </div>

            {/* Manual Refresh Button */}
            <button
              onClick={triggerClusterRefresh}
              disabled={refreshing || !clusterSettings.enabled}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white rounded-lg font-medium"
            >
              <RefreshCw size={18} className={refreshing ? "animate-spin" : ""} />
              {refreshing ? "Running Analysis..." : "Run Cluster Analysis Now"}
            </button>
          </div>
        </div>

        {/* Incident Categories */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <List size={20} />
            Incident Categories
          </h2>
          <p className="text-slate-400 text-sm mb-4">
            Manage the categories available for incident reports. Changes affect the citizen report form immediately after saving.
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
              disabled={!newCategory.trim()}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-white rounded-lg"
            >
              <Plus size={18} />
            </button>
          </div>

          {/* Categories List */}
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {categories.map((cat, index) => (
              <div
                key={`${cat}-${index}`}
                className="flex items-center justify-between px-3 py-2 bg-slate-700/50 rounded-lg group"
              >
                <span className="text-white">{cat}</span>
                <button
                  onClick={() => removeCategory(cat)}
                  className="p-1 hover:bg-slate-600 rounded text-slate-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  disabled={categories.length <= 1}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
          
          <p className="text-xs text-slate-500 mt-4">
            {categories.length} categories configured
          </p>
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
