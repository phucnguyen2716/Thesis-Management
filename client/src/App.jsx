import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import ThesisDetail from './pages/ThesisDetail';
import Profile from './pages/Profile';
import StudentGames from './pages/StudentGames';
import FlipbookPage from './pages/FlipbookPage';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

import AnalysisPage from './pages/AnalysisPage';
import NewsDetailPage from './pages/NewsDetailPage';
import LookupPage from './pages/LookupPage';
import NewsPage from './pages/NewsPage';
import FavoritesPage from './pages/FavoritesPage';
import GuidelinesPage from './pages/GuidelinesPage';
import SupportPage from './pages/SupportPage';
import ThesisPracticePage from './pages/ThesisPracticePage';
import LecturerLayout from './components/LecturerLayout';
import LecturerDashboard from './pages/lecturer/LecturerDashboard';
import LecturerControllerPage from './pages/lecturer/LecturerControllerPage';
import LecturerThesesPage from './pages/lecturer/LecturerThesesPage';
import LecturerReportsPage from './pages/lecturer/LecturerReportsPage';
import LecturerProfilePage from './pages/lecturer/LecturerProfilePage';

import LecturerPracticeManagerPage from './pages/lecturer/LecturerPracticeManagerPage';
import LecturerEventProposalPage from './pages/lecturer/LecturerEventProposalPage';
import AdminLayout from './components/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminLoginAuditPage from './pages/admin/AdminLoginAuditPage';
import AdminSocialPage from './pages/admin/AdminSocialPage';
import AdminThesesPage from './pages/admin/AdminThesesPage';


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/theses/:id/flipbook" element={
          <ProtectedRoute>
            <FlipbookPage />
          </ProtectedRoute>
        } />
        <Route path="/letcturer" element={<Navigate to="/lecturer" replace />} />

        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="students" element={<AdminUsersPage fixedRole="Student" />} />
          <Route path="advisors" element={<AdminUsersPage fixedRole="Advisor" />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="audit" element={<AdminLoginAuditPage />} />
          <Route path="social" element={<AdminSocialPage />} />
          <Route path="theses/:category" element={<AdminThesesPage />} />

        </Route>

        <Route
          path="/lecturer"
          element={
            <ProtectedRoute>
              <LecturerLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<LecturerDashboard />} />
          <Route path="controller" element={<LecturerControllerPage />} />
          <Route path="controller/:id" element={<LecturerControllerPage />} />
          <Route path="theses" element={<LecturerThesesPage />} />
          <Route path="reports" element={<LecturerReportsPage />} />
          <Route path="profile" element={<LecturerProfilePage />} />

          <Route path="propose-event" element={<LecturerEventProposalPage />} />
        </Route>
        
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="analysis" element={<AnalysisPage />} />
          <Route path="news" element={<NewsPage />} />
          <Route path="news/:id" element={<NewsDetailPage />} />
          <Route path="lookup" element={<LookupPage />} />
          <Route path="guidelines" element={<GuidelinesPage />} />
          <Route path="theses/:id" element={<ThesisDetail />} />
          <Route path="profile" element={<Profile />} />
          <Route path="games" element={<StudentGames />} />
          <Route path="favorites" element={<FavoritesPage />} />
          <Route path="support" element={<SupportPage />} />
          <Route path="practice" element={<ThesisPracticePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
