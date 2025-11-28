import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Circle, Popup } from "react-leaflet";
import { Shield, Info, Calendar, ArrowLeft } from "lucide-react";
import "leaflet/dist/leaflet.css";

export default function CommunitySafetyMap() {
  const navigate = useNavigate();
  const [clusters, setClusters] = useState([]);
  const [timeFilter, setTimeFilter] = useState("24h");
  const [loading, setLoading] = useState(true);

  const center = [-1.9441, 30.0619]; // Kigali, Rwanda

  useEffect(() => {
    fetchClusters();
  }, [timeFilter]);

  const fetchClusters = async () => {
    try {
      setLoading(true);
      // Replace with actual API call
      // For now, mock data
      const mockClusters = [
        {
          id: 1,
          center: [-1.95, 30.06],
          radius: 500,
          intensity: "high",
          count: 12,
        },
        {
          id: 2,
          center: [-1.94, 30.07],
          radius: 400,
          intensity: "medium",
          count: 6,
        },
        {
          id: 3,
          center: [-1.93, 30.055],
          radius: 300,
          intensity: "low",
          count: 3,
        },
      ];
      setClusters(mockClusters);
    } catch (error) {
      console.error("Failed to fetch clusters:", error);
    } finally {
      setLoading(false);
    }
  };

  const getColorByIntensity = (intensity) => {
    switch (intensity) {
      case "high":
        return "#ef4444"; // red
      case "medium":
        return "#f59e0b"; // orange
      case "low":
        return "#eab308"; // yellow
      default:
        return "#3b82f6"; // blue
    }
  };

  const getLabelByIntensity = (intensity) => {
    switch (intensity) {
      case "high":
        return "High Activity";
      case "medium":
        return "Moderate Activity";
      case "low":
        return "Low Activity";
      default:
        return "Activity";
    }
  };

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate("/welcome")}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <ArrowLeft className="text-white" size={24} />
              </button>
              <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                <Shield size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">
                  Community Safety Map
                </h1>
                <p className="text-xs text-slate-400">
                  Anonymized incident patterns
                </p>
              </div>
            </div>

            {/* Time Filter */}
            <div className="flex items-center space-x-2">
              <Calendar size={20} className="text-slate-400" />
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
                className="bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Info Panel */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-4">
          <div className="flex items-start space-x-3">
            <Info className="text-blue-400 flex-shrink-0 mt-0.5" size={20} />
            <div className="text-sm text-blue-200">
              <p className="font-semibold mb-1">Privacy Notice</p>
              <p>
                This map displays <strong>anonymized</strong> safety patterns
                based on recent incident reports. No individual report
                locations, personal information, or real-time incidents are
                shown. The data is aggregated and generalized to protect privacy
                while helping you understand safety trends in your community.
              </p>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="bg-slate-800 rounded-lg p-4 mb-4">
          <h3 className="text-white font-semibold mb-3">Activity Levels</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-full bg-red-500"></div>
              <span className="text-sm text-slate-300">
                High Activity (10+ reports)
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-full bg-orange-500"></div>
              <span className="text-sm text-slate-300">
                Moderate Activity (6-9 reports)
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-full bg-yellow-500"></div>
              <span className="text-sm text-slate-300">
                Low Activity (3-5 reports)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="max-w-7xl mx-auto px-4 pb-8">
        <div
          className="bg-slate-800 rounded-lg overflow-hidden shadow-2xl"
          style={{ height: "600px" }}
        >
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-400">Loading safety data...</p>
              </div>
            </div>
          ) : (
            <MapContainer
              center={center}
              zoom={13}
              style={{ height: "100%", width: "100%" }}
              className="z-0"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {clusters.map((cluster) => (
                <Circle
                  key={cluster.id}
                  center={cluster.center}
                  radius={cluster.radius}
                  pathOptions={{
                    color: getColorByIntensity(cluster.intensity),
                    fillColor: getColorByIntensity(cluster.intensity),
                    fillOpacity: 0.4,
                  }}
                >
                  <Popup>
                    <div className="p-2">
                      <h4 className="font-semibold mb-1">
                        {getLabelByIntensity(cluster.intensity)}
                      </h4>
                      <p className="text-sm text-gray-600">
                        Approximately {cluster.count} reports in this area (
                        {timeFilter})
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        Data is anonymized and generalized for privacy
                      </p>
                    </div>
                  </Popup>
                </Circle>
              ))}
            </MapContainer>
          )}
        </div>
      </div>

      {/* Call to Action */}
      <div className="max-w-7xl mx-auto px-4 pb-8">
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-8 text-center">
          <h3 className="text-2xl font-bold text-white mb-2">
            Want to help make your community safer?
          </h3>
          <p className="text-white/90 mb-6">
            Report incidents and stay connected with local law enforcement
          </p>
          <button
            onClick={() => navigate("/login")}
            className="bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
}
