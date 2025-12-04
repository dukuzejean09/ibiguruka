import { useState, useEffect } from "react";
import {
  Shield,
  AlertTriangle,
  TrendingDown,
  Users,
  FileWarning,
  Clock,
  CheckCircle,
  XCircle,
  Activity,
  BarChart3,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { adminAPI } from "../../services/api";

export default function AbuseAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [lowTrustDevices, setLowTrustDevices] = useState([]);
  const [flaggedReports, setFlaggedReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [cleaning, setCleaning] = useState(false);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const [analyticsRes, devicesRes, reportsRes] = await Promise.all([
        adminAPI.getAbuseAnalytics(),
        adminAPI.getLowTrustDevices(20),
        adminAPI.getFlaggedReports(50),
      ]);
      setAnalytics(analyticsRes.data);
      setLowTrustDevices(devicesRes.data.devices || []);
      setFlaggedReports(reportsRes.data.reports || []);
    } catch (error) {
      console.error("Failed to load abuse analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCleanup = async () => {
    if (
      !confirm(
        "This will permanently delete fingerprint data older than 30 days. Continue?"
      )
    ) {
      return;
    }
    try {
      setCleaning(true);
      const response = await adminAPI.cleanupOldData();
      alert(`Cleanup complete: ${response.data.deleted_count} records removed`);
      loadAnalytics();
    } catch (error) {
      console.error("Cleanup failed:", error);
      alert("Cleanup failed. Check console for details.");
    } finally {
      setCleaning(false);
    }
  };

  const getTrustScoreColor = (score) => {
    if (score >= 70) return "text-green-400";
    if (score >= 40) return "text-amber-400";
    return "text-red-400";
  };

  const getTrustScoreBg = (score) => {
    if (score >= 70) return "bg-green-500/20 border-green-500/30";
    if (score >= 40) return "bg-amber-500/20 border-amber-500/30";
    return "bg-red-500/20 border-red-500/30";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Shield className="text-amber-500" size={28} />
            Abuse Analytics
          </h1>
          <p className="text-slate-400 mt-1">
            Monitor trust scores, flagged reports, and system integrity
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleCleanup}
            disabled={cleaning}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white rounded-lg transition-colors"
          >
            <Trash2 size={16} />
            {cleaning ? "Cleaning..." : "Cleanup Old Data"}
          </button>
          <button
            onClick={loadAnalytics}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-700 pb-2">
        {[
          { id: "overview", label: "Overview", icon: BarChart3 },
          { id: "devices", label: "Low-Trust Devices", icon: Users },
          { id: "reports", label: "Flagged Reports", icon: FileWarning },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === tab.id
                ? "bg-amber-600 text-white"
                : "text-slate-400 hover:bg-slate-700"
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && analytics && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-800 rounded-lg p-5 border border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">
                    Total Devices Tracked
                  </p>
                  <p className="text-3xl font-bold text-white mt-1">
                    {analytics.total_fingerprints || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Users className="text-blue-400" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-slate-800 rounded-lg p-5 border border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Low-Trust Devices</p>
                  <p className="text-3xl font-bold text-red-400 mt-1">
                    {analytics.low_trust_count || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center">
                  <TrendingDown className="text-red-400" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-slate-800 rounded-lg p-5 border border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">High-Trust Devices</p>
                  <p className="text-3xl font-bold text-green-400 mt-1">
                    {analytics.high_trust_count || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <CheckCircle className="text-green-400" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-slate-800 rounded-lg p-5 border border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Fake Reports (Total)</p>
                  <p className="text-3xl font-bold text-amber-400 mt-1">
                    {analytics.reports?.totalFake || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-amber-500/20 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="text-amber-400" size={24} />
                </div>
              </div>
            </div>
          </div>

          {/* Trust Score Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Activity size={20} className="text-amber-400" />
                Trust Score Distribution
              </h3>
              <div className="space-y-3">
                {[
                  {
                    label: "Very Low (0-19)",
                    key: "very_low",
                    color: "bg-red-500",
                  },
                  { label: "Low (20-39)", key: "low", color: "bg-orange-500" },
                  {
                    label: "Medium (40-69)",
                    key: "medium",
                    color: "bg-amber-500",
                  },
                  { label: "High (70-89)", key: "high", color: "bg-lime-500" },
                  {
                    label: "Very High (90-100)",
                    key: "very_high",
                    color: "bg-green-500",
                  },
                ].map((item) => {
                  const count = analytics.trust_distribution?.[item.key] || 0;
                  const total = analytics.total_fingerprints || 1;
                  const percentage = ((count / total) * 100).toFixed(1);
                  return (
                    <div key={item.key} className="flex items-center gap-3">
                      <div className="w-32 text-sm text-slate-400">
                        {item.label}
                      </div>
                      <div className="flex-1 bg-slate-700 rounded-full h-4 overflow-hidden">
                        <div
                          className={`h-full ${item.color} transition-all duration-500`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="w-16 text-right text-sm text-white">
                        {count} ({percentage}%)
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <FileWarning size={20} className="text-red-400" />
                Report Status
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <p className="text-red-400 text-2xl font-bold">
                    {analytics.reports?.totalFake || 0}
                  </p>
                  <p className="text-slate-400 text-sm">Total Fake Reports</p>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <p className="text-amber-400 text-2xl font-bold">
                    {analytics.reports?.currentlyDelayed || 0}
                  </p>
                  <p className="text-slate-400 text-sm">Currently Delayed</p>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <p className="text-green-400 text-2xl font-bold">
                    {analytics.reports?.verified || 0}
                  </p>
                  <p className="text-slate-400 text-sm">Verified by Police</p>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <p className="text-orange-400 text-2xl font-bold">
                    {analytics.reports?.recentFakes || 0}
                  </p>
                  <p className="text-slate-400 text-sm">Fakes (Last 7 Days)</p>
                </div>
              </div>
            </div>
          </div>

          {/* Top Offenders */}
          {analytics.top_offenders?.length > 0 && (
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <AlertTriangle size={20} className="text-red-400" />
                Top Offenders (Most Fake Reports)
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-700/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase">
                        Device (Masked)
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase">
                        Trust Score
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase">
                        Fake Count
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase">
                        Duplicate Count
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase">
                        Total Reports
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {analytics.top_offenders.map((offender, idx) => (
                      <tr key={idx} className="hover:bg-slate-700/50">
                        <td className="px-4 py-3 font-mono text-slate-300">
                          {offender.fingerprint_masked}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-1 rounded-full text-sm font-medium ${getTrustScoreBg(
                              offender.trust_score
                            )} ${getTrustScoreColor(offender.trust_score)}`}
                          >
                            {offender.trust_score}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-red-400 font-semibold">
                          {offender.fake_count}
                        </td>
                        <td className="px-4 py-3 text-amber-400">
                          {offender.duplicate_count}
                        </td>
                        <td className="px-4 py-3 text-slate-300">
                          {offender.report_count}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Low-Trust Devices Tab */}
      {activeTab === "devices" && (
        <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
          <div className="p-4 border-b border-slate-700">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Users size={20} className="text-red-400" />
              Low-Trust Devices ({lowTrustDevices.length})
            </h3>
            <p className="text-slate-400 text-sm mt-1">
              Devices with trust score below 40. Reports from these devices are
              delayed for manual review.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-700/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase">
                    Device (Masked)
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase">
                    Trust Score
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase">
                    Reports
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase">
                    Fake
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase">
                    Verified
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase">
                    Last Activity
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {lowTrustDevices.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-slate-400"
                    >
                      No low-trust devices found. Great news!
                    </td>
                  </tr>
                ) : (
                  lowTrustDevices.map((device, idx) => (
                    <tr key={idx} className="hover:bg-slate-700/50">
                      <td className="px-4 py-3 font-mono text-slate-300">
                        {device.fingerprint_masked}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-sm font-medium ${getTrustScoreBg(
                            device.trust_score
                          )} ${getTrustScoreColor(device.trust_score)}`}
                        >
                          {device.trust_score}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        {device.report_count}
                      </td>
                      <td className="px-4 py-3 text-red-400">
                        {device.fake_count}
                      </td>
                      <td className="px-4 py-3 text-green-400">
                        {device.verified_count}
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-sm">
                        {formatDate(device.last_activity)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Flagged Reports Tab */}
      {activeTab === "reports" && (
        <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
          <div className="p-4 border-b border-slate-700">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <FileWarning size={20} className="text-amber-400" />
              Flagged Reports ({flaggedReports.length})
            </h3>
            <p className="text-slate-400 text-sm mt-1">
              Reports marked as fake/prank by police officers.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-700/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase">
                    Reference
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase">
                    Description
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase">
                    Device
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase">
                    Trust Score
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {flaggedReports.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-slate-400"
                    >
                      No flagged reports found.
                    </td>
                  </tr>
                ) : (
                  flaggedReports.map((report) => (
                    <tr key={report.id} className="hover:bg-slate-700/50">
                      <td className="px-4 py-3 font-mono text-amber-400">
                        {report.referenceNumber}
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        {report.category}
                      </td>
                      <td className="px-4 py-3 text-slate-400 max-w-xs truncate">
                        {report.description}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-400 text-sm">
                        {report.deviceFingerprint_masked}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-sm font-medium ${getTrustScoreBg(
                            report.trustScore
                          )} ${getTrustScoreColor(report.trustScore)}`}
                        >
                          {report.trustScore}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-sm">
                        {formatDate(report.timestamp)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
