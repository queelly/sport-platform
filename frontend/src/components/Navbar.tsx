import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Bell,
  Building2,
  CalendarCheck,
  CheckCheck,
  ChevronDown,
  HelpCircle,
  List,
  LogIn,
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
import { getRegionInfo, NotificationDto, RUSSIAN_REGIONS } from '../types';

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
  const isClubsActive =
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
    isClubsActive,
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
}> = ({ onOpenRegionModal, selectedRegion, mobileOpen = false, onCloseMobile }) => {
  const {
    user,
    unreadNotificationsCount,
    logout,
  } = useAuth();
  const navigate = useNavigate();

  const {
    isMapActive,
    isCatalogActive,
    isPartnersActive,
    isClubsActive,
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

  const content = (
    <aside className="w-64 h-full bg-card border-r border-line-2 flex flex-col justify-between select-none shrink-0">
      {/* Верхняя часть: Бренд + Кнопка создания + Вертикальные вкладки */}
      <div className="p-4 space-y-4 overflow-y-auto">
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
                СПОРТ · 2ГИС ПЛАТФОРМА
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

        {/* Выбор региона / города 2ГИС */}
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
                Город на карте 2ГИС
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
              <span>Карта 2ГИС</span>
            </span>
            <span
              className={`font-mono text-[10px] px-1.5 py-0.5 rounded ${
                isMapActive ? 'bg-white/20 text-white' : 'bg-brand-tint text-brand-ink'
              }`}
            >
              2ГИС
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
            to="/partners"
            onClick={onCloseMobile}
            className={sidebarLinkClass(isPartnersActive)}
          >
            <span className="flex items-center gap-2.5">
              <Users className="w-4 h-4 shrink-0" />
              <span>Напарники и друзья</span>
            </span>
          </Link>

          <Link
            to="/organizations"
            onClick={onCloseMobile}
            className={sidebarLinkClass(isClubsActive)}
          >
            <span className="flex items-center gap-2.5">
              <Building2 className="w-4 h-4 shrink-0" />
              <span>Клубы и сообщества</span>
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
                  <span>Мои сборы и расписание</span>
                </span>
              </Link>

              <Link
                to="/notifications"
                onClick={onCloseMobile}
                className={sidebarLinkClass(isNotifsActive)}
              >
                <span className="flex items-center gap-2.5">
                  <Bell className="w-4 h-4 shrink-0" />
                  <span>Уведомления и VK-бот</span>
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

      {/* Нижняя часть: Профиль пользователя */}
      <div className="p-3.5 border-t border-line-2 bg-surface/40">
        {user ? (
          <div className="space-y-2">
            <Link
              to="/profile"
              onClick={onCloseMobile}
              className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-card border border-transparent hover:border-line-2 transition-colors"
            >
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
                <div className="text-xs font-bold text-ink truncate">{user.displayName}</div>
                <div className="text-[11px] text-muted truncate">
                  {user.city || 'Профиль и анкета'}
                </div>
              </div>
            </Link>
            <div className="flex items-center gap-1.5">
              <Link
                to="/profile"
                onClick={onCloseMobile}
                className="flex-1 py-1.5 px-2.5 rounded-lg bg-card hover:bg-surface border border-line-2 text-[11px] font-semibold text-ink text-center transition-colors"
              >
                Настройки
              </Link>
              <button
                type="button"
                onClick={async () => {
                  if (onCloseMobile) onCloseMobile();
                  await logout();
                  navigate('/login');
                }}
                title="Выйти из аккаунта"
                className="py-1.5 px-2.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Выйти</span>
              </button>
            </div>
          </div>
        ) : (
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
        )}
      </div>
    </aside>
  );

  return content;
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

  // Применяем тему и только размер шрифта (все остальные фильтры удалены по требованию)
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
      setNotifications(list.slice(0, 12));
      await refreshUnreadCount();
    } catch {
      // ignore
    } finally {
      setLoadingNotifs(false);
    }
  }, [user, refreshUnreadCount]);

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
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      await refreshUnreadCount();
    } catch {
      // ignore
    }
  };

  const currentRegionInfo = getRegionInfo(selectedRegion);
  const filteredRegions = RUSSIAN_REGIONS.filter(
    (r) =>
      r.value.toLowerCase().includes(cityQuery.trim().toLowerCase()) ||
      r.label.toLowerCase().includes(cityQuery.trim().toLowerCase())
  );

  return (
    <>
      <header className="h-14 bg-card border-b border-line-2 px-3 sm:px-6 flex items-center justify-between gap-3 relative z-40 shrink-0">
        {/* Левая часть: Кнопка мобильного меню + быстрый выбор города */}
        <div className="flex items-center gap-2.5 min-w-0">
          {onOpenMobileSidebar && (
            <button
              type="button"
              onClick={onOpenMobileSidebar}
              aria-label="Открыть меню разделов"
              className="lg:hidden h-9 px-2.5 rounded-xl bg-surface hover:bg-surface-2 border border-line-2 text-ink flex items-center gap-1.5 text-xs font-bold cursor-pointer"
            >
              <Menu className="w-4 h-4 text-brand" />
              <span>Разделы</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setCityModalOpen(true)}
            className="h-9 px-3 rounded-xl bg-surface/80 hover:bg-surface border border-line-2 flex items-center gap-1.5 text-ink transition-colors cursor-pointer"
          >
            <MapPin className="w-3.5 h-3.5 text-brand shrink-0" />
            <span className="text-xs font-bold truncate max-w-[160px] sm:max-w-[220px]">
              {selectedRegion || 'Все регионы России'}
            </span>
            {currentRegionInfo && (
              <span className="hidden sm:inline font-mono text-[10px] font-bold text-muted bg-card px-1.5 py-0.5 rounded border border-line">
                {currentRegionInfo.tzLabel.split(' ')[0]}
              </span>
            )}
            <ChevronDown className="w-3.5 h-3.5 text-muted shrink-0" />
          </button>
        </div>

        {/* Правая часть: Масштаб шрифта (100% / 112% / 124%), Тема, Уведомления, Профиль */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Переключатель размера шрифта в 1 клик (без лишних фильтров) */}
          <div
            className="flex items-center bg-surface/80 border border-line-2 rounded-xl p-0.5"
            title="Масштаб текста интерфейса"
          >
            <span className="px-2 text-[11px] font-bold text-muted hidden sm:inline-flex items-center gap-1">
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
            className="w-9 h-9 rounded-xl bg-surface/80 hover:bg-surface border border-line-2 text-ink flex items-center justify-center transition-colors cursor-pointer"
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
                className="relative w-9 h-9 rounded-xl bg-surface/80 hover:bg-surface border border-line-2 text-ink flex items-center justify-center transition-colors cursor-pointer"
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
                    <span className="font-display font-bold text-xs text-ink">Уведомления</span>
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
                  ) : notifications.length === 0 ? (
                    <div className="py-6 text-center text-xs text-muted">
                      У вас пока нет новых уведомлений
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
                      {notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={async () => {
                            if (!n.read) {
                              try {
                                await apiFetch(`/api/v1/notifications/${n.id}/read`, {
                                  method: 'POST',
                                });
                                await refreshUnreadCount();
                              } catch {
                                // ignore
                              }
                            }
                            setNotifOpen(false);
                            if (n.linkUrl) navigate(n.linkUrl);
                          }}
                          className={`p-3 rounded-xl border text-xs cursor-pointer transition-colors ${
                            n.read
                              ? 'bg-surface/40 border-line text-muted'
                              : 'bg-brand-tint/60 border-brand/30 text-ink'
                          }`}
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
                className="h-9 pl-1.5 pr-2.5 rounded-xl bg-surface/80 hover:bg-surface border border-line-2 flex items-center gap-2 transition-colors cursor-pointer"
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
                <span className="hidden sm:inline text-xs font-bold text-ink max-w-[110px] truncate">
                  {user.displayName.split(' ')[0]}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-muted" />
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
                    <span>Мой профиль и анкета</span>
                  </Link>

                  <Link
                    to="/my-organization"
                    onClick={() => setProfileMenuOpen(false)}
                    className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-ink hover:bg-surface"
                  >
                    <span className="flex items-center gap-2.5">
                      <Building2 className="w-4 h-4 text-brand" />
                      <span>Мои клубы и сообщества</span>
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
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 anim-fade">
          <div className="bg-card border border-line-2 rounded-2xl max-w-lg w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-base text-ink">
                  Выберите город или регион
                </h3>
                <p className="text-xs text-muted mt-0.5">
                  Карта 2ГИС и каталог перестроятся под выбранный регион и часовой пояс
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
              placeholder="Найти город (например: Москва, Санкт-Петербург, Казань)..."
              autoFocus
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-line-2 text-sm text-ink outline-none focus:border-brand"
            />

            <div className="max-h-72 overflow-y-auto space-y-1 pr-1">
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
                <span>🌍 Все регионы России</span>
                <span className="font-mono text-[11px] opacity-80">Все часовые пояса</span>
              </button>

              {filteredRegions.map((reg) => {
                const active = selectedRegion.toLowerCase() === reg.value.toLowerCase();
                return (
                  <button
                    key={reg.value}
                    type="button"
                    onClick={() => {
                      setSelectedGlobalRegion(reg.value);
                      setCityModalOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                      active
                        ? 'bg-brand text-white font-bold'
                        : 'hover:bg-surface text-ink'
                    }`}
                  >
                    <span className="font-semibold">{reg.label}</span>
                    <span
                      className={`font-mono text-[11px] px-2 py-0.5 rounded-md ${
                        active ? 'bg-white/20 text-white' : 'bg-surface text-muted'
                      }`}
                    >
                      {reg.tzLabel}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export const MobileTabBar: React.FC = () => {
  const { user } = useAuth();
  const { isMapActive, isCatalogActive, isPartnersActive, isClubsActive } = useNavActiveState();

  return (
    <nav
      aria-label="Мобильное меню"
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-card/95 backdrop-blur-md border-t border-line-2 px-2 py-1.5 flex items-center justify-around"
    >
      <Link
        to="/?view=map"
        className={`flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-xl text-[10px] font-semibold ${
          isMapActive ? 'text-brand font-bold' : 'text-muted'
        }`}
      >
        <MapIcon className="w-4 h-4" />
        <span>Карта 2ГИС</span>
      </Link>
      <Link
        to="/events?view=list"
        className={`flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-xl text-[10px] font-semibold ${
          isCatalogActive ? 'text-brand font-bold' : 'text-muted'
        }`}
      >
        <List className="w-4 h-4" />
        <span>Каталог</span>
      </Link>
      <Link
        to={user ? '/events/new' : '/login'}
        className="flex flex-col items-center justify-center w-10 h-10 rounded-xl bg-brand text-white shadow-sm"
        aria-label="Создать сбор"
      >
        <Plus className="w-5 h-5" />
      </Link>
      <Link
        to="/partners"
        className={`flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-xl text-[10px] font-semibold ${
          isPartnersActive ? 'text-brand font-bold' : 'text-muted'
        }`}
      >
        <Users className="w-4 h-4" />
        <span>Напарники</span>
      </Link>
      <Link
        to="/organizations"
        className={`flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-xl text-[10px] font-semibold ${
          isClubsActive ? 'text-brand font-bold' : 'text-muted'
        }`}
      >
        <Building2 className="w-4 h-4" />
        <span>Клубы</span>
      </Link>
    </nav>
  );
};
