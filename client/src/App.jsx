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
const Premium = lazy(() => import("./pages/Premium.jsx"));
const Earnings = lazy(() => import("./pages/Earnings.jsx"));
const AdminRoute = lazy(() => import("./components/AdminRoute.jsx"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword.jsx"));
const ResetPassword = lazy(() => import("./pages/ResetPassword.jsx"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail.jsx"));
const UsersList = lazy(() => import("./pages/UsersList.jsx"));
const Onboarding = lazy(() => import("./pages/Onboarding.jsx"));
const ApplyVerification = lazy(() => import("./pages/ApplyVerification.jsx"));
const BrandTools = lazy(() => import("./pages/BrandTools.jsx"));

const Requests = lazy(() => import("./pages/Requests.jsx"));
const BrandDashboard = lazy(() => import("./pages/BrandDashboard.jsx"));
const EditProfile = lazy(() => import("./pages/EditProfile.jsx"));


export default function App() {
  return (
    <Suspense fallback={<LoadingSpinner centered />}>
      <Routes>
        <Route path="/" element={<SplashScreen />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        {/* Protected outside Layout */}
        <Route
          path="/select-role"
          element={
            <ProtectedRoute>
              <RoleSelect />
            </ProtectedRoute>
          }
        />
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute>
              <Onboarding />
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
          <Route path="/profile/edit" element={<EditProfile />} />
          <Route path="/user/:userId" element={<UserProfile />} />
          <Route path="/discover" element={<Discover />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/messages/:userId" element={<Messages />} />
          <Route path="/saved" element={<Saved />} />
          <Route path="/admin" element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          } />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/premium" element={<Premium />} />
          <Route path="/earnings" element={<Earnings />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/user/:userId/:type" element={<UsersList />} />
          <Route path="/post/:postId/likes" element={<UsersList />} />
          <Route path="/requests" element={<Requests />} />
          <Route path="/brand-dashboard" element={<BrandDashboard />} />
          <Route path="/verify-account" element={<ApplyVerification />} />
          <Route path="/brand-tools" element={<BrandTools />} />
        </Route>


        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </Suspense>
  );
}
