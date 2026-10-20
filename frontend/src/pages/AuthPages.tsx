import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, CheckCircle2, Lock, Mail, ShieldCheck, User, UserPlus } from 'lucide-react';
import { apiFetch, ApiError, ORG_TYPE_LABELS } from '../api';
import { useAuth } from '../AuthContext';
import { AuthResponse } from '../types';
import { CustomSelect, RegionSelect } from '../components/UiControls';

export const LoginPage: React.FC = () => {
  const { setSessionFromAuthResponse } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const performLogin = async (loginEmail: string, loginPass: string) => {
    setError(null);
    setSubmitting(true);
    try {
      const auth = await apiFetch<AuthResponse>('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: loginEmail, password: loginPass }),
      });
      setSessionFromAuthResponse(auth);
      navigate('/');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Ошибка входа. Проверьте email и пароль.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await performLogin(email, password);
  };

  const demoAccounts = [
    {
      label: 'Участник',
      sub: 'Алексей Смирнов · Москва',
      email: 'alexey@sportplatform.ru',
      pass: 'SportPass123!',
      icon: User,
    },
    {
      label: 'Участник 2',
      sub: 'Мария Волкова · Казань',
      email: 'maria@sportplatform.ru',
      pass: 'SportPass123!',
      icon: User,
    },
    {
      label: 'Спортивный клуб',
      sub: 'Беговой клуб «Импульс»',
      email: 'club@sportplatform.ru',
      pass: 'SportPass123!',
      icon: Building2,
    },
    {
      label: 'Модератор / Админ',
      sub: 'Управление платформой',
      email: 'admin@sportplatform.ru',
      pass: 'AdminPassword123!',
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="max-w-md mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-12 h-12 rounded-2xl bg-brand flex items-center justify-center text-white font-extrabold text-xl mx-auto mb-3 shadow-sm">
          ТС
        </div>
        <h1 className="text-2xl font-extrabold text-ink tracking-tight">Вход в аккаунт</h1>
        <p className="text-sm text-muted mt-1">
          Войдите, чтобы записываться на тренировки и создавать события
        </p>
      </div>

      {/* Main Card */}
      <div className="bg-card rounded-3xl border border-line-2 p-6 sm:p-7 shadow-xs space-y-5">
        {/* Mode Switcher */}
        <div className="grid grid-cols-2 p-1 rounded-xl bg-surface">
          <span className="h-9 rounded-lg text-sm font-semibold bg-card text-ink shadow-xs flex items-center justify-center">
            Вход
          </span>
          <Link
            to="/register"
            className="h-9 rounded-lg text-sm font-semibold text-muted hover:text-ink flex items-center justify-center transition-colors"
          >
            Регистрация
          </Link>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1.5">
              Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full h-11 pl-10 pr-3.5 rounded-xl bg-surface border border-transparent focus:border-brand focus:bg-card text-sm text-ink outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1.5">
              Пароль
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-11 pl-10 pr-3.5 rounded-xl bg-surface border border-transparent focus:border-brand focus:bg-card text-sm text-ink outline-none transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full h-11 rounded-xl bg-brand hover:bg-brand-hover disabled:opacity-50 text-white font-semibold text-sm transition-colors cursor-pointer"
          >
            {submitting ? 'Выполняется вход...' : 'Войти'}
          </button>
        </form>
      </div>

      {/* Sportikus 1-Click Demo Role Switcher */}
      <div className="bg-card rounded-3xl border border-line-2 p-5 space-y-3">
        <div className="text-xs font-bold text-muted uppercase tracking-wider">
          Быстрый вход для проверки ролей (1 клик)
        </div>
        <div className="grid grid-cols-1 gap-2">
          {demoAccounts.map((acc) => {
            const Icon = acc.icon;
            return (
              <button
                key={acc.email}
                type="button"
                disabled={submitting}
                onClick={() => performLogin(acc.email, acc.pass)}
                className="flex items-center justify-between p-3 rounded-xl bg-surface hover:bg-surface-2 transition-colors text-left group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-card flex items-center justify-center text-ink group-hover:text-brand transition-colors">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-ink">{acc.label}</div>
                    <div className="text-xs text-muted">{acc.sub}</div>
                  </div>
                </div>
                <span className="text-xs font-semibold text-brand">Войти →</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export const RegisterPage: React.FC = () => {
  const { sports, setSessionFromAuthResponse, refreshSports } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<'USER' | 'ORG'>('USER');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Common fields
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [city, setCity] = useState('Москва');
  const [termsAccepted, setTermsAccepted] = useState(true);

  // Organization specific fields
  const [organizationName, setOrganizationName] = useState('');
  const [orgType, setOrgType] = useState('SPORTS_CLUB');
  const [description, setDescription] = useState('');
  const [moderationContact, setModerationContact] = useState('');
  const [publicContacts, setPublicContacts] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [socialUrl, setSocialUrl] = useState('');
  const [verificationLink, setVerificationLink] = useState('');
  const [selectedSportIds, setSelectedSportIds] = useState<string[]>([]);
  const [newSportName, setNewSportName] = useState('');

  const toggleSportId = (id: string) => {
    setSelectedSportIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Пароль и подтверждение пароля не совпадают');
      return;
    }
    if (!termsAccepted) {
      setError('Необходимо принять правила платформы и политику обработки данных');
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'USER') {
        const auth = await apiFetch<AuthResponse>('/api/v1/auth/register/user', {
          method: 'POST',
          body: JSON.stringify({
            displayName,
            email,
            password,
            city,
            termsAccepted,
          }),
        });
        setSessionFromAuthResponse(auth);
        navigate('/profile');
      } else {
        const auth = await apiFetch<AuthResponse>('/api/v1/auth/register/organization', {
          method: 'POST',
          body: JSON.stringify({
            representativeName: displayName,
            email,
            password,
            termsAccepted,
            organizationName,
            orgType,
            city,
            description,
            moderationContact,
            publicContacts,
            websiteUrl,
            socialUrl,
            verificationLink,
            sportIds: selectedSportIds,
            newSportNames: newSportName.trim() ? [newSportName.trim()] : [],
          }),
        });
        await refreshSports();
        setSessionFromAuthResponse(auth);
        navigate('/my-organization');
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось завершить регистрацию');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-6 space-y-6">
      <div className="text-center">
        <div className="w-12 h-12 rounded-2xl bg-brand flex items-center justify-center text-white font-extrabold text-xl mx-auto mb-3 shadow-sm">
          ТС
        </div>
        <h1 className="text-2xl font-extrabold text-ink tracking-tight">Создать аккаунт</h1>
        <p className="text-sm text-muted mt-1">
          Выберите личный профиль участника или заявку спортивного клуба
        </p>
      </div>

      <div className="bg-card rounded-3xl border border-line-2 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="grid grid-cols-2 p-1 rounded-xl bg-surface">
          <Link
            to="/login"
            className="h-9 rounded-lg text-sm font-semibold text-muted hover:text-ink flex items-center justify-center transition-colors"
          >
            Вход
          </Link>
          <span className="h-9 rounded-lg text-sm font-semibold bg-card text-ink shadow-xs flex items-center justify-center">
            Регистрация
          </span>
        </div>

        {/* Account Type Switcher */}
        <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-surface">
          <button
            type="button"
            onClick={() => setMode('USER')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-lg font-semibold text-xs sm:text-sm transition-all cursor-pointer ${
              mode === 'USER'
                ? 'bg-brand text-white shadow-xs'
                : 'text-muted hover:text-ink'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Участник</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('ORG')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-lg font-semibold text-xs sm:text-sm transition-all cursor-pointer ${
              mode === 'ORG'
                ? 'bg-brand text-white shadow-xs'
                : 'text-muted hover:text-ink'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Спортивный клуб</span>
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1">
                {mode === 'USER' ? 'Имя и фамилия *' : 'ФИО представителя *'}
              </label>
              <input
                type="text"
                required
                minLength={2}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Иван Петров"
                className="w-full h-11 px-3.5 rounded-xl bg-surface border border-transparent focus:border-brand focus:bg-card text-sm text-ink outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1">
                Город / регион *
              </label>
              <RegionSelect value={city} onChange={setCity} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1">
                Email *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full h-11 px-3.5 rounded-xl bg-surface border border-transparent focus:border-brand focus:bg-card text-sm text-ink outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1">
                Пароль (от 8 симв.) *
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-11 px-3.5 rounded-xl bg-surface border border-transparent focus:border-brand focus:bg-card text-sm text-ink outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1">
                Повторите пароль *
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-11 px-3.5 rounded-xl bg-surface border border-transparent focus:border-brand focus:bg-card text-sm text-ink outline-none"
              />
            </div>
          </div>

          {mode === 'ORG' && (
            <div className="pt-4 border-t border-line space-y-4">
              <div className="p-3.5 rounded-xl bg-brand-tint text-brand-ink text-xs font-medium">
                <strong>Верификация клуба:</strong> заполните карточку организации для проверки модератором. Открытое комьюнити также можно создать в 1 клик из обычного аккаунта.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1">
                    Название клуба *
                  </label>
                  <input
                    type="text"
                    required
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    placeholder="Беговой клуб «Импульс»"
                    className="w-full h-11 px-3.5 rounded-xl bg-surface border border-transparent focus:border-brand focus:bg-card text-sm text-ink outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1">
                    Тип объединения *
                  </label>
                  <CustomSelect
                    value={orgType}
                    onChange={setOrgType}
                    options={Object.entries(ORG_TYPE_LABELS).map(([k, v]) => ({
                      value: k,
                      label: v,
                    }))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1">
                  Описание клуба *
                </label>
                <textarea
                  rows={3}
                  required
                  minLength={10}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Расскажите о тренировках и расписании..."
                  className="w-full p-3.5 rounded-xl bg-surface border border-transparent focus:border-brand focus:bg-card text-sm text-ink outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1">
                    Контакт для модератора *
                  </label>
                  <input
                    type="text"
                    required
                    value={moderationContact}
                    onChange={(e) => setModerationContact(e.target.value)}
                    placeholder="Телефон или ссылка VK"
                    className="w-full h-11 px-3.5 rounded-xl bg-surface border border-transparent focus:border-brand focus:bg-card text-sm text-ink outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1">
                    Публичные контакты
                  </label>
                  <input
                    type="text"
                    value={publicContacts}
                    onChange={(e) => setPublicContacts(e.target.value)}
                    placeholder="Телефон, VK или сайт"
                    className="w-full h-11 px-3.5 rounded-xl bg-surface border border-transparent focus:border-brand focus:bg-card text-sm text-ink outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1">
                    Ссылка на соцсеть / VK
                  </label>
                  <input
                    type="url"
                    value={verificationLink}
                    onChange={(e) => {
                      setVerificationLink(e.target.value);
                      setSocialUrl(e.target.value);
                    }}
                    placeholder="https://vk.com/your_club"
                    className="w-full h-11 px-3.5 rounded-xl bg-surface border border-transparent focus:border-brand focus:bg-card text-sm text-ink outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1">
                    Официальный сайт
                  </label>
                  <input
                    type="url"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="https://example.ru"
                    className="w-full h-11 px-3.5 rounded-xl bg-surface border border-transparent focus:border-brand focus:bg-card text-sm text-ink outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1.5">
                  Виды спорта клуба
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {sports.map((s) => {
                    const active = selectedSportIds.includes(s.id);
                    return (
                      <button
                        type="button"
                        key={s.id}
                        onClick={() => toggleSportId(s.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          active
                            ? 'bg-brand text-white'
                            : 'bg-surface text-ink hover:bg-surface-2'
                        }`}
                      >
                        {s.name}
                      </button>
                    );
                  })}
                </div>
                <input
                  type="text"
                  value={newSportName}
                  onChange={(e) => setNewSportName(e.target.value)}
                  placeholder="Или добавьте новый вид спорта (например: Триатлон)"
                  className="w-full h-10 px-3.5 rounded-xl bg-surface text-xs text-ink outline-none"
                />
              </div>
            </div>
          )}

          <label className="flex items-start gap-2.5 pt-2 cursor-pointer text-xs text-muted">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className="mt-0.5 rounded accent-brand"
            />
            <span>
              Я принимаю правила платформы «Точка Сбора» и даю согласие на обработку данных.
            </span>
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="w-full h-11 rounded-xl bg-brand hover:bg-brand-hover disabled:opacity-50 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            {mode === 'USER' ? <UserPlus className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            <span>
              {submitting
                ? 'Создание аккаунта...'
                : mode === 'USER'
                ? 'Зарегистрироваться'
                : 'Отправить заявку клуба'}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
};
