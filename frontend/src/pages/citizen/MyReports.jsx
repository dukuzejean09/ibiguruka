import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  MessageCircle,
  ChevronRight,
  Search,
  Filter,
} from "lucide-react";
import { reportsAPI } from "../../services/api";
import { useAuthStore } from "../../store/authStore";

export default function MyReports() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      const response = await reportsAPI.getAll({ userId: user?.id });
      setReports(response.data || []);
    } catch (error) {
      console.error("Failed to load reports:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "resolved":
        return <CheckCircle className="text-green-500" size={18} />;
      case "under_review":
        return <Clock className="text-amber-500" size={18} />;
      case "new":
      default:
        return <AlertTriangle className="text-blue-500" size={18} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "resolved":
        return "bg-green-500/20 text-green-400";
      case "under_review":
        return "bg-amber-500/20 text-amber-400";
      case "new":
      default:
        return "bg-blue-500/20 text-blue-400";
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredReports = reports.filter((report) => {
    const matchesFilter = filter === "all" || report.status === filter;
    const matchesSearch =
      report.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.referenceNumber?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">My Reports</h1>
        <button
          onClick={() => navigate("/citizen/report")}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
        >
          New Report
        </button>
      </div>

      {/* Filters */}
      <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search by category, description, or reference..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="text-slate-400" size={18} />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="new">New</option>
              <option value="under_review">Under Review</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reports List */}
      {filteredReports.length === 0 ? (
        <div className="bg-slate-800 rounded-lg p-12 border border-slate-700 text-center">
          <FileText className="mx-auto text-slate-600 mb-4" size={48} />
          <h3 className="text-xl font-semibold text-white mb-2">
            No Reports Found
          </h3>
          <p className="text-slate-400 mb-6">
            {reports.length === 0
              ? "You haven't submitted any reports yet."
              : "No reports match your search criteria."}
          </p>
          <button
            onClick={() => navigate("/citizen/report")}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
          >
            Submit Your First Report
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReports.map((report) => (
            <div
              key={report.id}
              className="bg-slate-800 rounded-lg p-4 border border-slate-700 hover:border-slate-600 transition-colors cursor-pointer"
              onClick={() => navigate(`/citizen/chat/${report.id}`)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs text-slate-500 font-mono">
                      #{report.referenceNumber || report.id?.slice(-8)}
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        report.status
                      )}`}
                    >
                      {report.status?.replace("_", " ").toUpperCase() || "NEW"}
                    </span>
                  </div>

                  <h3 className="text-lg font-semibold text-white mb-1">
                    {report.category}
                  </h3>

                  <p className="text-slate-400 text-sm line-clamp-2 mb-3">
                    {report.description}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock size={14} />
                      {formatDate(report.timestamp || report.created_at)}
                    </span>
                    {report.hasChat && (
                      <span className="flex items-center gap-1 text-blue-400">
                        <MessageCircle size={14} />
                        Chat available
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {getStatusIcon(report.status)}
                  <ChevronRight className="text-slate-500" size={20} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      {reports.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 text-center">
            <p className="text-2xl font-bold text-white">{reports.length}</p>
            <p className="text-slate-400 text-sm">Total Reports</p>
          </div>
          <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 text-center">
            <p className="text-2xl font-bold text-amber-400">
              {reports.filter((r) => r.status === "under_review").length}
            </p>
            <p className="text-slate-400 text-sm">Under Review</p>
          </div>
          <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 text-center">
            <p className="text-2xl font-bold text-green-400">
              {reports.filter((r) => r.status === "resolved").length}
            </p>
            <p className="text-slate-400 text-sm">Resolved</p>
          </div>
        </div>
      )}
    </div>
  );
}
