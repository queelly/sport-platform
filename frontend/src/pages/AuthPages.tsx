import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, CheckCircle2, Lock, Mail, User, UserPlus } from 'lucide-react';
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const auth = await apiFetch<AuthResponse>('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setSessionFromAuthResponse(auth);
      navigate('/');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Ошибка входа. Проверьте email и пароль.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-8">
      <div className="bg-white rounded-3xl border border-slate-200 p-7 sm:p-9 shadow-xl space-y-6">
        <div className="space-y-1.5 text-center">
          <h1 className="font-display font-extrabold text-2xl text-slate-900">Вход в платформу</h1>
          <p className="text-sm text-slate-600">
            Введите email и пароль вашей учётной записи (JWT-авторизация)
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-medium text-rose-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Пароль</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-display font-bold text-sm shadow-md shadow-blue-600/20 transition-colors"
          >
            {submitting ? 'Выполняется вход...' : 'Войти'}
          </button>
        </form>

        <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-600">
          Ещё нет учётной записи?{' '}
          <Link to="/register" className="font-bold text-blue-600 hover:text-blue-700">
            Зарегистрироваться как участник или организация
          </Link>
        </div>

        {/* Справочная памятка по предсозданным тестовым аккаунтам БД */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 space-y-1.5">
          <div className="font-bold text-slate-800">
            Справка для проверки (предсозданные записи в БД, вход по настоящему паролю):
          </div>
          <div>• Обычный пользователь 1: <code className="text-slate-900 font-semibold">alexey@sportplatform.ru</code> / <code className="text-slate-900">SportPass123!</code></div>
          <div>• Обычный пользователь 2: <code className="text-slate-900 font-semibold">maria@sportplatform.ru</code> / <code className="text-slate-900">SportPass123!</code></div>
          <div>• Клуб (Одобрен): <code className="text-slate-900 font-semibold">club@sportplatform.ru</code> / <code className="text-slate-900">SportPass123!</code></div>
          <div>• Клуб (Отклонён, для переподачи): <code className="text-slate-900 font-semibold">start@sportplatform.ru</code> / <code className="text-slate-900">SportPass123!</code></div>
          <div>• Администратор: <code className="text-slate-900 font-semibold">admin@sportplatform.ru</code> / <code className="text-slate-900">AdminPassword123!</code></div>
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
    <div className="max-w-2xl mx-auto py-6">
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-9 shadow-xl space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900">
            Регистрация на платформе
          </h1>
          <p className="text-sm text-slate-600">
            Выберите тип регистрации: личный аккаунт спортсмена или заявка спортивной организации
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="grid grid-cols-2 gap-3 p-1.5 rounded-2xl bg-slate-100">
          <button
            type="button"
            onClick={() => setMode('USER')}
            className={`flex items-center justify-center gap-2 py-3 rounded-xl font-display font-bold text-xs sm:text-sm transition-colors ${
              mode === 'USER'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Обычный пользователь</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('ORG')}
            className={`flex items-center justify-center gap-2 py-3 rounded-xl font-display font-bold text-xs sm:text-sm transition-colors ${
              mode === 'ORG'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Официальная организация</span>
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-medium text-rose-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {mode === 'USER' ? 'Отображаемое имя *' : 'ФИО / Имя представителя *'}
              </label>
              <input
                type="text"
                required
                minLength={2}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={mode === 'USER' ? 'Например: Иван Петров' : 'Имя координатора или руководителя'}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Город или регион *</label>
              <RegionSelect value={city} onChange={setCity} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email для входа *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Пароль (от 8 символов) *</label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Минимум 8 символов"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Подтверждение пароля *</label>
              <input
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Повторите пароль"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>
          </div>

          {mode === 'ORG' && (
            <div className="pt-4 border-t border-slate-200 space-y-4">
              <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200/80 text-xs text-blue-900">
                <strong>Простая подача без бюрократии:</strong> мы не требуем ИНН, ОГРН и сканов паспортов. Укажите основные сведения о вашем клубе для быстрой проверки модератором. (Если вы хотите просто создать открытое сообщество по интересам, вы также можете сделать это мгновенно из обычного аккаунта в разделе «Клубы»).
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Название организации или клуба *
                  </label>
                  <input
                    type="text"
                    required
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    placeholder="Например: Беговой клуб «Импульс»"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Тип объединения *</label>
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
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Краткое описание деятельности и тренировок *
                </label>
                <textarea
                  rows={3}
                  required
                  minLength={10}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Расскажите, какие тренировки или сборы вы проводите, для кого они подходят..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Контакт представителя для модератора (не публикуется) *
                  </label>
                  <input
                    type="text"
                    required
                    value={moderationContact}
                    onChange={(e) => setModerationContact(e.target.value)}
                    placeholder="Телефон или личный контакт для связи при проверке"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Публичные контакты для участников (необязательно)
                  </label>
                  <input
                    type="text"
                    value={publicContacts}
                    onChange={(e) => setPublicContacts(e.target.value)}
                    placeholder="Публичный телефон, группа VK или почта клуба"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Ссылка для ознакомления с деятельностью (группа VK / сайт)
                  </label>
                  <input
                    type="url"
                    value={verificationLink}
                    onChange={(e) => {
                      setVerificationLink(e.target.value);
                      setSocialUrl(e.target.value);
                    }}
                    placeholder="https://vk.com/your_club"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Официальный сайт (если есть)
                  </label>
                  <input
                    type="url"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="https://example.ru"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Спортивные направления организации
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {sports.map((s) => {
                    const active = selectedSportIds.includes(s.id);
                    return (
                      <button
                        type="button"
                        key={s.id}
                        onClick={() => toggleSportId(s.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                          active
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
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
                  placeholder="Или введите своё направление, если его нет в списке (например: Триатлон)"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>
            </div>
          )}

          <label className="flex items-start gap-2.5 pt-2 cursor-pointer text-xs text-slate-700">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span>
              Я принимаю правила спортивной платформы «Точка Сбора» и даю согласие на обработку регистрационных данных для работы сервиса.
            </span>
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-display font-bold text-sm shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 transition-colors"
          >
            {mode === 'USER' ? <UserPlus className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            <span>
              {submitting
                ? 'Сохранение в базу данных...'
                : mode === 'USER'
                ? 'Создать аккаунт спортсмена'
                : 'Зарегистрировать представителя и отправить заявку организации'}
            </span>
          </button>
        </form>

        <div className="pt-3 border-t border-slate-100 text-center text-xs text-slate-600">
          Уже есть аккаунт?{' '}
          <Link to="/login" className="font-bold text-blue-600 hover:text-blue-700">
            Войти
          </Link>
        </div>
      </div>
    </div>
  );
};
