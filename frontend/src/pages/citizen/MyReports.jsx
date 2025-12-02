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
  Eye,
  X,
} from "lucide-react";
import { reportsAPI, chatAPI } from "../../services/api";
import { useAuthStore } from "../../store/authStore";

export default function MyReports() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedReport, setSelectedReport] = useState(null);

  useEffect(() => {
    loadReports();
    loadStats();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      const response = await reportsAPI.getAll();
      setReports(response.data || []);
    } catch (error) {
      console.error("Failed to load reports:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await reportsAPI.getStats();
      setStats(response.data);
    } catch (error) {
      console.error("Failed to load stats:", error);
    }
  };

  const handleStartChat = async (reportId) => {
    try {
      const response = await chatAPI.start(reportId);
      navigate(`/citizen/chat`);
    } catch (error) {
      console.error("Failed to start chat:", error);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "resolved":
      case "closed":
        return <CheckCircle className="text-green-500" size={18} />;
      case "investigating":
        return <Clock className="text-amber-500" size={18} />;
      case "new":
      default:
        return <AlertTriangle className="text-blue-500" size={18} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "resolved":
      case "closed":
        return "bg-green-500/20 text-green-400";
      case "investigating":
        return "bg-amber-500/20 text-amber-400";
      case "new":
      default:
        return "bg-blue-500/20 text-blue-400";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "text-red-400";
      case "medium":
        return "text-amber-400";
      case "low":
        return "text-green-400";
      default:
        return "text-slate-400";
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">My Reports</h1>
        <button
          onClick={() => navigate("/citizen/report")}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm"
        >
          New Report
        </button>
      </div>

      {/* Stats Summary */}
      {stats && (
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-slate-800 rounded-lg p-3 border border-slate-700 text-center">
            <p className="text-xl font-bold text-white">{stats.total}</p>
            <p className="text-slate-400 text-xs">Total</p>
          </div>
          <div className="bg-slate-800 rounded-lg p-3 border border-slate-700 text-center">
            <p className="text-xl font-bold text-blue-400">{stats.new}</p>
            <p className="text-slate-400 text-xs">New</p>
          </div>
          <div className="bg-slate-800 rounded-lg p-3 border border-slate-700 text-center">
            <p className="text-xl font-bold text-amber-400">
              {stats.investigating}
            </p>
            <p className="text-slate-400 text-xs">In Progress</p>
          </div>
          <div className="bg-slate-800 rounded-lg p-3 border border-slate-700 text-center">
            <p className="text-xl font-bold text-green-400">{stats.resolved}</p>
            <p className="text-slate-400 text-xs">Resolved</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-slate-800 rounded-lg p-3 border border-slate-700">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
              size={16}
            />
            <input
              type="text"
              placeholder="Search by reference number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          {/* Status Filter */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="all">All Status</option>
            <option value="new">New</option>
            <option value="investigating">Investigating</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Reports List */}
      {filteredReports.length === 0 ? (
        <div className="bg-slate-800 rounded-lg p-8 border border-slate-700 text-center">
          <FileText className="mx-auto text-slate-600 mb-4" size={40} />
          <h3 className="text-lg font-semibold text-white mb-2">
            No Reports Found
          </h3>
          <p className="text-slate-400 text-sm mb-4">
            {reports.length === 0
              ? "You haven't submitted any reports yet."
              : "No reports match your search criteria."}
          </p>
          <button
            onClick={() => navigate("/citizen/report")}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm"
          >
            Submit Your First Report
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredReports.map((report) => (
            <div
              key={report.id}
              className="bg-slate-800 rounded-lg p-4 border border-slate-700 hover:border-slate-600 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-xs text-blue-400 font-mono bg-blue-500/10 px-2 py-0.5 rounded">
                      {report.referenceNumber || `#${report.id?.slice(-8)}`}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(
                        report.status
                      )}`}
                    >
                      {report.status?.toUpperCase() || "NEW"}
                    </span>
                    {report.priority && (
                      <span
                        className={`text-xs ${getPriorityColor(
                          report.priority
                        )}`}
                      >
                        {report.priority.toUpperCase()} PRIORITY
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-semibold text-white mb-1">
                    {report.category}
                  </h3>

                  <p className="text-slate-400 text-sm line-clamp-2 mb-2">
                    {report.description}
                  </p>

                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {formatDate(report.timestamp)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => setSelectedReport(report)}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                    title="View Details"
                  >
                    <Eye size={18} />
                  </button>
                  <button
                    onClick={() => handleStartChat(report.id)}
                    className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-colors"
                    title="Chat"
                  >
                    <MessageCircle size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Report Detail Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-lg border border-slate-700 w-full max-w-lg max-h-[80vh] overflow-y-auto">
            <div className="p-4 border-b border-slate-700 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Report Details</h2>
              <button
                onClick={() => setSelectedReport(null)}
                className="text-slate-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <p className="text-xs text-slate-500 mb-1">Reference Number</p>
                <p className="text-blue-400 font-mono">
                  {selectedReport.referenceNumber}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Category</p>
                <p className="text-white">{selectedReport.category}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Status</p>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                    selectedReport.status
                  )}`}
                >
                  {selectedReport.status?.toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Description</p>
                <p className="text-slate-300 text-sm">
                  {selectedReport.description}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Submitted</p>
                <p className="text-slate-300 text-sm">
                  {formatDate(selectedReport.timestamp)}
                </p>
              </div>

              {/* Status History */}
              {selectedReport.statusHistory?.length > 0 && (
                <div>
                  <p className="text-xs text-slate-500 mb-2">Status History</p>
                  <div className="space-y-2">
                    {selectedReport.statusHistory.map((entry, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-700/50 rounded p-2 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`font-medium ${getStatusColor(
                              entry.status
                            )}`}
                          >
                            {entry.status?.toUpperCase()}
                          </span>
                          <span className="text-slate-500">
                            {new Date(entry.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                        {entry.note && (
                          <p className="text-slate-400 mt-1">{entry.note}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => {
                  handleStartChat(selectedReport.id);
                  setSelectedReport(null);
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium flex items-center justify-center gap-2"
              >
                <MessageCircle size={18} />
                Chat with Police
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
