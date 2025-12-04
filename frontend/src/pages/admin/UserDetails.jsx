import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Shield,
  BadgeCheck,
  Calendar,
  CheckCircle,
  XCircle,
  UserCheck,
  UserX,
  Save,
  AlertTriangle,
} from "lucide-react";
import { adminAPI } from "../../services/api";

export default function UserDetails() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    role: "",
    verified: false,
    blocked: false,
  });

  useEffect(() => {
    loadUser();
  }, [userId]);

  const loadUser = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getUser(userId);
      setUser(response.data);
      setFormData({
        role: response.data.role || "citizen",
        verified: response.data.verified || false,
        blocked: response.data.blocked || false,
      });
    } catch (err) {
      setError("Failed to load user details");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      await adminAPI.updateUser(userId, {
        role: formData.role,
        verified: formData.verified,
        blocked: formData.blocked,
      });

      setSuccess("User updated successfully!");
      setEditMode(false);
      loadUser();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to update user");
    } finally {
      setSaving(false);
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case "admin":
        return "bg-purple-500/20 text-purple-400 border-purple-500";
      case "police":
        return "bg-blue-500/20 text-blue-400 border-blue-500";
      default:
        return "bg-slate-500/20 text-slate-400 border-slate-500";
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case "admin":
        return <Shield size={18} />;
      case "police":
        return <BadgeCheck size={18} />;
      default:
        return <User size={18} />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6">
        <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded-lg">
          User not found
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/admin/users")}
            className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">User Details</h1>
            <p className="text-slate-400">
              Manage user account and permissions
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {!editMode ? (
            <button
              onClick={() => setEditMode(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Edit User
            </button>
          ) : (
            <>
              <button
                onClick={() => {
                  setEditMode(false);
                  setFormData({
                    role: user.role || "citizen",
                    verified: user.verified || false,
                    blocked: user.blocked || false,
                  });
                }}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <Save size={18} />
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertTriangle size={18} />
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-500/10 border border-green-500 text-green-400 px-4 py-3 rounded-lg flex items-center gap-2">
          <CheckCircle size={18} />
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Profile Card */}
        <div className="lg:col-span-1">
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <div className="text-center">
              <div className="w-24 h-24 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <User size={48} className="text-slate-400" />
              </div>
              <h2 className="text-xl font-bold text-white">
                {user.full_name || user.name || "Unknown User"}
              </h2>
              <p className="text-slate-400">{user.email}</p>

              {/* Current Role Badge */}
              <div className="mt-4">
                <span
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border ${getRoleColor(
                    user.role
                  )}`}
                >
                  {getRoleIcon(user.role)}
                  {user.role?.toUpperCase() || "CITIZEN"}
                </span>
              </div>

              {/* Status Badges */}
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {user.verified ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs bg-green-500/20 text-green-400 border border-green-500/30">
                    <CheckCircle size={12} />
                    Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs bg-slate-500/20 text-slate-400 border border-slate-500/30">
                    <XCircle size={12} />
                    Unverified
                  </span>
                )}
                {user.blocked && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs bg-red-500/20 text-red-400 border border-red-500/30">
                    <UserX size={12} />
                    Blocked
                  </span>
                )}
              </div>
            </div>

            {/* Contact Info */}
            <div className="mt-6 space-y-3 border-t border-slate-700 pt-6">
              <div className="flex items-center gap-3 text-slate-300">
                <Mail size={18} className="text-slate-500" />
                <span>{user.email}</span>
              </div>
              {user.phone && (
                <div className="flex items-center gap-3 text-slate-300">
                  <Phone size={18} className="text-slate-500" />
                  <span>{user.phone}</span>
                </div>
              )}
              {user.badge_number && (
                <div className="flex items-center gap-3 text-slate-300">
                  <BadgeCheck size={18} className="text-blue-500" />
                  <span>Badge: {user.badge_number}</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-slate-300">
                <Calendar size={18} className="text-slate-500" />
                <span>Joined: {formatDate(user.created_at)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Panel */}
        <div className="lg:col-span-2">
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-6">
              {editMode ? "Edit User Settings" : "User Settings"}
            </h3>

            {/* Role Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-3">
                User Role
              </label>
              {editMode ? (
                <div className="grid grid-cols-3 gap-4">
                  {["citizen", "police", "admin"].map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setFormData({ ...formData, role })}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        formData.role === role
                          ? role === "admin"
                            ? "border-purple-500 bg-purple-500/20"
                            : role === "police"
                            ? "border-blue-500 bg-blue-500/20"
                            : "border-green-500 bg-green-500/20"
                          : "border-slate-600 hover:border-slate-500 bg-slate-700/50"
                      }`}
                    >
                      <div className="text-center">
                        <div
                          className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-2 ${
                            role === "admin"
                              ? "bg-purple-500/20 text-purple-400"
                              : role === "police"
                              ? "bg-blue-500/20 text-blue-400"
                              : "bg-green-500/20 text-green-400"
                          }`}
                        >
                          {role === "admin" ? (
                            <Shield size={24} />
                          ) : role === "police" ? (
                            <BadgeCheck size={24} />
                          ) : (
                            <User size={24} />
                          )}
                        </div>
                        <p
                          className={`font-medium ${
                            formData.role === role
                              ? "text-white"
                              : "text-slate-400"
                          }`}
                        >
                          {role.charAt(0).toUpperCase() + role.slice(1)}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {role === "admin"
                            ? "Full system access"
                            : role === "police"
                            ? "Report management"
                            : "Submit reports"}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div
                  className={`p-4 rounded-lg border ${getRoleColor(user.role)}`}
                >
                  <div className="flex items-center gap-3">
                    {getRoleIcon(user.role)}
                    <span className="font-medium">
                      {user.role?.charAt(0).toUpperCase() + user.role?.slice(1)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Warning for role change */}
            {editMode && formData.role !== user.role && (
              <div className="mb-6 bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="text-amber-400 mt-0.5" size={20} />
                  <div>
                    <p className="text-amber-400 font-medium">
                      Role Change Warning
                    </p>
                    <p className="text-slate-400 text-sm mt-1">
                      Changing the role from <strong>{user.role}</strong> to{" "}
                      <strong>{formData.role}</strong> will affect the user's
                      access permissions. They will only be able to login
                      through the {formData.role} portal.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Account Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Verified Status */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  Verification Status
                </label>
                {editMode ? (
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, verified: true })
                      }
                      className={`flex-1 p-3 rounded-lg border-2 transition-all flex items-center justify-center gap-2 ${
                        formData.verified
                          ? "border-green-500 bg-green-500/20 text-green-400"
                          : "border-slate-600 bg-slate-700/50 text-slate-400 hover:border-slate-500"
                      }`}
                    >
                      <UserCheck size={18} />
                      Verified
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, verified: false })
                      }
                      className={`flex-1 p-3 rounded-lg border-2 transition-all flex items-center justify-center gap-2 ${
                        !formData.verified
                          ? "border-slate-500 bg-slate-500/20 text-slate-300"
                          : "border-slate-600 bg-slate-700/50 text-slate-400 hover:border-slate-500"
                      }`}
                    >
                      <XCircle size={18} />
                      Unverified
                    </button>
                  </div>
                ) : (
                  <div
                    className={`p-3 rounded-lg border ${
                      user.verified
                        ? "border-green-500/30 bg-green-500/10 text-green-400"
                        : "border-slate-600 bg-slate-700/50 text-slate-400"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {user.verified ? (
                        <CheckCircle size={18} />
                      ) : (
                        <XCircle size={18} />
                      )}
                      {user.verified ? "Verified" : "Not Verified"}
                    </div>
                  </div>
                )}
              </div>

              {/* Blocked Status */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  Account Status
                </label>
                {editMode ? (
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, blocked: false })
                      }
                      className={`flex-1 p-3 rounded-lg border-2 transition-all flex items-center justify-center gap-2 ${
                        !formData.blocked
                          ? "border-green-500 bg-green-500/20 text-green-400"
                          : "border-slate-600 bg-slate-700/50 text-slate-400 hover:border-slate-500"
                      }`}
                    >
                      <CheckCircle size={18} />
                      Active
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, blocked: true })
                      }
                      className={`flex-1 p-3 rounded-lg border-2 transition-all flex items-center justify-center gap-2 ${
                        formData.blocked
                          ? "border-red-500 bg-red-500/20 text-red-400"
                          : "border-slate-600 bg-slate-700/50 text-slate-400 hover:border-slate-500"
                      }`}
                    >
                      <UserX size={18} />
                      Blocked
                    </button>
                  </div>
                ) : (
                  <div
                    className={`p-3 rounded-lg border ${
                      user.blocked
                        ? "border-red-500/30 bg-red-500/10 text-red-400"
                        : "border-green-500/30 bg-green-500/10 text-green-400"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {user.blocked ? (
                        <UserX size={18} />
                      ) : (
                        <CheckCircle size={18} />
                      )}
                      {user.blocked ? "Blocked" : "Active"}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
