import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import {
  Camera,
  MapPin,
  Send,
  Mic,
  Loader2,
  AlertTriangle,
  Wifi,
  WifiOff,
} from "lucide-react";
import { reportsAPI, adminAPI } from "../../services/api";
import { useAuthStore } from "../../store/authStore";
import L from "leaflet";

// Fix Leaflet default marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Default categories (used as fallback)
const defaultCategories = [
  "Theft",
  "Vandalism",
  "Accident",
  "Fire",
  "Assault",
  "Suspicious Activity",
  "Public Disturbance",
  "Traffic Hazard",
  "Other",
];

// Categories that require mandatory photo
const PHOTO_REQUIRED_CATEGORIES = ["Theft", "Suspicious Activity"];

/**
 * Generate a privacy-preserving device fingerprint.
 * This uses non-personal, non-unique properties to create a
 * pseudonymous identifier that cannot be reversed to identify the user.
 */
function generateDeviceFingerprint() {
  const data = [
    screen.width + "x" + screen.height,
    new Date().getTimezoneOffset(),
    navigator.language,
    navigator.platform,
    navigator.hardwareConcurrency || "",
    navigator.deviceMemory || "",
  ].join("|");

  // Simple hash function (in production, use SHA-256)
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }

  // Convert to hex string and pad to 32 characters
  const hexHash = Math.abs(hash).toString(16).padStart(16, "0");
  return hexHash + hexHash; // 32 char fingerprint
}

function LocationMarker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });

  return position ? <Marker position={position} /> : null;
}

export default function ReportIncident() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [categories, setCategories] = useState(defaultCategories);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queuedReports, setQueuedReports] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);

  const [formData, setFormData] = useState({
    category: "",
    description: "",
    photo: null,
  });

  const [position, setPosition] = useState([-1.9441, 30.0619]);
  const [referenceNumber, setReferenceNumber] = useState("");

  useEffect(() => {
    // Get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setPosition([pos.coords.latitude, pos.coords.longitude]);
        },
        (err) => console.error("Location error:", err)
      );
    }

    // Load categories from config
    loadCategories();
  }, []);

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncQueuedReports();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Load queued reports on component mount
  useEffect(() => {
    const saved = localStorage.getItem("queuedReports");
    if (saved) {
      setQueuedReports(JSON.parse(saved));
    }
  }, []);

  const loadCategories = async () => {
    try {
      const response = await adminAPI.getConfig();
      if (response.data?.categories?.length > 0) {
        setCategories(response.data.categories);
      }
    } catch (error) {
      console.error("Failed to load categories, using defaults:", error);
    }
  };

  const handleVoiceInput = () => {
    if (
      !("webkitSpeechRecognition" in window || "SpeechRecognition" in window)
    ) {
      alert("Voice recognition not supported in your browser");
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US"; // English
    recognition.interimResults = false;

    recognition.onstart = () => setIsRecording(true);
    recognition.onend = () => setIsRecording(false);

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setFormData((prev) => ({
        ...prev,
        description: prev.description + " " + transcript,
      }));
    };

    recognition.start();
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, photo: file });
    }
  };

  const syncQueuedReports = async () => {
    if (!isOnline || queuedReports.length === 0) return;

    setIsSyncing(true);
    const remainingReports = [];

    for (const queuedReport of queuedReports) {
      try {
        const response = await reportsAPI.submit(queuedReport.data);
        // Successfully submitted, don't add to remaining
        console.log(`Synced queued report: ${queuedReport.id}`);
      } catch (error) {
        console.error(`Failed to sync report ${queuedReport.id}:`, error);
        remainingReports.push(queuedReport);
      }
    }

    setQueuedReports(remainingReports);
    localStorage.setItem("queuedReports", JSON.stringify(remainingReports));
    setIsSyncing(false);
  };

  const queueReport = (reportData) => {
    const queuedReport = {
      id: Date.now().toString(),
      data: reportData,
      timestamp: new Date().toISOString(),
    };

    const updatedQueue = [...queuedReports, queuedReport];
    setQueuedReports(updatedQueue);
    localStorage.setItem("queuedReports", JSON.stringify(updatedQueue));

    return queuedReport.id;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Check mandatory photo for high-risk categories
    if (
      PHOTO_REQUIRED_CATEGORIES.includes(formData.category) &&
      !formData.photo
    ) {
      setError(
        `Photo is required for ${formData.category} reports to ensure credibility.`
      );
      return;
    }

    setLoading(true);

    try {
      // Generate privacy-preserving device fingerprint
      const deviceFingerprint = generateDeviceFingerprint();

      const reportData = {
        ...formData,
        location: { lat: position[0], lng: position[1] },
        userId: user?.id || "anonymous",
        deviceFingerprint: deviceFingerprint,
      };

      if (!isOnline) {
        // Queue report for later submission
        const queueId = queueReport(reportData);
        setReferenceNumber(`QUEUED-${queueId}`);
        setSuccess(true);
        setError("Report queued for submission when connection is restored.");
        return;
      }

      const response = await reportsAPI.submit(reportData);
      setReferenceNumber(response.data?.referenceNumber || "");

      // Check if report was delayed due to low trust
      if (response.data?.notice) {
        setError(response.data.notice);
      }

      setSuccess(true);

      setTimeout(() => {
        navigate("/citizen");
      }, 4000);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          "Failed to submit report"
      );
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Send className="text-white" size={40} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Report Submitted!
          </h2>
          {referenceNumber && (
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 mb-4">
              <p className="text-slate-400 text-sm mb-1">
                Your Reference Number
              </p>
              <p className="text-2xl font-mono font-bold text-blue-400">
                {referenceNumber}
              </p>
              <p className="text-slate-500 text-xs mt-2">
                Save this number to track your report
              </p>
            </div>
          )}
          <p className="text-slate-400">
            Thank you for keeping our community safe.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h1 className="text-2xl font-bold text-white mb-6">
          Report an Incident
        </h1>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Online/Offline Status Indicator */}
        <div
          className={`flex items-center justify-between px-4 py-3 rounded-lg mb-6 border ${
            isOnline
              ? "bg-green-500/10 border-green-500 text-green-400"
              : "bg-amber-500/10 border-amber-500 text-amber-400"
          }`}
        >
          <div className="flex items-center gap-2">
            {isOnline ? <Wifi size={18} /> : <WifiOff size={18} />}
            <span className="font-medium">
              {isOnline ? "Online" : "Offline - Reports will be queued"}
            </span>
            {isSyncing && (
              <span className="text-sm text-blue-400 ml-2">Syncing...</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!isOnline && queuedReports.length > 0 && (
              <div className="text-sm">
                {queuedReports.length} report
                {queuedReports.length !== 1 ? "s" : ""} queued
              </div>
            )}
            {isOnline && queuedReports.length > 0 && (
              <button
                type="button"
                onClick={syncQueuedReports}
                disabled={isSyncing}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSyncing ? "Syncing..." : "Sync Now"}
              </button>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Incident Category *
            </label>
            <select
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            {HIGH_RISK_CATEGORIES.includes(formData.category) && (
              <div className="flex items-center gap-2 mt-2 text-amber-400 text-sm">
                <AlertCircle size={16} />
                <span>Photo evidence is required for this category</span>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-slate-300">
                Description *
              </label>
              <button
                type="button"
                onClick={handleVoiceInput}
                className={`flex items-center gap-2 px-3 py-1 rounded-lg transition-colors ${
                  isRecording
                    ? "bg-red-600 text-white"
                    : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                }`}
              >
                <Mic size={16} />
                {isRecording ? "Recording..." : "Voice Input"}
              </button>
            </div>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="5"
              placeholder="Describe what happened... (You can also use voice input)"
              required
            />
          </div>

          {/* Location Map */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              <MapPin className="inline mr-1" size={16} />
              Location (Click on map to adjust)
            </label>
            <div className="h-64 rounded-lg overflow-hidden border border-slate-600">
              <MapContainer
                center={position}
                zoom={15}
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                <LocationMarker position={position} setPosition={setPosition} />
              </MapContainer>
            </div>
            <p className="text-sm text-slate-400 mt-2">
              Coordinates: {position[0].toFixed(4)}, {position[1].toFixed(4)}
            </p>
          </div>

          {/* Photo Upload */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Photo Evidence{" "}
              {HIGH_RISK_CATEGORIES.includes(formData.category) ? (
                <span className="text-amber-400">* Required</span>
              ) : (
                <span className="text-slate-400">(Optional)</span>
              )}
            </label>
            <div className="flex items-center gap-4">
              <label
                className={`flex items-center gap-2 px-4 py-3 border rounded-lg cursor-pointer transition-colors ${
                  HIGH_RISK_CATEGORIES.includes(formData.category) &&
                  !formData.photo
                    ? "bg-amber-900/30 border-amber-600 text-amber-300 hover:bg-amber-900/50"
                    : "bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600"
                }`}
              >
                <Camera size={20} />
                Choose Photo
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
              {formData.photo && (
                <span className="text-sm text-green-400">
                  {formData.photo.name}
                </span>
              )}
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate("/citizen")}
              className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-semibold rounded-lg transition-colors"
            >
              {loading ? "Submitting..." : "Submit Report"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
