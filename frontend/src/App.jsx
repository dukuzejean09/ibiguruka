import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useAuthStore } from "./store/authStore";

// Auth Pages
import LoginPage from "./pages/auth/LoginPage";
import AdminLoginPage from "./pages/auth/AdminLoginPage";
import PoliceLoginPage from "./pages/auth/PoliceLoginPage";

// Citizen Pages
import CitizenLayout from "./layouts/CitizenLayout";
import CitizenHome from "./pages/citizen/Home";
import ReportIncident from "./pages/citizen/ReportIncident";
import CitizenAlerts from "./pages/citizen/Alerts";
import CitizenChat from "./pages/citizen/Chat";
import CitizenProfile from "./pages/citizen/Profile";

// Police Pages
import PoliceLayout from "./layouts/PoliceLayout";
import PoliceDashboard from "./pages/police/Dashboard";
import ReportsManagement from "./pages/police/ReportsManagement";
import ClustersView from "./pages/police/ClustersView";
import BroadcastAlert from "./pages/police/BroadcastAlert";
import PoliceChat from "./pages/police/Chat";

// Admin Pages
import AdminLayout from "./layouts/AdminLayout";
import AdminDashboard from "./pages/admin/Dashboard";
import UsersManagement from "./pages/admin/UsersManagement";
import UserDetails from "./pages/admin/UserDetails";
import AdminSettings from "./pages/admin/Settings";

function App() {
  const { user, role } = useAuthStore();

  const ProtectedRoute = ({ children, allowedRoles }) => {
    if (!user) {
      return <Navigate to="/login" replace />;
    }
    if (allowedRoles && !allowedRoles.includes(role)) {
      return <Navigate to="/" replace />;
    }
    return children;
  };

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin-login" element={<AdminLoginPage />} />
        <Route path="/police-login" element={<PoliceLoginPage />} />

        {/* Citizen Routes */}
        <Route
          path="/citizen"
          element={
            <ProtectedRoute allowedRoles={["citizen", "anonymous"]}>
              <CitizenLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<CitizenHome />} />
          <Route path="report" element={<ReportIncident />} />
          <Route path="alerts" element={<CitizenAlerts />} />
          <Route path="chat/:reportId?" element={<CitizenChat />} />
          <Route path="profile" element={<CitizenProfile />} />
        </Route>

        {/* Police Routes */}
        <Route
          path="/police"
          element={
            <ProtectedRoute allowedRoles={["police"]}>
              <PoliceLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/police/dashboard" replace />} />
          <Route path="dashboard" element={<PoliceDashboard />} />
          <Route path="reports" element={<ReportsManagement />} />
          <Route path="clusters" element={<ClustersView />} />
          <Route path="broadcast" element={<BroadcastAlert />} />
          <Route path="chat/:chatId?" element={<PoliceChat />} />
        </Route>

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<UsersManagement />} />
          <Route path="users/:userId" element={<UserDetails />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        {/* Default Redirect */}
        <Route
          path="/"
          element={
            user ? (
              role === "admin" ? (
                <Navigate to="/admin" />
              ) : role === "police" ? (
                <Navigate to="/police" />
              ) : (
                <Navigate to="/citizen" />
              )
            ) : (
              <Navigate to="/login" />
            )
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
