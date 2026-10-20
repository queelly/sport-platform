import React, { useEffect, useState } from 'react';
import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import {
  AppSidebar,
  getSelectedGlobalRegion,
  MobileTabBar,
  Navbar,
} from './components/Navbar';
import {
  HomeAndCatalogPage,
  MyEventsPage,
  RecommendedPage,
} from './pages/HomeAndCatalogPage';
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
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="w-full h-64 rounded-[22px] bg-card border border-line animate-pulse" />
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (requireAdmin && user.globalRole !== 'ADMIN') {
    return (
      <div className="max-w-xl mx-auto mt-12 bg-card rounded-[22px] border border-rose-200 p-8 text-center space-y-3 shadow-xs">
        <div className="font-bold text-xl text-rose-800">Доступ запрещён (403)</div>
        <p className="text-xs text-muted">
          Эта страница доступна только администраторам платформы.
        </p>
      </div>
    );
  }
  return <>{children}</>;
};

const PageContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="max-w-[1240px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 lg:pb-10">
    {children}
  </div>
);

const AppShell: React.FC = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [cityModalOpen, setCityModalOpen] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<string>(() => getSelectedGlobalRegion());

  useEffect(() => {
    const handler = (e: Event) => {
      const custom = e as CustomEvent<string>;
      setSelectedRegion(custom.detail ?? '');
    };
    window.addEventListener('sp-region-change', handler);
    return () => window.removeEventListener('sp-region-change', handler);
  }, []);

  return (
    <div className="h-dvh flex bg-page text-ink font-sans overflow-hidden">
      {/* Левая боковая панель со всеми вкладками (на десктопе всегда видна и ничего не обрезается) */}
      <div className="hidden lg:flex h-full shrink-0">
        <AppSidebar
          selectedRegion={selectedRegion}
          onOpenRegionModal={() => setCityModalOpen(true)}
        />
      </div>

      {/* Мобильный выезжающий сайдбар */}
      {mobileSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="relative z-10 h-full">
            <AppSidebar
              selectedRegion={selectedRegion}
              onOpenRegionModal={() => setCityModalOpen(true)}
              mobileOpen={mobileSidebarOpen}
              onCloseMobile={() => setMobileSidebarOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Правая рабочая область: Верхняя компактная панель + Основной контент */}
      <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden">
        <Navbar
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
          cityModalOpen={cityModalOpen}
          setCityModalOpen={setCityModalOpen}
        />

        <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
          <Routes>
            <Route path="/" element={<HomeAndCatalogPage />} />
            <Route path="/events" element={<HomeAndCatalogPage catalogOnly />} />
            <Route path="/recommended" element={<RecommendedPage />} />
            <Route path="/my" element={<MyEventsPage />} />

            <Route
              path="/events/new"
              element={
                <ProtectedRoute>
                  <PageContainer>
                    <CreateEventPage />
                  </PageContainer>
                </ProtectedRoute>
              }
            />
            <Route
              path="/events/:eventId"
              element={
                <PageContainer>
                  <EventDetailPage />
                </PageContainer>
              }
            />

            <Route
              path="/login"
              element={
                <PageContainer>
                  <LoginPage />
                </PageContainer>
              }
            />
            <Route
              path="/register"
              element={
                <PageContainer>
                  <RegisterPage />
                </PageContainer>
              }
            />

            <Route
              path="/organizations"
              element={
                <PageContainer>
                  <OrganizationsListPage />
                </PageContainer>
              }
            />
            <Route
              path="/organizations/:orgId"
              element={
                <PageContainer>
                  <OrganizationPublicPage />
                </PageContainer>
              }
            />
            <Route
              path="/my-organization"
              element={
                <ProtectedRoute>
                  <PageContainer>
                    <MyOrganizationCabinetPage />
                  </PageContainer>
                </ProtectedRoute>
              }
            />

            <Route
              path="/partners"
              element={
                <PageContainer>
                  <PartnersAndFriendsPage />
                </PageContainer>
              }
            />
            <Route
              path="/friends"
              element={
                <PageContainer>
                  <PartnersAndFriendsPage />
                </PageContainer>
              }
            />
            <Route
              path="/users/:userId"
              element={
                <PageContainer>
                  <PublicUserProfilePage />
                </PageContainer>
              }
            />

            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <PageContainer>
                    <MyProfilePage />
                  </PageContainer>
                </ProtectedRoute>
              }
            />

            <Route
              path="/support"
              element={
                <ProtectedRoute>
                  <PageContainer>
                    <SupportPage />
                  </PageContainer>
                </ProtectedRoute>
              }
            />
            <Route
              path="/support/tickets/:ticketId"
              element={
                <ProtectedRoute>
                  <PageContainer>
                    <SupportPage />
                  </PageContainer>
                </ProtectedRoute>
              }
            />
            <Route
              path="/support/chat"
              element={
                <ProtectedRoute>
                  <PageContainer>
                    <SupportPage />
                  </PageContainer>
                </ProtectedRoute>
              }
            />

            <Route
              path="/notifications"
              element={
                <ProtectedRoute>
                  <PageContainer>
                    <NotificationsAndVkPage />
                  </PageContainer>
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin"
              element={
                <ProtectedRoute requireAdmin>
                  <PageContainer>
                    <AdminDashboardPage />
                  </PageContainer>
                </ProtectedRoute>
              }
            />

            <Route
              path="/terms"
              element={
                <PageContainer>
                  <LegalInfoPage doc="terms" />
                </PageContainer>
              }
            />
            <Route
              path="/privacy"
              element={
                <PageContainer>
                  <LegalInfoPage doc="privacy" />
                </PageContainer>
              }
            />

            <Route
              path="*"
              element={
                <PageContainer>
                  <div className="max-w-lg mx-auto my-12 bg-card rounded-[22px] border border-line-2 p-10 text-center space-y-3">
                    <div className="font-extrabold text-3xl text-ink">404</div>
                    <p className="text-sm text-muted">Страница не найдена</p>
                    <div className="pt-2">
                      <Link
                        to="/"
                        className="inline-flex px-5 py-2.5 rounded-xl bg-brand text-white text-xs font-bold"
                      >
                        Вернуться на карту
                      </Link>
                    </div>
                  </div>
                </PageContainer>
              }
            />
          </Routes>
        </main>

        <MobileTabBar />
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </AuthProvider>
  );
};

const LegalInfoPage: React.FC<{ doc: 'terms' | 'privacy' }> = ({ doc }) => {
  const isTerms = doc === 'terms';
  return (
    <div className="max-w-3xl mx-auto bg-card rounded-[22px] border border-line-2 p-6 sm:p-8 shadow-xs space-y-5">
      <div className="space-y-1">
        <span className="inline-block px-3 py-1 rounded-full bg-brand-tint text-brand-ink text-xs font-bold">
          Официальный документ платформы «Точка Сбора»
        </span>
        <h1 className="font-extrabold text-2xl sm:text-3xl text-ink">
          {isTerms ? 'Пользовательское соглашение' : 'Политика конфиденциальности и обработки данных'}
        </h1>
      </div>

      {isTerms ? (
        <div className="space-y-3 text-sm text-ink/90 leading-relaxed">
          <p>
            Настоящее Пользовательское соглашение регулирует порядок использования Спортивной Платформы «Точка Сбора» для поиска и организации спортивных тренировок и городских спортивных сообществ.
          </p>
          <h2 className="font-bold text-base text-ink pt-2">
            1. Правила создания мероприятий и участия
          </h2>
          <p>
            Организаторы обязаны указывать достоверные сведения о дате, времени, регионе (или онлайн-формате), условиях участия и ограничениях по уровню подготовки. Запрещается публикация заведомо ложных объявлений, спама и материалов, нарушающих законодательство РФ.
          </p>
          <h2 className="font-bold text-base text-ink pt-2">
            2. Безопасность и ответственность участников
          </h2>
          <p>
            Каждый участник самостоятельно оценивает состояние своего здоровья и уровень физической подготовки перед записью на спортивные встречи. При обнаружении нарушений правил любой пользователь может подать обращение через систему тикетов.
          </p>
        </div>
      ) : (
        <div className="space-y-3 text-sm text-ink/90 leading-relaxed">
          <p>
            Политика конфиденциальности описывает, какие данные собираются на платформе «Точка Сбора» и как обеспечивается их защита.
          </p>
          <h2 className="font-bold text-base text-ink pt-2">
            1. Обрабатываемые данные
          </h2>
          <p>
            Мы храним только данные, необходимые для работы сервиса: отображаемое имя, адрес электронной почты, хэш пароля (BCrypt), выбранный регион, спортивные интересы и настройки приватности профиля.
          </p>
          <h2 className="font-bold text-base text-ink pt-2">
            2. Управление видимостью и уведомлениями
          </h2>
          <p>
            Пользователь может в любой момент изменить настройки видимости своего профиля в поиске напарников, скрыть предстоящие записи или отключить уведомления ВКонтакте в разделе «Мой профиль» и «Уведомления и VK».
          </p>
        </div>
      )}

      <div className="pt-4 border-t border-line flex flex-wrap items-center justify-between gap-3 text-xs text-muted">
        <span>Служба поддержки: support@sportplatform.ru</span>
        <div className="flex gap-3">
          <Link to="/support" className="font-bold text-brand-ink hover:underline">
            Создать тикет в поддержку
          </Link>
          <Link to="/support/chat" className="font-bold text-brand-ink hover:underline">
            Открыть онлайн-чат с поддержкой
          </Link>
        </div>
      </div>
    </div>
  );
};
