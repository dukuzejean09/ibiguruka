import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Filter,
  UserCheck,
  UserX,
  Shield,
  User,
  Mail,
  Phone,
  Calendar,
  MoreVertical,
  Eye,
  CheckCircle,
  XCircle,
  BadgeCheck,
} from "lucide-react";
import { adminAPI } from "../../services/api";

export default function UsersManagement() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [filters, setFilters] = useState({
    role: "",
    search: "",
  });

  useEffect(() => {
    loadUsers();
  }, [filters]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const [usersRes, pendingRes] = await Promise.all([
        adminAPI.getUsers({ role: filters.role || undefined }),
        adminAPI.getUsers({ role: "pending" }).catch(() => ({ data: [] })),
      ]);
      setUsers(usersRes.data || []);
      setPendingUsers(
        (usersRes.data || []).filter(
          (u) => u.requested_role && !u.role_approved
        )
      );
    } catch (error) {
      console.error("Failed to load users:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateUserStatus = async (userId, action) => {
    try {
      if (action === "verify") {
        await adminAPI.updateUser(userId, { verified: true });
      } else if (action === "suspend") {
        await adminAPI.updateUser(userId, { blocked: true });
      } else if (action === "activate") {
        await adminAPI.updateUser(userId, { blocked: false });
      } else if (action === "approve_police") {
        await adminAPI.updateUser(userId, {
          role: "police",
          role_approved: true,
        });
      } else if (action === "reject_police") {
        await adminAPI.updateUser(userId, {
          requested_role: null,
          role_approved: false,
        });
      }
      loadUsers();
    } catch (error) {
      console.error("Failed to update user:", error);
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case "admin":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      case "police":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      default:
        return "bg-slate-500/20 text-slate-400 border-slate-500/30";
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case "admin":
        return <Shield size={14} />;
      case "police":
        return <BadgeCheck size={14} />;
      default:
        return <User size={14} />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      !filters.search ||
      user.email?.toLowerCase().includes(filters.search.toLowerCase()) ||
      user.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(filters.search.toLowerCase());
    return matchesSearch;
  });

  const displayUsers = activeTab === "pending" ? pendingUsers : filteredUsers;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Users Management</h1>
        <div className="flex items-center gap-4">
          <div className="text-sm text-slate-400">
            Total Users:{" "}
            <span className="text-white font-semibold">{users.length}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-700 pb-2">
        <button
          onClick={() => setActiveTab("all")}
          className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
            activeTab === "all"
              ? "bg-slate-800 text-white border-b-2 border-blue-500"
              : "text-slate-400 hover:text-white"
          }`}
        >
          All Users
        </button>
        <button
          onClick={() => setActiveTab("pending")}
          className={`px-4 py-2 rounded-t-lg font-medium transition-colors flex items-center gap-2 ${
            activeTab === "pending"
              ? "bg-slate-800 text-white border-b-2 border-amber-500"
              : "text-slate-400 hover:text-white"
          }`}
        >
          Pending Approval
          {pendingUsers.length > 0 && (
            <span className="px-2 py-0.5 bg-amber-500 text-white text-xs rounded-full">
              {pendingUsers.length}
            </span>
          )}
        </button>
      </div>

      {/* Filters */}
      {activeTab === "all" && (
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative md:col-span-2">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
                className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Role Filter */}
            <select
              value={filters.role}
              onChange={(e) => setFilters({ ...filters, role: e.target.value })}
              className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Roles</option>
              <option value="citizen">Citizens</option>
              <option value="police">Police Officers</option>
              <option value="admin">Administrators</option>
            </select>
          </div>
        </div>
      )}

      {/* Pending Approvals Section */}
      {activeTab === "pending" && pendingUsers.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
          <h3 className="text-amber-400 font-semibold mb-2 flex items-center gap-2">
            <BadgeCheck size={18} />
            Police Role Requests
          </h3>
          <p className="text-slate-400 text-sm">
            These users have requested police officer access. Review their badge
            numbers and approve or reject their requests.
          </p>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-700/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  User
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                  </td>
                </tr>
              ) : displayUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-12 text-center text-slate-400"
                  >
                    {activeTab === "pending"
                      ? "No pending approval requests"
                      : "No users found"}
                  </td>
                </tr>
              ) : (
                displayUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-700/50">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-600 rounded-full flex items-center justify-center">
                          <User size={20} className="text-slate-300" />
                        </div>
                        <div>
                          <p className="text-white font-medium">
                            {user.full_name || user.name || "Unknown"}
                          </p>
                          <p className="text-slate-400 text-sm">{user.email}</p>
                          {user.badge_number && (
                            <p className="text-amber-400 text-xs">
                              Badge: {user.badge_number}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getRoleColor(
                          user.role
                        )}`}
                      >
                        {getRoleIcon(user.role)}
                        {user.role?.toUpperCase()}
                      </span>
                      {user.requested_role && !user.role_approved && (
                        <span className="ml-2 inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          Wants: {user.requested_role}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-1">
                        {user.verified ? (
                          <span className="inline-flex items-center gap-1 text-green-400 text-sm">
                            <CheckCircle size={14} />
                            Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-slate-400 text-sm">
                            <XCircle size={14} />
                            Unverified
                          </span>
                        )}
                        {user.blocked && (
                          <span className="inline-flex items-center gap-1 text-red-400 text-sm">
                            <UserX size={14} />
                            Suspended
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-slate-400 text-sm">
                        {formatDate(user.created_at)}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        {user.requested_role && !user.role_approved ? (
                          <>
                            <button
                              onClick={() =>
                                updateUserStatus(user.id, "approve_police")
                              }
                              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() =>
                                updateUserStatus(user.id, "reject_police")
                              }
                              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium"
                            >
                              Reject
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() =>
                                navigate(`/admin/users/${user.id}`)
                              }
                              className="p-2 hover:bg-slate-600 rounded-lg text-slate-400 hover:text-white"
                              title="View Details"
                            >
                              <Eye size={16} />
                            </button>
                            {!user.verified && (
                              <button
                                onClick={() =>
                                  updateUserStatus(user.id, "verify")
                                }
                                className="p-2 hover:bg-slate-600 rounded-lg text-green-400 hover:text-green-300"
                                title="Verify User"
                              >
                                <UserCheck size={16} />
                              </button>
                            )}
                            {user.blocked ? (
                              <button
                                onClick={() =>
                                  updateUserStatus(user.id, "activate")
                                }
                                className="p-2 hover:bg-slate-600 rounded-lg text-green-400 hover:text-green-300"
                                title="Activate User"
                              >
                                <CheckCircle size={16} />
                              </button>
                            ) : (
                              <button
                                onClick={() =>
                                  updateUserStatus(user.id, "suspend")
                                }
                                className="p-2 hover:bg-slate-600 rounded-lg text-red-400 hover:text-red-300"
                                title="Suspend User"
                              >
                                <UserX size={16} />
                              </button>
                            )}
                          </>
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

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <p className="text-2xl font-bold text-white">
            {users.filter((u) => u.role === "citizen").length}
          </p>
          <p className="text-slate-400 text-sm">Citizens</p>
        </div>
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <p className="text-2xl font-bold text-blue-400">
            {users.filter((u) => u.role === "police").length}
          </p>
          <p className="text-slate-400 text-sm">Police Officers</p>
        </div>
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <p className="text-2xl font-bold text-purple-400">
            {users.filter((u) => u.role === "admin").length}
          </p>
          <p className="text-slate-400 text-sm">Administrators</p>
        </div>
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <p className="text-2xl font-bold text-amber-400">
            {pendingUsers.length}
          </p>
          <p className="text-slate-400 text-sm">Pending Approval</p>
        </div>
      </div>
    </div>
  );
}
