import React, { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  Bell,
  Building2,
  Calendar,
  Compass,
  Eye,
  Heart,
  HelpCircle,
  Home,
  LogIn,
  LogOut,
  MapPin,
  Menu,
  PlusCircle,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  User,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../AuthContext';
import { apiFetch } from '../api';
import { EventCardDto, getRegionInfo, RUSSIAN_REGIONS } from '../types';

export function getSelectedGlobalRegion(): string {
  return localStorage.getItem('sp_selected_region') ?? '';
}

export function setSelectedGlobalRegion(region: string) {
  localStorage.setItem('sp_selected_region', region);
  window.dispatchEvent(new CustomEvent('sp-region-change', { detail: region }));
}

interface A11ySettings {
  fontSize: 'normal' | 'lg' | 'xl';
  contrast: 'normal' | 'bw' | 'wb' | 'blue';
  wideSpacing: boolean;
  hideImages: boolean;
}

const DEFAULT_A11Y: A11ySettings = {
  fontSize: 'normal',
  contrast: 'normal',
  wideSpacing: false,
  hideImages: false,
};

export const Navbar: React.FC = () => {
  const {
    user,
    myOrganizations,
    unreadNotificationsCount,
    savedSessions,
    switchAccount,
    removeSavedAccount,
    logout,
  } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [regionDropdownOpen, setRegionDropdownOpen] = useState(false);
  const [accountSwitcherOpen, setAccountSwitcherOpen] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<string>(() => getSelectedGlobalRegion());
  const [a11yOpen, setA11yOpen] = useState(false);
  const [a11y, setA11y] = useState<A11ySettings>(() => {
    try {
      const saved = localStorage.getItem('sp_a11y');
      return saved ? { ...DEFAULT_A11Y, ...JSON.parse(saved) } : DEFAULT_A11Y;
    } catch {
      return DEFAULT_A11Y;
    }
  });

  const navigate = useNavigate();

  // Sync user's city as initial region if none chosen yet
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

  // Apply Accessibility Mode classes to <html>
  useEffect(() => {
    const html = document.documentElement;
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

  const isA11yActive =
    a11y.fontSize !== 'normal' ||
    a11y.contrast !== 'normal' ||
    a11y.wideSpacing ||
    a11y.hideImages;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const sidebarItemClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center justify-between gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-200 ${
      isActive
        ? 'bg-[#16B672] text-white shadow-md shadow-[#16B672]/25'
        : 'text-slate-600 hover:bg-[#EEF4F1] hover:text-slate-900'
    }`;

  const currentRegionInfo = getRegionInfo(selectedRegion);

  return (
    <>
      {/* Панель версии для слабовидящих (ГОСТ) */}
      {a11yOpen && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-slate-900 text-white border-b border-slate-700 px-4 py-3 shadow-xl">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-300">Размер шрифта:</span>
                {(
                  [
                    { id: 'normal', label: 'Обычный (100%)' },
                    { id: 'lg', label: 'Увеличенный (115%)' },
                    { id: 'xl', label: 'Крупный (130%)' },
                  ] as const
                ).map((sz) => (
                  <button
                    key={sz.id}
                    type="button"
                    aria-pressed={a11y.fontSize === sz.id}
                    onClick={() => setA11y((p) => ({ ...p, fontSize: sz.id }))}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                      a11y.fontSize === sz.id
                        ? 'bg-[#16B672] text-white ring-2 ring-white'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {sz.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-300">Контрастность:</span>
                {[
                  { id: 'normal', label: 'Стандартная' },
                  { id: 'bw', label: 'Чёрно-белая (высокий контраст)' },
                  { id: 'wb', label: 'Жёлтый на чёрном' },
                  { id: 'blue', label: 'Синяя' },
                ].map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    aria-pressed={a11y.contrast === c.id}
                    onClick={() => setA11y((p) => ({ ...p, contrast: c.id as A11ySettings['contrast'] }))}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                      a11y.contrast === c.id
                        ? 'bg-[#16B672] text-white ring-2 ring-white'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>

              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={a11y.wideSpacing}
                  onChange={(e) => setA11y((p) => ({ ...p, wideSpacing: e.target.checked }))}
                  className="rounded"
                />
                <span>Широкий интервал букв</span>
              </label>

              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={a11y.hideImages}
                  onChange={(e) => setA11y((p) => ({ ...p, hideImages: e.target.checked }))}
                  className="rounded"
                />
                <span>Отключить изображения</span>
              </label>
            </div>

            <div className="flex items-center gap-2">
              {isA11yActive && (
                <button
                  type="button"
                  onClick={() => setA11y(DEFAULT_A11Y)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-600/90 hover:bg-rose-600 text-white font-bold"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Сбросить настройки</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setA11yOpen(false)}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold"
              >
                Скрыть панель
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Top Header */}
      <header className="lg:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/70 px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-[#16B672] flex items-center justify-center text-white shadow-sm shadow-[#16B672]/25">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <span className="font-display font-extrabold text-base tracking-tight text-slate-900 block leading-none">
              Точка Сбора
            </span>
            <span className="text-[10px] font-bold text-[#16B672] tracking-wider block mt-0.5">
              СПОРТ • КОМЬЮНИТИ
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setA11yOpen((prev) => !prev)}
            title="Версия для слабовидящих"
            className="p-2 rounded-xl text-slate-700 hover:bg-[#EEF4F1]"
          >
            <Eye className="w-5 h-5" />
          </button>
          {user && (
            <Link to="/notifications" className="relative p-2 rounded-xl text-slate-700 hover:bg-[#EEF4F1]">
              <Bell className="w-5 h-5" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-[#FF7849] text-white text-[10px] font-bold flex items-center justify-center">
                  {unreadNotificationsCount}
                </span>
              )}
            </Link>
          )}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Открыть меню"
            className="p-2 rounded-xl text-slate-700 hover:bg-[#EEF4F1]"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex justify-end">
          <div className="w-80 max-w-full bg-white h-full p-5 flex flex-col justify-between overflow-y-auto shadow-2xl">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="font-display font-extrabold text-lg text-slate-900">Навигация</span>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-2 rounded-xl text-slate-500 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-1">
                <NavLink to="/" end onClick={() => setMobileOpen(false)} className={sidebarItemClass}>
                  <span className="flex items-center gap-3">
                    <Home className="w-4 h-4" />
                    <span>Дашборд</span>
                  </span>
                </NavLink>
                <NavLink to="/events" onClick={() => setMobileOpen(false)} className={sidebarItemClass}>
                  <span className="flex items-center gap-3">
                    <Compass className="w-4 h-4" />
                    <span>Каталог встреч</span>
                  </span>
                </NavLink>
                <NavLink to="/organizations" onClick={() => setMobileOpen(false)} className={sidebarItemClass}>
                  <span className="flex items-center gap-3">
                    <Building2 className="w-4 h-4" />
                    <span>Клубы и сообщества</span>
                  </span>
                </NavLink>
                <NavLink to="/partners" onClick={() => setMobileOpen(false)} className={sidebarItemClass}>
                  <span className="flex items-center gap-3">
                    <Users className="w-4 h-4" />
                    <span>Напарники и мэтч</span>
                  </span>
                </NavLink>
                {user && (
                  <>
                    <NavLink to="/events/new" onClick={() => setMobileOpen(false)} className={sidebarItemClass}>
                      <span className="flex items-center gap-3">
                        <PlusCircle className="w-4 h-4" />
                        <span>Создать встречу</span>
                      </span>
                    </NavLink>
                    {myOrganizations.length > 0 && (
                      <NavLink to="/my-organization" onClick={() => setMobileOpen(false)} className={sidebarItemClass}>
                        <span className="flex items-center gap-3">
                          <Building2 className="w-4 h-4" />
                          <span>Мои сообщества</span>
                        </span>
                      </NavLink>
                    )}
                    <NavLink to="/notifications" onClick={() => setMobileOpen(false)} className={sidebarItemClass}>
                      <span className="flex items-center gap-3">
                        <Bell className="w-4 h-4" />
                        <span>Уведомления и VK</span>
                      </span>
                      {unreadNotificationsCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-[#FF7849] text-white text-[11px] font-extrabold">
                          {unreadNotificationsCount}
                        </span>
                      )}
                    </NavLink>
                    <NavLink to="/support" onClick={() => setMobileOpen(false)} className={sidebarItemClass}>
                      <span className="flex items-center gap-3">
                        <HelpCircle className="w-4 h-4" />
                        <span>Поддержка</span>
                      </span>
                    </NavLink>
                    <NavLink to="/profile" onClick={() => setMobileOpen(false)} className={sidebarItemClass}>
                      <span className="flex items-center gap-3">
                        <User className="w-4 h-4" />
                        <span>Мой профиль</span>
                      </span>
                    </NavLink>
                    {user.globalRole === 'ADMIN' && (
                      <NavLink to="/admin" onClick={() => setMobileOpen(false)} className={sidebarItemClass}>
                        <span className="flex items-center gap-3">
                          <ShieldAlert className="w-4 h-4" />
                          <span>Админ-панель</span>
                        </span>
                      </NavLink>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-2">
              {savedSessions.length > 0 && (
                <div className="bg-[#F7FAF8] rounded-2xl p-2.5 space-y-1.5 border border-slate-200/70">
                  <div className="text-[10px] font-extrabold text-slate-400 uppercase px-1">
                    Аккаунты на устройстве ({savedSessions.length})
                  </div>
                  {savedSessions.map((s) => {
                    const isCurrent = user?.id === s.user.id;
                    return (
                      <div
                        key={s.user.id}
                        className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl text-xs ${
                          isCurrent ? 'bg-[#E7F8F0] text-[#11995E] font-extrabold' : 'hover:bg-white text-slate-700 font-semibold'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={async () => {
                            if (!isCurrent) await switchAccount(s.user.id);
                            setMobileOpen(false);
                          }}
                          className="flex-1 text-left truncate"
                        >
                          {s.user.displayName} {isCurrent ? '• активен' : ''}
                        </button>
                        {!isCurrent && (
                          <button
                            type="button"
                            onClick={() => removeSavedAccount(s.user.id)}
                            className="text-slate-400 hover:text-rose-600 px-1"
                            title="Забыть сессию"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    );
                  })}
                  <Link
                    to="/login?addAccount=1"
                    onClick={() => setMobileOpen(false)}
                    className="block text-center py-1.5 rounded-xl bg-white border border-slate-200 text-[11px] font-bold text-[#16B672]"
                  >
                    + Добавить ещё аккаунт
                  </Link>
                </div>
              )}

              {user ? (
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Выйти из аккаунта</span>
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    to="/login"
                    onClick={() => setMobileOpen(false)}
                    className="py-2.5 rounded-2xl text-center text-xs font-bold border border-slate-200 text-slate-700"
                  >
                    Войти
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileOpen(false)}
                    className="py-2.5 rounded-2xl text-center text-xs font-bold bg-[#16B672] text-white"
                  >
                    Регистрация
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Desktop Left Vertical Sidebar (Ref 1 & Ref 2 style) */}
      <aside className="hidden lg:flex flex-col justify-between w-64 shrink-0 bg-white rounded-[28px] p-5 border border-slate-100 shadow-xs sticky top-5 h-[calc(100vh-2.5rem)] overflow-y-auto">
        <div className="space-y-5">
          {/* Brand Logo */}
          <div className="flex items-center justify-between px-1">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-2xl bg-[#16B672] flex items-center justify-center text-white shadow-md shadow-[#16B672]/25 group-hover:scale-105 transition-transform">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <span className="font-display font-black text-xl tracking-tight text-slate-900 block leading-none">
                  Точка Сбора
                </span>
                <span className="text-[10px] font-extrabold text-[#16B672] uppercase tracking-wider block mt-0.5">
                  Спорт • Платформа
                </span>
              </div>
            </Link>

            <button
              type="button"
              onClick={() => setA11yOpen((prev) => !prev)}
              title="Версия для слабовидящих (ГОСТ)"
              className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold transition-colors ${
                isA11yActive || a11yOpen
                  ? 'bg-slate-900 text-white'
                  : 'bg-[#F4F8F6] text-slate-600 hover:bg-[#E7F8F0] hover:text-[#16B672]'
              }`}
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>

          {/* Global Region Selector pill */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setRegionDropdownOpen((prev) => !prev)}
              title="Выбрать регион и часовой пояс"
              className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-2xl bg-[#F7FAF8] hover:bg-[#E7F8F0]/70 border border-slate-200/60 text-xs font-bold text-slate-700 transition-colors"
            >
              <span className="flex items-center gap-2 min-w-0">
                <MapPin className="w-3.5 h-3.5 text-[#16B672] shrink-0" />
                <span className="truncate">{selectedRegion || 'Все регионы РФ'}</span>
              </span>
              {currentRegionInfo && (
                <span className="text-[10px] font-bold text-[#16B672] bg-[#E7F8F0] px-2 py-0.5 rounded-full shrink-0">
                  {currentRegionInfo.tzLabel.split(' ')[0]}
                </span>
              )}
            </button>

            {regionDropdownOpen && (
              <div className="absolute left-0 right-0 mt-2 bg-white rounded-2xl border border-slate-200 shadow-xl py-2 z-50 max-h-72 overflow-y-auto">
                <div className="px-3 py-1.5 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  Регион и часовой пояс
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedGlobalRegion('');
                    setRegionDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2 text-xs font-bold flex items-center justify-between hover:bg-[#F7FAF8] ${
                    !selectedRegion ? 'text-[#16B672] bg-[#E7F8F0]/60' : 'text-slate-700'
                  }`}
                >
                  <span>Все регионы России</span>
                  <span className="text-[10px] text-slate-400">Все пояса</span>
                </button>
                {RUSSIAN_REGIONS.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => {
                      setSelectedGlobalRegion(r.value);
                      setRegionDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between gap-2 hover:bg-[#F7FAF8] ${
                      selectedRegion === r.value ? 'text-[#16B672] font-bold bg-[#E7F8F0]/60' : 'text-slate-700'
                    }`}
                  >
                    <span className="truncate">{r.label}</span>
                    <span className="text-[10px] text-slate-400 shrink-0">{r.tzLabel.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Primary Vertical Navigation (Ref 1 & Ref 2) */}
          <nav className="space-y-1">
            <NavLink to="/" end className={sidebarItemClass}>
              <span className="flex items-center gap-3">
                <Home className="w-4 h-4 shrink-0" />
                <span>Дашборд</span>
              </span>
            </NavLink>

            <NavLink to="/events" className={sidebarItemClass}>
              <span className="flex items-center gap-3">
                <Compass className="w-4 h-4 shrink-0" />
                <span>Каталог встреч</span>
              </span>
            </NavLink>

            <NavLink to="/organizations" className={sidebarItemClass}>
              <span className="flex items-center gap-3">
                <Building2 className="w-4 h-4 shrink-0" />
                <span>Клубы и комьюнити</span>
              </span>
            </NavLink>

            <NavLink to="/partners" className={sidebarItemClass}>
              <span className="flex items-center gap-3">
                <Users className="w-4 h-4 shrink-0" />
                <span>Спорт-Мэтч</span>
              </span>
            </NavLink>

            {user && (
              <>
                <NavLink to="/events/new" className={sidebarItemClass}>
                  <span className="flex items-center gap-3">
                    <PlusCircle className="w-4 h-4 shrink-0" />
                    <span>Создать встречу</span>
                  </span>
                </NavLink>

                {myOrganizations.length > 0 && (
                  <NavLink to="/my-organization" className={sidebarItemClass}>
                    <span className="flex items-center gap-3">
                      <Sparkles className="w-4 h-4 shrink-0" />
                      <span>Кабинет клуба</span>
                    </span>
                  </NavLink>
                )}

                <NavLink to="/notifications" className={sidebarItemClass}>
                  <span className="flex items-center gap-3">
                    <Bell className="w-4 h-4 shrink-0" />
                    <span>Уведомления и VK</span>
                  </span>
                  {unreadNotificationsCount > 0 && (
                    <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-[#FF7849] text-white text-[11px] font-extrabold flex items-center justify-center shadow-xs">
                      {unreadNotificationsCount}
                    </span>
                  )}
                </NavLink>

                <NavLink to="/support" className={sidebarItemClass}>
                  <span className="flex items-center gap-3">
                    <HelpCircle className="w-4 h-4 shrink-0" />
                    <span>Поддержка</span>
                  </span>
                </NavLink>

                <NavLink to="/profile" className={sidebarItemClass}>
                  <span className="flex items-center gap-3">
                    <User className="w-4 h-4 shrink-0" />
                    <span>Мой профиль</span>
                  </span>
                </NavLink>

                {user.globalRole === 'ADMIN' && (
                  <NavLink to="/admin" className={sidebarItemClass}>
                    <span className="flex items-center gap-3">
                      <ShieldAlert className="w-4 h-4 shrink-0" />
                      <span>Админ-панель</span>
                    </span>
                  </NavLink>
                )}
              </>
            )}
          </nav>
        </div>

        {/* Bottom Promo Card + Account Switcher + Logout / Auth */}
        <div className="space-y-2.5 pt-4">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#DDF3EA] via-[#E7F8F0] to-[#CFECE0] p-4 border border-[#16B672]/15">
            <div className="relative z-10 space-y-1.5">
              <span className="inline-block px-2 py-0.5 rounded-full bg-white/80 text-[#11995E] text-[10px] font-extrabold uppercase tracking-wider">
                Совет дня 🌿
              </span>
              <div className="font-display font-extrabold text-sm text-slate-900 leading-snug">
                Соберите свою команду сегодня!
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Создайте открытую тренировку или вступите в городской спортивный клуб.
              </p>
              <div className="pt-1 flex items-center justify-between">
                <Link
                  to={user ? '/events/new' : '/register'}
                  className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#11995E] hover:text-[#16B672]"
                >
                  <span>{user ? 'Создать сбор' : 'Присоединиться'}</span>
                </Link>
                <Link
                  to={user ? '/events/new' : '/register'}
                  className="w-9 h-9 rounded-full bg-[#16B672] hover:bg-[#11995E] text-white flex items-center justify-center shadow-md shadow-[#16B672]/30 transition-transform hover:scale-105"
                >
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>

          {user ? (
            <div className="space-y-1.5 relative">
              <button
                type="button"
                onClick={() => setAccountSwitcherOpen((o) => !o)}
                className="w-full flex items-center justify-between gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold bg-[#F7FAF8] hover:bg-[#E7F8F0] text-slate-700 border border-slate-200/70 transition-colors"
              >
                <span className="truncate">
                  Аккаунты ({savedSessions.length || 1}) • Сменить
                </span>
                <Users className="w-3.5 h-3.5 text-[#16B672] shrink-0" />
              </button>

              {accountSwitcherOpen && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-2.5 space-y-1.5">
                  <div className="text-[10px] font-extrabold text-slate-400 uppercase px-1">
                    Быстрое переключение
                  </div>
                  {savedSessions.map((s) => {
                    const isCurrent = user.id === s.user.id;
                    return (
                      <div
                        key={s.user.id}
                        className={`flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-xl text-xs ${
                          isCurrent
                            ? 'bg-[#E7F8F0] text-[#11995E] font-extrabold'
                            : 'hover:bg-[#F7FAF8] text-slate-700 font-semibold'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={async () => {
                            if (!isCurrent) await switchAccount(s.user.id);
                            setAccountSwitcherOpen(false);
                          }}
                          className="flex-1 text-left truncate"
                        >
                          <div className="truncate">{s.user.displayName}</div>
                          <div className="text-[10px] opacity-75 truncate">{s.user.email}</div>
                        </button>
                        {!isCurrent && (
                          <button
                            type="button"
                            onClick={() => removeSavedAccount(s.user.id)}
                            title="Удалить сохранённый аккаунт"
                            className="text-slate-400 hover:text-rose-600 px-1"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    );
                  })}
                  <Link
                    to="/login?addAccount=1"
                    onClick={() => setAccountSwitcherOpen(false)}
                    className="block text-center py-1.5 rounded-xl bg-[#F7FAF8] hover:bg-[#E7F8F0] text-[11px] font-extrabold text-[#16B672]"
                  >
                    + Войти в ещё один аккаунт
                  </Link>
                </div>
              )}

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2 rounded-2xl text-xs font-bold text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-colors"
              >
                <LogOut className="w-4 h-4 text-rose-500" />
                <span>Выйти ({user.displayName.split(' ')[0]})</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <Link
                to="/login"
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-2xl text-xs font-bold bg-[#F4F8F6] text-slate-700 hover:bg-slate-200/70 transition-colors"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Войти</span>
              </Link>
              <Link
                to="/register"
                className="flex items-center justify-center py-2.5 rounded-2xl text-xs font-bold bg-[#16B672] text-white hover:bg-[#11995E] shadow-sm shadow-[#16B672]/25 transition-colors"
              >
                <span>Старт</span>
              </Link>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

/**
 * Right Profile & Upcoming Trainings Panel (from Reference 2 "My Profile" + "Destination Trip")
 * Shows scenic sky/clouds/hills background, circular avatar in dashed emerald ring,
 * and floating white cards of upcoming events with participant avatar stacks.
 */
export const RightProfileSidebar: React.FC = () => {
  const { user, unreadNotificationsCount } = useAuth();
  const location = useLocation();
  const [upcomingEvents, setUpcomingEvents] = useState<EventCardDto[]>([]);

  useEffect(() => {
    let active = true;
    apiFetch<EventCardDto[]>('/api/v1/events')
      .then((list) => {
        if (!active) return;
        const activeList = list.filter((e) => e.status === 'PUBLISHED' || e.status === 'COMPLETED');
        if (user) {
          const mine = activeList.filter(
            (e) =>
              e.viewerParticipationStatus === 'CONFIRMED' ||
              e.viewerParticipationStatus === 'PENDING' ||
              e.organizerUserId === user.id
          );
          setUpcomingEvents((mine.length > 0 ? mine : activeList).slice(0, 3));
        } else {
          setUpcomingEvents(activeList.slice(0, 3));
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [user, location.pathname]);

  return (
    <aside className="hidden xl:flex flex-col w-80 shrink-0 sticky top-5 h-[calc(100vh-2.5rem)] rounded-[28px] overflow-hidden border border-slate-100 shadow-xs bg-gradient-to-b from-[#BCE6FF] via-[#DDF3EA] to-[#7CC992] relative">
      {/* Scenic SVG clouds, birds & rolling green hills at bottom (Ref 2 Right Column) */}
      <svg
        viewBox="0 0 320 760"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none a11y-decorative"
        preserveAspectRatio="none"
      >
        {/* Sun */}
        <circle cx="265" cy="95" r="24" fill="#FFFDF5" opacity="0.9" />
        {/* Clouds */}
        <g fill="#FFFFFF" opacity="0.78">
          <ellipse cx="70" cy="85" rx="34" ry="12" />
          <ellipse cx="90" cy="80" rx="22" ry="14" />
          <ellipse cx="235" cy="145" rx="38" ry="12" />
          <ellipse cx="215" cy="140" rx="24" ry="15" />
        </g>
        {/* Distant hills */}
        <path d="M0 540 Q110 470 220 520 T320 500 L320 760 L0 760 Z" fill="#82D197" opacity="0.65" />
        <path d="M0 600 Q160 530 320 590 L320 760 L0 760 Z" fill="#4EB877" opacity="0.8" />
        <path d="M0 665 Q130 620 320 655 L320 760 L0 760 Z" fill="#1F8A54" opacity="0.9" />
      </svg>

      <div className="relative z-10 flex flex-col justify-between h-full p-5 overflow-y-auto">
        <div className="space-y-5">
          {/* Top Bar: My Profile title + Notification Bell */}
          <div className="flex items-center justify-between">
            <span className="font-display font-extrabold text-base text-slate-900">
              Мой профиль 🏃
            </span>
            <Link
              to={user ? '/notifications' : '/login'}
              title="Уведомления"
              className="relative w-9 h-9 rounded-full bg-white/90 hover:bg-white text-slate-700 flex items-center justify-center shadow-xs transition-transform hover:scale-105"
            >
              <Bell className="w-4 h-4" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#FF7849] text-white text-[9px] font-extrabold flex items-center justify-center">
                  {unreadNotificationsCount}
                </span>
              )}
            </Link>
          </div>

          {/* Center Circular Avatar inside Dashed Emerald Ring (Ref 2) */}
          <div className="text-center pt-1">
            <Link to={user ? '/profile' : '/login'} className="inline-block group">
              <div className="w-24 h-24 mx-auto rounded-full p-1.5 border-2 border-dashed border-[#16B672] flex items-center justify-center bg-white/40 backdrop-blur-xs group-hover:scale-105 transition-transform">
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.displayName}
                    className="w-full h-full rounded-full object-cover shadow-md a11y-keep"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-[#16B672] text-white font-display font-black text-2xl flex items-center justify-center shadow-md">
                    {user ? user.displayName.charAt(0).toUpperCase() : 'ТС'}
                  </div>
                )}
              </div>
            </Link>

            <h3 className="font-display font-extrabold text-lg text-slate-900 mt-2.5 leading-tight">
              {user ? user.displayName : 'Гость платформы'}
            </h3>
            <p className="text-xs font-bold text-slate-700/80 mt-0.5">
              {user
                ? `${user.city || 'Россия'} • ${user.globalRole === 'ADMIN' ? 'Администратор' : 'Спортсмен'} ✨`
                : 'Войдите для записи на встречи ✨'}
            </p>
          </div>

          {/* Floating White Cards: Upcoming Trainings ("Destination Trip" from Ref 2) */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <span className="font-display font-extrabold text-sm text-slate-900">
                Ближайшие сборы 🏕️
              </span>
              <Link
                to="/events"
                className="w-7 h-7 rounded-lg bg-[#16B672] text-white flex items-center justify-center shadow-xs hover:bg-[#11995E]"
                title="Все встречи"
              >
                <Calendar className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-2.5">
              {upcomingEvents.map((ev) => {
                const maxP = ev.maxParticipants || Math.max(10, ev.confirmedParticipantsCount + 4);
                const pct = Math.min(100, Math.round((ev.confirmedParticipantsCount / maxP) * 100));
                return (
                  <Link
                    key={ev.id}
                    to={`/events/${ev.id}`}
                    className="block bg-white/95 hover:bg-white rounded-2xl p-3.5 shadow-sm hover:shadow-md transition-all border border-white"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-display font-extrabold text-xs text-slate-900 truncate">
                          {ev.title}
                        </div>
                        <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                          <MapPin className="w-3 h-3 text-[#16B672] shrink-0" />
                          <span className="truncate">{ev.city}</span>
                          <span>•</span>
                          <span>{ev.sport.name}</span>
                        </div>
                      </div>

                      {/* Stacked Avatars + Green Count Badge (Ref 2) */}
                      <div className="flex items-center -space-x-1.5 shrink-0">
                        <div className="w-6 h-6 rounded-full bg-[#E7F8F0] border-2 border-white text-[#11995E] text-[10px] font-extrabold flex items-center justify-center">
                          {(ev.organizerDisplayName || 'У').charAt(0)}
                        </div>
                        <div className="w-6 h-6 rounded-full bg-[#16B672] border-2 border-white text-white text-[9px] font-extrabold flex items-center justify-center">
                          +{Math.max(1, ev.confirmedParticipantsCount)}
                        </div>
                      </div>
                    </div>

                    {/* Capacity progress bar */}
                    <div className="mt-2.5 flex items-center justify-between gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-[#EEF4F1] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#16B672]"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-extrabold text-[#16B672] shrink-0">
                        {ev.confirmedParticipantsCount}
                        {ev.maxParticipants ? `/${ev.maxParticipants}` : ''}
                      </span>
                    </div>
                  </Link>
                );
              })}

              {upcomingEvents.length === 0 && (
                <div className="bg-white/90 rounded-2xl p-4 text-center text-xs text-slate-600 font-semibold">
                  Пока нет запланированных сборов
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom quick action button inside scenic hills */}
        <div className="pt-4">
          <Link
            to={user ? '/partners' : '/login'}
            className="w-full py-3 px-4 rounded-2xl bg-white/95 hover:bg-white text-slate-900 font-display font-extrabold text-xs flex items-center justify-between shadow-md transition-all"
          >
            <span className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-[#16B672] fill-[#16B672]" />
              <span>Найти напарника (Мэтч)</span>
            </span>
            <ArrowRight className="w-4 h-4 text-[#16B672]" />
          </Link>
        </div>
      </div>
    </aside>
  );
};
