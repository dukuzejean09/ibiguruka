import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { Camera, MapPin, Send, Mic } from "lucide-react";
import { reportsAPI } from "../../services/api";
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

const categories = [
  "Theft",
  "Vandalism",
  "Accident",
  "Fire",
  "Assault",
  "Suspicious Activity",
  "Public Disturbance",
  "Other",
];

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
  }, []);

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
    recognition.lang = "rw-RW"; // Kinyarwanda
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const reportData = {
        ...formData,
        location: { lat: position[0], lng: position[1] },
        userId: user?.id || "anonymous",
      };

      const response = await reportsAPI.submit(reportData);
      setReferenceNumber(response.data?.referenceNumber || "");
      setSuccess(true);

      setTimeout(() => {
        navigate("/citizen");
      }, 4000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit report");
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
              Photo Evidence (Optional)
            </label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-slate-300 hover:bg-slate-600 cursor-pointer transition-colors">
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
