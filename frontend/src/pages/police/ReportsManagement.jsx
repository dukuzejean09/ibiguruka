import { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Download,
  Eye,
  MessageCircle,
  Clock,
  CheckCircle,
  AlertTriangle,
  MapPin,
  Calendar,
  ChevronDown,
  X,
  ShieldAlert,
  ShieldCheck,
  Ban,
} from "lucide-react";
import { reportsAPI, chatAPI } from "../../services/api";
import { useNavigate } from "react-router-dom";

export default function ReportsManagement() {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [filters, setFilters] = useState({
    category: "",
    status: "",
    dateRange: "all",
    search: "",
    trustFilter: "all", // "all", "high", "medium", "low"
  });

  useEffect(() => {
    loadReports();
  }, [filters]);

  const loadReports = async () => {
    try {
      setLoading(true);
      const response = await reportsAPI.getAll({
        category: filters.category || undefined,
        status: filters.status || undefined,
      });
      setReports(response.data || []);
    } catch (error) {
      console.error("Failed to load reports:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateReportStatus = async (reportId, newStatus) => {
    try {
      await reportsAPI.update(reportId, { status: newStatus });
      setReports((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, status: newStatus } : r))
      );
      if (selectedReport?.id === reportId) {
        setSelectedReport({ ...selectedReport, status: newStatus });
      }
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  const markAsFake = async (reportId) => {
    if (
      !confirm(
        "Mark this report as fake/prank? This will lower the reporter's trust score."
      )
    ) {
      return;
    }
    try {
      await reportsAPI.markAsFake(reportId);
      loadReports();
      if (selectedReport?.id === reportId) {
        setSelectedReport({
          ...selectedReport,
          flaggedAsFake: true,
          status: "fake",
        });
      }
    } catch (error) {
      console.error("Failed to mark as fake:", error);
    }
  };

  const verifyReport = async (reportId) => {
    try {
      await reportsAPI.verify(reportId);
      loadReports();
      if (selectedReport?.id === reportId) {
        setSelectedReport({ ...selectedReport, verifiedByPolice: true });
      }
    } catch (error) {
      console.error("Failed to verify report:", error);
    }
  };

  const startChat = async (reportId) => {
    try {
      await chatAPI.start(reportId);
      navigate(`/police/chat/${reportId}`);
    } catch (error) {
      console.error("Failed to start chat:", error);
    }
  };

  const getTrustColor = (score) => {
    if (score >= 70) return "text-green-400";
    if (score >= 40) return "text-amber-400";
    return "text-red-400";
  };

  const getTrustBg = (score) => {
    if (score >= 70) return "bg-green-500/20 border-green-500/30";
    if (score >= 40) return "bg-amber-500/20 border-amber-500/30";
    return "bg-red-500/20 border-red-500/30";
  };

  const getTrustLabel = (score) => {
    if (score >= 70) return "High";
    if (score >= 40) return "Medium";
    return "Low";
  };

  const exportToCSV = () => {
    const headers = [
      "Reference",
      "Category",
      "Description",
      "Status",
      "Trust Score",
      "Location",
      "Date",
    ];
    const csvData = reports.map((r) => [
      r.referenceNumber || r.id?.slice(-8),
      r.category,
      `"${r.description?.replace(/"/g, '""') || ""}"`,
      r.status,
      `${r.location?.lat}, ${r.location?.lng}`,
      new Date(r.timestamp || r.created_at).toISOString(),
    ]);

    const csv = [
      headers.join(","),
      ...csvData.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reports-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "resolved":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "under_review":
        return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      case "new":
      default:
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "resolved":
        return <CheckCircle size={14} />;
      case "under_review":
        return <Clock size={14} />;
      default:
        return <AlertTriangle size={14} />;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredReports = reports.filter((report) => {
    const matchesSearch =
      !filters.search ||
      report.category?.toLowerCase().includes(filters.search.toLowerCase()) ||
      report.description
        ?.toLowerCase()
        .includes(filters.search.toLowerCase()) ||
      report.referenceNumber?.includes(filters.search);

    // Trust filter
    const trustScore = report.trustScore || 50;
    let matchesTrust = true;
    if (filters.trustFilter === "high") {
      matchesTrust = trustScore >= 70;
    } else if (filters.trustFilter === "medium") {
      matchesTrust = trustScore >= 40 && trustScore < 70;
    } else if (filters.trustFilter === "low") {
      matchesTrust = trustScore < 40;
    }

    return matchesSearch && matchesTrust;
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Reports Management</h1>
        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium"
        >
          <Download size={18} />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search reports..."
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
              className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Category Filter */}
          <select
            value={filters.category}
            onChange={(e) =>
              setFilters({ ...filters, category: e.target.value })
            }
            className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="new">New</option>
            <option value="under_review">Under Review</option>
            <option value="resolved">Resolved</option>
          </select>

          {/* Date Filter */}
          <select
            value={filters.dateRange}
            onChange={(e) =>
              setFilters({ ...filters, dateRange: e.target.value })
            }
            className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>

          {/* Trust Filter */}
          <select
            value={filters.trustFilter}
            onChange={(e) =>
              setFilters({ ...filters, trustFilter: e.target.value })
            }
            className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Trust Levels</option>
            <option value="high">High Trust (70+)</option>
            <option value="medium">Medium Trust (40-69)</option>
            <option value="low">Low Trust (&lt;40)</option>
          </select>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-700/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Reference
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Trust
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                  </td>
                </tr>
              ) : filteredReports.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-12 text-center text-slate-400"
                  >
                    No reports found
                  </td>
                </tr>
              ) : (
                filteredReports.map((report) => (
                  <tr
                    key={report.id}
                    className={`hover:bg-slate-700/50 cursor-pointer ${
                      report.flaggedAsFake ? "opacity-50 bg-red-900/20" : ""
                    } ${report.isDelayed ? "bg-amber-900/10" : ""}`}
                    onClick={() => setSelectedReport(report)}
                  >
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono text-slate-300">
                          #{report.referenceNumber || report.id?.slice(-8)}
                        </span>
                        {report.flaggedAsFake && (
                          <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 text-xs rounded">
                            FAKE
                          </span>
                        )}
                        {report.verifiedByPolice && (
                          <ShieldCheck size={14} className="text-green-400" />
                        )}
                        {report.isDelayed && (
                          <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded">
                            DELAYED
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="text-sm text-white">
                        {report.category}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-slate-400 line-clamp-1 max-w-xs">
                        {report.description}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getTrustBg(
                          report.trustScore || 50
                        )} ${getTrustColor(report.trustScore || 50)}`}
                      >
                        {report.trustScore || 50}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                          report.status
                        )}`}
                      >
                        {getStatusIcon(report.status)}
                        {report.status?.replace("_", " ").toUpperCase() ||
                          "NEW"}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="text-sm text-slate-400">
                        {formatDate(report.timestamp || report.created_at)}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedReport(report);
                          }}
                          className="p-2 hover:bg-slate-600 rounded-lg text-slate-400 hover:text-white"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            startChat(report.id);
                          }}
                          className="p-2 hover:bg-slate-600 rounded-lg text-slate-400 hover:text-white"
                          title="Start Chat"
                        >
                          <MessageCircle size={16} />
                        </button>
                        {!report.verifiedByPolice && !report.flaggedAsFake && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              verifyReport(report.id);
                            }}
                            className="p-2 hover:bg-green-600/20 rounded-lg text-green-400 hover:text-green-300"
                            title="Verify Report"
                          >
                            <ShieldCheck size={16} />
                          </button>
                        )}
                        {!report.flaggedAsFake && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsFake(report.id);
                            }}
                            className="p-2 hover:bg-red-600/20 rounded-lg text-red-400 hover:text-red-300"
                            title="Mark as Fake"
                          >
                            <Ban size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Report Detail Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-lg border border-slate-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h2 className="text-xl font-bold text-white">Report Details</h2>
              <button
                onClick={() => setSelectedReport(null)}
                className="p-2 hover:bg-slate-700 rounded-lg text-slate-400"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm text-slate-500 font-mono">
                    #
                    {selectedReport.referenceNumber ||
                      selectedReport.id?.slice(-8)}
                  </span>
                  <h3 className="text-2xl font-bold text-white mt-1">
                    {selectedReport.category}
                  </h3>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                    selectedReport.status
                  )}`}
                >
                  {selectedReport.status?.replace("_", " ").toUpperCase() ||
                    "NEW"}
                </span>
              </div>

              {/* Description */}
              <div>
                <h4 className="text-sm font-medium text-slate-400 mb-2">
                  Description
                </h4>
                <p className="text-white">{selectedReport.description}</p>
              </div>

              {/* Location */}
              <div>
                <h4 className="text-sm font-medium text-slate-400 mb-2">
                  Location
                </h4>
                <div className="flex items-center gap-2 text-white">
                  <MapPin size={16} className="text-blue-500" />
                  <span>
                    {selectedReport.location?.lat?.toFixed(4)},{" "}
                    {selectedReport.location?.lng?.toFixed(4)}
                  </span>
                </div>
              </div>

              {/* Date */}
              <div>
                <h4 className="text-sm font-medium text-slate-400 mb-2">
                  Reported
                </h4>
                <div className="flex items-center gap-2 text-white">
                  <Calendar size={16} className="text-blue-500" />
                  <span>
                    {formatDate(
                      selectedReport.timestamp || selectedReport.created_at
                    )}
                  </span>
                </div>
              </div>

              {/* Status Update */}
              <div>
                <h4 className="text-sm font-medium text-slate-400 mb-2">
                  Update Status
                </h4>
                <div className="flex gap-2">
                  <button
                    onClick={() => updateReportStatus(selectedReport.id, "new")}
                    className={`px-4 py-2 rounded-lg font-medium ${
                      selectedReport.status === "new"
                        ? "bg-blue-600 text-white"
                        : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                    }`}
                  >
                    New
                  </button>
                  <button
                    onClick={() =>
                      updateReportStatus(selectedReport.id, "under_review")
                    }
                    className={`px-4 py-2 rounded-lg font-medium ${
                      selectedReport.status === "under_review"
                        ? "bg-amber-600 text-white"
                        : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                    }`}
                  >
                    Under Review
                  </button>
                  <button
                    onClick={() =>
                      updateReportStatus(selectedReport.id, "resolved")
                    }
                    className={`px-4 py-2 rounded-lg font-medium ${
                      selectedReport.status === "resolved"
                        ? "bg-green-600 text-white"
                        : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                    }`}
                  >
                    Resolved
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-slate-700">
                <button
                  onClick={() => startChat(selectedReport.id)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                >
                  <MessageCircle size={18} />
                  Start Chat
                </button>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
