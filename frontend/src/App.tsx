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

                  <Route path="/terms" element={<LegalInfoPage doc="terms" />} />
                  <Route path="/privacy" element={<LegalInfoPage doc="privacy" />} />

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
              <footer className="bg-white rounded-3xl px-5 py-4 border border-slate-100/90 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-slate-500">
                <div>
                  <span className="font-display font-extrabold text-slate-800">Точка Сбора</span> — спортивная платформа совместных тренировок, соревнований и клубов
                </div>
                <div className="flex flex-wrap items-center justify-center gap-4">
                  <a href="/terms" className="font-bold text-slate-700 hover:text-[#16B672] hover:underline">
                    Пользовательское соглашение
                  </a>
                  <a href="/privacy" className="font-bold text-slate-700 hover:text-[#16B672] hover:underline">
                    Политика конфиденциальности
                  </a>
                  <a href="/support/chat" className="font-bold text-[#16B672] hover:underline">
                    Контакты техподдержки
                  </a>
                  <a href="/support" className="font-bold text-[#16B672] hover:underline">
                    Обращения и тикеты
                  </a>
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

const LegalInfoPage: React.FC<{ doc: 'terms' | 'privacy' }> = ({ doc }) => {
  const isTerms = doc === 'terms';
  return (
    <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 shadow-xs space-y-5">
      <div className="space-y-1">
        <span className="inline-block px-3 py-1 rounded-full bg-[#E7F8F0] text-[#11995E] text-xs font-extrabold">
          Официальный документ платформы «Точка Сбора»
        </span>
        <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900">
          {isTerms ? 'Пользовательское соглашение' : 'Политика конфиденциальности и обработки данных'}
        </h1>
      </div>

      {isTerms ? (
        <div className="space-y-3 text-sm text-slate-700 leading-relaxed">
          <p>
            Настоящее Пользовательское соглашение регулирует порядок использования Спортивной Платформы «Точка Сбора» для поиска и организации спортивных тренировок, соревнований, фестивалей, квестов и городских спортивных сообществ.
          </p>
          <h2 className="font-display font-extrabold text-base text-slate-900 pt-2">
            1. Правила создания мероприятий и участия
          </h2>
          <p>
            Организаторы обязаны указывать достоверные сведения о дате, времени, регионе (или онлайн-формате), условиях участия и ограничениях по уровню подготовки. Запрещается публикация заведомо ложных объявлений, спама и материалов, нарушающих законодательство РФ.
          </p>
          <h2 className="font-display font-extrabold text-base text-slate-900 pt-2">
            2. Безопасность и ответственность участников
          </h2>
          <p>
            Каждый участник самостоятельно оценивает состояние своего здоровья и уровень физической подготовки перед записью на спортивные встречи и соревнования. При обнаружении нарушений правил любой пользователь может подать обращение через систему тикетов.
          </p>
        </div>
      ) : (
        <div className="space-y-3 text-sm text-slate-700 leading-relaxed">
          <p>
            Политика конфиденциальности описывает, какие данные собираются на платформе «Точка Сбора» и как обеспечивается их защита.
          </p>
          <h2 className="font-display font-extrabold text-base text-slate-900 pt-2">
            1. Обрабатываемые данные
          </h2>
          <p>
            Мы храним только данные, необходимые для работы сервиса: отображаемое имя, адрес электронной почты, хэш пароля (BCrypt), выбранный регион, спортивные интересы и настройки приватности профиля.
          </p>
          <h2 className="font-display font-extrabold text-base text-slate-900 pt-2">
            2. Управление видимостью и уведомлениями
          </h2>
          <p>
            Пользователь может в любой момент изменить настройки видимости своего профиля в поиске напарников, скрыть предстоящие записи или отключить уведомления ВКонтакте в разделе «Мой профиль» и «Уведомления и VK».
          </p>
        </div>
      )}

      <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
        <span>Служба поддержки: support@sportplatform.ru</span>
        <div className="flex gap-3">
          <a href="/support" className="font-bold text-[#16B672] hover:underline">
            Создать тикет в поддержку
          </a>
          <a href="/support/chat" className="font-bold text-[#16B672] hover:underline">
            Открыть онлайн-чат с поддержкой
          </a>
        </div>
      </div>
    </div>
  );
};

