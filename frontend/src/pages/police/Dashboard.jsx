import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Circle, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { Activity, AlertTriangle, CheckCircle, Clock, RefreshCw, Filter, Loader2 } from "lucide-react";
import { reportsAPI, clustersAPI, adminAPI } from "../../services/api";

// Component to fit map bounds to markers
function FitBounds({ reports, clusters }) {
  const map = useMap();
  
  useEffect(() => {
    const points = [];
    
    reports.forEach(r => {
      if (r.location?.lat && r.location?.lng) {
        points.push([r.location.lat, r.location.lng]);
      }
    });
    
    clusters.forEach(c => {
      if (c.center?.lat && c.center?.lng) {
        points.push([c.center.lat, c.center.lng]);
      }
    });
    
    if (points.length > 0) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [reports, clusters, map]);
  
  return null;
}

// Custom marker icon creator
const createMarkerIcon = (color) => {
  return L.divIcon({
    className: "custom-marker",
    html: `<div style="background-color: ${color}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7]
  });
};

export default function PoliceDashboard() {
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [clusters, setClusters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [categories, setCategories] = useState([]);
  
  // Filter states
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedTimeframe, setSelectedTimeframe] = useState("24h");
  const [selectedStatuses, setSelectedStatuses] = useState({
    new: true,
    investigating: true,
    resolved: false
  });
  
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    resolved: 0,
    critical: 0,
  });

  useEffect(() => {
    loadData();
    loadCategories();
    const interval = setInterval(loadClusters, 600000);
    return () => clearInterval(interval);
  }, []);

  // Apply filters when filter state changes
  useEffect(() => {
    applyFilters();
  }, [selectedCategory, selectedTimeframe, selectedStatuses, reports]);

  const loadCategories = async () => {
    try {
      const response = await adminAPI.getConfig();
      if (response.data?.categories) {
        setCategories(response.data.categories);
      }
    } catch (error) {
      setCategories([
        "Theft", "Vandalism", "Accident", "Fire", "Assault",
        "Suspicious Activity", "Public Disturbance", "Traffic Hazard", "Other"
      ]);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [reportsRes, clustersRes] = await Promise.all([
        reportsAPI.getAll({ limit: 500 }),
        clustersAPI.getLatest(),
      ]);

      const reportsData = reportsRes.data || [];
      setReports(reportsData);
      setClusters(clustersRes.data || []);
      
      updateStats(reportsData);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateStats = (data) => {
    setStats({
      total: data.length,
      pending: data.filter((r) => r.status === "new").length,
      resolved: data.filter((r) => r.status === "resolved").length,
      critical: data.filter((r) => r.priority === "high" || r.credibilityScore > 0.8).length,
    });
  };

  const applyFilters = () => {
    let filtered = [...reports];
    
    // Category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter(r => r.category === selectedCategory);
    }
    
    // Timeframe filter
    const now = new Date();
    if (selectedTimeframe === "24h") {
      const cutoff = new Date(now - 24 * 60 * 60 * 1000);
      filtered = filtered.filter(r => new Date(r.timestamp) >= cutoff);
    } else if (selectedTimeframe === "7d") {
      const cutoff = new Date(now - 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(r => new Date(r.timestamp) >= cutoff);
    } else if (selectedTimeframe === "30d") {
      const cutoff = new Date(now - 30 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(r => new Date(r.timestamp) >= cutoff);
    }
    
    // Status filter
    const activeStatuses = Object.entries(selectedStatuses)
      .filter(([_, active]) => active)
      .map(([status]) => status);
    
    if (activeStatuses.length > 0) {
      filtered = filtered.filter(r => activeStatuses.includes(r.status));
    }
    
    setFilteredReports(filtered);
    updateStats(filtered);
  };

  const loadClusters = async () => {
    try {
      setRefreshing(true);
      await clustersAPI.refresh();
      const response = await clustersAPI.getLatest();
      setClusters(response.data || []);
    } catch (error) {
      console.error("Failed to refresh clusters:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleStatusChange = (status) => {
    setSelectedStatuses(prev => ({
      ...prev,
      [status]: !prev[status]
    }));
  };

  const getMarkerIcon = (report) => {
    const color = report.status === "new" ? "#3b82f6" : 
                  report.status === "investigating" ? "#f59e0b" : "#22c55e";
    return createMarkerIcon(color);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-2 text-white">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Operations Dashboard</h1>
        <button
          onClick={loadClusters}
          disabled={refreshing}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white rounded-lg font-medium flex items-center gap-2"
        >
          <RefreshCw size={18} className={refreshing ? "animate-spin" : ""} />
          {refreshing ? "Analyzing..." : "Refresh Clusters"}
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Filtered Reports</p>
              <p className="text-3xl font-bold text-white mt-2">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center">
              <Activity className="text-blue-500" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Pending</p>
              <p className="text-3xl font-bold text-white mt-2">{stats.pending}</p>
            </div>
            <div className="w-12 h-12 bg-amber-600/20 rounded-lg flex items-center justify-center">
              <Clock className="text-amber-500" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Resolved</p>
              <p className="text-3xl font-bold text-white mt-2">{stats.resolved}</p>
            </div>
            <div className="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center">
              <CheckCircle className="text-green-500" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">High Priority</p>
              <p className="text-3xl font-bold text-white mt-2">{stats.critical}</p>
            </div>
            <div className="w-12 h-12 bg-red-600/20 rounded-lg flex items-center justify-center">
              <AlertTriangle className="text-red-500" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Map and Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Filter size={20} />
            Filters
          </h3>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">
                Category
              </label>
              <select 
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">
                Timeframe
              </label>
              <div className="space-y-2">
                {[
                  { value: "24h", label: "Last 24 Hours" },
                  { value: "7d", label: "Last 7 Days" },
                  { value: "30d", label: "Last 30 Days" },
                  { value: "all", label: "All Time" }
                ].map(tf => (
                  <button 
                    key={tf.value}
                    onClick={() => setSelectedTimeframe(tf.value)}
                    className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedTimeframe === tf.value 
                        ? "bg-blue-600 text-white" 
                        : "bg-slate-700 hover:bg-slate-600 text-white"
                    }`}
                  >
                    {tf.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">
                Status
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={selectedStatuses.new}
                    onChange={() => handleStatusChange("new")}
                    className="rounded bg-slate-700 border-slate-600 text-blue-500 focus:ring-blue-500"
                  />
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  New
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={selectedStatuses.investigating}
                    onChange={() => handleStatusChange("investigating")}
                    className="rounded bg-slate-700 border-slate-600 text-blue-500 focus:ring-blue-500"
                  />
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  Under Investigation
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={selectedStatuses.resolved}
                    onChange={() => handleStatusChange("resolved")}
                    className="rounded bg-slate-700 border-slate-600 text-blue-500 focus:ring-blue-500"
                  />
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  Resolved
                </label>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-700">
              <p className="text-xs text-slate-400">
                Showing {filteredReports.length} of {reports.length} reports
              </p>
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="lg:col-span-3 bg-slate-800 rounded-lg p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Live Incident Map</h3>
            <div className="flex items-center gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-blue-500"></span> New
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-amber-500"></span> Investigating
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-green-500"></span> Resolved
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-red-500 opacity-50"></span> Cluster
              </span>
            </div>
          </div>
          <div className="h-[500px] rounded-lg overflow-hidden">
            <MapContainer
              center={[-1.9441, 30.0619]}
              zoom={13}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution="&copy; OpenStreetMap contributors"
              />

              {/* Auto-fit bounds */}
              <FitBounds reports={filteredReports} clusters={clusters} />

              {/* Report Markers */}
              {filteredReports.map((report) => (
                <Marker
                  key={report.id}
                  position={[report.location.lat, report.location.lng]}
                  icon={getMarkerIcon(report)}
                >
                  <Popup>
                    <div className="p-2 min-w-[200px]">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-gray-900">{report.category}</h4>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          report.status === "new" ? "bg-blue-100 text-blue-700" :
                          report.status === "investigating" ? "bg-amber-100 text-amber-700" :
                          "bg-green-100 text-green-700"
                        }`}>
                          {report.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{report.description}</p>
                      {report.referenceNumber && (
                        <p className="text-xs text-gray-500 font-mono">{report.referenceNumber}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(report.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </Popup>
                </Marker>
              ))}

              {/* Cluster Circles */}
              {clusters.map((cluster) => (
                <Circle
                  key={cluster.id}
                  center={[cluster.center.lat, cluster.center.lng]}
                  radius={cluster.radius || 500}
                  pathOptions={{
                    color: cluster.riskLevel === "high" ? "#ef4444" : "#f59e0b",
                    fillColor: cluster.riskLevel === "high" ? "#ef4444" : "#f59e0b",
                    fillOpacity: 0.2,
                    weight: 2
                  }}
                >
                  <Popup>
                    <div className="p-2">
                      <h4 className={`font-bold ${cluster.riskLevel === "high" ? "text-red-600" : "text-amber-600"}`}>
                        {cluster.riskLevel === "high" ? "High Risk" : "Medium Risk"} Hotspot
                      </h4>
                      <p className="text-sm text-gray-600">{cluster.points?.length || 0} incidents clustered</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Radius: ~{Math.round(cluster.radius || 500)}m
                      </p>
                    </div>
                  </Popup>
                </Circle>
              ))}
            </MapContainer>
          </div>
        </div>
      </div>

      {/* Recent Reports Table */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">
          Recent Reports ({filteredReports.length})
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-slate-400 border-b border-slate-700">
                <th className="pb-3 font-medium">Reference</th>
                <th className="pb-3 font-medium">Category</th>
                <th className="pb-3 font-medium">Description</th>
                <th className="pb-3 font-medium">Location</th>
                <th className="pb-3 font-medium">Time</th>
                <th className="pb-3 font-medium">Priority</th>
                <th className="pb-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.slice(0, 15).map((report) => (
                <tr
                  key={report.id}
                  className="border-b border-slate-700 hover:bg-slate-700/50 cursor-pointer"
                >
                  <td className="py-3 text-slate-300 font-mono text-xs">
                    {report.referenceNumber || "N/A"}
                  </td>
                  <td className="py-3 text-white font-medium">{report.category}</td>
                  <td className="py-3 text-slate-300 max-w-xs truncate">
                    {report.description?.substring(0, 50)}{report.description?.length > 50 ? "..." : ""}
                  </td>
                  <td className="py-3 text-slate-400 text-sm">
                    {report.location.lat.toFixed(4)}, {report.location.lng.toFixed(4)}
                  </td>
                  <td className="py-3 text-slate-400 text-sm">
                    {new Date(report.timestamp).toLocaleString("en-US", {
                      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                    })}
                  </td>
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      report.priority === "high" ? "bg-red-600/20 text-red-400" :
                      report.priority === "low" ? "bg-slate-600/20 text-slate-400" :
                      "bg-amber-600/20 text-amber-400"
                    }`}>
                      {report.priority || "medium"}
                    </span>
                  </td>
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      report.status === "new" ? "bg-blue-600/20 text-blue-400" :
                      report.status === "resolved" ? "bg-green-600/20 text-green-400" :
                      "bg-amber-600/20 text-amber-400"
                    }`}>
                      {report.status}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredReports.length === 0 && (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400">
                    No reports match the current filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
