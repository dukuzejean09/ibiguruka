import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import { AlertTriangle, TrendingUp, Activity } from "lucide-react";
import { heatmapAPI, alertsAPI } from "../../services/api";
import "leaflet/dist/leaflet.css";

export default function CitizenHome() {
  const [heatmapData, setHeatmapData] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState({ total: 0, thisWeek: 0, resolved: 0 });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [heatmapRes, alertsRes] = await Promise.all([
        heatmapAPI.getData(),
        alertsAPI.getAll(),
      ]);
      setHeatmapData(heatmapRes.data || []);
      setAlerts(alertsRes.data?.slice(0, 3) || []);
      setStats({
        total: 1248,
        thisWeek: 45,
        resolved: 1156,
      });
    } catch (error) {
      console.error("Failed to load data:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <p className="text-slate-400 text-sm">This Week</p>
              <p className="text-3xl font-bold text-white mt-2">
                {stats.thisWeek}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="text-green-500" size={24} />
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
            <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center">
              <AlertTriangle className="text-purple-500" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Safety Map */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h2 className="text-xl font-bold text-white mb-4">
          Community Safety Heat Map
        </h2>
        <div className="h-96 rounded-lg overflow-hidden">
          <MapContainer
            center={[-1.9441, 30.0619]}
            zoom={13}
            style={{ height: "100%", width: "100%" }}
            className="rounded-lg"
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution="&copy; OpenStreetMap contributors &copy; CARTO"
            />
            {heatmapData.map((point, idx) => (
              <Circle
                key={idx}
                center={[point.lat, point.lng]}
                radius={point.radius || 200}
                fillColor="#ef4444"
                fillOpacity={0.3}
                stroke={false}
              />
            ))}
          </MapContainer>
        </div>
        <p className="text-sm text-slate-400 mt-3">
          Red areas indicate higher incident density. Stay alert in these zones.
        </p>
      </div>

      {/* Recent Alerts */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h2 className="text-xl font-bold text-white mb-4">
          Recent Safety Alerts
        </h2>
        <div className="space-y-3">
          {alerts.length > 0 ? (
            alerts.map((alert) => (
              <div
                key={alert.id}
                className="bg-slate-700 rounded-lg p-4 border border-amber-500/30"
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle
                    className="text-amber-500 flex-shrink-0"
                    size={20}
                  />
                  <div className="flex-1">
                    <p className="text-white font-medium">{alert.message}</p>
                    <p className="text-slate-400 text-sm mt-1">
                      {new Date(alert.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-slate-400 text-center py-4">No recent alerts</p>
          )}
        </div>
      </div>
    </div>
  );
}
