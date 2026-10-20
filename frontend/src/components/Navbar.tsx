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

export const Navbar: React.FC = () => {
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

  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [selectedRegion, setSelectedRegion] = useState<string>(() => getSelectedGlobalRegion());
  const [cityModalOpen, setCityModalOpen] = useState(false);
  const [cityQuery, setCityQuery] = useState('');

  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const notifPanelRef = useRef<HTMLDivElement>(null);
  const notifBtnRef = useRef<HTMLButtonElement>(null);

  const [fontOpen, setFontOpen] = useState(false);
  const fontPanelRef = useRef<HTMLDivElement>(null);
  const fontBtnRef = useRef<HTMLButtonElement>(null);

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

  // Apply ONLY theme and font-size scaling (all contrast/color filters removed per user request)
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
      if (
        fontOpen &&
        fontPanelRef.current &&
        !fontPanelRef.current.contains(target) &&
        fontBtnRef.current &&
        !fontBtnRef.current.contains(target)
      ) {
        setFontOpen(false);
      }
      if (profileMenuOpen && profileMenuRef.current && !profileMenuRef.current.contains(target)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [notifOpen, fontOpen, profileMenuOpen]);

  const handleMarkAllRead = async () => {
    try {
      await apiFetch('/api/v1/notifications/read-all', { method: 'POST' });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      await refreshUnreadCount();
    } catch {
      // ignore
    }
  };

  const isHome = location.pathname === '/';
  const isCatalogRoute = location.pathname === '/events';
  const viewParam = searchParams.get('view');
  const isMapActive = isHome && viewParam !== 'list';
  const isCatalogActive = isCatalogRoute || (isHome && viewParam === 'list');
  const isPartnersActive =
    location.pathname.startsWith('/partners') ||
    location.pathname.startsWith('/friends') ||
    location.pathname.startsWith('/users/');
  const isClubsActive =
    location.pathname.startsWith('/organizations') ||
    location.pathname.startsWith('/my-organization');
  const isMyActive = location.pathname === '/my';
  const isAdminActive = location.pathname.startsWith('/admin');
  const isAdmin = user?.globalRole === 'ADMIN';

  const currentRegionInfo = getRegionInfo(selectedRegion);
  const filteredRegions = RUSSIAN_REGIONS.filter(
    (r) =>
      r.value.toLowerCase().includes(cityQuery.trim().toLowerCase()) ||
      r.label.toLowerCase().includes(cityQuery.trim().toLowerCase())
  );

  const navItemClass = (active: boolean) =>
    `h-10 px-3.5 rounded-xl flex items-center gap-2 text-xs xl:text-[13px] font-semibold whitespace-nowrap transition-colors ${
      active
        ? 'bg-ink text-card font-bold shadow-xs'
        : 'text-muted hover:text-ink hover:bg-surface/70'
    }`;

  return (
    <>
      <header className="bg-card border-b border-line-2 relative z-40 shrink-0">
        <div className="max-w-[1600px] mx-auto px-3 sm:px-6 h-[68px] flex items-center justify-between gap-3">
          {/* 1. LEFT ZONE: Brand Mark + Region Selector */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <Link
              to="/"
              className="flex items-center gap-2.5 group shrink-0"
              aria-label="Точка Сбора — на главную"
            >
              <span className="w-10 h-10 rounded-xl bg-brand text-white font-display font-extrabold text-sm flex items-center justify-center shadow-xs group-hover:bg-brand-hover transition-colors">
                ТС
              </span>
              <div className="hidden sm:flex flex-col leading-none">
                <span className="font-display font-extrabold text-[15px] tracking-tight text-ink">
                  ТОЧКА СБОРА
                </span>
                <span className="font-mono text-[10px] font-medium text-brand-ink mt-0.5">
                  СПОРТ · 2ГИС
                </span>
              </div>
            </Link>

            <button
              type="button"
              onClick={() => setCityModalOpen(true)}
              title={
                currentRegionInfo
                  ? `${currentRegionInfo.label} (${currentRegionInfo.tzLabel})`
                  : 'Все регионы России'
              }
              className="h-10 px-3 rounded-xl bg-surface/80 hover:bg-surface border border-line-2 flex items-center gap-1.5 text-ink transition-colors cursor-pointer shrink-0"
            >
              <MapPin className="w-4 h-4 text-brand shrink-0" />
              <span className="text-xs sm:text-[13px] font-bold max-w-[130px] truncate">
                {selectedRegion || 'Все регионы'}
              </span>
              {currentRegionInfo && (
                <span className="hidden xl:inline font-mono text-[10px] font-bold text-muted bg-card px-1.5 py-0.5 rounded-md border border-line">
                  {currentRegionInfo.tzLabel.split(' ')[0]}
                </span>
              )}
              <ChevronDown className="w-3.5 h-3.5 text-muted shrink-0" />
            </button>
          </div>

          {/* 2. CENTER ZONE: Symmetrical Intuitive Navigation Pill Bar (Never cramped!) */}
          <nav
            aria-label="Основные разделы платформы"
            className="hidden lg:flex items-center gap-1 p-1 rounded-2xl bg-surface/60 border border-line"
          >
            <Link to="/?view=map" className={navItemClass(isMapActive)}>
              <MapIcon className="w-4 h-4 shrink-0 text-brand" />
              <span>Карта 2ГИС</span>
            </Link>

            <Link to="/?view=list" className={navItemClass(isCatalogActive)}>
              <List className="w-4 h-4 shrink-0" />
              <span>Каталог встреч</span>
            </Link>

            <Link to="/partners" className={navItemClass(isPartnersActive)}>
              <Users className="w-4 h-4 shrink-0" />
              <span>Напарники</span>
            </Link>

            <Link to="/organizations" className={navItemClass(isClubsActive)}>
              <Building2 className="w-4 h-4 shrink-0" />
              <span>Клубы и сообщества</span>
            </Link>

            {user && (
              <Link to="/my" className={navItemClass(isMyActive)}>
                <CalendarCheck className="w-4 h-4 shrink-0" />
                <span>Мои сборы</span>
              </Link>
            )}

            {isAdmin && (
              <Link to="/admin" className={navItemClass(isAdminActive)}>
                <ShieldCheck className="w-4 h-4 shrink-0 text-[#FF5A26]" />
                <span>Модерация</span>
              </Link>
            )}
          </nav>

          {/* 3. RIGHT ZONE: Font Size Only (Аа), Theme, Notifications, Create, Profile */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Font Size Only Switcher (Аа) — all other a11y filters removed per user request */}
            <div className="relative">
              <button
                ref={fontBtnRef}
                type="button"
                onClick={() => setFontOpen((o) => !o)}
                aria-label="Размер шрифта"
                title="Изменить размер текста (Обычный / Увеличенный / Крупный)"
                className={`h-10 px-2.5 rounded-xl border flex items-center gap-1 text-xs font-bold transition-colors cursor-pointer ${
                  settings.fontSize !== 'normal'
                    ? 'border-brand bg-brand-tint text-brand-ink'
                    : 'border-line-2 bg-card text-ink hover:bg-surface'
                }`}
              >
                <Type className="w-4 h-4" />
                <span className="hidden sm:inline font-mono text-[11px]">
                  {settings.fontSize === 'normal'
                    ? '100%'
                    : settings.fontSize === 'lg'
                    ? '112%'
                    : '124%'}
                </span>
              </button>

              {fontOpen && (
                <div
                  ref={fontPanelRef}
                  className="fixed right-3 top-[72px] sm:absolute sm:right-0 sm:top-[calc(100%+8px)] w-64 bg-card border border-line-2 rounded-2xl shadow-2xl p-3.5 z-[2200] space-y-2.5 anim-fade"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-ink">Размер шрифта</span>
                    <button
                      type="button"
                      onClick={() => setFontOpen(false)}
                      className="text-muted hover:text-ink"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 p-1 bg-surface rounded-xl">
                    {(
                      [
                        { id: 'normal', label: '100%', sub: 'Обычный' },
                        { id: 'lg', label: '112%', sub: 'Средний' },
                        { id: 'xl', label: '124%', sub: 'Крупный' },
                      ] as const
                    ).map((sz) => (
                      <button
                        key={sz.id}
                        type="button"
                        onClick={() => setSettings((p) => ({ ...p, fontSize: sz.id }))}
                        className={`py-2 px-1.5 rounded-lg text-center transition-colors cursor-pointer ${
                          settings.fontSize === sz.id
                            ? 'bg-brand text-white font-bold shadow-2xs'
                            : 'text-ink hover:bg-card'
                        }`}
                      >
                        <div className="font-mono text-xs font-bold">{sz.label}</div>
                        <div className="text-[10px] opacity-85">{sz.sub}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Light / Dark Theme Toggle */}
            <button
              type="button"
              onClick={() =>
                setSettings((p) => ({ ...p, theme: p.theme === 'dark' ? 'light' : 'dark' }))
              }
              aria-label={settings.theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
              title={settings.theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
              className="w-10 h-10 rounded-xl border border-line-2 bg-card flex items-center justify-center text-ink hover:bg-surface transition-colors cursor-pointer shrink-0"
            >
              {settings.theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>

            {/* Notifications Bell */}
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
                  className="relative w-10 h-10 rounded-xl border border-line-2 bg-card flex items-center justify-center text-ink hover:bg-surface transition-colors cursor-pointer shrink-0"
                >
                  <Bell className="w-4 h-4" />
                  {unreadNotificationsCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#FF5A26] text-white font-mono text-[10px] font-bold flex items-center justify-center">
                      {unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}
                    </span>
                  )}
                </button>

                {notifOpen && (
                  <div
                    ref={notifPanelRef}
                    className="fixed inset-x-2 top-[72px] sm:inset-x-auto sm:right-4 sm:top-[72px] w-auto sm:w-[390px] max-h-[500px] bg-card border border-line-2 rounded-2xl shadow-2xl flex flex-col z-[2200] overflow-hidden anim-fade"
                  >
                    <div className="p-4 border-b border-line-2 flex items-center justify-between bg-surface/50">
                      <div className="flex items-center gap-2">
                        <span className="font-display font-bold text-ink text-sm">Уведомления</span>
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
                            className="px-2.5 py-1 text-xs font-semibold text-muted hover:text-ink hover:bg-surface rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
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
                            className={`w-full text-left p-3.5 hover:bg-surface transition-colors block space-y-1 cursor-pointer ${
                              !n.read ? 'bg-brand-tint/40' : ''
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold text-xs text-ink line-clamp-1">
                                {n.title}
                              </span>
                              <span className="font-mono text-[10px] text-muted shrink-0">
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
                      className="shrink-0 border-t border-line-2 py-3 text-center text-xs font-bold text-brand-ink hover:bg-surface transition-colors"
                    >
                      Все уведомления и подключение VK-бота →
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Create Event CTA */}
            <Link
              to={user ? '/events/new' : '/login'}
              className="hidden sm:inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-brand hover:bg-brand-hover text-white font-display font-bold text-xs transition-colors shrink-0 shadow-xs"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Создать сбор</span>
            </Link>

            {/* User Profile Pill with Live Avatar Update (#12) */}
            {user ? (
              <div className="relative" ref={profileMenuRef}>
                <button
                  type="button"
                  onClick={() => setProfileMenuOpen((o) => !o)}
                  aria-label="Меню профиля"
                  className="h-10 pl-1.5 pr-2.5 rounded-xl border border-line-2 bg-card hover:bg-surface flex items-center gap-2 transition-colors cursor-pointer shrink-0"
                >
                  <span className="w-7 h-7 rounded-lg bg-brand text-white flex items-center justify-center overflow-hidden shrink-0 font-display font-bold text-xs">
                    {user.avatarUrl ? (
                      <img
                        key={user.avatarUrl}
                        src={user.avatarUrl}
                        alt={user.displayName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      user.displayName.slice(0, 1).toUpperCase()
                    )}
                  </span>
                  <span className="hidden xl:block text-xs font-bold text-ink max-w-[115px] truncate">
                    {user.displayName}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-muted" />
                </button>

                {profileMenuOpen && (
                  <div className="fixed right-2 top-[72px] sm:absolute sm:right-0 sm:top-[calc(100%+8px)] w-[300px] bg-card border border-line-2 rounded-2xl shadow-2xl p-2 z-[2200] space-y-1 anim-fade">
                    <div className="px-3 py-2.5 border-b border-line flex items-center gap-3">
                      <span className="w-10 h-10 rounded-xl bg-brand text-white flex items-center justify-center overflow-hidden shrink-0 font-display font-bold text-sm">
                        {user.avatarUrl ? (
                          <img
                            key={user.avatarUrl}
                            src={user.avatarUrl}
                            alt={user.displayName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          user.displayName.slice(0, 1).toUpperCase()
                        )}
                      </span>
                      <div className="min-w-0">
                        <div className="font-bold text-sm text-ink truncate">{user.displayName}</div>
                        <div className="text-xs text-muted truncate">{user.email}</div>
                      </div>
                    </div>

                    <Link
                      to="/profile"
                      onClick={() => setProfileMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold text-ink hover:bg-surface transition-colors"
                    >
                      <User className="w-4 h-4 text-brand" />
                      <span>Мой профиль и виды спорта</span>
                    </Link>

                    <Link
                      to="/my"
                      onClick={() => setProfileMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold text-ink hover:bg-surface transition-colors"
                    >
                      <CalendarCheck className="w-4 h-4 text-brand" />
                      <span>Мои события и записи</span>
                    </Link>

                    <Link
                      to="/partners"
                      onClick={() => setProfileMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold text-ink hover:bg-surface transition-colors"
                    >
                      <Users className="w-4 h-4 text-brand" />
                      <span>Напарники, друзья и чаты</span>
                    </Link>

                    <Link
                      to={myOrganizations && myOrganizations.length > 0 ? '/my-organization' : '/organizations'}
                      onClick={() => setProfileMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold text-ink hover:bg-surface transition-colors"
                    >
                      <Building2 className="w-4 h-4 text-brand" />
                      <span>
                        {myOrganizations && myOrganizations.length > 0
                          ? 'Кабинет моего клуба'
                          : 'Клубы и сообщества'}
                      </span>
                    </Link>

                    <Link
                      to="/notifications"
                      onClick={() => setProfileMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold text-ink hover:bg-surface transition-colors"
                    >
                      <Bell className="w-4 h-4 text-brand" />
                      <span>Уведомления и VK-бот</span>
                    </Link>

                    <Link
                      to="/support"
                      onClick={() => setProfileMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold text-ink hover:bg-surface transition-colors"
                    >
                      <HelpCircle className="w-4 h-4 text-brand" />
                      <span>Центр поддержки и тикеты</span>
                    </Link>

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
                                isCurrent
                                  ? 'bg-brand-tint text-brand-ink font-bold'
                                  : 'hover:bg-surface text-ink'
                              }`}
                            >
                              <button
                                type="button"
                                disabled={isCurrent}
                                onClick={async () => {
                                  await switchAccount(acc.user.id);
                                  setProfileMenuOpen(false);
                                }}
                                className="flex items-center gap-2 flex-1 min-w-0 text-left cursor-pointer"
                              >
                                <span className="w-6 h-6 rounded-lg bg-surface-2 flex items-center justify-center font-bold text-[11px] shrink-0 overflow-hidden">
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
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand text-white font-bold">
                                  Активен
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => removeSavedAccount(acc.user.id)}
                                  className="text-muted hover:text-rose-600 p-1 cursor-pointer"
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
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
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
                className="flex items-center gap-1.5 h-10 px-4 rounded-xl border border-line-2 bg-card text-ink hover:bg-surface transition-colors font-bold text-xs sm:text-sm shrink-0"
              >
                <LogIn className="w-4 h-4" />
                <span>Войти</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Region Selection Modal (#5, #28) */}
      {cityModalOpen && (
        <div
          className="fixed inset-0 z-[2300] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 anim-fade"
          onClick={() => setCityModalOpen(false)}
        >
          <div
            className="bg-card border border-line-2 rounded-3xl shadow-2xl w-full max-w-md p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display font-bold text-base text-ink">Выберите регион</h2>
                <p className="text-xs text-muted mt-0.5">
                  События и карта 2ГИС подстроятся под ваш часовой пояс
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCityModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-surface text-ink flex items-center justify-center hover:bg-surface-2 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <input
              autoFocus
              type="text"
              value={cityQuery}
              onChange={(e) => setCityQuery(e.target.value)}
              placeholder="Поиск по региону или городу..."
              className="w-full rounded-xl border border-line-2 bg-surface/60 px-4 py-2.5 text-sm font-medium text-ink outline-none focus:border-brand"
            />

            <div className="max-h-72 overflow-y-auto space-y-1 pr-1">
              <button
                type="button"
                onClick={() => {
                  setSelectedGlobalRegion('');
                  setCityModalOpen(false);
                  setCityQuery('');
                }}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-between cursor-pointer ${
                  !selectedRegion
                    ? 'bg-brand-tint text-brand-ink'
                    : 'text-ink hover:bg-surface'
                }`}
              >
                <span>🌍 Все регионы России (без ограничения)</span>
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
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs sm:text-sm flex items-center justify-between transition-colors cursor-pointer ${
                      active ? 'bg-brand-tint text-brand-ink font-bold' : 'text-ink hover:bg-surface'
                    }`}
                  >
                    <div>
                      <div className="font-bold">{reg.label}</div>
                      <div className="font-mono text-[11px] text-muted">{reg.tzLabel}</div>
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

  const isHome = location.pathname === '/';
  const isListView = location.pathname === '/events' || (isHome && searchParams.get('view') === 'list');
  const isAdmin = user?.globalRole === 'ADMIN';

  const tabItem = (to: string, label: string, icon: React.ReactNode, active: boolean) => (
    <Link
      to={to}
      aria-current={active ? 'page' : undefined}
      className={`flex-1 h-[56px] flex flex-col items-center justify-center gap-0.5 text-[11px] font-bold ${
        active ? 'text-brand' : 'text-muted'
      }`}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );

  return (
    <nav
      aria-label="Мобильная навигация"
      className="lg:hidden shrink-0 bg-card border-t border-line-2 flex items-center px-1 pb-[max(4px,env(safe-area-inset-bottom))] relative z-40"
    >
      {tabItem('/?view=map', 'Карта 2ГИС', <MapIcon className="w-4 h-4" />, isHome && !isListView)}
      {tabItem('/?view=list', 'Каталог', <List className="w-4 h-4" />, isListView)}
      {tabItem('/partners', 'Напарники', <Users className="w-4 h-4" />, location.pathname.startsWith('/partners'))}
      {tabItem('/organizations', 'Клубы', <Building2 className="w-4 h-4" />, location.pathname.startsWith('/organizations'))}
      {isAdmin
        ? tabItem('/admin', 'Модерация', <ShieldCheck className="w-4 h-4" />, location.pathname.startsWith('/admin'))
        : tabItem(user ? '/my' : '/login', user ? 'Мои сборы' : 'Войти', <CalendarCheck className="w-4 h-4" />, location.pathname === '/my')}
    </nav>
  );
};

export const RightProfileSidebar: React.FC = () => null;
