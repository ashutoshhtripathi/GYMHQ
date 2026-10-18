import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import MembersPage from './pages/MembersPage';
import AttendancePage from './pages/AttendancePage';
import PaymentsPage from './pages/PaymentsPage';
import ReportsPage from './pages/ReportsPage';
import GuidePage from './pages/GuidePage';
import PlatformAdminPage from './pages/PlatformAdminPage';
import { useAuth } from './context/AuthContext';

function SuperAdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user?.role !== 'super_admin') {
    return <Navigate to="/" replace />;
  }
  return children;
}

function GymOwnerRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user?.role === 'super_admin') {
    return <Navigate to="/" replace />;
  }
  return children;
}

function HomeRoute() {
  const { user } = useAuth();
  if (user?.role === 'super_admin') {
    return <PlatformAdminPage />;
  }
  return <DashboardPage />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<HomeRoute />} />
        
        {/* Gym operational pages strictly reserved for client gym owners */}
        <Route
          path="members"
          element={
            <GymOwnerRoute>
              <MembersPage />
            </GymOwnerRoute>
          }
        />
        <Route
          path="attendance"
          element={
            <GymOwnerRoute>
              <AttendancePage />
            </GymOwnerRoute>
          }
        />
        <Route
          path="payments"
          element={
            <GymOwnerRoute>
              <PaymentsPage />
            </GymOwnerRoute>
          }
        />
        <Route
          path="reports"
          element={
            <GymOwnerRoute>
              <ReportsPage />
            </GymOwnerRoute>
          }
        />
        <Route
          path="guide"
          element={
            <GymOwnerRoute>
              <GuidePage />
            </GymOwnerRoute>
          }
        />
        
        {/* Platform SaaS administration */}
        <Route
          path="access-control"
          element={
            <SuperAdminRoute>
              <PlatformAdminPage />
            </SuperAdminRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
