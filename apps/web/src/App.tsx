import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.js';
import { Navbar } from './components/Navbar.js';
import { Footer } from './components/Footer.js';
import { LandingPage } from './pages/LandingPage.js';
import { SubAppsPage } from './pages/SubAppsPage.js';
import { SubAppDetailPage } from './pages/SubAppDetailPage.js';
import { CreativesPage } from './pages/CreativesPage.js';
import { CreativeDetailPage } from './pages/CreativeDetailPage.js';
import { LoginPage } from './pages/LoginPage.js';
import { RegisterPage } from './pages/RegisterPage.js';
import { ProfilePage } from './pages/ProfilePage.js';
import { AdminLayout } from './pages/admin/AdminLayout.js';
import { AdminOverviewPage } from './pages/admin/AdminOverviewPage.js';
import { AdminSubAppsPage } from './pages/admin/AdminSubAppsPage.js';
import { AdminCreativesPage } from './pages/admin/AdminCreativesPage.js';
import { AdminCategoriesPage } from './pages/admin/AdminCategoriesPage.js';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 font-sans">
          <Navbar />
          <main className="flex-1">
            <Routes>
              {/* Public Pages */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/sub-apps" element={<SubAppsPage />} />
              <Route path="/sub-apps/:slug" element={<SubAppDetailPage />} />
              <Route path="/creative" element={<CreativesPage />} />
              <Route path="/creative/:slug" element={<CreativeDetailPage />} />

              {/* Auth Pages */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* User Dashboard */}
              <Route path="/dashboard" element={<Navigate to="/dashboard/profile" replace />} />
              <Route path="/dashboard/profile" element={<ProfilePage />} />

              {/* Admin Panel */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminOverviewPage />} />
                <Route path="sub-apps" element={<AdminSubAppsPage />} />
                <Route path="creative-profiles" element={<AdminCreativesPage />} />
                <Route path="categories" element={<AdminCategoriesPage />} />
              </Route>

              {/* 404 Fallback */}
              <Route
                path="*"
                element={
                  <div className="max-w-md mx-auto my-24 p-8 text-center bg-white rounded-3xl border border-slate-200 shadow-sm space-y-3">
                    <h2 className="text-2xl font-bold text-slate-800">Halaman Tidak Ditemukan (404)</h2>
                    <p className="text-xs text-slate-500">Alamat URL yang Anda tuju tidak tersedia.</p>
                  </div>
                }
              />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
};
