import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { authAPI } from "../../services/api";
import { Shield, Mail, Lock, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    phone: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = isRegister
        ? await authAPI.register(formData)
        : await authAPI.login(formData);

      const { user, token, role } = response.data;
      setAuth(user, role || "citizen", token);
      localStorage.setItem("token", token);

      navigate("/citizen");
    } catch (err) {
      setError(err.response?.data?.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleAnonymous = () => {
    setAuth({ id: "anonymous", name: "Anonymous User" }, "anonymous", null);
    navigate("/citizen");
  };

  const goToAdminLogin = () => {
    navigate("/admin-login");
  };

  const goToPoliceLogin = () => {
    navigate("/police-login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-full mb-4">
            <Shield size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            NeighborWatch Connect
          </h1>
          <p className="text-slate-300">Community Safety Platform</p>
        </div>

        <div className="bg-slate-800 rounded-2xl shadow-2xl p-8">
          <h2 className="text-2xl font-semibold text-white mb-6">
            {isRegister ? "Create Account" : "Welcome Back"}
          </h2>

          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Email or Phone
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
                  className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your email or phone"
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
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full pl-10 pr-12 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              {loading
                ? "Please wait..."
                : isRegister
                ? "Create Account"
                : "Login"}
            </button>
          </form>

          <div className="mt-6 space-y-3">
            <button
              onClick={handleAnonymous}
              className="w-full bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              Continue Anonymously
            </button>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <button
                  onClick={() => setIsRegister(!isRegister)}
                  className="text-blue-400 hover:text-blue-300"
                >
                  {isRegister
                    ? "Already have an account?"
                    : "Create new account"}
                </button>
              </div>

              <div className="flex items-center justify-center gap-3 text-sm pt-2 border-t border-slate-700">
                <button
                  onClick={goToPoliceLogin}
                  className="text-indigo-400 hover:text-indigo-300 font-medium"
                >
                  Police Officer →
                </button>
                <span className="text-slate-600">|</span>
                <button
                  onClick={goToAdminLogin}
                  className="text-purple-400 hover:text-purple-300 font-medium"
                >
                  Admin →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
