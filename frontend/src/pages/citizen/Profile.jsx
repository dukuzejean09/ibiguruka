import { useState } from "react";
import { useAuthStore } from "../../store/authStore";
import { User, Mail, Phone, Save } from "lucide-react";

export default function CitizenProfile() {
  const { user, updateUser } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
  });

  const handleSave = () => {
    updateUser(formData);
    setEditing(false);
  };

  if (user?.id === "anonymous") {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-slate-800 rounded-lg p-8 border border-slate-700 text-center">
          <User size={64} className="text-slate-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Anonymous User</h2>
          <p className="text-slate-400 mb-6">
            You're using the app anonymously. Create an account to track your
            reports and get updates.
          </p>
          <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold">
            Create Account
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">Profile Settings</h1>
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
            >
              Edit Profile
            </button>
          ) : null}
        </div>

        <div className="flex flex-col items-center mb-8">
          <div className="w-24 h-24 bg-slate-700 rounded-full flex items-center justify-center text-white text-3xl font-bold mb-4">
            {user?.name?.substring(0, 2).toUpperCase() || "U"}
          </div>
          <h2 className="text-xl font-semibold text-white">{user?.name}</h2>
          <p className="text-slate-400">{user?.email}</p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              <User className="inline mr-2" size={16} />
              Full Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              disabled={!editing}
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              <Mail className="inline mr-2" size={16} />
              Email Address
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              disabled={!editing}
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              <Phone className="inline mr-2" size={16} />
              Phone Number
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              disabled={!editing}
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
          </div>

          {editing && (
            <div className="flex gap-4">
              <button
                onClick={() => setEditing(false)}
                className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg flex items-center justify-center gap-2"
              >
                <Save size={20} />
                Save Changes
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
