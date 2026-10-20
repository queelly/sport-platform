import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle,
  BadgeCheck,
  Bell,
  Building2,
  CheckCircle2,
  Clock,
  Crown,
  ExternalLink,
  Flag,
  Globe,
  MapPin,
  Plus,
  RefreshCw,
  Shield,
  Users,
  X,
} from 'lucide-react';
import {
  apiFetch,
  ApiError,
  formatDateTime,
  ORG_STATUS_LABELS,
  ORG_TYPE_LABELS,
} from '../api';
import { useAuth } from '../AuthContext';
import { EventCardDto, OrganizationDto, OrganizationMemberDto } from '../types';
import { EventCard } from '../components/EventCard';
import { CustomSelect, RegionSelect } from '../components/UiControls';

export const OrganizationsListPage: React.FC = () => {
  const { user, sports, refreshMe, refreshSports } = useAuth();
  const navigate = useNavigate();

  const [orgs, setOrgs] = useState<OrganizationDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'ALL' | 'CLUBS' | 'COMMUNITIES'>('ALL');

  // Create Community Modal state (#13)
  const [showCreateCommunity, setShowCreateCommunity] = useState(false);
  const [commName, setCommName] = useState('');
  const [commCity, setCommCity] = useState(user?.city || 'Москва');
  const [commDesc, setCommDesc] = useState('');
  const [commPublicContacts, setCommPublicContacts] = useState('');
  const [commSocialUrl, setCommSocialUrl] = useState('');
  const [commSportIds, setCommSportIds] = useState<string[]>([]);
  const [commNewSport, setCommNewSport] = useState('');
  const [creatingComm, setCreatingComm] = useState(false);
  const [commError, setCommError] = useState<string | null>(null);

  const loadOrgs = async () => {
    setLoading(true);
    try {
      const list = await apiFetch<OrganizationDto[]>('/api/v1/organizations');
      setOrgs(list);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrgs();
  }, []);

  const toggleCommSport = (id: string) => {
    setCommSportIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleCreateCommunity = async (e: React.FormEvent) => {
    e.preventDefault();
    setCommError(null);
    setCreatingComm(true);
    try {
      const created = await apiFetch<OrganizationDto>('/api/v1/organizations/community', {
        method: 'POST',
        body: JSON.stringify({
          name: commName,
          city: commCity,
          description: commDesc,
          publicContacts: commPublicContacts,
          socialUrl: commSocialUrl,
          sportIds: commSportIds,
          newSportNames: commNewSport.trim() ? [commNewSport.trim()] : [],
        }),
      });
      await refreshSports();
      await refreshMe();
      setShowCreateCommunity(false);
      navigate(`/organizations/${created.id}`);
    } catch (err) {
      setCommError(err instanceof ApiError ? err.message : 'Не удалось создать сообщество');
    } finally {
      setCreatingComm(false);
    }
  };

  const filteredOrgs = orgs.filter((o) => {
    if (filterType === 'COMMUNITIES') return o.orgType === 'COMMUNITY';
    if (filterType === 'CLUBS') return o.orgType !== 'COMMUNITY';
    return true;
  });

  return (
    <div className="space-y-8 pb-16">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900">
            Спортивные клубы и сообщества
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Вступайте в проверенные клубы и открытые сообщества по интересам или создайте собственное сообщество
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {user ? (
            <button
              type="button"
              onClick={() => setShowCreateCommunity(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Создать открытое сообщество</span>
            </button>
          ) : (
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-sm"
            >
              <Building2 className="w-4 h-4" />
              <span>Зарегистрировать клуб или аккаунт</span>
            </Link>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setFilterType('ALL')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            filterType === 'ALL'
              ? 'bg-slate-900 text-white'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
          }`}
        >
          Все объединения ({orgs.length})
        </button>
        <button
          type="button"
          onClick={() => setFilterType('CLUBS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            filterType === 'CLUBS'
              ? 'bg-slate-900 text-white'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
          }`}
        >
          Официальные клубы и федерации ({orgs.filter((o) => o.orgType !== 'COMMUNITY').length})
        </button>
        <button
          type="button"
          onClick={() => setFilterType('COMMUNITIES')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            filterType === 'COMMUNITIES'
              ? 'bg-slate-900 text-white'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
          }`}
        >
          Открытые сообщества участников ({orgs.filter((o) => o.orgType === 'COMMUNITY').length})
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[1, 2].map((n) => (
            <div key={n} className="h-48 rounded-2xl bg-slate-200 animate-pulse" />
          ))}
        </div>
      ) : filteredOrgs.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center text-sm text-slate-600 space-y-3">
          <div>В этой категории пока нет клубов или сообществ.</div>
          {user && (
            <button
              type="button"
              onClick={() => setShowCreateCommunity(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold"
            >
              <Plus className="w-4 h-4" />
              <span>Создать первое сообщество</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredOrgs.map((org) => (
            <Link
              key={org.id}
              to={`/organizations/${org.id}`}
              className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-xl hover:border-blue-300 transition-all space-y-4"
            >
              <div className="flex items-center justify-between gap-2">
                {org.orgType === 'COMMUNITY' ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-bold">
                    <Users className="w-3.5 h-3.5" />
                    <span>Открытое сообщество</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                    <BadgeCheck className="w-3.5 h-3.5" />
                    <span>Проверено платформой</span>
                  </span>
                )}
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
                  <span>Участников / подписчиков: {org.subscribersCount}</span>
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

      {/* Create Community Modal (#13) */}
      {showCreateCommunity && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-xl w-full p-6 sm:p-8 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display font-extrabold text-xl text-slate-900">
                  Создать открытое сообщество
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Любой участник может создать сообщество по интересам, приглашать друзей, назначать администраторов и публиковать мероприятия от имени сообщества
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateCommunity(false)}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {commError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-800">
                {commError}
              </div>
            )}

            <form onSubmit={handleCreateCommunity} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Название сообщества *
                  </label>
                  <input
                    type="text"
                    required
                    minLength={3}
                    value={commName}
                    onChange={(e) => setCommName(e.target.value)}
                    placeholder="Например: Утренний бег в Парке Горького"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Город / Регион *</label>
                  <RegionSelect value={commCity} onChange={setCommCity} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Описание сообщества и расписания сборов *
                </label>
                <textarea
                  rows={3}
                  required
                  minLength={10}
                  value={commDesc}
                  onChange={(e) => setCommDesc(e.target.value)}
                  placeholder="Расскажите, кого вы объединяете, где и как проходят совместные тренировки..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Публичные контакты (необязательно)
                  </label>
                  <input
                    type="text"
                    value={commPublicContacts}
                    onChange={(e) => setCommPublicContacts(e.target.value)}
                    placeholder="Чат или контакт координатора"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Ссылка на группу ВК / чат (необязательно)
                  </label>
                  <input
                    type="url"
                    value={commSocialUrl}
                    onChange={(e) => setCommSocialUrl(e.target.value)}
                    placeholder="https://vk.com/..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Виды спорта сообщества
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {sports.map((s) => (
                    <button
                      type="button"
                      key={s.id}
                      onClick={() => toggleCommSport(s.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                        commSportIds.includes(s.id)
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={commNewSport}
                  onChange={(e) => setCommNewSport(e.target.value)}
                  placeholder="Или впишите новый вид спорта..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateCommunity(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={creatingComm}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md"
                >
                  {creatingComm ? 'Создание...' : 'Создать сообщество'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export const OrganizationPublicPage: React.FC = () => {
  const { orgId } = useParams<{ orgId: string }>();
  const { user, refreshMe } = useAuth();

  const [org, setOrg] = useState<OrganizationDto | null>(null);
  const [events, setEvents] = useState<EventCardDto[]>([]);
  const [members, setMembers] = useState<OrganizationMemberDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roleFeedback, setRoleFeedback] = useState<string | null>(null);

  const loadData = async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const [o, evs, mems] = await Promise.all([
        apiFetch<OrganizationDto>(`/api/v1/organizations/${orgId}`),
        apiFetch<EventCardDto[]>(`/api/v1/organizations/${orgId}/events`),
        apiFetch<OrganizationMemberDto[]>(`/api/v1/organizations/${orgId}/members`),
      ]);
      setOrg(o);
      setEvents(evs);
      setMembers(mems);
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
      const mems = await apiFetch<OrganizationMemberDto[]>(`/api/v1/organizations/${org.id}/members`);
      setMembers(mems);
      await refreshMe();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось изменить участие');
    }
  };

  const handleChangeMemberRole = async (targetUserId: string, newRole: 'ADMIN' | 'MEMBER') => {
    if (!org) return;
    setRoleFeedback(null);
    try {
      const updatedMembers = await apiFetch<OrganizationMemberDto[]>(
        `/api/v1/organizations/${org.id}/members/role`,
        {
          method: 'POST',
          body: JSON.stringify({ userId: targetUserId, role: newRole }),
        }
      );
      setMembers(updatedMembers);
      setRoleFeedback(
        newRole === 'ADMIN'
          ? 'Участник назначен администратором сообщества! Теперь он может управлять сообществом и публиковать мероприятия от его имени.'
          : 'Права администратора сообщества сняты.'
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось изменить роль участника');
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
  const canManage = Boolean(org.managedByViewer) || (user != null && user.id === org.ownerUserId);

  return (
    <div className="space-y-8 pb-16">
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-9 shadow-sm space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusInfo.color}`}>
              <BadgeCheck className="w-4 h-4" />
              <span>{org.orgType === 'COMMUNITY' ? 'Активное сообщество' : statusInfo.label}</span>
            </span>
            <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
              {ORG_TYPE_LABELS[org.orgType] || org.orgType}
            </span>
            {canManage && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold">
                <Crown className="w-3.5 h-3.5" />
                <span>Вы администратор</span>
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {user && org.status === 'APPROVED' && (
              <button
                type="button"
                onClick={handleToggleSubscribe}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                  org.subscribedByViewer
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                <Bell className="w-3.5 h-3.5" />
                <span>
                  {org.subscribedByViewer
                    ? org.orgType === 'COMMUNITY'
                      ? `Вы участник сообщества (${org.subscribersCount})`
                      : `Вы подписаны (${org.subscribersCount})`
                    : org.orgType === 'COMMUNITY'
                    ? `Вступить в сообщество (${org.subscribersCount})`
                    : `Подписаться на анонсы клуба (${org.subscribersCount})`}
                </span>
              </button>
            )}

            {canManage && org.status === 'APPROVED' && (
              <Link
                to={`/my-organization?orgId=${org.id}`}
                className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold"
              >
                <span>Настройки профиля</span>
              </Link>
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
            <Link to={`/users/${org.ownerUserId}`} className="hover:text-blue-600 font-medium">
              Основатель / представитель: {org.representativeName}
            </Link>
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

        {/* Public Contacts & Links */}
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

      {/* EVENTS SECTION */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display font-extrabold text-xl text-slate-900">
            Мероприятия {org.orgType === 'COMMUNITY' ? 'сообщества' : 'организации'} ({events.length})
          </h2>
          {canManage && org.status === 'APPROVED' && (
            <Link
              to={`/events/new?orgId=${org.id}`}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>
                Создать мероприятие от {org.orgType === 'COMMUNITY' ? 'сообщества' : 'клуба'}
              </span>
            </Link>
          )}
        </div>

        {events.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs text-slate-500">
            У объединения пока нет опубликованных мероприятий.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {events.map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        )}
      </section>

      {/* MEMBERS & ADMINISTRATORS SECTION (#13) */}
      <section className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-display font-extrabold text-lg text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span>Команда и участники ({members.length})</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Создатель и назначенные администраторы могут публиковать мероприятия от имени сообщества и редактировать его профиль
            </p>
          </div>
        </div>

        {roleFeedback && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-900 flex items-center justify-between">
            <span>{roleFeedback}</span>
            <button type="button" onClick={() => setRoleFeedback(null)}>
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {members.map((m) => {
            const isCreator = m.userId === org.ownerUserId || m.role === 'OWNER' || String(m.role) === 'CREATOR';
            const isAdminRole = m.role === 'ADMIN';
            return (
              <div
                key={m.userId}
                className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/60 flex items-center justify-between gap-2"
              >
                <Link to={`/users/${m.userId}`} className="flex items-center gap-2.5 min-w-0">
                  {m.avatarUrl ? (
                    <img
                      src={m.avatarUrl}
                      alt={m.displayName}
                      className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                      {m.displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="font-bold text-xs text-slate-900 truncate hover:text-blue-600">
                      {m.displayName}
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                      <span>{m.city || 'Россия'}</span>
                      {isCreator ? (
                        <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-bold text-[10px]">
                          Создатель
                        </span>
                      ) : isAdminRole ? (
                        <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-bold text-[10px]">
                          Админ
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">Участник</span>
                      )}
                    </div>
                  </div>
                </Link>

                {canManage && !isCreator && (
                  <button
                    type="button"
                    onClick={() =>
                      handleChangeMemberRole(m.userId, isAdminRole ? 'MEMBER' : 'ADMIN')
                    }
                    className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold shrink-0 transition-colors ${
                      isAdminRole
                        ? 'bg-slate-200 hover:bg-rose-100 text-slate-700 hover:text-rose-800'
                        : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200'
                    }`}
                    title={
                      isAdminRole
                        ? 'Снять права администратора сообщества'
                        : 'Назначить администратором (сможет публиковать встречи от имени сообщества)'
                    }
                  >
                    <Shield className="w-3 h-3 inline mr-1" />
                    {isAdminRole ? 'Разжаловать' : 'Сделать админом'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
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
          За вашим аккаунтом пока не закреплена спортивная организация или сообщество
        </div>
        <p className="text-xs text-slate-600">
          Вы можете создать открытое сообщество в разделе «Клубы» или подать заявку официальной организации.
        </p>
        <Link
          to="/organizations"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold"
        >
          Перейти в раздел «Клубы и сообщества»
        </Link>
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
            Кабинет управления клубом / сообществом
          </h1>
          <p className="text-sm text-slate-600">
            Управление профилем объединения, отслеживание статуса модерации и публикация мероприятий
          </p>
        </div>

        {orgs.length > 1 && (
          <div className="min-w-[240px]">
            <CustomSelect
              value={selectedOrg.id}
              onChange={(val) => {
                const found = orgs.find((o) => o.id === val);
                if (found) populateForm(found);
              }}
              options={orgs.map((o) => ({
                value: o.id,
                label: `${o.name} (${ORG_TYPE_LABELS[o.orgType] || o.orgType})`,
              }))}
            />
          </div>
        )}

        {selectedOrg.status === 'APPROVED' && (
          <div className="flex gap-2">
            <Link
              to={`/organizations/${selectedOrg.id}`}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 bg-white"
            >
              Открыть публичную страницу
            </Link>
            <Link
              to={`/events/new?orgId=${selectedOrg.id}`}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Опубликовать мероприятие</span>
            </Link>
          </div>
        )}
      </div>

      {/* Status Alert Banner */}
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
              Объединение активно! Публичная страница открыта, и вы (а также назначенные вами администраторы) можете публиковать разовые и еженедельные мероприятия.
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
            Анкетные и публичные сведения
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Название *</label>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Город / регион *</label>
              <RegionSelect value={city} onChange={setCity} />
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
