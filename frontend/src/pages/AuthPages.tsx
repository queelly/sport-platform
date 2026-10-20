import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, CheckCircle2, Lock, Mail, Sparkles, User, UserPlus } from 'lucide-react';
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
    <div className="max-w-lg mx-auto py-4">
      <div className="bento-card overflow-hidden">
        {/* Scenic Top Header */}
        <div className="bg-gradient-to-r from-[#D9F2E6] via-[#E9F8F1] to-[#D4EEFC] p-6 sm:p-8 text-center space-y-2 border-b border-slate-100">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/85 text-[#11995E] text-xs font-extrabold shadow-2xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Точка Сбора • Спортивная платформа</span>
          </div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-slate-900">
            С возвращением! 👋
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-slate-600">
            Введите email и пароль вашей учётной записи для входа в дашборд
          </p>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-800">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#16B672] absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-11 pr-4 py-3 rounded-2xl bg-[#F7FAF8] border border-slate-200/80 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#16B672] focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1.5">Пароль</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#16B672] absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3 rounded-2xl bg-[#F7FAF8] border border-slate-200/80 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#16B672] focus:bg-white transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 rounded-2xl bg-[#16B672] hover:bg-[#11995E] disabled:opacity-50 text-white font-display font-extrabold text-sm shadow-md shadow-[#16B672]/25 transition-all cursor-pointer"
            >
              {submitting ? 'Выполняется вход...' : 'Войти в аккаунт'}
            </button>
          </form>

          <div className="pt-4 border-t border-slate-100 text-center text-xs font-semibold text-slate-600">
            Ещё нет учётной записи?{' '}
            <Link to="/register" className="font-extrabold text-[#16B672] hover:text-[#11995E]">
              Зарегистрироваться как участник или клуб
            </Link>
          </div>

          {/* Справочная памятка по предсозданным тестовым аккаунтам БД */}
          <div className="p-4 rounded-2xl bg-[#F7FAF8] border border-[#DCEAE4] text-[11px] text-slate-600 space-y-1.5">
            <div className="font-extrabold text-slate-900">
              Тестовые аккаунты (предсозданные записи в БД):
            </div>
            <div>• Спортсмен 1: <code className="text-[#11995E] font-bold">alexey@sportplatform.ru</code> / <code className="text-slate-900 font-bold">SportPass123!</code></div>
            <div>• Спортсмен 2: <code className="text-[#11995E] font-bold">maria@sportplatform.ru</code> / <code className="text-slate-900 font-bold">SportPass123!</code></div>
            <div>• Клуб (Одобрен): <code className="text-[#11995E] font-bold">club@sportplatform.ru</code> / <code className="text-slate-900 font-bold">SportPass123!</code></div>
            <div>• Клуб (На доработке): <code className="text-[#11995E] font-bold">start@sportplatform.ru</code> / <code className="text-slate-900 font-bold">SportPass123!</code></div>
            <div>• Администратор: <code className="text-[#11995E] font-bold">admin@sportplatform.ru</code> / <code className="text-slate-900 font-bold">AdminPassword123!</code></div>
          </div>
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
    <div className="max-w-2xl mx-auto py-4">
      <div className="bento-card overflow-hidden">
        <div className="bg-gradient-to-r from-[#D9F2E6] via-[#E9F8F1] to-[#D4EEFC] p-6 sm:p-8 text-center space-y-2 border-b border-slate-100">
          <h1 className="font-display font-black text-2xl sm:text-3xl text-slate-900">
            Регистрация в Точке Сбора 🌿
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-slate-600">
            Выберите формат участия: личный профиль спортсмена или заявка спортивного клуба
          </p>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {/* Mode Switcher */}
          <div className="grid grid-cols-2 gap-2.5 p-1.5 rounded-2xl bg-[#F4F8F6]">
            <button
              type="button"
              onClick={() => setMode('USER')}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl font-display font-extrabold text-xs sm:text-sm transition-all cursor-pointer ${
                mode === 'USER'
                  ? 'bg-[#16B672] text-white shadow-sm shadow-[#16B672]/25'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Личный аккаунт</span>
            </button>

            <button
              type="button"
              onClick={() => setMode('ORG')}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl font-display font-extrabold text-xs sm:text-sm transition-all cursor-pointer ${
                mode === 'ORG'
                  ? 'bg-[#16B672] text-white shadow-sm shadow-[#16B672]/25'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Спортивный клуб / Организация</span>
            </button>
          </div>

          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-800">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  {mode === 'USER' ? 'Отображаемое имя *' : 'ФИО / Имя представителя *'}
                </label>
                <input
                  type="text"
                  required
                  minLength={2}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder={mode === 'USER' ? 'Например: Иван Петров' : 'Имя координатора или руководителя'}
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#F7FAF8] border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#16B672] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">Город или регион *</label>
                <RegionSelect value={city} onChange={setCity} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">Email для входа *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#F7FAF8] border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#16B672] focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">Пароль (от 8 симв.) *</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Минимум 8 символов"
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#F7FAF8] border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#16B672] focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">Повторите пароль *</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Повторите пароль"
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#F7FAF8] border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#16B672] focus:bg-white"
                />
              </div>
            </div>

            {mode === 'ORG' && (
              <div className="pt-4 border-t border-slate-100 space-y-4">
                <div className="p-4 rounded-2xl bg-[#E7F8F0] border border-[#16B672]/20 text-xs text-[#11995E] font-semibold">
                  <strong>Быстрая верификация без бюрократии:</strong> укажите основные сведения о вашем клубе для проверки модератором. (Открытое пользовательское сообщество также можно создать мгновенно из обычного аккаунта в разделе «Клубы и комьюнити»).
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1">
                      Название организации или клуба *
                    </label>
                    <input
                      type="text"
                      required
                      value={organizationName}
                      onChange={(e) => setOrganizationName(e.target.value)}
                      placeholder="Например: Беговой клуб «Импульс»"
                      className="w-full px-4 py-2.5 rounded-2xl bg-[#F7FAF8] border border-slate-200 text-sm font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1">Тип объединения *</label>
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
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">
                    Описание деятельности и тренировок *
                  </label>
                  <textarea
                    rows={3}
                    required
                    minLength={10}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Расскажите, какие тренировки или сборы вы проводите..."
                    className="w-full px-4 py-2.5 rounded-2xl bg-[#F7FAF8] border border-slate-200 text-sm font-semibold"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1">
                      Контакт для модератора (не публикуется) *
                    </label>
                    <input
                      type="text"
                      required
                      value={moderationContact}
                      onChange={(e) => setModerationContact(e.target.value)}
                      placeholder="Телефон или VK для связи при проверке"
                      className="w-full px-4 py-2.5 rounded-2xl bg-[#F7FAF8] border border-slate-200 text-sm font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1">
                      Публичные контакты для участников
                    </label>
                    <input
                      type="text"
                      value={publicContacts}
                      onChange={(e) => setPublicContacts(e.target.value)}
                      placeholder="Телефон, группа VK или почта клуба"
                      className="w-full px-4 py-2.5 rounded-2xl bg-[#F7FAF8] border border-slate-200 text-sm font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1">
                      Ссылка на группу VK / соцсеть
                    </label>
                    <input
                      type="url"
                      value={verificationLink}
                      onChange={(e) => {
                        setVerificationLink(e.target.value);
                        setSocialUrl(e.target.value);
                      }}
                      placeholder="https://vk.com/your_club"
                      className="w-full px-4 py-2.5 rounded-2xl bg-[#F7FAF8] border border-slate-200 text-sm font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1">
                      Официальный сайт (если есть)
                    </label>
                    <input
                      type="url"
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      placeholder="https://example.ru"
                      className="w-full px-4 py-2.5 rounded-2xl bg-[#F7FAF8] border border-slate-200 text-sm font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
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
                          className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all ${
                            active
                              ? 'bg-[#16B672] text-white shadow-xs'
                              : 'bg-[#F7FAF8] text-slate-700 hover:bg-[#E7F8F0]'
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
                    className="w-full px-4 py-2 rounded-2xl bg-[#F7FAF8] border border-slate-200 text-xs font-semibold"
                  />
                </div>
              </div>
            )}

            <label className="flex items-start gap-2.5 pt-2 cursor-pointer text-xs font-semibold text-slate-600">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-[#16B672] focus:ring-[#16B672]"
              />
              <span>
                Я принимаю правила спортивной платформы «Точка Сбора» и даю согласие на обработку регистрационных данных для работы сервиса.
              </span>
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 rounded-2xl bg-[#16B672] hover:bg-[#11995E] disabled:opacity-50 text-white font-display font-extrabold text-sm shadow-md shadow-[#16B672]/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {mode === 'USER' ? <UserPlus className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>
                {submitting
                  ? 'Сохранение в базу данных...'
                  : mode === 'USER'
                  ? 'Создать аккаунт спортсмена'
                  : 'Отправить заявку организации'}
              </span>
            </button>
          </form>

          <div className="pt-3 border-t border-slate-100 text-center text-xs font-semibold text-slate-600">
            Уже есть аккаунт?{' '}
            <Link to="/login" className="font-extrabold text-[#16B672] hover:text-[#11995E]">
              Войти
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
