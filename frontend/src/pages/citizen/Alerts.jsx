import { useState, useEffect } from "react";
import { Bell, MapPin, Clock } from "lucide-react";
import { alertsAPI } from "../../services/api";

export default function CitizenAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      const response = await alertsAPI.getAll();
      setAlerts(response.data || []);
    } catch (error) {
      console.error("Failed to load alerts:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h1 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <Bell size={28} />
          Safety Alerts
        </h1>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
          </div>
        ) : alerts.length > 0 ? (
          <div className="space-y-4">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="bg-slate-700 rounded-lg p-5 border border-slate-600 hover:border-amber-500/50 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-amber-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Bell className="text-amber-500" size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {alert.title || "Safety Alert"}
                    </h3>
                    <p className="text-slate-300 mb-3">{alert.message}</p>
                    <div className="flex items-center gap-4 text-sm text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {new Date(alert.timestamp).toLocaleString()}
                      </span>
                      {alert.area && (
                        <span className="flex items-center gap-1">
                          <MapPin size={14} />
                          {alert.area.name || "Kigali Area"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Bell size={48} className="text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No alerts at this time</p>
          </div>
        )}
      </div>
    </div>
  );
}
