import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import { Navbar, RightProfileSidebar } from './components/Navbar';
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
    return <div className="w-full p-8 h-64 rounded-[28px] bg-white/70 animate-pulse" />;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (requireAdmin && user.globalRole !== 'ADMIN') {
    return (
      <div className="max-w-xl mx-auto mt-12 bg-white rounded-[28px] border border-rose-200 p-8 text-center space-y-3 shadow-xs">
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
        <div className="min-h-screen flex flex-col bg-[#EEF4F1] text-[#1A2622]">
          <div className="max-w-[1600px] w-full mx-auto px-3 sm:px-5 lg:px-6 py-3 lg:py-5 flex flex-col lg:flex-row gap-5 flex-1">
            {/* Left Vertical Sidebar (Ref 1 & Ref 2) */}
            <Navbar />

            {/* Central Bento Workspace */}
            <div className="flex-1 min-w-0 flex flex-col justify-between gap-8">
              <main className="flex-1 min-w-0">
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
                      <div className="max-w-lg mx-auto my-16 bg-white rounded-[28px] border border-slate-100 p-10 text-center space-y-3 shadow-xs">
                        <div className="font-display font-extrabold text-3xl text-slate-900">404</div>
                        <p className="text-sm text-slate-600">Страница не найдена</p>
                      </div>
                    }
                  />
                </Routes>
              </main>

              {/* Compact Bottom Footer inside Workspace */}
              <footer className="bg-white rounded-3xl px-5 py-4 border border-slate-100/90 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
                <div>
                  <span className="font-display font-extrabold text-slate-800">Точка Сбора</span> — спортивная экосистема совместных тренировок, клубов и напарников
                </div>
                <div className="flex items-center gap-4">
                  <a
                    href="/swagger-ui.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-[#16B672] hover:underline"
                  >
                    OpenAPI / Swagger
                  </a>
                  <span>Java 21 • Spring Boot 3.4 • PostgreSQL • VK Bot</span>
                </div>
              </footer>
            </div>

            {/* Right Scenic Profile & Upcoming Trainings Column (Ref 2) */}
            <RightProfileSidebar />
          </div>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
};
