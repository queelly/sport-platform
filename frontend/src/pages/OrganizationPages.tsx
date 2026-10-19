import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  AlertCircle,
  BadgeCheck,
  Bell,
  Building2,
  CheckCircle2,
  Clock,
  ExternalLink,
  Flag,
  Globe,
  MapPin,
  Plus,
  RefreshCw,
} from 'lucide-react';
import {
  apiFetch,
  ApiError,
  formatDateTime,
  ORG_STATUS_LABELS,
  ORG_TYPE_LABELS,
} from '../api';
import { useAuth } from '../AuthContext';
import { EventCardDto, OrganizationDto } from '../types';
import { EventCard } from '../components/EventCard';

export const OrganizationsListPage: React.FC = () => {
  const { user } = useAuth();
  const [orgs, setOrgs] = useState<OrganizationDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const list = await apiFetch<OrganizationDto[]>('/api/v1/organizations');
        setOrgs(list);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-8 pb-16">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900">
            Проверенные спортивные клубы и организации
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Каждое сообщество в этом списке прошло ручную проверку администраторами платформы
          </p>
        </div>

        {!user && (
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-sm"
          >
            <Building2 className="w-4 h-4" />
            <span>Зарегистрировать организацию</span>
          </Link>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[1, 2].map((n) => (
            <div key={n} className="h-48 rounded-2xl bg-slate-200 animate-pulse" />
          ))}
        </div>
      ) : orgs.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center text-sm text-slate-600">
          Список одобренных организаций пока пуст.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {orgs.map((org) => (
            <Link
              key={org.id}
              to={`/organizations/${org.id}`}
              className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-xl hover:border-blue-300 transition-all space-y-4"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                  <BadgeCheck className="w-3.5 h-3.5" />
                  <span>Проверено платформой</span>
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  {ORG_TYPE_LABELS[org.orgType] || org.orgType}
                </span>
              </div>

              <div>
                <h2 className="font-display font-bold text-xl text-slate-900">{org.name}</h2>
                <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-blue-600" />
                  <span>{org.city}</span>
                  <span>•</span>
                  <span>Подписчиков: {org.subscribersCount}</span>
                </div>
              </div>

              <p className="text-sm text-slate-600 line-clamp-3">{org.description}</p>

              <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100">
                {org.sports.map((s) => (
                  <span
                    key={s.id}
                    className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold"
                  >
                    {s.name}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export const OrganizationPublicPage: React.FC = () => {
  const { orgId } = useParams<{ orgId: string }>();
  const { user } = useAuth();

  const [org, setOrg] = useState<OrganizationDto | null>(null);
  const [events, setEvents] = useState<EventCardDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const [o, evs] = await Promise.all([
        apiFetch<OrganizationDto>(`/api/v1/organizations/${orgId}`),
        apiFetch<EventCardDto[]>(`/api/v1/organizations/${orgId}/events`),
      ]);
      setOrg(o);
      setEvents(evs);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось загрузить страницу организации');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [orgId]);

  const handleToggleSubscribe = async () => {
    if (!org) return;
    try {
      const updated = await apiFetch<OrganizationDto>(`/api/v1/organizations/${org.id}/subscribe`, {
        method: 'POST',
      });
      setOrg(updated);
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Не удалось изменить подписку');
    }
  };

  if (loading) return <div className="h-80 rounded-3xl bg-slate-200 animate-pulse" />;

  if (error || !org) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center space-y-3">
        <div className="font-display font-bold text-lg text-slate-900">
          {error || 'Организация не найдена'}
        </div>
        <Link to="/organizations" className="inline-block px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold">
          К списку организаций
        </Link>
      </div>
    );
  }

  const statusInfo = ORG_STATUS_LABELS[org.status] || { label: org.status, color: 'bg-slate-100 text-slate-700' };

  return (
    <div className="space-y-8 pb-16">
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-9 shadow-sm space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusInfo.color}`}>
              <BadgeCheck className="w-4 h-4" />
              <span>{statusInfo.label}</span>
            </span>
            <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
              {ORG_TYPE_LABELS[org.orgType] || org.orgType}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {user && org.status === 'APPROVED' && (
              <button
                onClick={handleToggleSubscribe}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  org.subscribedByViewer
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                <Bell className="w-3.5 h-3.5" />
                <span>
                  {org.subscribedByViewer
                    ? `Вы подписаны (${org.subscribersCount})`
                    : `Подписаться на анонсы клуба (${org.subscribersCount})`}
                </span>
              </button>
            )}

            {user && (
              <Link
                to={`/support?targetType=ORGANIZATION&targetId=${org.id}&subject=${encodeURIComponent(
                  'Обращение по организации: ' + org.name
                )}`}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold"
              >
                <Flag className="w-3.5 h-3.5" />
                <span>Пожаловаться</span>
              </Link>
            )}
          </div>
        </div>

        <div>
          <h1 className="font-display font-extrabold text-2xl sm:text-4xl text-slate-900">{org.name}</h1>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 mt-2">
            <span className="inline-flex items-center gap-1 font-semibold text-slate-800">
              <MapPin className="w-4 h-4 text-blue-600" />
              {org.city}
            </span>
            <span>•</span>
            <span>Представитель: {org.representativeName}</span>
          </div>
        </div>

        <p className="text-slate-700 text-sm sm:text-base whitespace-pre-line leading-relaxed">
          {org.description}
        </p>

        <div className="flex flex-wrap gap-2">
          {org.sports.map((s) => (
            <span
              key={s.id}
              className="px-3 py-1 rounded-xl bg-blue-50 text-blue-700 border border-blue-200/60 text-xs font-bold"
            >
              {s.name}
            </span>
          ))}
        </div>

        {/* Public Contacts & Links (Moderation contacts are strictly excluded on backend for non-owners) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/70 text-xs">
          <div>
            <div className="font-bold text-slate-900 mb-0.5">Публичные контакты для участников</div>
            <div className="text-slate-700">{org.publicContacts || 'Связь через обсуждения мероприятий'}</div>
          </div>
          {org.websiteUrl && (
            <div>
              <div className="font-bold text-slate-900 mb-0.5">Официальный сайт</div>
              <a
                href={org.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline inline-flex items-center gap-1 break-all"
              >
                <Globe className="w-3.5 h-3.5 shrink-0" />
                <span>{org.websiteUrl}</span>
              </a>
            </div>
          )}
          {org.socialUrl && (
            <div>
              <div className="font-bold text-slate-900 mb-0.5">Публичная страница в соцсетях</div>
              <a
                href={org.socialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline inline-flex items-center gap-1 break-all"
              >
                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                <span>{org.socialUrl}</span>
              </a>
            </div>
          )}
        </div>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-extrabold text-xl text-slate-900">
            Мероприятия организации ({events.length})
          </h2>
          {user?.id === org.ownerUserId && org.status === 'APPROVED' && (
            <Link
              to="/events/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold"
            >
              <Plus className="w-4 h-4" />
              <span>Создать мероприятие от клуба</span>
            </Link>
          )}
        </div>

        {events.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs text-slate-500">
            У организации пока нет опубликованных мероприятий.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {events.map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export const MyOrganizationCabinetPage: React.FC = () => {
  const { sports, refreshMe } = useAuth();
  const [orgs, setOrgs] = useState<OrganizationDto[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<OrganizationDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Edit / Resubmit Form fields
  const [name, setName] = useState('');
  const [orgType, setOrgType] = useState('SPORTS_CLUB');
  const [city, setCity] = useState('');
  const [description, setDescription] = useState('');
  const [representativeName, setRepresentativeName] = useState('');
  const [moderationContact, setModerationContact] = useState('');
  const [publicContacts, setPublicContacts] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [socialUrl, setSocialUrl] = useState('');
  const [verificationLink, setVerificationLink] = useState('');
  const [extraModerationInfo, setExtraModerationInfo] = useState('');
  const [selectedSportIds, setSelectedSportIds] = useState<string[]>([]);

  const populateForm = (o: OrganizationDto) => {
    setSelectedOrg(o);
    setName(o.name);
    setOrgType(o.orgType);
    setCity(o.city);
    setDescription(o.description);
    setRepresentativeName(o.representativeName);
    setModerationContact(o.moderationContact || '');
    setPublicContacts(o.publicContacts || '');
    setWebsiteUrl(o.websiteUrl || '');
    setSocialUrl(o.socialUrl || '');
    setVerificationLink(o.verificationLink || '');
    setExtraModerationInfo(o.extraModerationInfo || '');
    setSelectedSportIds(o.sports.map((s) => s.id));
  };

  const loadMyOrgs = async () => {
    setLoading(true);
    try {
      const list = await apiFetch<OrganizationDto[]>('/api/v1/organizations/my');
      setOrgs(list);
      if (list.length > 0) {
        populateForm(list[0]);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMyOrgs();
  }, []);

  const toggleSport = (id: string) => {
    setSelectedSportIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleSaveAndResubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrg) return;
    setSaving(true);
    setFeedback(null);
    setError(null);
    try {
      const updated = await apiFetch<OrganizationDto>(`/api/v1/organizations/${selectedOrg.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name,
          orgType,
          city,
          description,
          representativeName,
          moderationContact,
          publicContacts,
          websiteUrl,
          socialUrl,
          verificationLink,
          extraModerationInfo,
          sportIds: selectedSportIds,
        }),
      });
      populateForm(updated);
      setOrgs((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
      await refreshMe();
      setFeedback(
        updated.status === 'PENDING_REVIEW'
          ? `Изменения сохранены! Заявка (версия #${updated.submissionVersion}) отправлена на повторное рассмотрение администратору.`
          : 'Данные организации успешно обновлены!'
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось сохранить изменения');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="h-80 rounded-3xl bg-slate-200 animate-pulse" />;

  if (!selectedOrg) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center space-y-3">
        <div className="font-display font-bold text-lg text-slate-900">
          За вашим аккаунтом пока не закреплена спортивная организация
        </div>
        <p className="text-xs text-slate-600">
          Вы можете зарегистрировать организацию на странице регистрации с выбором вкладки «Организация / Сообщество».
        </p>
      </div>
    );
  }

  const statusMeta = ORG_STATUS_LABELS[selectedOrg.status] || {
    label: selectedOrg.status,
    color: 'bg-slate-100 text-slate-700',
  };

  return (
    <div className="space-y-8 pb-16">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900">
            Кабинет представителя организации
          </h1>
          <p className="text-sm text-slate-600">
            Управление профилем клуба, отслеживание статуса модерации и повторная отправка заявки после исправлений
          </p>
        </div>

        {selectedOrg.status === 'APPROVED' && (
          <div className="flex gap-2">
            <Link
              to={`/organizations/${selectedOrg.id}`}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 bg-white"
            >
              Открыть публичную страницу клуба
            </Link>
            <Link
              to="/events/new"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Опубликовать мероприятие от клуба</span>
            </Link>
          </div>
        )}
      </div>

      {/* Status Alert Banner (Especially critical for Scenario 4: Rejected -> Fix -> Resubmit) */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className={`px-3.5 py-1 rounded-full text-xs font-bold border ${statusMeta.color}`}>
              {statusMeta.label}
            </span>
            <span className="text-xs font-semibold text-slate-500">
              Текущая версия заявки: #{selectedOrg.submissionVersion}
            </span>
          </div>
        </div>

        {(selectedOrg.status === 'REJECTED' || selectedOrg.status === 'NEEDS_REVISION') && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-950 space-y-1.5">
            <div className="font-display font-bold text-sm flex items-center gap-2 text-rose-800">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Причина отклонения / возврата от администратора:</span>
            </div>
            <p className="text-xs sm:text-sm font-medium">{selectedOrg.rejectionReason}</p>
            <p className="text-xs text-rose-700 pt-1">
              Исправьте сведения в форме ниже и нажмите кнопку «Исправить и повторно отправить заявку на проверку».
            </p>
          </div>
        )}

        {selectedOrg.status === 'PENDING_REVIEW' && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center gap-2.5">
            <Clock className="w-5 h-5 text-amber-600 shrink-0" />
            <span>
              Ваша заявка находится на рассмотрении у администратора. До момента одобрения публичная страница скрыта, а публикация мероприятий от имени организации недоступна.
            </span>
          </div>
        )}

        {selectedOrg.status === 'APPROVED' && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>
              Организация одобрена администратором! Публичная страница активна, и вы можете публиковать разовые и регулярные мероприятия от имени клуба.
            </span>
          </div>
        )}
      </div>

      {feedback && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-900">
          {feedback}
        </div>
      )}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-800">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form for Editing and Resubmitting */}
        <form
          onSubmit={handleSaveAndResubmit}
          className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4"
        >
          <h2 className="font-display font-bold text-lg text-slate-900">
            Анкетные и публичные сведения организации
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Название организации *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Тип объединения *</label>
              <select
                value={orgType}
                onChange={(e) => setOrgType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
              >
                {Object.entries(ORG_TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Город / регион *</label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Имя представителя *</label>
              <input
                type="text"
                required
                value={representativeName}
                onChange={(e) => setRepresentativeName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Описание деятельности *</label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Контакт для модератора (скрыт от публики) *
              </label>
              <input
                type="text"
                required
                value={moderationContact}
                onChange={(e) => setModerationContact(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Публичные контакты для участников
              </label>
              <input
                type="text"
                value={publicContacts}
                onChange={(e) => setPublicContacts(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Ссылка для проверки (группа VK / расписание)
              </label>
              <input
                type="url"
                value={verificationLink}
                onChange={(e) => {
                  setVerificationLink(e.target.value);
                  setSocialUrl(e.target.value);
                }}
                placeholder="https://vk.com/club..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Официальный сайт</label>
              <input
                type="url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Пояснение для администратора при повторной подаче
            </label>
            <input
              type="text"
              value={extraModerationInfo}
              onChange={(e) => setExtraModerationInfo(e.target.value)}
              placeholder="Укажите, какие замечания были устранены..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Спортивные направления</label>
            <div className="flex flex-wrap gap-2">
              {sports.map((s) => (
                <button
                  type="button"
                  key={s.id}
                  onClick={() => toggleSport(s.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                    selectedSportIds.includes(s.id)
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-3">
            <button
              type="submit"
              disabled={saving}
              className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-display font-bold text-sm shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>
                {saving
                  ? 'Сохранение...'
                  : selectedOrg.status === 'REJECTED' || selectedOrg.status === 'NEEDS_REVISION'
                  ? 'Исправить сведения и повторно отправить заявку на проверку'
                  : 'Сохранить изменения'}
              </span>
            </button>
          </div>
        </form>

        {/* Application History Sidebar */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h3 className="font-display font-bold text-base text-slate-900">
            История подач и решений модерации ({selectedOrg.applicationHistory.length})
          </h3>
          <div className="space-y-3">
            {selectedOrg.applicationHistory.map((h) => (
              <div key={h.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">Версия заявки #{h.versionNumber}</span>
                  <span className="text-[11px] font-semibold text-slate-500">
                    {formatDateTime(h.createdAt)}
                  </span>
                </div>
                <div className="font-semibold text-blue-700">
                  Статус: {ORG_STATUS_LABELS[h.status]?.label || h.status}
                </div>
                {h.decisionReason && (
                  <div className="text-slate-700">
                    Комментарий / причина: <span className="font-medium">{h.decisionReason}</span>
                  </div>
                )}
                <div className="text-[11px] text-slate-500 break-words">{h.submittedSnapshot}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
