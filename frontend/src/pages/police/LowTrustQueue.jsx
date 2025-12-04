import { useState, useEffect } from "react";
import {
  AlertTriangle,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Shield,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Calendar,
  Fingerprint,
} from "lucide-react";
import { reportsAPI } from "../../services/api";

export default function LowTrustQueue() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [processing, setProcessing] = useState(null);
  const reportsPerPage = 10;

  useEffect(() => {
    fetchLowTrustReports();
  }, []);

  const fetchLowTrustReports = async () => {
    try {
      const response = await reportsAPI.getLowTrustQueue();
      const lowTrustReports = response.data.reports || [];
      // Sort by date (oldest first for delayed processing)
      lowTrustReports.sort(
        (a, b) =>
          new Date(a.createdAt || a.timestamp) -
          new Date(b.createdAt || b.timestamp)
      );
      setReports(lowTrustReports);
    } catch (error) {
      console.error("Error fetching low-trust reports:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (reportId) => {
    setProcessing(reportId);
    try {
      await reportsAPI.verify(reportId);
      // Remove from queue after verification
      setReports(reports.filter((r) => r.id !== reportId));
      setSelectedReport(null);
    } catch (error) {
      console.error("Error verifying report:", error);
    } finally {
      setProcessing(null);
    }
  };

  const handleFlag = async (reportId) => {
    setProcessing(reportId);
    try {
      await reportsAPI.markAsFake(reportId);
      // Update the report in the list
      setReports(
        reports.map((r) => (r.id === reportId ? { ...r, flagged: true } : r))
      );
      setSelectedReport(null);
    } catch (error) {
      console.error("Error flagging report:", error);
    } finally {
      setProcessing(null);
    }
  };

  const filteredReports = reports.filter(
    (report) =>
      report.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredReports.length / reportsPerPage);
  const paginatedReports = filteredReports.slice(
    (currentPage - 1) * reportsPerPage,
    currentPage * reportsPerPage
  );

  const getTrustColor = (weight) => {
    if (weight >= 0.7) return "text-green-400";
    if (weight >= 0.4) return "text-yellow-400";
    return "text-red-400";
  };

  const getTrustLabel = (weight) => {
    if (weight >= 0.7) return "High";
    if (weight >= 0.4) return "Medium";
    return "Low";
  };

  const getQueueReason = (report) => {
    if (report.flagged) return "Previously Flagged";
    if (report.trustWeight < 0.4) return "Low Trust Score";
    if (report.inLowTrustQueue) return "In Review Queue";
    return "Manual Review";
  };

  const getTimeSinceSubmission = (timestamp) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h ago`;
    }
    return `${hours}h ${minutes}m ago`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <AlertTriangle className="text-amber-500" />
            Low-Trust Queue
          </h1>
          <p className="text-slate-400 mt-1">
            Reports requiring manual verification before public visibility
          </p>
        </div>
        <div className="bg-amber-900/30 border border-amber-600 rounded-lg px-4 py-2">
          <span className="text-amber-400 font-semibold">
            {reports.length} reports pending
          </span>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <Shield className="text-blue-400 mt-1" size={20} />
          <div>
            <h3 className="text-white font-medium">About Low-Trust Queue</h3>
            <p className="text-slate-400 text-sm mt-1">
              Reports from users with trust scores below 40 are held for 1-2
              hours before public display. This helps prevent abuse while
              maintaining anonymous reporting. Verified reports improve the
              submitter's trust score.
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Search reports..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Reports List */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
        {paginatedReports.length === 0 ? (
          <div className="p-12 text-center">
            <CheckCircle className="mx-auto text-green-400 mb-4" size={48} />
            <h3 className="text-xl font-semibold text-white mb-2">
              Queue is Clear!
            </h3>
            <p className="text-slate-400">
              No low-trust reports require review at this time.
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-900">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                  Report
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                  Queue Reason
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                  Trust Score
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                  Wait Time
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {paginatedReports.map((report) => (
                <tr
                  key={report.id}
                  className={`hover:bg-slate-700/50 cursor-pointer ${
                    report.flagged ? "bg-red-900/20" : ""
                  }`}
                  onClick={() => setSelectedReport(report)}
                >
                  <td className="px-4 py-4">
                    <div>
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          report.flagged
                            ? "bg-red-900/50 text-red-300"
                            : "bg-blue-900/50 text-blue-300"
                        }`}
                      >
                        {report.category}
                      </span>
                      <p className="text-white mt-1 truncate max-w-xs">
                        {report.description?.substring(0, 50)}...
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-amber-400 text-sm flex items-center gap-1">
                      <AlertTriangle size={14} />
                      {getQueueReason(report)}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`font-semibold ${getTrustColor(
                        report.trustWeight || 0.5
                      )}`}
                    >
                      {Math.round((report.trustWeight || 0.5) * 100)}
                    </span>
                    <span className="text-slate-400 text-sm ml-1">
                      ({getTrustLabel(report.trustWeight || 0.5)})
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-slate-300 flex items-center gap-1">
                      <Clock size={14} />
                      {getTimeSinceSubmission(report.timestamp)}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedReport(report);
                        }}
                        className="p-2 bg-slate-700 hover:bg-slate-600 rounded text-white"
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleVerify(report._id);
                        }}
                        disabled={processing === report._id}
                        className="p-2 bg-green-600 hover:bg-green-500 rounded text-white disabled:opacity-50"
                        title="Verify Report"
                      >
                        <CheckCircle size={16} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFlag(report._id);
                        }}
                        disabled={processing === report._id || report.flagged}
                        className="p-2 bg-red-600 hover:bg-red-500 rounded text-white disabled:opacity-50"
                        title="Flag as Fake"
                      >
                        <XCircle size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-t border-slate-700">
            <span className="text-sm text-slate-400">
              Showing {(currentPage - 1) * reportsPerPage + 1} to{" "}
              {Math.min(currentPage * reportsPerPage, filteredReports.length)}{" "}
              of {filteredReports.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 bg-slate-700 hover:bg-slate-600 rounded text-white disabled:opacity-50"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-white px-3">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="p-2 bg-slate-700 hover:bg-slate-600 rounded text-white disabled:opacity-50"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Report Detail Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Report Details</h2>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="text-slate-400 hover:text-white"
                >
                  <XCircle size={24} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Status Banner */}
              <div
                className={`p-4 rounded-lg ${
                  selectedReport.flagged
                    ? "bg-red-900/30 border border-red-600"
                    : "bg-amber-900/30 border border-amber-600"
                }`}
              >
                <div className="flex items-center gap-3">
                  <AlertTriangle
                    className={
                      selectedReport.flagged ? "text-red-400" : "text-amber-400"
                    }
                  />
                  <div>
                    <h4
                      className={`font-semibold ${
                        selectedReport.flagged
                          ? "text-red-300"
                          : "text-amber-300"
                      }`}
                    >
                      {selectedReport.flagged
                        ? "Report Flagged as Fake"
                        : "Pending Verification"}
                    </h4>
                    <p className="text-slate-400 text-sm">
                      {getQueueReason(selectedReport)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Report Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-400">Category</label>
                  <p className="text-white font-medium">
                    {selectedReport.category}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-slate-400">Trust Score</label>
                  <p
                    className={`font-semibold ${getTrustColor(
                      selectedReport.trustWeight || 0.5
                    )}`}
                  >
                    {Math.round((selectedReport.trustWeight || 0.5) * 100)} (
                    {getTrustLabel(selectedReport.trustWeight || 0.5)})
                  </p>
                </div>
                <div>
                  <label className="text-sm text-slate-400 flex items-center gap-1">
                    <Calendar size={14} />
                    Submitted
                  </label>
                  <p className="text-white">
                    {new Date(selectedReport.timestamp).toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-slate-400 flex items-center gap-1">
                    <Clock size={14} />
                    Wait Time
                  </label>
                  <p className="text-white">
                    {getTimeSinceSubmission(selectedReport.timestamp)}
                  </p>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-sm text-slate-400">Description</label>
                <p className="text-white mt-1 bg-slate-900 p-4 rounded-lg">
                  {selectedReport.description}
                </p>
              </div>

              {/* Location */}
              <div>
                <label className="text-sm text-slate-400 flex items-center gap-1">
                  <MapPin size={14} />
                  Location
                </label>
                <p className="text-white mt-1">
                  {selectedReport.location?.coordinates
                    ? `${selectedReport.location.coordinates[1].toFixed(
                        4
                      )}, ${selectedReport.location.coordinates[0].toFixed(4)}`
                    : "Not provided"}
                </p>
              </div>

              {/* Device Fingerprint */}
              {selectedReport.deviceFingerprint && (
                <div>
                  <label className="text-sm text-slate-400 flex items-center gap-1">
                    <Fingerprint size={14} />
                    Device Fingerprint
                  </label>
                  <p className="text-slate-500 mt-1 font-mono text-xs">
                    {selectedReport.deviceFingerprint.substring(0, 16)}...
                  </p>
                </div>
              )}

              {/* Photo */}
              {selectedReport.photo && (
                <div>
                  <label className="text-sm text-slate-400">
                    Photo Evidence
                  </label>
                  <img
                    src={selectedReport.photo}
                    alt="Evidence"
                    className="mt-2 rounded-lg max-h-64 object-cover"
                  />
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="p-6 border-t border-slate-700 flex gap-4">
              <button
                onClick={() => handleVerify(selectedReport._id)}
                disabled={processing === selectedReport._id}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-lg disabled:opacity-50"
              >
                <CheckCircle size={20} />
                Verify Report
              </button>
              <button
                onClick={() => handleFlag(selectedReport._id)}
                disabled={
                  processing === selectedReport._id || selectedReport.flagged
                }
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-lg disabled:opacity-50"
              >
                <XCircle size={20} />
                {selectedReport.flagged ? "Already Flagged" : "Flag as Fake"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
