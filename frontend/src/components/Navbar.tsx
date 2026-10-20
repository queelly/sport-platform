import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Bell,
  Building2,
  CalendarCheck,
  CheckCheck,
  ChevronDown,
  Compass,
  HelpCircle,
  List,
  LogOut,
  Map as MapIcon,
  MapPin,
  Menu,
  Moon,
  Plus,
  ShieldCheck,
  Sun,
  Type,
  User,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../AuthContext';
import { apiFetch, formatDateTime } from '../api';
import { getRegionInfo, NotificationDto, searchRussianLocations } from '../types';

export function getSelectedGlobalRegion(): string {
  return localStorage.getItem('sp_selected_region') ?? '';
}

export function setSelectedGlobalRegion(region: string) {
  localStorage.setItem('sp_selected_region', region);
  window.dispatchEvent(new CustomEvent('sp-region-change', { detail: region }));
}

interface UiSettings {
  theme: 'light' | 'dark';
  fontSize: 'normal' | 'lg' | 'xl';
}

const DEFAULT_SETTINGS: UiSettings = {
  theme: 'light',
  fontSize: 'normal',
};

function useNavActiveState() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const isHome = location.pathname === '/';
  const isCatalogRoute = location.pathname === '/events';
  const viewParam = searchParams.get('view');

  const isMapActive = (isHome && viewParam !== 'list') || (isCatalogRoute && viewParam === 'map');
  const isCatalogActive = (isCatalogRoute && viewParam !== 'map') || (isHome && viewParam === 'list');
  const isPartnersActive =
    location.pathname.startsWith('/partners') ||
    location.pathname.startsWith('/friends') ||
    location.pathname.startsWith('/users/');
  const isCommunitiesActive = location.pathname.startsWith('/communities');
  const isOrganizationsActive =
    location.pathname.startsWith('/organizations') ||
    location.pathname.startsWith('/my-organization');
  const isMyActive = location.pathname === '/my';
  const isNotifsActive = location.pathname.startsWith('/notifications');
  const isSupportActive = location.pathname.startsWith('/support');
  const isAdminActive = location.pathname.startsWith('/admin');
  const isAdmin = user?.globalRole === 'ADMIN';

  return {
    isMapActive,
    isCatalogActive,
    isPartnersActive,
    isCommunitiesActive,
    isOrganizationsActive,
    isMyActive,
    isNotifsActive,
    isSupportActive,
    isAdminActive,
    isAdmin,
  };
}

/* ============================================================================
 * ЛЕВАЯ БОКОВАЯ ПАНЕЛЬ НАВИГАЦИИ (AppSidebar) — все вкладки вертикально и целиком
 * ============================================================================ */
export const AppSidebar: React.FC<{
  onOpenRegionModal: () => void;
  selectedRegion: string;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}> = ({ onOpenRegionModal, selectedRegion, onCloseMobile }) => {
  const {
    user,
    unreadNotificationsCount,
  } = useAuth();

  const {
    isMapActive,
    isCatalogActive,
    isPartnersActive,
    isCommunitiesActive,
    isOrganizationsActive,
    isMyActive,
    isNotifsActive,
    isSupportActive,
    isAdminActive,
    isAdmin,
  } = useNavActiveState();

  const currentRegionInfo = getRegionInfo(selectedRegion);

  const sidebarLinkClass = (active: boolean) =>
    `w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-semibold transition-colors ${
      active
        ? 'bg-brand text-white font-bold shadow-xs'
        : 'text-ink hover:bg-surface/80'
    }`;

  return (
    <aside className="w-64 h-full bg-card border-r border-line-2 flex flex-col justify-between select-none shrink-0">
      {/* Верхняя часть: Бренд + Кнопка создания + Вертикальные вкладки */}
      <div className="p-4 space-y-4 overflow-y-auto flex-1">
        {/* Логотип */}
        <div className="flex items-center justify-between gap-2">
          <Link
            to="/"
            onClick={onCloseMobile}
            className="flex items-center gap-2.5 group"
          >
            <span className="w-10 h-10 rounded-xl bg-brand text-white font-display font-extrabold text-sm flex items-center justify-center shadow-xs group-hover:bg-brand-hover transition-colors shrink-0">
              ТС
            </span>
            <div className="flex flex-col leading-none">
              <span className="font-display font-extrabold text-[15px] tracking-tight text-ink">
                ТОЧКА СБОРА
              </span>
              <span className="font-mono text-[10px] font-medium text-brand-ink mt-1">
                СПОРТИВНАЯ ПЛАТФОРМА
              </span>
            </div>
          </Link>

          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="lg:hidden w-8 h-8 rounded-lg bg-surface text-muted hover:text-ink flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Главная кнопка действия */}
        <Link
          to={user ? '/events/new' : '/login'}
          onClick={onCloseMobile}
          className="w-full h-11 px-4 rounded-xl bg-brand hover:bg-brand-hover text-white font-display font-bold text-xs tracking-wide flex items-center justify-center gap-2 shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Создать сбор</span>
        </Link>

        {/* Выбор региона / города */}
        <button
          type="button"
          onClick={() => {
            if (onCloseMobile) onCloseMobile();
            onOpenRegionModal();
          }}
          className="w-full p-2.5 rounded-xl bg-surface/80 hover:bg-surface border border-line-2 flex items-center justify-between gap-2 text-left transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2 min-w-0">
            <MapPin className="w-4 h-4 text-brand shrink-0" />
            <div className="min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted">
                Город или регион
              </div>
              <div className="text-xs font-bold text-ink truncate">
                {selectedRegion || 'Все регионы России'}
              </div>
            </div>
          </div>
          {currentRegionInfo && (
            <span className="font-mono text-[10px] font-bold text-brand-ink bg-brand-tint px-1.5 py-0.5 rounded-md shrink-0">
              {currentRegionInfo.tzLabel.split(' ')[0]}
            </span>
          )}
        </button>

        {/* Вертикальный список всех разделов платформы */}
        <nav aria-label="Основная навигация" className="space-y-1 pt-1">
          <div className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted">
            Разделы платформы
          </div>

          <Link
            to="/?view=map"
            onClick={onCloseMobile}
            className={sidebarLinkClass(isMapActive)}
          >
            <span className="flex items-center gap-2.5">
              <MapIcon className="w-4 h-4 shrink-0" />
              <span>Карта событий</span>
            </span>
          </Link>

          <Link
            to="/events?view=list"
            onClick={onCloseMobile}
            className={sidebarLinkClass(isCatalogActive)}
          >
            <span className="flex items-center gap-2.5">
              <List className="w-4 h-4 shrink-0" />
              <span>Каталог встреч</span>
            </span>
          </Link>

          <Link
            to="/communities"
            onClick={onCloseMobile}
            className={sidebarLinkClass(isCommunitiesActive)}
          >
            <span className="flex items-center gap-2.5">
              <Compass className="w-4 h-4 shrink-0" />
              <span>Сообщества</span>
            </span>
          </Link>

          <Link
            to="/organizations"
            onClick={onCloseMobile}
            className={sidebarLinkClass(isOrganizationsActive)}
          >
            <span className="flex items-center gap-2.5">
              <Building2 className="w-4 h-4 shrink-0" />
              <span>Организации</span>
            </span>
          </Link>

          <Link
            to="/partners"
            onClick={onCloseMobile}
            className={sidebarLinkClass(isPartnersActive)}
          >
            <span className="flex items-center gap-2.5">
              <Users className="w-4 h-4 shrink-0" />
              <span>Напарники и друзья</span>
            </span>
          </Link>

          {user && (
            <>
              <div className="px-2 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted">
                Личный кабинет
              </div>

              <Link
                to="/my"
                onClick={onCloseMobile}
                className={sidebarLinkClass(isMyActive)}
              >
                <span className="flex items-center gap-2.5">
                  <CalendarCheck className="w-4 h-4 shrink-0" />
                  <span>Мои записи и календарь</span>
                </span>
              </Link>

              <Link
                to="/notifications"
                onClick={onCloseMobile}
                className={sidebarLinkClass(isNotifsActive)}
              >
                <span className="flex items-center gap-2.5">
                  <Bell className="w-4 h-4 shrink-0" />
                  <span>Уведомления</span>
                </span>
                {unreadNotificationsCount > 0 && (
                  <span
                    className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      isNotifsActive ? 'bg-white text-brand-ink' : 'bg-clay text-white'
                    }`}
                  >
                    {unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}
                  </span>
                )}
              </Link>

              <Link
                to="/support"
                onClick={onCloseMobile}
                className={sidebarLinkClass(isSupportActive)}
              >
                <span className="flex items-center gap-2.5">
                  <HelpCircle className="w-4 h-4 shrink-0" />
                  <span>Поддержка и тикеты</span>
                </span>
              </Link>
            </>
          )}

          {isAdmin && (
            <>
              <div className="px-2 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted">
                Администрирование
              </div>
              <Link
                to="/admin"
                onClick={onCloseMobile}
                className={sidebarLinkClass(isAdminActive)}
              >
                <span className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>Панель модерации</span>
                </span>
              </Link>
            </>
          )}
        </nav>
      </div>

      {/* Нижняя часть только для неавторизованных гостей (чтобы не дублировать меню профиля сверху) */}
      {!user && (
        <div className="p-3.5 border-t border-line-2 bg-surface/40">
          <div className="grid grid-cols-2 gap-2">
            <Link
              to="/login"
              onClick={onCloseMobile}
              className="py-2 px-3 rounded-xl bg-card hover:bg-surface border border-line-2 text-xs font-bold text-ink text-center"
            >
              Войти
            </Link>
            <Link
              to="/register"
              onClick={onCloseMobile}
              className="py-2 px-3 rounded-xl bg-ink text-card text-xs font-bold text-center"
            >
              Регистрация
            </Link>
          </div>
        </div>
      )}
    </aside>
  );
};

/* ============================================================================
 * ВЕРХНЯЯ ПАНЕЛЬ ИНСТРУМЕНТОВ (Navbar) + МОДАЛКА ВЫБОРА ГОРОДА
 * ============================================================================ */
export const Navbar: React.FC<{
  onOpenMobileSidebar?: () => void;
  cityModalOpen?: boolean;
  setCityModalOpen?: (v: boolean) => void;
}> = ({ onOpenMobileSidebar, cityModalOpen: externalModalOpen, setCityModalOpen: setExternalModalOpen }) => {
  const {
    user,
    myOrganizations,
    unreadNotificationsCount,
    refreshUnreadCount,
    savedSessions,
    switchAccount,
    removeSavedAccount,
    logout,
  } = useAuth();

  const navigate = useNavigate();

  const [selectedRegion, setSelectedRegion] = useState<string>(() => getSelectedGlobalRegion());
  const [internalCityModalOpen, setInternalCityModalOpen] = useState(false);
  const cityModalOpen = externalModalOpen ?? internalCityModalOpen;
  const setCityModalOpen = setExternalModalOpen ?? setInternalCityModalOpen;

  const [cityQuery, setCityQuery] = useState('');

  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const notifPanelRef = useRef<HTMLDivElement>(null);
  const notifBtnRef = useRef<HTMLButtonElement>(null);

  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const [settings, setSettings] = useState<UiSettings>(() => {
    try {
      const saved = localStorage.getItem('sp_a11y');
      if (!saved) return DEFAULT_SETTINGS;
      const parsed = JSON.parse(saved);
      return {
        theme: parsed.theme === 'dark' ? 'dark' : 'light',
        fontSize: parsed.fontSize === 'lg' || parsed.fontSize === 'xl' ? parsed.fontSize : 'normal',
      };
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  useEffect(() => {
    if (user?.city && localStorage.getItem('sp_selected_region') === null) {
      setSelectedGlobalRegion(user.city);
      setSelectedRegion(user.city);
    }
  }, [user?.city]);

  useEffect(() => {
    const handler = (e: Event) => {
      const custom = e as CustomEvent<string>;
      setSelectedRegion(custom.detail ?? '');
    };
    window.addEventListener('sp-region-change', handler);
    return () => window.removeEventListener('sp-region-change', handler);
  }, []);

  // Применяем тему и только размер шрифта
  useEffect(() => {
    const html = document.documentElement;
    html.dataset.theme = settings.theme;
    html.classList.remove(
      'a11y-font-lg',
      'a11y-font-xl',
      'a11y-contrast-bw',
      'a11y-contrast-wb',
      'a11y-contrast-blue',
      'a11y-spacing-wide',
      'a11y-hide-images'
    );
    if (settings.fontSize === 'lg') html.classList.add('a11y-font-lg');
    if (settings.fontSize === 'xl') html.classList.add('a11y-font-xl');
    localStorage.setItem('sp_a11y', JSON.stringify(settings));
  }, [settings]);

  const loadNotifications = useCallback(async () => {
    if (!user) return;
    setLoadingNotifs(true);
    try {
      const list = await apiFetch<NotificationDto[]>('/api/v1/notifications');
      setNotifications(list.filter((n) => !n.read).slice(0, 15));
      await refreshUnreadCount();
    } catch {
      // ignore
    } finally {
      setLoadingNotifs(false);
    }
  }, [user, refreshUnreadCount]);

  useEffect(() => {
    const onNotifSync = () => {
      loadNotifications();
    };
    window.addEventListener('sp-notifications-updated', onNotifSync);
    return () => window.removeEventListener('sp-notifications-updated', onNotifSync);
  }, [loadNotifications]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        notifOpen &&
        notifPanelRef.current &&
        !notifPanelRef.current.contains(target) &&
        notifBtnRef.current &&
        !notifBtnRef.current.contains(target)
      ) {
        setNotifOpen(false);
      }
      if (profileMenuOpen && profileMenuRef.current && !profileMenuRef.current.contains(target)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [notifOpen, profileMenuOpen]);

  const handleMarkAllRead = async () => {
    try {
      await apiFetch('/api/v1/notifications/read-all', { method: 'POST' });
      setNotifications([]);
      await refreshUnreadCount();
      window.dispatchEvent(new CustomEvent('sp-notifications-updated'));
    } catch {
      // ignore
    }
  };

  const unreadNotifications = notifications.filter((n) => !n.read);

  const currentRegionInfo = getRegionInfo(selectedRegion);
  const filteredRegions = searchRussianLocations(cityQuery);

  return (
    <>
      <header className="h-14 bg-card border-b border-line-2 px-2.5 sm:px-6 flex items-center justify-between gap-1.5 sm:gap-3 relative z-40 shrink-0">
        {/* Левая часть: Кнопка мобильного меню + быстрый выбор города */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 flex-1">
          {onOpenMobileSidebar && (
            <button
              type="button"
              onClick={onOpenMobileSidebar}
              aria-label="Открыть меню разделов"
              className="lg:hidden h-9 w-9 sm:w-auto sm:px-2.5 rounded-xl bg-surface hover:bg-surface-2 border border-line-2 text-ink flex items-center justify-center gap-1.5 text-xs font-bold shrink-0 cursor-pointer"
            >
              <Menu className="w-4 h-4 text-brand shrink-0" />
              <span className="hidden sm:inline">Разделы</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setCityModalOpen(true)}
            className="h-9 px-2.5 sm:px-3 rounded-xl bg-surface/80 hover:bg-surface border border-line-2 flex items-center gap-1.5 text-ink transition-colors min-w-0 max-w-[165px] xs:max-w-[190px] sm:max-w-[260px] cursor-pointer"
          >
            <MapPin className="w-3.5 h-3.5 text-brand shrink-0" />
            <span className="text-xs font-bold truncate">
              {selectedRegion || 'Все регионы РФ'}
            </span>
            {currentRegionInfo && (
              <span className="hidden md:inline font-mono text-[10px] font-bold text-muted bg-card px-1.5 py-0.5 rounded border border-line shrink-0">
                {currentRegionInfo.tzLabel.split(' ')[0]}
              </span>
            )}
            <ChevronDown className="w-3.5 h-3.5 text-muted shrink-0" />
          </button>
        </div>

        {/* Правая часть: Масштаб шрифта (100% / 112% / 124%), Тема, Уведомления, Профиль */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Компактная кнопка размера шрифта для мобильных экранов */}
          <button
            type="button"
            onClick={() =>
              setSettings((prev) => ({
                ...prev,
                fontSize:
                  prev.fontSize === 'normal' ? 'lg' : prev.fontSize === 'lg' ? 'xl' : 'normal',
              }))
            }
            title="Изменить размер шрифта"
            aria-label="Изменить размер шрифта"
            className="sm:hidden h-9 px-2 rounded-xl bg-surface/80 hover:bg-surface border border-line-2 text-ink flex items-center gap-1 font-mono text-[11px] font-bold shrink-0 cursor-pointer"
          >
            <Type className="w-3.5 h-3.5 text-brand shrink-0" />
            <span>
              {settings.fontSize === 'normal'
                ? '100%'
                : settings.fontSize === 'lg'
                ? '112%'
                : '124%'}
            </span>
          </button>

          {/* Переключатель размера шрифта в 1 клик на планшетах и ПК */}
          <div
            className="hidden sm:flex items-center bg-surface/80 border border-line-2 rounded-xl p-0.5"
            title="Масштаб текста интерфейса"
          >
            <span className="px-2 text-[11px] font-bold text-muted hidden md:inline-flex items-center gap-1">
              <Type className="w-3.5 h-3.5 text-brand" />
              <span>Шрифт:</span>
            </span>
            {(
              [
                { id: 'normal', label: '100%' },
                { id: 'lg', label: '112%' },
                { id: 'xl', label: '124%' },
              ] as const
            ).map((opt) => {
              const active = settings.fontSize === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSettings((prev) => ({ ...prev, fontSize: opt.id }))}
                  className={`px-2 py-1 rounded-lg font-mono text-[11px] font-bold transition-colors cursor-pointer ${
                    active
                      ? 'bg-brand text-white shadow-2xs'
                      : 'text-muted hover:text-ink'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          {/* Переключатель светлой / тёмной темы */}
          <button
            type="button"
            onClick={() =>
              setSettings((prev) => ({
                ...prev,
                theme: prev.theme === 'dark' ? 'light' : 'dark',
              }))
            }
            title={settings.theme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему'}
            aria-label="Переключить тему"
            className="w-9 h-9 rounded-xl bg-surface/80 hover:bg-surface border border-line-2 text-ink flex items-center justify-center transition-colors shrink-0 cursor-pointer"
          >
            {settings.theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>

          {/* Уведомления */}
          {user && (
            <div className="relative">
              <button
                ref={notifBtnRef}
                type="button"
                onClick={() => {
                  const next = !notifOpen;
                  setNotifOpen(next);
                  if (next) loadNotifications();
                }}
                title="Уведомления"
                aria-label="Уведомления"
                className="relative w-9 h-9 rounded-xl bg-surface/80 hover:bg-surface border border-line-2 text-ink flex items-center justify-center transition-colors shrink-0 cursor-pointer"
              >
                <Bell className="w-4 h-4" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-clay text-white font-mono text-[10px] font-bold flex items-center justify-center shadow-xs">
                    {unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div
                  ref={notifPanelRef}
                  className="absolute right-0 top-11 w-80 sm:w-96 rounded-2xl bg-card border border-line-2 shadow-2xl p-4 z-50 space-y-3 anim-fade"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-line">
                    <span className="font-display font-bold text-xs text-ink">
                      Новые уведомления
                    </span>
                    <div className="flex items-center gap-2">
                      {unreadNotificationsCount > 0 && (
                        <button
                          type="button"
                          onClick={handleMarkAllRead}
                          className="text-[11px] font-semibold text-brand hover:underline inline-flex items-center gap-1 cursor-pointer"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                          <span>Прочитать все</span>
                        </button>
                      )}
                      <Link
                        to="/notifications"
                        onClick={() => setNotifOpen(false)}
                        className="text-[11px] font-semibold text-muted hover:text-ink"
                      >
                        Все →
                      </Link>
                    </div>
                  </div>

                  {loadingNotifs ? (
                    <div className="space-y-2 py-2">
                      <div className="h-12 rounded-xl bg-surface animate-pulse" />
                      <div className="h-12 rounded-xl bg-surface animate-pulse" />
                    </div>
                  ) : unreadNotifications.length === 0 ? (
                    <div className="py-6 text-center text-xs text-muted">
                      У вас нет непрочитанных уведомлений
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
                      {unreadNotifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={async () => {
                            // Сразу убираем из выпадающего окошка и отмечаем прочитанным
                            setNotifications((prev) => prev.filter((item) => item.id !== n.id));
                            try {
                              await apiFetch(`/api/v1/notifications/${n.id}/read`, {
                                method: 'POST',
                              });
                              await refreshUnreadCount();
                              window.dispatchEvent(
                                new CustomEvent('sp-notifications-updated', {
                                  detail: { id: n.id },
                                })
                              );
                            } catch {
                              // ignore
                            }
                            setNotifOpen(false);
                            if (n.linkUrl) navigate(n.linkUrl);
                          }}
                          className="p-3 rounded-xl border bg-brand-tint/60 border-brand/30 hover:bg-brand-tint text-ink text-xs cursor-pointer transition-colors"
                        >
                          <div className="font-bold text-ink">{n.title}</div>
                          <div className="text-[11px] text-muted mt-0.5 line-clamp-2">
                            {n.message}
                          </div>
                          <div className="font-mono text-[10px] text-muted mt-1">
                            {formatDateTime(n.createdAt)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Профиль (быстрое меню и переключение аккаунтов) */}
          {user && (
            <div ref={profileMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setProfileMenuOpen((v) => !v)}
                className="h-9 pl-1.5 pr-2 rounded-xl bg-surface/80 hover:bg-surface border border-line-2 flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
              >
                {user.avatarUrl ? (
                  <img
                    key={user.avatarUrl}
                    src={user.avatarUrl}
                    alt={user.displayName}
                    className="w-6 h-6 rounded-full object-cover border border-line-2 shrink-0"
                  />
                ) : (
                  <span className="w-6 h-6 rounded-full bg-brand text-white font-display font-bold text-[11px] flex items-center justify-center shrink-0">
                    {user.displayName.charAt(0).toUpperCase()}
                  </span>
                )}
                <span className="hidden md:inline text-xs font-bold text-ink max-w-[110px] truncate">
                  {user.displayName.split(' ')[0]}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-muted shrink-0" />
              </button>

              {profileMenuOpen && (
                <div className="absolute right-0 top-11 w-72 rounded-2xl bg-card border border-line-2 shadow-2xl p-2 z-50 space-y-1 anim-fade">
                  <div className="px-3 py-2.5 border-b border-line flex items-center gap-2.5">
                    {user.avatarUrl ? (
                      <img
                        key={user.avatarUrl}
                        src={user.avatarUrl}
                        alt={user.displayName}
                        className="w-9 h-9 rounded-full object-cover border border-line-2 shrink-0"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-brand text-white font-display font-bold text-xs flex items-center justify-center shrink-0">
                        {user.displayName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-xs text-ink truncate">{user.displayName}</div>
                      <div className="text-[11px] text-muted truncate">{user.email}</div>
                    </div>
                  </div>

                  <Link
                    to="/profile"
                    onClick={() => setProfileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-ink hover:bg-surface"
                  >
                    <User className="w-4 h-4 text-brand" />
                    <span>Мой профиль и настройки</span>
                  </Link>

                  <Link
                    to="/my"
                    onClick={() => setProfileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-ink hover:bg-surface"
                  >
                    <CalendarCheck className="w-4 h-4 text-brand" />
                    <span>Мои записи и календарь</span>
                  </Link>

                  <Link
                    to="/my-organization"
                    onClick={() => setProfileMenuOpen(false)}
                    className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-ink hover:bg-surface"
                  >
                    <span className="flex items-center gap-2.5">
                      <Building2 className="w-4 h-4 text-brand" />
                      <span>Управление организациями и сообществами</span>
                    </span>
                    {myOrganizations.length > 0 && (
                      <span className="px-1.5 py-0.5 rounded-md bg-brand-tint text-brand-ink font-mono text-[10px] font-bold">
                        {myOrganizations.length}
                      </span>
                    )}
                  </Link>

                  {savedSessions.length > 1 && (
                    <div className="pt-1 mt-1 border-t border-line">
                      <div className="px-3 py-1 text-[10px] font-bold text-muted uppercase tracking-wider">
                        Переключить аккаунт
                      </div>
                      {savedSessions.map((sess) => {
                        const isCurrent = sess.user.id === user.id;
                        return (
                          <div
                            key={sess.user.id}
                            className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs ${
                              isCurrent ? 'bg-brand-tint/70 font-bold text-brand-ink' : 'hover:bg-surface'
                            }`}
                          >
                            <button
                              type="button"
                              disabled={isCurrent}
                              onClick={async () => {
                                setProfileMenuOpen(false);
                                await switchAccount(sess.user.id);
                              }}
                              className="flex-1 text-left truncate cursor-pointer"
                            >
                              {sess.user.displayName}
                            </button>
                            {!isCurrent && (
                              <button
                                type="button"
                                onClick={() => removeSavedAccount(sess.user.id)}
                                className="p-1 text-muted hover:text-rose-600"
                                title="Удалить из сохранённых"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="pt-1 mt-1 border-t border-line">
                    <button
                      type="button"
                      onClick={async () => {
                        setProfileMenuOpen(false);
                        await logout();
                        navigate('/login');
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Выйти из аккаунта</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Модальное окно выбора региона / города России */}
      {cityModalOpen && (
        <div className="fixed inset-0 !m-0 z-[300] bg-black/55 backdrop-blur-sm flex items-center justify-center p-4 anim-fade">
          <div className="bg-card border border-line-2 rounded-2xl max-w-lg w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-base text-ink">
                  Выберите город или регион России
                </h3>
                <p className="text-xs text-muted mt-0.5">
                  Поиск по всем 89 субъектам РФ и городам (включая малые города регионального подчинения)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCityModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-surface hover:bg-surface-2 flex items-center justify-center text-muted hover:text-ink cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <input
              type="text"
              value={cityQuery}
              onChange={(e) => setCityQuery(e.target.value)}
              placeholder="Найти город или регион (например: Железногорск, Красноярский край, Донецк, Бурятия)..."
              autoFocus
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-line-2 text-sm text-ink outline-none focus:border-brand"
            />

            <div className="max-h-80 overflow-y-auto space-y-1 pr-1">
              <button
                type="button"
                onClick={() => {
                  setSelectedGlobalRegion('');
                  setCityModalOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                  !selectedRegion
                    ? 'bg-brand text-white font-bold'
                    : 'hover:bg-surface text-ink'
                }`}
              >
                <span>Все регионы России</span>
                <span className="font-mono text-[11px] opacity-80">Все часовые пояса</span>
              </button>

              {filteredRegions.map((reg) => {
                const active = selectedRegion.toLowerCase() === reg.value.toLowerCase();
                return (
                  <button
                    key={`${reg.value}-${reg.label}`}
                    type="button"
                    onClick={() => {
                      setSelectedGlobalRegion(reg.value);
                      setCityModalOpen(false);
                    }}
                    className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                      active
                        ? 'bg-brand text-white font-bold'
                        : 'hover:bg-surface text-ink'
                    }`}
                  >
                    <div className="text-left min-w-0">
                      <div className="font-semibold truncate">{reg.label}</div>
                      {reg.regionName && reg.regionName !== reg.label && (
                        <div
                          className={`text-[10px] truncate ${
                            active ? 'text-white/80' : 'text-muted'
                          }`}
                        >
                          {reg.regionName}
                        </div>
                      )}
                    </div>
                    <span
                      className={`font-mono text-[11px] px-2 py-0.5 rounded-md shrink-0 ${
                        active ? 'bg-white/20 text-white' : 'bg-surface text-muted'
                      }`}
                    >
                      {reg.tzLabel}
                    </span>
                  </button>
                );
              })}

              {cityQuery.trim().length >= 2 &&
                !filteredRegions.some(
                  (r) => r.value.toLowerCase() === cityQuery.trim().toLowerCase()
                ) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedGlobalRegion(cityQuery.trim());
                      setCityModalOpen(false);
                    }}
                    className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-brand-tint/60 hover:bg-brand-tint text-brand-ink transition-colors cursor-pointer"
                  >
                    <span>Искать в населённом пункте «{cityQuery.trim()}»</span>
                    <span className="font-mono text-[10px]">Выбрать →</span>
                  </button>
                )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export const MobileTabBar: React.FC = () => {
  const { user } = useAuth();
  const {
    isMapActive,
    isCatalogActive,
    isCommunitiesActive,
    isOrganizationsActive,
    isMyActive,
  } = useNavActiveState();

  return (
    <nav
      aria-label="Мобильное меню"
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-card/95 backdrop-blur-md border-t border-line-2 px-1.5 py-1.5 flex items-center justify-around"
    >
      <Link
        to="/?view=map"
        className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl text-[10px] font-semibold ${
          isMapActive ? 'text-brand font-bold' : 'text-muted'
        }`}
      >
        <MapIcon className="w-4 h-4" />
        <span>Карта</span>
      </Link>
      <Link
        to="/events?view=list"
        className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl text-[10px] font-semibold ${
          isCatalogActive ? 'text-brand font-bold' : 'text-muted'
        }`}
      >
        <List className="w-4 h-4" />
        <span>События</span>
      </Link>
      <Link
        to={user ? '/events/new' : '/login'}
        className="flex flex-col items-center justify-center w-10 h-10 rounded-xl bg-brand text-white shadow-sm shrink-0"
        aria-label="Создать сбор"
      >
        <Plus className="w-5 h-5" />
      </Link>
      <Link
        to="/communities"
        className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl text-[10px] font-semibold ${
          isCommunitiesActive ? 'text-brand font-bold' : 'text-muted'
        }`}
      >
        <Compass className="w-4 h-4" />
        <span>Сообщества</span>
      </Link>
      {user ? (
        <Link
          to="/my"
          className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl text-[10px] font-semibold ${
            isMyActive ? 'text-brand font-bold' : 'text-muted'
          }`}
        >
          <CalendarCheck className="w-4 h-4" />
          <span>Записи</span>
        </Link>
      ) : (
        <Link
          to="/organizations"
          className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl text-[10px] font-semibold ${
            isOrganizationsActive ? 'text-brand font-bold' : 'text-muted'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Организации</span>
        </Link>
      )}
    </nav>
  );
};
