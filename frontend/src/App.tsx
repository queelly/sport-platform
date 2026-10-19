import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import { Navbar } from './components/Navbar';
import { HomeAndCatalogPage } from './pages/HomeAndCatalogPage';
import { LoginPage, RegisterPage } from './pages/AuthPages';
import { CreateEventPage, EventDetailPage } from './pages/EventPages';
import {
  MyOrganizationCabinetPage,
  OrganizationPublicPage,
  OrganizationsListPage,
} from './pages/OrganizationPages';
import {
  MyProfilePage,
  PartnersAndFriendsPage,
  PublicUserProfilePage,
} from './pages/SocialPages';
import { NotificationsAndVkPage, SupportPage } from './pages/SupportAndVkPages';
import { AdminDashboardPage } from './pages/AdminDashboardPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode; requireAdmin?: boolean }> = ({
  children,
  requireAdmin = false,
}) => {
  const { user, loading } = useAuth();
  if (loading) {
    return <div className="max-w-7xl mx-auto p-8 h-64 rounded-3xl bg-slate-200 animate-pulse mt-6" />;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (requireAdmin && user.globalRole !== 'ADMIN') {
    return (
      <div className="max-w-xl mx-auto mt-12 bg-white rounded-3xl border border-rose-200 p-8 text-center space-y-3">
        <div className="font-display font-bold text-xl text-rose-800">Доступ запрещён (403)</div>
        <p className="text-xs text-slate-600">
          Эта страница доступна только администраторам платформы.
        </p>
      </div>
    );
  }
  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
          <Navbar />
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
            <Routes>
              <Route path="/" element={<HomeAndCatalogPage />} />
              <Route path="/events" element={<HomeAndCatalogPage catalogOnly />} />
              <Route
                path="/events/new"
                element={
                  <ProtectedRoute>
                    <CreateEventPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/events/:eventId" element={<EventDetailPage />} />

              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              <Route path="/organizations" element={<OrganizationsListPage />} />
              <Route path="/organizations/:orgId" element={<OrganizationPublicPage />} />
              <Route
                path="/my-organization"
                element={
                  <ProtectedRoute>
                    <MyOrganizationCabinetPage />
                  </ProtectedRoute>
                }
              />

              <Route path="/partners" element={<PartnersAndFriendsPage />} />
              <Route path="/friends" element={<PartnersAndFriendsPage />} />
              <Route path="/users/:userId" element={<PublicUserProfilePage />} />

              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <MyProfilePage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/support"
                element={
                  <ProtectedRoute>
                    <SupportPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/support/tickets/:ticketId"
                element={
                  <ProtectedRoute>
                    <SupportPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/support/chat"
                element={
                  <ProtectedRoute>
                    <SupportPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/notifications"
                element={
                  <ProtectedRoute>
                    <NotificationsAndVkPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/admin"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminDashboardPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="*"
                element={
                  <div className="max-w-lg mx-auto my-16 bg-white rounded-3xl border border-slate-200 p-10 text-center space-y-3">
                    <div className="font-display font-extrabold text-3xl text-slate-900">404</div>
                    <p className="text-sm text-slate-600">Страница не найдена</p>
                  </div>
                }
              />
            </Routes>
          </main>

          <footer className="border-t border-slate-200/80 bg-white py-6 mt-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
              <div>
                <span className="font-display font-bold text-slate-800">ТОЧКА СБОРА</span> — Спортивная платформа для совместных активностей, клубов и единомышленников
              </div>
              <div className="flex items-center gap-4">
                <a href="/swagger-ui.html" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600">
                  OpenAPI / Swagger
                </a>
                <span>Java 21 • Spring Boot 3.4 • JWT • PostgreSQL • Docker • VK Bot</span>
              </div>
            </div>
          </footer>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
};
