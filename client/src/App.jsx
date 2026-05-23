import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import ThesisList from './pages/ThesisList';
import ThesisDetail from './pages/ThesisDetail';
import Profile from './pages/Profile';

const ProtectedRoute = ({ children }) => {
  // Temporarily bypass authentication for preview
  return children;
};

import AnalysisPage from './pages/AnalysisPage';
import NewsDetailPage from './pages/NewsDetailPage';
import LookupPage from './pages/LookupPage';
import NewsPage from './pages/NewsPage';
import FavoritesPage from './pages/FavoritesPage';
import GuidelinesPage from './pages/GuidelinesPage';
import SupportPage from './pages/SupportPage';
import LecturerLayout from './components/LecturerLayout';
import LecturerDashboard from './pages/lecturer/LecturerDashboard';
import LecturerControllerPage from './pages/lecturer/LecturerControllerPage';
import LecturerThesesPage from './pages/lecturer/LecturerThesesPage';
import LecturerReportsPage from './pages/lecturer/LecturerReportsPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/letcturer" element={<Navigate to="/lecturer" replace />} />

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
          <Route path="theses" element={<LecturerThesesPage />} />
          <Route path="reports" element={<LecturerReportsPage />} />
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
          <Route path="theses" element={<ThesisList />} />
          <Route path="theses/:id" element={<ThesisDetail />} />
          <Route path="profile" element={<Profile />} />
          <Route path="favorites" element={<FavoritesPage />} />
          <Route path="support" element={<SupportPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
