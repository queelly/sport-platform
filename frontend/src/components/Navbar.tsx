import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Activity,
  Bell,
  Building2,
  CalendarCheck,
  CheckCheck,
  ChevronDown,
  Eye,
  HelpCircle,
  List,
  LogIn,
  LogOut,
  Map as MapIcon,
  MapPin,
  Moon,
  Plus,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Sun,
  User,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../AuthContext';
import { apiFetch, formatDateTime } from '../api';
import { getRegionInfo, NotificationDto, RUSSIAN_REGIONS } from '../types';
import { VoiceSearchButton } from './UiControls';

export function getSelectedGlobalRegion(): string {
  return localStorage.getItem('sp_selected_region') ?? '';
}

export function setSelectedGlobalRegion(region: string) {
  localStorage.setItem('sp_selected_region', region);
  window.dispatchEvent(new CustomEvent('sp-region-change', { detail: region }));
}

interface A11ySettings {
  theme: 'light' | 'dark';
  fontSize: 'normal' | 'lg' | 'xl';
  contrast: 'normal' | 'bw' | 'wb' | 'blue';
  wideSpacing: boolean;
  hideImages: boolean;
}

const DEFAULT_A11Y: A11ySettings = {
  theme: 'light',
  fontSize: 'normal',
  contrast: 'normal',
  wideSpacing: false,
  hideImages: false,
};

export const Navbar: React.FC = () => {
  const {
    user,
    unreadNotificationsCount,
    refreshUnreadCount,
    savedSessions,
    switchAccount,
    removeSavedAccount,
    logout,
  } = useAuth();

  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [selectedRegion, setSelectedRegion] = useState<string>(() => getSelectedGlobalRegion());
  const [cityModalOpen, setCityModalOpen] = useState(false);
  const [cityQuery, setCityQuery] = useState('');

  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const notifPanelRef = useRef<HTMLDivElement>(null);
  const notifBtnRef = useRef<HTMLButtonElement>(null);

  const [a11yOpen, setA11yOpen] = useState(false);
  const a11yPanelRef = useRef<HTMLDivElement>(null);
  const a11yBtnRef = useRef<HTMLButtonElement>(null);

  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const [a11y, setA11y] = useState<A11ySettings>(() => {
    try {
      const saved = localStorage.getItem('sp_a11y');
      return saved ? { ...DEFAULT_A11Y, ...JSON.parse(saved) } : DEFAULT_A11Y;
    } catch {
      return DEFAULT_A11Y;
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

  // Apply theme & accessibility settings to <html>
  useEffect(() => {
    const html = document.documentElement;
    html.dataset.theme = a11y.theme;
    html.classList.remove(
      'a11y-font-lg',
      'a11y-font-xl',
      'a11y-contrast-bw',
      'a11y-contrast-wb',
      'a11y-contrast-blue',
      'a11y-spacing-wide',
      'a11y-hide-images'
    );
    if (a11y.fontSize === 'lg') html.classList.add('a11y-font-lg');
    if (a11y.fontSize === 'xl') html.classList.add('a11y-font-xl');
    if (a11y.contrast === 'bw') html.classList.add('a11y-contrast-bw');
    if (a11y.contrast === 'wb') html.classList.add('a11y-contrast-wb');
    if (a11y.contrast === 'blue') html.classList.add('a11y-contrast-blue');
    if (a11y.wideSpacing) html.classList.add('a11y-spacing-wide');
    if (a11y.hideImages) html.classList.add('a11y-hide-images');
    localStorage.setItem('sp_a11y', JSON.stringify(a11y));
  }, [a11y]);

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

  // Close popovers on outside click
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
      if (
        a11yOpen &&
        a11yPanelRef.current &&
        !a11yPanelRef.current.contains(target) &&
        a11yBtnRef.current &&
        !a11yBtnRef.current.contains(target)
      ) {
        setA11yOpen(false);
      }
      if (profileMenuOpen && profileMenuRef.current && !profileMenuRef.current.contains(target)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [notifOpen, a11yOpen, profileMenuOpen]);

  const handleMarkAllRead = async () => {
    try {
      await apiFetch('/api/v1/notifications/read-all', { method: 'POST' });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      await refreshUnreadCount();
    } catch {
      // ignore
    }
  };

  const isHomeOrEvents = location.pathname === '/' || location.pathname === '/events';
  const currentView = isHomeOrEvents
    ? searchParams.get('view') === 'list'
      ? 'list'
      : 'map'
    : null;

  const buildViewLink = (view: 'map' | 'list') => {
    const params = new URLSearchParams(isHomeOrEvents ? searchParams : undefined);
    if (view === 'list') {
      params.set('view', 'list');
    } else {
      params.delete('view');
    }
    const qs = params.toString();
    return qs ? `/?${qs}` : '/';
  };

  const searchQuery = isHomeOrEvents ? searchParams.get('q') ?? '' : '';
  const updateSearchQuery = (val: string) => {
    const next = new URLSearchParams(searchParams);
    if (val) {
      next.set('q', val);
    } else {
      next.delete('q');
    }
    if (!isHomeOrEvents) {
      navigate(`/?${next.toString()}`);
    } else {
      setSearchParams(next, { replace: true });
    }
  };

  const navTabClass = (active: boolean) =>
    `h-full -mb-px px-2.5 xl:px-3.5 flex items-center gap-2 border-b-[3px] text-[15px] whitespace-nowrap transition-all ${
      active
        ? 'border-brand text-ink font-bold shadow-[inset_0_-3px_10px_rgba(4,215,147,0.3)]'
        : 'border-transparent text-muted font-semibold hover:text-ink'
    }`;

  const isAdmin = user?.globalRole === 'ADMIN';
  const isA11yActive =
    a11y.fontSize !== 'normal' ||
    a11y.contrast !== 'normal' ||
    a11y.wideSpacing ||
    a11y.hideImages;

  const currentRegionInfo = getRegionInfo(selectedRegion);
  const filteredRegions = RUSSIAN_REGIONS.filter(
    (r) =>
      r.value.toLowerCase().includes(cityQuery.trim().toLowerCase()) ||
      r.label.toLowerCase().includes(cityQuery.trim().toLowerCase())
  );

  return (
    <>
      <nav className="bg-card border-b border-line-2 relative z-40 shrink-0 max-w-full">
        <div className="px-3 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4 max-w-full">
          {/* Left: Brand + City Selector + Search Bar + Main Navigation Tabs */}
          <div className="flex-1 self-stretch flex items-center gap-2 lg:gap-3 min-w-0">
            <Link
              to="/"
              className="flex items-center gap-2.5 shrink-0"
              aria-label="Точка Сбора — на главную"
            >
              <span className="w-[38px] h-[38px] rounded-[10px] bg-brand text-on-brand flex items-center justify-center shadow-sm">
                <Activity className="w-5 h-5 stroke-[2.4]" />
              </span>
              <span className="text-[20px] sm:text-[22px] font-extrabold tracking-[-0.03em] text-ink md:max-xl:hidden">
                Точка Сбора
              </span>
            </Link>

            {/* City Selector Button */}
            <button
              type="button"
              onClick={() => setCityModalOpen(true)}
              title={ currentRegionInfo ? `${currentRegionInfo.value} (${currentRegionInfo.tzLabel})` : 'Все города России' }
              className="flex shrink-0 h-[42px] px-2.5 items-center gap-1.5 rounded-[10px] text-ink hover:bg-surface border border-transparent hover:border-line-2 transition-colors"
            >
              <MapPin className="w-[18px] h-[18px] text-brand-ink shrink-0" />
              <span className="text-sm font-bold max-w-[115px] truncate hidden sm:inline">
                {selectedRegion || 'Все города'}
              </span>
              <ChevronDown className="w-4 h-4 text-muted shrink-0" />
            </button>

            {/* Inline Search Input with Voice Search */}
            <div className="hidden lg:flex flex-[2] min-w-[160px] max-w-[460px] h-[42px] items-center gap-2 pl-3 pr-1.5 rounded-[10px] bg-surface border border-line-2 text-muted focus-within:border-ink">
              <Search className="w-[18px] h-[18px] shrink-0" />
              <input
                type="search"
                aria-label="Поиск мероприятий"
                placeholder="Спорт, место или клуб"
                value={searchQuery}
                onChange={(e) => updateSearchQuery(e.target.value)}
                className="flex-1 min-w-0 bg-transparent outline-none text-[15px] font-medium text-ink placeholder:text-muted"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => updateSearchQuery('')}
                  aria-label="Очистить"
                  className="shrink-0 w-[28px] h-[28px] rounded-lg bg-card text-ink flex items-center justify-center hover:bg-surface-2"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <VoiceSearchButton onResult={(transcript) => updateSearchQuery(transcript)} />
            </div>

            <div className="flex-1" />

            {/* Desktop Horizontal Tabs (Sportikus Architecture) */}
            <div className="hidden md:flex self-stretch gap-0.5 xl:gap-1 shrink-0">
              <Link to={buildViewLink('map')} className={navTabClass(currentView === 'map')}>
                <MapIcon className="w-[18px] h-[18px] shrink-0" />
                <span>Карта</span>
              </Link>

              <Link to={buildViewLink('list')} className={navTabClass(currentView === 'list')}>
                <List className="w-[18px] h-[18px] shrink-0" />
                <span>Лента</span>
              </Link>

              <Link
                to="/recommended"
                className={navTabClass(
                  location.pathname === '/recommended' ||
                    location.pathname === '/partners' ||
                    location.pathname === '/friends' ||
                    location.pathname.startsWith('/organizations')
                )}
              >
                <Sparkles className="w-[18px] h-[18px] shrink-0 lg:hidden xl:inline" />
                <span>Для вас</span>
              </Link>

              {user && (
                <Link
                  to="/my"
                  className={navTabClass(location.pathname === '/my')}
                >
                  <CalendarCheck className="w-[18px] h-[18px] shrink-0 lg:hidden xl:inline" />
                  <span>Мои события</span>
                </Link>
              )}

              {isAdmin && (
                <Link
                  to="/admin"
                  className={navTabClass(location.pathname.startsWith('/admin'))}
                >
                  <ShieldCheck className="w-[18px] h-[18px] shrink-0 text-amber-500" />
                  <span>Модерация</span>
                </Link>
              )}
            </div>
          </div>

          {/* Right Action Controls: Accessibility/Theme, Notifications, Create, Profile */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Quick Dark/Light Theme Toggle */}
            <button
              type="button"
              onClick={() =>
                setA11y((p) => ({ ...p, theme: p.theme === 'dark' ? 'light' : 'dark' }))
              }
              aria-label={a11y.theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
              title={a11y.theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
              className="w-9 h-9 sm:w-[42px] sm:h-[42px] rounded-[10px] border border-line-2 bg-card flex items-center justify-center text-ink hover:bg-surface transition-colors shrink-0"
            >
              {a11y.theme === 'dark' ? (
                <Sun className="w-4 h-4 sm:w-5 sm:h-5" />
              ) : (
                <Moon className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
            </button>

            {/* Accessibility (ГОСТ / Для слабовидящих) Popover Button */}
            <div className="relative">
              <button
                ref={a11yBtnRef}
                type="button"
                onClick={() => setA11yOpen((o) => !o)}
                aria-label="Доступность для слабовидящих"
                aria-expanded={a11yOpen}
                title="Версия для слабовидящих (размер шрифта и контраст)"
                className={`relative w-9 h-9 sm:w-[42px] sm:h-[42px] rounded-[10px] border flex items-center justify-center transition-colors shrink-0 ${
                  isA11yActive
                    ? 'border-brand bg-brand-tint text-brand-ink font-bold'
                    : 'border-line-2 bg-card text-ink hover:bg-surface'
                }`}
              >
                <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                {isA11yActive && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-brand" />
                )}
              </button>

              {a11yOpen && (
                <div
                  ref={a11yPanelRef}
                  role="dialog"
                  aria-label="Настройки доступности для слабовидящих"
                  className="fixed inset-x-2 top-16 sm:inset-x-auto sm:right-4 sm:top-[68px] w-auto sm:w-[340px] bg-card border border-line-2 rounded-2xl shadow-2xl p-4 z-[2200] space-y-4 anim-fade"
                >
                  <div className="flex items-center justify-between border-b border-line pb-2.5">
                    <span className="font-extrabold text-sm text-ink flex items-center gap-2">
                      <Eye className="w-4 h-4 text-brand-ink" />
                      <span>Версия для слабовидящих</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setA11yOpen(false)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-muted hover:bg-surface hover:text-ink"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    <div className="text-xs font-bold text-muted uppercase tracking-wider">
                      Размер текста
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 p-1 bg-surface rounded-xl">
                      {(
                        [
                          { id: 'normal', label: 'Обычный' },
                          { id: 'lg', label: 'Крупнее' },
                          { id: 'xl', label: 'Крупный' },
                        ] as const
                      ).map((sz) => (
                        <button
                          key={sz.id}
                          type="button"
                          aria-pressed={a11y.fontSize === sz.id}
                          onClick={() => setA11y((p) => ({ ...p, fontSize: sz.id }))}
                          className={`py-2 px-2 rounded-lg text-xs font-bold transition-all ${
                            a11y.fontSize === sz.id
                              ? 'bg-brand text-on-brand shadow-sm'
                              : 'text-ink hover:bg-card'
                          }`}
                        >
                          {sz.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="text-xs font-bold text-muted uppercase tracking-wider">
                      Контрастность
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { id: 'normal', label: 'Стандартная' },
                        { id: 'bw', label: 'Ч/Б высокий контраст' },
                        { id: 'wb', label: 'Жёлтый на чёрном' },
                        { id: 'blue', label: 'Синяя схема' },
                      ].map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          aria-pressed={a11y.contrast === c.id}
                          onClick={() =>
                            setA11y((p) => ({ ...p, contrast: c.id as A11ySettings['contrast'] }))
                          }
                          className={`py-2 px-2.5 rounded-xl border text-xs font-bold text-left transition-all ${
                            a11y.contrast === c.id
                              ? 'border-brand bg-brand-tint text-brand-ink'
                              : 'border-line-2 bg-card text-ink hover:bg-surface'
                          }`}
                        >
                          {c.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2 pt-1 border-t border-line text-xs font-semibold text-ink">
                    <label className="flex items-center justify-between cursor-pointer py-1">
                      <span>Увеличенный интервал букв</span>
                      <input
                        type="checkbox"
                        checked={a11y.wideSpacing}
                        onChange={(e) => setA11y((p) => ({ ...p, wideSpacing: e.target.checked }))}
                        className="w-4 h-4 accent-brand"
                      />
                    </label>
                    <label className="flex items-center justify-between cursor-pointer py-1">
                      <span>Скрыть фоновые иллюстрации</span>
                      <input
                        type="checkbox"
                        checked={a11y.hideImages}
                        onChange={(e) => setA11y((p) => ({ ...p, hideImages: e.target.checked }))}
                        className="w-4 h-4 accent-brand"
                      />
                    </label>
                  </div>

                  {isA11yActive && (
                    <button
                      type="button"
                      onClick={() => setA11y((p) => ({ ...DEFAULT_A11Y, theme: p.theme }))}
                      className="w-full py-2 rounded-xl bg-surface hover:bg-surface-2 text-ink text-xs font-bold flex items-center justify-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Сбросить настройки доступности</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Notifications Bell Popover (Sportikus style) */}
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
                  aria-label="Уведомления"
                  title={
                    unreadNotificationsCount > 0
                      ? `${unreadNotificationsCount} новых уведомлений`
                      : 'Уведомления'
                  }
                  className="relative w-9 h-9 sm:w-[42px] sm:h-[42px] rounded-[10px] border border-line-2 bg-card flex items-center justify-center text-ink hover:bg-surface transition-colors shrink-0"
                >
                  <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                  {unreadNotificationsCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-brand text-on-brand text-[10px] leading-none font-extrabold flex items-center justify-center">
                      {unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}
                    </span>
                  )}
                </button>

                {notifOpen && (
                  <div
                    ref={notifPanelRef}
                    role="dialog"
                    aria-label="Уведомления"
                    className="fixed inset-x-2 top-16 sm:inset-x-auto sm:right-4 sm:top-[68px] w-auto sm:w-[380px] max-h-[500px] bg-card border border-line-2 rounded-2xl shadow-2xl flex flex-col z-[2200] overflow-hidden anim-fade"
                  >
                    <div className="p-4 border-b border-line-2 flex items-center justify-between bg-surface/50">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-ink text-base">Уведомления</span>
                        {unreadNotificationsCount > 0 && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-brand-tint text-brand-ink font-bold">
                            {unreadNotificationsCount} новых
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {unreadNotificationsCount > 0 && (
                          <button
                            type="button"
                            onClick={handleMarkAllRead}
                            className="px-2.5 py-1 text-xs font-semibold text-muted hover:text-ink hover:bg-surface rounded-lg flex items-center gap-1 transition-colors"
                          >
                            <CheckCheck className="w-3.5 h-3.5" />
                            <span>Прочитать все</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setNotifOpen(false)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-muted hover:bg-surface hover:text-ink"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto divide-y divide-line">
                      {loadingNotifs && notifications.length === 0 ? (
                        <div className="py-10 text-center text-xs text-muted">Загрузка...</div>
                      ) : notifications.length === 0 ? (
                        <div className="py-12 px-4 text-center text-muted">
                          <Bell className="w-9 h-9 mx-auto mb-2 opacity-40" />
                          <p className="text-sm font-semibold text-ink">Уведомлений пока нет</p>
                          <p className="text-xs mt-1">
                            Здесь появятся ответы по заявкам, приглашения и напоминания
                          </p>
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <button
                            key={n.id}
                            type="button"
                            onClick={() => {
                              setNotifOpen(false);
                              if (n.linkUrl) navigate(n.linkUrl);
                            }}
                            className={`w-full text-left p-3.5 hover:bg-surface transition-colors block space-y-1 ${
                              !n.read ? 'bg-brand-tint/40' : ''
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold text-xs text-ink line-clamp-1">
                                {n.title}
                              </span>
                              <span className="text-[11px] text-muted shrink-0">
                                {formatDateTime(n.createdAt)}
                              </span>
                            </div>
                            <p className="text-xs text-muted line-clamp-2">{n.message}</p>
                          </button>
                        ))
                      )}
                    </div>

                    <Link
                      to="/notifications"
                      onClick={() => setNotifOpen(false)}
                      className="shrink-0 border-t border-line-2 py-3 text-center text-sm font-semibold text-brand-ink hover:bg-surface transition-colors"
                    >
                      Все уведомления и подключение VK-бота →
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Primary Create Event Button */}
            <Link
              to="/events/new"
              aria-label="Создать мероприятие"
              className="hidden md:flex items-center gap-1.5 h-[42px] px-3.5 xl:px-4 rounded-[10px] bg-brand text-on-brand text-[15px] font-bold hover:bg-brand-hover transition-colors shrink-0 shadow-sm"
            >
              <Plus className="w-5 h-5 stroke-[2.4]" />
              <span className="hidden xl:inline">Создать</span>
            </Link>

            {/* User Profile Pill & Quick Menu (with Multi-Account Switcher) */}
            {user ? (
              <div className="relative" ref={profileMenuRef}>
                <button
                  type="button"
                  onClick={() => setProfileMenuOpen((o) => !o)}
                  aria-label="Меню профиля"
                  className="flex items-center gap-2 rounded-full sm:rounded-[12px] p-0.5 sm:px-2 sm:py-1 hover:bg-surface transition-colors shrink-0"
                >
                  <span className="w-9 h-9 sm:w-[38px] sm:h-[38px] rounded-full bg-surface-2 text-ink flex items-center justify-center overflow-hidden shrink-0 font-bold text-sm border border-line-2">
                    {user.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={user.displayName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      user.displayName.slice(0, 1).toUpperCase()
                    )}
                  </span>
                  <span className="hidden 2xl:flex flex-col text-left leading-tight">
                    <span className="text-sm font-bold text-ink max-w-[140px] truncate">
                      {user.displayName}
                    </span>
                    <span className="text-[11px] font-medium text-muted">
                      {user.city || 'Профиль'}
                    </span>
                  </span>
                  <ChevronDown className="w-4 h-4 text-muted hidden sm:block" />
                </button>

                {profileMenuOpen && (
                  <div className="fixed right-2 top-16 sm:absolute sm:right-0 sm:top-[calc(100%+8px)] w-[290px] bg-card border border-line-2 rounded-2xl shadow-2xl p-2 z-[2200] space-y-1 anim-fade">
                    <div className="px-3 py-2.5 border-b border-line">
                      <div className="font-bold text-sm text-ink truncate">{user.displayName}</div>
                      <div className="text-xs text-muted truncate">{user.email}</div>
                    </div>

                    <Link
                      to="/profile"
                      onClick={() => setProfileMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-ink hover:bg-surface transition-colors"
                    >
                      <User className="w-4 h-4 text-brand-ink" />
                      <span>Мой профиль и анкета</span>
                    </Link>

                    <Link
                      to="/friends"
                      onClick={() => setProfileMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-ink hover:bg-surface transition-colors"
                    >
                      <Users className="w-4 h-4 text-brand-ink" />
                      <span>Друзья, напарники и чаты</span>
                    </Link>

                    <Link
                      to="/organizations"
                      onClick={() => setProfileMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-ink hover:bg-surface transition-colors"
                    >
                      <Building2 className="w-4 h-4 text-brand-ink" />
                      <span>Спортивные клубы и секции</span>
                    </Link>

                    <Link
                      to="/notifications"
                      onClick={() => setProfileMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-ink hover:bg-surface transition-colors"
                    >
                      <Bell className="w-4 h-4 text-brand-ink" />
                      <span>Уведомления и VK-бот</span>
                    </Link>

                    <Link
                      to="/support"
                      onClick={() => setProfileMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-ink hover:bg-surface transition-colors"
                    >
                      <HelpCircle className="w-4 h-4 text-brand-ink" />
                      <span>Поддержка и обращения</span>
                    </Link>

                    {/* Multi-Account Switcher (#3) */}
                    {savedSessions.length > 0 && (
                      <div className="pt-2 mt-1 border-t border-line space-y-1">
                        <div className="px-3 py-1 flex items-center justify-between text-[11px] font-bold text-muted uppercase tracking-wider">
                          <span>Быстрая смена аккаунта</span>
                          <Link
                            to="/login"
                            onClick={() => setProfileMenuOpen(false)}
                            className="text-brand-ink hover:underline normal-case font-bold"
                          >
                            + Добавить
                          </Link>
                        </div>
                        {savedSessions.map((acc) => {
                          const isCurrent = acc.user.id === user.id;
                          return (
                            <div
                              key={acc.user.id}
                              className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl text-xs ${
                                isCurrent ? 'bg-brand-tint text-brand-ink font-bold' : 'hover:bg-surface text-ink'
                              }`}
                            >
                              <button
                                type="button"
                                disabled={isCurrent}
                                onClick={async () => {
                                  await switchAccount(acc.user.id);
                                  setProfileMenuOpen(false);
                                }}
                                className="flex items-center gap-2 flex-1 min-w-0 text-left"
                              >
                                <span className="w-6 h-6 rounded-full bg-surface-2 flex items-center justify-center font-bold text-[11px] shrink-0 overflow-hidden">
                                  {acc.user.avatarUrl ? (
                                    <img
                                      src={acc.user.avatarUrl}
                                      alt=""
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    acc.user.displayName.slice(0, 1).toUpperCase()
                                  )}
                                </span>
                                <span className="truncate">{acc.user.displayName}</span>
                              </button>
                              {isCurrent ? (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand text-on-brand font-bold">
                                  Активен
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => removeSavedAccount(acc.user.id)}
                                  className="text-muted hover:text-rose-600 p-1"
                                  title="Убрать из списка"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div className="pt-1 border-t border-line">
                      <button
                        type="button"
                        onClick={async () => {
                          setProfileMenuOpen(false);
                          await logout();
                          navigate('/login');
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Выйти из аккаунта</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-1.5 h-9 sm:h-[42px] px-3.5 sm:px-4 rounded-[10px] border border-line-2 bg-card text-ink hover:bg-surface transition-colors font-semibold text-sm sm:text-base shrink-0"
              >
                <LogIn className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Войти</span>
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* City Selection Modal (Sportikus style) */}
      {cityModalOpen && (
        <div
          className="fixed inset-0 z-[2300] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 anim-fade"
          onClick={() => setCityModalOpen(false)}
        >
          <div
            className="bg-card border border-line-2 rounded-2xl shadow-2xl w-full max-w-md p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-ink">Выберите город или регион</h2>
              <button
                type="button"
                onClick={() => setCityModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-surface text-ink flex items-center justify-center hover:bg-surface-2"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <input
              autoFocus
              type="text"
              value={cityQuery}
              onChange={(e) => setCityQuery(e.target.value)}
              placeholder="Введите название города..."
              className="w-full rounded-xl border border-line-2 bg-surface px-4 py-3 text-sm font-medium text-ink outline-none focus:border-brand"
            />

            <div className="max-h-72 overflow-y-auto space-y-1 pr-1">
              <button
                type="button"
                onClick={() => {
                  setSelectedGlobalRegion('');
                  setCityModalOpen(false);
                  setCityQuery('');
                }}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-bold flex items-center justify-between ${
                  !selectedRegion
                    ? 'bg-brand-tint text-brand-ink'
                    : 'text-ink hover:bg-surface'
                }`}
              >
                <span>🌍 Все города России (без ограничения)</span>
                {!selectedRegion && <span className="text-xs">✓</span>}
              </button>

              {filteredRegions.map((reg) => {
                const active = selectedRegion === reg.value;
                return (
                  <button
                    key={reg.value}
                    type="button"
                    onClick={() => {
                      setSelectedGlobalRegion(reg.value);
                      setCityModalOpen(false);
                      setCityQuery('');
                    }}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm flex items-center justify-between transition-colors ${
                      active ? 'bg-brand-tint text-brand-ink font-bold' : 'text-ink hover:bg-surface'
                    }`}
                  >
                    <div>
                      <span className="font-bold">{reg.value}</span>
                      <span className="ml-2 text-xs text-muted">{reg.tzLabel}</span>
                    </div>
                    {active && <span className="text-xs font-extrabold">✓</span>}
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
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const isHomeOrEvents = location.pathname === '/' || location.pathname === '/events';
  const isListView = isHomeOrEvents && searchParams.get('view') === 'list';
  const isAdmin = user?.globalRole === 'ADMIN';

  const buildViewLink = (view: 'map' | 'list') => {
    const params = new URLSearchParams(isHomeOrEvents ? searchParams : undefined);
    if (view === 'list') {
      params.set('view', 'list');
    } else {
      params.delete('view');
    }
    const qs = params.toString();
    return qs ? `/?${qs}` : '/';
  };

  const tabItem = (to: string, label: string, icon: React.ReactNode, active: boolean) => (
    <Link
      to={to}
      aria-current={active ? 'page' : undefined}
      className={`flex-1 h-[58px] flex flex-col items-center justify-center gap-[3px] text-xs font-bold ${
        active ? 'text-ink' : 'text-muted'
      }`}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );

  return (
    <nav
      aria-label="Основная навигация"
      className="md:hidden shrink-0 bg-card border-t border-line-2 flex items-start px-1.5 pt-1.5 pb-[max(8px,env(safe-area-inset-bottom))] relative z-40 max-w-full overflow-hidden"
    >
      {tabItem(
        buildViewLink('map'),
        'Карта',
        <MapIcon className="w-5 h-5" />,
        isHomeOrEvents && !isListView
      )}
      {tabItem(
        buildViewLink('list'),
        'Лента',
        <List className="w-5 h-5" />,
        isListView
      )}
      <div className="flex-1 flex justify-center pt-1">
        <Link
          to="/events/new"
          aria-label="Создать событие"
          className="w-[54px] h-[44px] rounded-xl bg-brand text-on-brand flex items-center justify-center shadow-sm"
        >
          <Plus className="w-6 h-6 stroke-[2.4]" />
        </Link>
      </div>
      {tabItem(
        '/recommended',
        'Для вас',
        <Sparkles className="w-5 h-5" />,
        location.pathname === '/recommended' || location.pathname === '/partners'
      )}
      {isAdmin
        ? tabItem(
            '/admin',
            'Модерация',
            <ShieldCheck className="w-5 h-5" />,
            location.pathname.startsWith('/admin')
          )
        : tabItem(
            user ? '/my' : '/login',
            user ? 'Мои события' : 'Войти',
            <CalendarCheck className="w-5 h-5" />,
            location.pathname === '/my'
          )}
    </nav>
  );
};

export const RightProfileSidebar: React.FC = () => null;
