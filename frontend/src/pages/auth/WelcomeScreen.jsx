import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Shield,
  AlertCircle,
  Map,
  FileText,
  Users,
  TrendingUp,
} from "lucide-react";

export default function WelcomeScreen() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalReports: 0,
    reportsThisWeek: 0,
    activeUsers: 0,
  });

  useEffect(() => {
    // Fetch statistics from API
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Replace with actual API call
      // For now, using mock data
      setStats({
        totalReports: 1247,
        reportsThisWeek: 89,
        activeUsers: 342,
      });
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <div className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
              <Shield size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">
                NeighborWatch Connect
              </h1>
              <p className="text-xs text-slate-400">
                Community Safety Platform
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate("/login")}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Login / Register
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Building Safer Communities Together
          </h2>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            Report incidents, view safety trends, and stay informed about your
            neighborhood
          </p>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-slate-800/70 backdrop-blur-sm p-6 rounded-xl border border-slate-700">
              <FileText className="w-12 h-12 text-blue-500 mx-auto mb-3" />
              <div className="text-3xl font-bold text-white mb-1">
                {stats.totalReports}
              </div>
              <div className="text-slate-400">Total Reports Filed</div>
            </div>
            <div className="bg-slate-800/70 backdrop-blur-sm p-6 rounded-xl border border-slate-700">
              <TrendingUp className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <div className="text-3xl font-bold text-white mb-1">
                {stats.reportsThisWeek}
              </div>
              <div className="text-slate-400">Reports This Week</div>
            </div>
            <div className="bg-slate-800/70 backdrop-blur-sm p-6 rounded-xl border border-slate-700">
              <Users className="w-12 h-12 text-purple-500 mx-auto mb-3" />
              <div className="text-3xl font-bold text-white mb-1">
                {stats.activeUsers}
              </div>
              <div className="text-slate-400">Active Community Members</div>
            </div>
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Report Incident */}
          <div
            onClick={() => navigate("/login")}
            className="bg-gradient-to-br from-blue-600 to-blue-700 p-8 rounded-2xl shadow-2xl cursor-pointer hover:scale-105 transition-transform"
          >
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4">
              <AlertCircle size={32} className="text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">
              Report Incident
            </h3>
            <p className="text-blue-100 mb-4">
              Submit an incident report anonymously or with your account
            </p>
            <button className="bg-white text-blue-600 px-6 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-colors">
              Get Started
            </button>
          </div>

          {/* My Reports */}
          <div
            onClick={() => navigate("/login")}
            className="bg-gradient-to-br from-indigo-600 to-indigo-700 p-8 rounded-2xl shadow-2xl cursor-pointer hover:scale-105 transition-transform"
          >
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4">
              <FileText size={32} className="text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">My Reports</h3>
            <p className="text-indigo-100 mb-4">
              View your report history and track their status
            </p>
            <button className="bg-white text-indigo-600 px-6 py-2 rounded-lg font-semibold hover:bg-indigo-50 transition-colors">
              View Reports
            </button>
            <p className="text-xs text-indigo-200 mt-2">
              (Registered users only)
            </p>
          </div>

          {/* Community Safety Map */}
          <div
            onClick={() => navigate("/safety-map")}
            className="bg-gradient-to-br from-purple-600 to-purple-700 p-8 rounded-2xl shadow-2xl cursor-pointer hover:scale-105 transition-transform"
          >
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4">
              <Map size={32} className="text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">
              Community Safety Map
            </h3>
            <p className="text-purple-100 mb-4">
              View anonymized safety trends in your area
            </p>
            <button className="bg-white text-purple-600 px-6 py-2 rounded-lg font-semibold hover:bg-purple-50 transition-colors">
              View Map
            </button>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-slate-800/70 backdrop-blur-sm rounded-2xl p-8 border border-slate-700">
          <h3 className="text-2xl font-bold text-white mb-6 text-center">
            How It Works
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">
                1
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">Report</h4>
              <p className="text-slate-400">
                Submit an incident with location, category, and optional photo
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">
                2
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">Review</h4>
              <p className="text-slate-400">
                Police officers review and respond to your report
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">
                3
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">
                Stay Informed
              </h4>
              <p className="text-slate-400">
                Track progress and view community safety trends
              </p>
            </div>
          </div>
        </div>

        {/* Footer Links */}
        <div className="mt-12 text-center">
          <div className="flex items-center justify-center gap-6 text-sm">
            <button
              onClick={() => navigate("/police-login")}
              className="text-indigo-400 hover:text-indigo-300 font-medium"
            >
              Police Officer Portal →
            </button>
            <span className="text-slate-600">|</span>
            <button
              onClick={() => navigate("/admin-login")}
              className="text-purple-400 hover:text-purple-300 font-medium"
            >
              Admin Portal →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
