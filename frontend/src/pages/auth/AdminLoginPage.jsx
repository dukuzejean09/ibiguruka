import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { authAPI } from "../../services/api";
import { Shield, Mail, Lock, ArrowLeft } from "lucide-react";

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await authAPI.loginAdmin(formData);
      const { user, access_token, role } = response.data;

      setAuth(user, role, access_token);
      localStorage.setItem("token", access_token);

      navigate("/admin");
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          "Authentication failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-900">
      {/* Left Side - Image/Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-blue-800 p-12 flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 text-white mb-8">
            <Shield size={40} />
            <h1 className="text-3xl font-bold">Rwanda National Police</h1>
          </div>
          <h2 className="text-5xl font-bold text-white leading-tight">
            Building a Safer
            <br />
            Community,
            <br />
            Together.
          </h2>
        </div>
        <div className="text-white/80">
          <p className="text-lg">Incident Management Platform</p>
          <p className="text-sm mt-2">Version 1.0 - Secure Access Portal</p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">
              Officer Login
            </h2>
            <p className="text-slate-400">
              Enter your credentials to access the dashboard
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Username or Email
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={20}
                />
                <input
                  type="text"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="officer@police.rw"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={20}
                />
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              {loading ? "Authenticating..." : "Login"}
            </button>
          </form>

          <button
            onClick={() => navigate("/login")}
            className="mt-6 flex items-center gap-2 text-slate-400 hover:text-slate-300 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Citizen Login
          </button>

          <div className="mt-8 p-4 bg-slate-800 rounded-lg border border-slate-700">
            <p className="text-sm text-slate-400 mb-2">
              Default Admin Credentials:
            </p>
            <p className="text-xs text-slate-500">
              Email: admin@trustbond.rw
              <br />
              Password: Admin123
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
