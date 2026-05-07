import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import LoadingSpinner from "./components/LoadingSpinner.jsx";
import SplashScreen from "./pages/SplashScreen.jsx";
import Home from "./pages/Home.jsx";

// Lazy load non-critical pages
const Login = lazy(() => import("./pages/Login.jsx"));
const Register = lazy(() => import("./pages/Register.jsx"));
const RoleSelect = lazy(() => import("./pages/RoleSelect.jsx"));
const Profile = lazy(() => import("./pages/Profile.jsx"));
const UserProfile = lazy(() => import("./pages/UserProfile.jsx"));
const Discover = lazy(() => import("./pages/Discover.jsx"));
const Messages = lazy(() => import("./pages/Messages.jsx"));
const Notifications = lazy(() => import("./pages/Notifications.jsx"));
const Settings = lazy(() => import("./pages/Settings.jsx"));
const Chat = lazy(() => import("./pages/Chat.jsx"));
const Saved = lazy(() => import("./pages/Saved.jsx"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard.jsx"));
const Analytics = lazy(() => import("./pages/Analytics.jsx"));
const AdminRoute = lazy(() => import("./components/AdminRoute.jsx"));


export default function App() {
  return (
    <Suspense fallback={<LoadingSpinner centered />}>
      <Routes>
        <Route path="/" element={<SplashScreen />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Role selection — protected but outside Layout (no nav bar) */}
        <Route
          path="/select-role"
          element={
            <ProtectedRoute>
              <RoleSelect />
            </ProtectedRoute>
          }
        />

        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/home" element={<Home />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/user/:userId" element={<UserProfile />} />
          <Route path="/discover" element={<Discover />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/chat/:userId" element={<Chat />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/saved" element={<Saved />} />
          <Route path="/admin" element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          } />
          <Route path="/analytics" element={<Analytics />} />
        </Route>

        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </Suspense>
  );
}
