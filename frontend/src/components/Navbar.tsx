import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  Activity,
  Bell,
  Building2,
  Calendar,
  HelpCircle,
  LogIn,
  LogOut,
  Menu,
  MessageSquareHeart,
  PlusCircle,
  ShieldAlert,
  User,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../AuthContext';

export const Navbar: React.FC = () => {
  const { user, myOrganizations, unreadNotificationsCount, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    `inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
      isActive
        ? 'bg-blue-600 text-white shadow-sm'
        : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
    }`;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-blue-600/20 group-hover:scale-105 transition-transform">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <span className="font-display font-extrabold text-lg tracking-tight text-slate-900 block leading-none">
              ТОЧКА СБОРА
            </span>
            <span className="text-[11px] font-medium text-blue-600 tracking-wide">
              СПОРТИВНАЯ ПЛАТФОРМА
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1">
          <NavLink to="/events" className={navItemClass}>
            <Calendar className="w-4 h-4" />
            <span>Мероприятия</span>
          </NavLink>
          <NavLink to="/partners" className={navItemClass}>
            <Users className="w-4 h-4" />
            <span>Партнёры и Знакомые</span>
          </NavLink>
          <NavLink to="/organizations" className={navItemClass}>
            <Building2 className="w-4 h-4" />
            <span>Клубы</span>
          </NavLink>
          {user && (
            <>
              <NavLink to="/events/new" className={navItemClass}>
                <PlusCircle className="w-4 h-4" />
                <span>Создать встречу</span>
              </NavLink>
              <NavLink to="/support" className={navItemClass}>
                <HelpCircle className="w-4 h-4" />
                <span>Поддержка</span>
              </NavLink>
            </>
          )}
          {user && myOrganizations.length > 0 && (
            <NavLink to="/my-organization" className={navItemClass}>
              <Building2 className="w-4 h-4 text-emerald-500" />
              <span>Кабинет клуба</span>
            </NavLink>
          )}
          {user?.globalRole === 'ADMIN' && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
                }`
              }
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Админ-панель</span>
            </NavLink>
          )}
        </nav>

        {/* User Actions */}
        <div className="hidden lg:flex items-center gap-2.5">
          {user ? (
            <>
              <Link
                to="/notifications"
                title="Уведомления и VK-бот"
                className="relative p-2.5 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
              >
                <Bell className="w-5 h-5" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[20px] h-5 px-1 rounded-full bg-rose-600 text-white text-[11px] font-bold flex items-center justify-center">
                    {unreadNotificationsCount}
                  </span>
                )}
              </Link>

              <Link
                to="/profile"
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-display font-bold text-xs flex items-center justify-center">
                  {user.displayName.charAt(0).toUpperCase()}
                </div>
                <div className="text-left">
                  <div className="text-xs font-semibold text-slate-900 leading-tight max-w-[130px] truncate">
                    {user.displayName}
                  </div>
                  <div className="text-[10px] text-slate-500 leading-tight">
                    {user.globalRole === 'ADMIN' ? 'Администратор' : user.city || 'Участник'}
                  </div>
                </div>
              </Link>

              <button
                onClick={handleLogout}
                title="Выйти из аккаунта"
                className="p-2.5 rounded-xl text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <LogIn className="w-4 h-4" />
                <span>Войти</span>
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-600/20 transition-all"
              >
                <span>Регистрация</span>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="flex lg:hidden items-center gap-2">
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
              <span>Спортивные клубы</span>
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
                    <span>Кабинет организации</span>
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
