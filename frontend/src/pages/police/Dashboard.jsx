import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Circle, Popup } from "react-leaflet";
import { Activity, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { reportsAPI, clustersAPI } from "../../services/api";

export default function PoliceDashboard() {
  const [reports, setReports] = useState([]);
  const [clusters, setClusters] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    resolved: 0,
    critical: 0,
  });

  useEffect(() => {
    loadData();
    const interval = setInterval(loadClusters, 600000); // Refresh every 10 minutes
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [reportsRes, clustersRes] = await Promise.all([
        reportsAPI.getAll({ limit: 100 }),
        clustersAPI.getLatest(),
      ]);

      const reportsData = reportsRes.data || [];
      setReports(reportsData);
      setClusters(clustersRes.data || []);

      setStats({
        total: reportsData.length,
        pending: reportsData.filter((r) => r.status === "new").length,
        resolved: reportsData.filter((r) => r.status === "resolved").length,
        critical: reportsData.filter((r) => r.credibilityScore > 0.8).length,
      });
    } catch (error) {
      console.error("Failed to load data:", error);
    }
  };

  const loadClusters = async () => {
    try {
      const response = await clustersAPI.getLatest();
      setClusters(response.data || []);
    } catch (error) {
      console.error("Failed to refresh clusters:", error);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Operations Dashboard</h1>
        <button
          onClick={loadClusters}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
        >
          Refresh Clusters
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Total Reports</p>
              <p className="text-3xl font-bold text-white mt-2">
                {stats.total}
              </p>
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
              <p className="text-3xl font-bold text-white mt-2">
                {stats.pending}
              </p>
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
              <p className="text-3xl font-bold text-white mt-2">
                {stats.resolved}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center">
              <CheckCircle className="text-green-500" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Critical</p>
              <p className="text-3xl font-bold text-white mt-2">
                {stats.critical}
              </p>
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
          <h3 className="text-lg font-semibold text-white mb-4">Filters</h3>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">
                Category
              </label>
              <select className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm">
                <option>All Categories</option>
                <option>Theft</option>
                <option>Accident</option>
                <option>Vandalism</option>
                <option>Fire</option>
                <option>Assault</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">
                Timeframe
              </label>
              <div className="space-y-2">
                <button className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">
                  Last 24h
                </button>
                <button className="w-full px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium">
                  Last 7 Days
                </button>
                <button className="w-full px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium">
                  Last 30 Days
                </button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">
                Status
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm text-slate-300">
                  <input type="checkbox" defaultChecked className="rounded" />
                  New
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-300">
                  <input type="checkbox" defaultChecked className="rounded" />
                  Under Investigation
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-300">
                  <input type="checkbox" className="rounded" />
                  Resolved
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="lg:col-span-3 bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">
            Live Incident Map
          </h3>
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

              {/* Report Markers */}
              {reports.map((report) => (
                <Marker
                  key={report.id}
                  position={[report.location.lat, report.location.lng]}
                >
                  <Popup>
                    <div className="p-2">
                      <h4 className="font-bold">{report.category}</h4>
                      <p className="text-sm">{report.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
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
                    color: "red",
                    fillColor: "#ef4444",
                    fillOpacity: 0.3,
                  }}
                >
                  <Popup>
                    <div className="p-2">
                      <h4 className="font-bold text-red-600">
                        Hotspot Cluster
                      </h4>
                      <p className="text-sm">
                        {cluster.points?.length || 0} incidents
                      </p>
                      <p className="text-sm">
                        Risk Level: {cluster.riskLevel || "High"}
                      </p>
                    </div>
                  </Popup>
                </Circle>
              ))}
            </MapContainer>
          </div>
        </div>
      </div>

      {/* Recent Reports */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">
          Recent Reports
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-slate-400 border-b border-slate-700">
                <th className="pb-3 font-medium">Category</th>
                <th className="pb-3 font-medium">Description</th>
                <th className="pb-3 font-medium">Location</th>
                <th className="pb-3 font-medium">Time</th>
                <th className="pb-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {reports.slice(0, 10).map((report) => (
                <tr
                  key={report.id}
                  className="border-b border-slate-700 hover:bg-slate-700/50"
                >
                  <td className="py-3 text-white font-medium">
                    {report.category}
                  </td>
                  <td className="py-3 text-slate-300">
                    {report.description?.substring(0, 50)}...
                  </td>
                  <td className="py-3 text-slate-400 text-sm">
                    {report.location.lat.toFixed(4)},{" "}
                    {report.location.lng.toFixed(4)}
                  </td>
                  <td className="py-3 text-slate-400 text-sm">
                    {new Date(report.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        report.status === "new"
                          ? "bg-blue-600/20 text-blue-400"
                          : report.status === "resolved"
                          ? "bg-green-600/20 text-green-400"
                          : "bg-amber-600/20 text-amber-400"
                      }`}
                    >
                      {report.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
