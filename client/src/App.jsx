import { Suspense, lazy } from "react";
import { Toaster } from "react-hot-toast";
import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import LoadingSpinner from "./components/LoadingSpinner.jsx";
import SplashScreen from "./pages/SplashScreen.jsx";
import Home from "./pages/Home.jsx";

// Static import critical pages to avoid loading spinner on click
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import RoleSelect from "./pages/RoleSelect.jsx";
import Profile from "./pages/Profile.jsx";
import UserProfile from "./pages/UserProfile.jsx";
import Discover from "./pages/Discover.jsx";
import CategorySearch from "./pages/CategorySearch.jsx";
import Messages from "./pages/Messages.jsx";
import Notifications from "./pages/Notifications.jsx";
import Settings from "./pages/Settings.jsx";
import Chat from "./pages/Chat.jsx";
import Saved from "./pages/Saved.jsx";
import Collaborations from "./pages/Collaborations.jsx";
import Analytics from "./pages/Analytics.jsx";
import Premium from "./pages/Premium.jsx";
import Earnings from "./pages/Earnings.jsx";
import BrandTools from "./pages/BrandTools.jsx";
import Requests from "./pages/Requests.jsx";
import BrandDashboard from "./pages/BrandDashboard.jsx";

// Lazy load non-critical pages
const ForgotPassword = lazy(() => import("./pages/ForgotPassword.jsx"));
const ResetPassword = lazy(() => import("./pages/ResetPassword.jsx"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail.jsx"));
const UsersList = lazy(() => import("./pages/UsersList.jsx"));
const Onboarding = lazy(() => import("./pages/Onboarding.jsx"));
const ApplyVerification = lazy(() => import("./pages/ApplyVerification.jsx"));
const EditProfile = lazy(() => import("./pages/EditProfile.jsx"));


export default function App() {
  return (
    <>
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
          <Route path="/search" element={<CategorySearch />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/messages/:userId" element={<Messages />} />
          <Route path="/saved" element={<Saved />} />
          <Route path="/collaborations" element={<Collaborations />} />
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
    <Toaster 
      position="top-center"
      toastOptions={{
        style: {
          background: 'var(--bg-card)',
          color: 'var(--text-main)',
          borderRadius: '12px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
          border: '1px solid var(--border-light)',
          fontSize: '14px',
          fontWeight: '500'
        },
        success: {
          iconTheme: {
            primary: 'var(--accent-color)',
            secondary: 'white',
          },
        },
      }}
    />
    </>
  );
}
