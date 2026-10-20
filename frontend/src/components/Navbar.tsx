import React, { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  Activity,
  Bell,
  Building2,
  Calendar,
  Eye,
  HelpCircle,
  LogIn,
  LogOut,
  MapPin,
  Menu,
  MessageSquareHeart,
  PlusCircle,
  RotateCcw,
  ShieldAlert,
  User,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../AuthContext';
import { getRegionInfo, RUSSIAN_REGIONS } from '../types';

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
  const { user, myOrganizations, unreadNotificationsCount, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [regionDropdownOpen, setRegionDropdownOpen] = useState(false);
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

  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    `inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-xs xl:text-sm font-semibold whitespace-nowrap transition-colors duration-150 ${
      isActive
        ? 'bg-blue-600 text-white shadow-sm'
        : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
    }`;

  const currentRegionInfo = getRegionInfo(selectedRegion);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
      {/* Панель версии для слабовидящих (#27) */}
      {a11yOpen && (
        <div className="bg-slate-900 text-white border-b border-slate-700 px-4 py-3">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-300">Размер шрифта:</span>
                {(['normal', 'lg', 'xl'] as const).map((sz, i) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => setA11y((p) => ({ ...p, fontSize: sz }))}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                      a11y.fontSize === sz
                        ? 'bg-blue-500 text-white'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {i === 0 ? 'А (100%)' : i === 1 ? 'А+ (115%)' : 'А++ (130%)'}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-300">Цвет сайта:</span>
                {[
                  { id: 'normal', label: 'Стандарт' },
                  { id: 'bw', label: 'Ч/Б' },
                  { id: 'wb', label: 'Б/Ч' },
                  { id: 'blue', label: 'Синий' },
                ].map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setA11y((p) => ({ ...p, contrast: c.id as A11ySettings['contrast'] }))}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                      a11y.contrast === c.id
                        ? 'bg-blue-500 text-white'
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
                  <span>Обычная версия</span>
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

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
        {/* Left: Brand Logo + Global Region Selector */}
        <div className="flex items-center gap-3 shrink-0">
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-sm shrink-0">
              <Activity className="w-5 h-5" />
            </div>
            <div className="whitespace-nowrap">
              <span className="font-display font-extrabold text-base tracking-tight text-slate-900 block leading-none">
                ТОЧКА СБОРА
              </span>
              <span className="text-[10px] font-semibold text-blue-600 tracking-wider block mt-0.5">
                СПОРТИВНАЯ ПЛАТФОРМА
              </span>
            </div>
          </Link>

          {/* Выпадающий выбор региона/часового пояса (#5, #28) */}
          <div className="relative hidden sm:block">
            <button
              type="button"
              onClick={() => setRegionDropdownOpen((prev) => !prev)}
              title="Выбрать регион и часовой пояс"
              className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-xs font-semibold text-slate-700 whitespace-nowrap transition-colors"
            >
              <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="max-w-[115px] truncate">{selectedRegion || 'Все регионы'}</span>
              {currentRegionInfo && (
                <span className="text-[10px] text-slate-400 hidden xl:inline">
                  {currentRegionInfo.tzLabel.split(' ')[0]}
                </span>
              )}
            </button>

            {regionDropdownOpen && (
              <div className="absolute left-0 mt-2 w-72 bg-white rounded-2xl border border-slate-200 shadow-xl py-2 z-50 max-h-80 overflow-y-auto">
                <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Регион и часовой пояс
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedGlobalRegion('');
                    setRegionDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2 text-xs font-semibold flex items-center justify-between hover:bg-slate-50 ${
                    !selectedRegion ? 'text-blue-600 bg-blue-50/60' : 'text-slate-700'
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
                    className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between gap-2 hover:bg-slate-50 ${
                      selectedRegion === r.value ? 'text-blue-600 font-bold bg-blue-50/60' : 'text-slate-700'
                    }`}
                  >
                    <span className="truncate">{r.label}</span>
                    <span className="text-[10px] text-slate-400 shrink-0">{r.tzLabel}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Center: Symmetric Desktop Navigation (#3) */}
        <nav className="hidden lg:flex items-center justify-center gap-1 flex-1 min-w-0">
          <NavLink to="/events" className={navItemClass}>
            <Calendar className="w-4 h-4 shrink-0" />
            <span>Мероприятия</span>
          </NavLink>
          <NavLink to="/partners" className={navItemClass}>
            <Users className="w-4 h-4 shrink-0" />
            <span>Партнёры</span>
          </NavLink>
          <NavLink to="/organizations" className={navItemClass}>
            <Building2 className="w-4 h-4 shrink-0" />
            <span>Сообщества и Клубы</span>
          </NavLink>
          {user && (
            <>
              <NavLink to="/events/new" className={navItemClass}>
                <PlusCircle className="w-4 h-4 shrink-0" />
                <span>Создать встречу</span>
              </NavLink>
              <NavLink to="/support" className={navItemClass}>
                <HelpCircle className="w-4 h-4 shrink-0" />
                <span>Поддержка</span>
              </NavLink>
            </>
          )}
          {user && myOrganizations.length > 0 && (
            <NavLink to="/my-organization" className={navItemClass}>
              <Building2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Мои сообщества</span>
            </NavLink>
          )}
          {user?.globalRole === 'ADMIN' && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-xs xl:text-sm font-semibold whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
                }`
              }
            >
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>Админ-панель</span>
            </NavLink>
          )}
        </nav>

        {/* Right: Accessibility + User Actions (#12, #27) */}
        <div className="hidden lg:flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setA11yOpen((prev) => !prev)}
            title="Версия для слабовидящих"
            className={`inline-flex items-center gap-1 h-9 px-2.5 rounded-xl text-xs font-semibold transition-colors ${
              isA11yActive || a11yOpen
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span className="hidden xl:inline">Аа</span>
          </button>

          {user ? (
            <>
              <Link
                to="/notifications"
                title="Уведомления и VK-бот"
                className="relative h-9 w-9 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 flex items-center justify-center transition-colors"
              >
                <Bell className="w-4 h-4" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center">
                    {unreadNotificationsCount}
                  </span>
                )}
              </Link>

              <Link
                to="/profile"
                className="flex items-center gap-2 h-9 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 transition-colors"
              >
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.displayName}
                    className="w-6 h-6 rounded-full object-cover border border-white shadow-sm shrink-0 a11y-keep"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-display font-bold text-xs flex items-center justify-center shrink-0">
                    {user.displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="text-left leading-tight">
                  <div className="text-xs font-semibold text-slate-900 max-w-[110px] truncate">
                    {user.displayName}
                  </div>
                  <div className="text-[10px] text-slate-500 max-w-[110px] truncate">
                    {user.globalRole === 'ADMIN' ? 'Администратор' : user.city || 'Участник'}
                  </div>
                </div>
              </Link>

              <button
                onClick={handleLogout}
                title="Выйти из аккаунта"
                className="h-9 w-9 rounded-xl text-slate-500 hover:bg-rose-50 hover:text-rose-600 flex items-center justify-center transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-1.5">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl text-xs xl:text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors whitespace-nowrap"
              >
                <LogIn className="w-4 h-4" />
                <span>Войти</span>
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl text-xs xl:text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition-colors whitespace-nowrap"
              >
                <span>Регистрация</span>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu buttons */}
        <div className="flex lg:hidden items-center gap-1.5">
          <button
            type="button"
            onClick={() => setA11yOpen((prev) => !prev)}
            title="Версия для слабовидящих"
            className="p-2 rounded-xl text-slate-700 hover:bg-slate-100"
          >
            <Eye className="w-5 h-5" />
          </button>
          {user && (
            <Link to="/notifications" className="relative p-2 rounded-xl text-slate-700 hover:bg-slate-100">
              <Bell className="w-5 h-5" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center">
                  {unreadNotificationsCount}
                </span>
              )}
            </Link>
          )}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Открыть меню"
            className="p-2 rounded-xl text-slate-700 hover:bg-slate-100"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-2 shadow-lg">
          <div className="grid grid-cols-1 gap-1">
            <NavLink to="/events" onClick={() => setMobileOpen(false)} className={navItemClass}>
              <Calendar className="w-4 h-4" />
              <span>Каталог мероприятий</span>
            </NavLink>
            <NavLink to="/partners" onClick={() => setMobileOpen(false)} className={navItemClass}>
              <Users className="w-4 h-4" />
              <span>Партнёры и Знакомые</span>
            </NavLink>
            <NavLink to="/organizations" onClick={() => setMobileOpen(false)} className={navItemClass}>
              <Building2 className="w-4 h-4" />
              <span>Сообщества и Клубы</span>
            </NavLink>
            {user && (
              <>
                <NavLink to="/events/new" onClick={() => setMobileOpen(false)} className={navItemClass}>
                  <PlusCircle className="w-4 h-4" />
                  <span>Создать мероприятие</span>
                </NavLink>
                {myOrganizations.length > 0 && (
                  <NavLink to="/my-organization" onClick={() => setMobileOpen(false)} className={navItemClass}>
                    <Building2 className="w-4 h-4" />
                    <span>Мои сообщества</span>
                  </NavLink>
                )}
                <NavLink to="/support" onClick={() => setMobileOpen(false)} className={navItemClass}>
                  <MessageSquareHeart className="w-4 h-4" />
                  <span>Тикеты и Чат техподдержки</span>
                </NavLink>
                <NavLink to="/profile" onClick={() => setMobileOpen(false)} className={navItemClass}>
                  <User className="w-4 h-4" />
                  <span>Мой профиль ({user.displayName})</span>
                </NavLink>
                {user.globalRole === 'ADMIN' && (
                  <NavLink to="/admin" onClick={() => setMobileOpen(false)} className={navItemClass}>
                    <ShieldAlert className="w-4 h-4" />
                    <span>Админ-панель и Модерация</span>
                  </NavLink>
                )}
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Выйти</span>
                </button>
              </>
            )}
            {!user && (
              <div className="pt-2 flex flex-col gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="w-full text-center py-2.5 rounded-xl font-semibold border border-slate-300 text-slate-700"
                >
                  Войти в аккаунт
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileOpen(false)}
                  className="w-full text-center py-2.5 rounded-xl font-semibold bg-blue-600 text-white"
                >
                  Зарегистрироваться
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
