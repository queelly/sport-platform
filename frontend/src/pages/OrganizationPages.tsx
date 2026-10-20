import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle,
  BadgeCheck,
  Bell,
  Building2,
  CheckCircle2,
  Clock,
  Compass,
  Crown,
  ExternalLink,
  Flag,
  Globe,
  MapPin,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Shield,
  Trash2,
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
import { CustomSelect, RegionSelect, VoiceSearchButton } from '../components/UiControls';

export const OrganizationsListPage: React.FC<{ mode?: 'ORGANIZATIONS' | 'COMMUNITIES' }> = ({
  mode,
}) => {
  const { user, myOrganizations, sports, refreshMe, refreshSports } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const activeMode: 'ORGANIZATIONS' | 'COMMUNITIES' =
    mode || (location.pathname.startsWith('/communities') ? 'COMMUNITIES' : 'ORGANIZATIONS');
  const isCommunitiesMode = activeMode === 'COMMUNITIES';

  // Аккаунт организации — это обезличенный аккаунт, владеющий официальной организацией (не COMMUNITY).
  // Ему запрещено создавать пользовательские сообщества.
  const isOrganizationAccount = Boolean(
    user && myOrganizations.some((o) => o.orgType !== 'COMMUNITY' && o.ownerUserId === user.id)
  );

  const [orgs, setOrgs] = useState<OrganizationDto[]>([]);
  const [loading, setLoading] = useState(true);

  // Поиск и фильтры по сообществам и организациям
  const [searchQuery, setSearchQuery] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [sportFilter, setSportFilter] = useState('');
  const [orgTypeFilter, setOrgTypeFilter] = useState('');

  // Create Community Modal state
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

  const baseList = orgs.filter((o) =>
    isCommunitiesMode ? o.orgType === 'COMMUNITY' : o.orgType !== 'COMMUNITY'
  );

  const normQuery = searchQuery.trim().toLowerCase().replace(/ё/g, 'е');
  const normCity = cityFilter.trim().toLowerCase().replace(/ё/g, 'е');

  const filteredOrgs = baseList.filter((o) => {
    if (normQuery) {
      const hay = `${o.name} ${o.description} ${o.city} ${o.sports.map((s) => s.name).join(' ')}`
        .toLowerCase()
        .replace(/ё/g, 'е');
      if (!hay.includes(normQuery)) return false;
    }
    if (normCity) {
      const orgCity = (o.city || '').toLowerCase().replace(/ё/g, 'е');
      if (!orgCity.includes(normCity) && !normCity.includes(orgCity)) return false;
    }
    if (sportFilter) {
      if (!o.sports.some((s) => s.id === sportFilter)) return false;
    }
    if (!isCommunitiesMode && orgTypeFilter) {
      if (o.orgType !== orgTypeFilter) return false;
    }
    return true;
  });

  const hasActiveFilters = Boolean(searchQuery.trim() || cityFilter || sportFilter || orgTypeFilter);

  const resetFilters = () => {
    setSearchQuery('');
    setCityFilter('');
    setSportFilter('');
    setOrgTypeFilter('');
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header & Section Switcher */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center p-1 rounded-xl bg-surface border border-line-2">
            <Link
              to="/communities"
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                isCommunitiesMode
                  ? 'bg-brand text-white shadow-2xs'
                  : 'text-muted hover:text-ink'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Сообщества ({orgs.filter((o) => o.orgType === 'COMMUNITY').length})</span>
            </Link>
            <Link
              to="/organizations"
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                !isCommunitiesMode
                  ? 'bg-brand text-white shadow-2xs'
                  : 'text-muted hover:text-ink'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Организации ({orgs.filter((o) => o.orgType !== 'COMMUNITY').length})</span>
            </Link>
          </div>

          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-ink">
            {isCommunitiesMode ? 'Сообщества участников' : 'Спортивные организации'}
          </h1>
          <p className="text-sm text-muted max-w-2xl">
            {isCommunitiesMode
              ? 'Открытые объединения по интересам, создаваемые участниками платформы для совместных тренировок, пробежек и игр.'
              : 'Официальные спортивные организации, федерации, секции и спортивные школы с проверенным статусом.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {isCommunitiesMode ? (
            user ? (
              isOrganizationAccount ? (
                <div className="px-3.5 py-2 rounded-xl bg-surface border border-line-2 text-xs font-semibold text-muted">
                  Вы вошли как организация (создание пользовательских сообществ доступно только обычным участникам)
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowCreateCommunity(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Создать сообщество</span>
                </button>
              )
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand text-white text-xs font-bold shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Войти и создать сообщество</span>
              </Link>
            )
          ) : user ? (
            myOrganizations.length > 0 && (
              <Link
                to="/my-organization"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-card hover:bg-surface border border-line-2 text-ink text-xs font-bold shadow-xs transition-colors"
              >
                <Building2 className="w-4 h-4 text-brand" />
                <span>Кабинет управления</span>
              </Link>
            )
          ) : (
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand text-white text-xs font-bold shadow-sm"
            >
              <Building2 className="w-4 h-4" />
              <span>Зарегистрировать аккаунт организации</span>
            </Link>
          )}
        </div>
      </div>

      {/* Поиск и фильтры по сообществам / организациям */}
      <div className="bg-card rounded-[22px] border border-line-2 p-4 sm:p-5 shadow-xs space-y-3">
        <div
          className={`grid grid-cols-1 ${
            isCommunitiesMode ? 'md:grid-cols-3' : 'md:grid-cols-4'
          } gap-3`}
        >
          {/* Поисковая строка */}
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                isCommunitiesMode
                  ? 'Поиск сообщества по названию или описанию...'
                  : 'Поиск организации по названию или описанию...'
              }
              className="w-full h-[44px] pl-10 pr-11 rounded-xl border border-line-2 bg-card focus:border-brand text-sm text-ink outline-none"
            />
            <div className="absolute right-1.5 top-1/2 -translate-y-1/2">
              <VoiceSearchButton onResult={(txt) => setSearchQuery(txt)} />
            </div>
          </div>

          {/* Фильтр по городу / региону */}
          <RegionSelect
            value={cityFilter}
            onChange={setCityFilter}
            allowAll
            allLabel="Все города и регионы РФ"
            placeholder="Город или регион..."
          />

          {/* Фильтр по виду спорта */}
          <CustomSelect
            value={sportFilter}
            onChange={setSportFilter}
            searchable
            placeholder="Все виды спорта"
            options={[
              { value: '', label: 'Все виды спорта' },
              ...sports.map((s) => ({ value: s.id, label: s.name })),
            ]}
          />

          {/* Фильтр по типу организации (только для раздела Организации) */}
          {!isCommunitiesMode && (
            <CustomSelect
              value={orgTypeFilter}
              onChange={setOrgTypeFilter}
              placeholder="Все типы организаций"
              options={[
                { value: '', label: 'Все типы организаций' },
                ...Object.entries(ORG_TYPE_LABELS)
                  .filter(([k]) => k !== 'COMMUNITY')
                  .map(([k, v]) => ({ value: k, label: v })),
              ]}
            />
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-muted">
          <span>
            Найдено {isCommunitiesMode ? 'сообществ' : 'организаций'}:{' '}
            <strong className="text-ink font-mono">{filteredOrgs.length}</strong> из{' '}
            <span className="font-mono">{baseList.length}</span>
          </span>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-surface hover:bg-surface-2 text-ink font-semibold transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-brand" />
              <span>Сбросить фильтры</span>
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[1, 2].map((n) => (
            <div key={n} className="h-48 rounded-2xl bg-surface animate-pulse" />
          ))}
        </div>
      ) : filteredOrgs.length === 0 ? (
        <div className="bg-card rounded-[22px] border border-line-2 p-10 text-center text-sm text-muted space-y-3">
          <div>
            {hasActiveFilters
              ? `По заданным фильтрам ${isCommunitiesMode ? 'сообществ' : 'организаций'} не найдено.`
              : isCommunitiesMode
              ? 'Пока нет созданных открытых сообществ.'
              : 'Пока нет зарегистрированных организаций.'}
          </div>
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand text-white text-xs font-bold cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Показать все</span>
            </button>
          ) : (
            isCommunitiesMode &&
            user &&
            !isOrganizationAccount && (
              <button
                type="button"
                onClick={() => setShowCreateCommunity(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand text-white text-xs font-bold cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Создать первое сообщество</span>
              </button>
            )
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredOrgs.map((org) => (
            <Link
              key={org.id}
              to={`/organizations/${org.id}`}
              className="bg-card rounded-[22px] border border-line-2 p-6 shadow-xs hover:shadow-md hover:border-brand/50 transition-all space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  {org.orgType === 'COMMUNITY' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-tint text-brand-ink border border-brand-line text-xs font-bold">
                      <Users className="w-3.5 h-3.5" />
                      <span>Сообщество участников</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-tint text-brand-ink border border-brand-line text-xs font-bold">
                      <BadgeCheck className="w-3.5 h-3.5" />
                      <span>Официальная организация</span>
                    </span>
                  )}
                  <span className="text-xs font-semibold text-muted">
                    {ORG_TYPE_LABELS[org.orgType] || org.orgType}
                  </span>
                </div>

                <div>
                  <h2 className="font-display font-bold text-xl text-ink">{org.name}</h2>
                  <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted mt-1">
                    <MapPin className="w-3.5 h-3.5 text-brand" />
                    <span className="font-semibold text-ink">{org.city}</span>
                    <span>•</span>
                    <span>
                      {org.orgType === 'COMMUNITY'
                        ? `Участников: ${org.subscribersCount}`
                        : `Подписчиков: ${org.subscribersCount}`}
                    </span>
                  </div>
                </div>

                <p className="text-sm text-muted line-clamp-3">{org.description}</p>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-3 border-t border-line">
                {org.sports.map((s) => (
                  <span
                    key={s.id}
                    className="px-2.5 py-1 rounded-lg bg-surface text-ink text-xs font-semibold"
                  >
                    {s.name}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Create Community Modal */}
      {showCreateCommunity &&
        createPortal(
          <div className="fixed inset-0 !m-0 z-[300] bg-slate-900/65 backdrop-blur-sm overflow-y-auto flex items-start justify-center p-4 sm:p-6">
            <div className="bg-card rounded-3xl border border-line-2 max-w-xl w-full p-6 sm:p-8 shadow-2xl space-y-5 my-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display font-extrabold text-xl text-ink">
                    Создать открытое сообщество
                  </h3>
                  <p className="text-xs text-muted mt-0.5">
                    Обычный участник может создать сообщество по интересам, приглашать участников и проводить мероприятия от имени сообщества
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCreateCommunity(false)}
                  className="p-2 rounded-xl hover:bg-surface text-muted"
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
                    <label className="block text-xs font-bold text-ink mb-1">
                      Название сообщества *
                    </label>
                    <input
                      type="text"
                      required
                      minLength={3}
                      value={commName}
                      onChange={(e) => setCommName(e.target.value)}
                      placeholder="Например: Утренний бег в Парке Горького"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-line-2 bg-card text-sm text-ink"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-ink mb-1">Город / Регион *</label>
                    <RegionSelect value={commCity} onChange={setCommCity} />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink mb-1">
                    Описание сообщества и расписания сборов *
                  </label>
                  <textarea
                    rows={3}
                    required
                    minLength={10}
                    value={commDesc}
                    onChange={(e) => setCommDesc(e.target.value)}
                    placeholder="Расскажите, кого вы объединяете, где и как проходят совместные тренировки..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-line-2 bg-card text-sm text-ink"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-ink mb-1">
                      Публичные контакты (необязательно)
                    </label>
                    <input
                      type="text"
                      value={commPublicContacts}
                      onChange={(e) => setCommPublicContacts(e.target.value)}
                      placeholder="Чат или контакт координатора"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-line-2 bg-card text-sm text-ink"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-ink mb-1">
                      Ссылка на группу ВК / чат (необязательно)
                    </label>
                    <input
                      type="url"
                      value={commSocialUrl}
                      onChange={(e) => setCommSocialUrl(e.target.value)}
                      placeholder="https://vk.com/..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-line-2 bg-card text-sm text-ink"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink mb-1.5">
                    Виды спорта сообщества
                  </label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {sports.map((s) => (
                      <button
                        type="button"
                        key={s.id}
                        onClick={() => toggleCommSport(s.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                          commSportIds.includes(s.id)
                            ? 'bg-brand text-white'
                            : 'bg-surface text-ink hover:bg-surface-2'
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
                    className="w-full px-3.5 py-2 rounded-xl border border-line-2 bg-card text-xs text-ink"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-line">
                  <button
                    type="button"
                    onClick={() => setShowCreateCommunity(false)}
                    className="px-4 py-2.5 rounded-xl border border-line-2 text-xs font-bold text-ink cursor-pointer"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    disabled={creatingComm}
                    className="px-5 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-bold shadow-sm cursor-pointer"
                  >
                    {creatingComm ? 'Создание...' : 'Создать сообщество'}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export const OrganizationPublicPage: React.FC = () => {
  const { orgId } = useParams<{ orgId: string }>();
  const { user, refreshMe } = useAuth();
  const navigate = useNavigate();

  const [org, setOrg] = useState<OrganizationDto | null>(null);
  const [events, setEvents] = useState<EventCardDto[]>([]);
  const [members, setMembers] = useState<OrganizationMemberDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roleFeedback, setRoleFeedback] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
      setError(err instanceof ApiError ? err.message : 'Не удалось загрузить страницу');
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

  const handleDeleteOrganization = async () => {
    if (!org) return;
    setDeleting(true);
    setError(null);
    try {
      const isComm = org.orgType === 'COMMUNITY';
      await apiFetch(`/api/v1/organizations/${org.id}`, { method: 'DELETE' });
      await refreshMe();
      navigate(isComm ? '/communities' : '/organizations');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось удалить объединение');
      setDeleting(false);
    }
  };

  if (loading) return <div className="h-80 rounded-3xl bg-surface animate-pulse" />;

  if (error || !org) {
    return (
      <div className="bg-card rounded-3xl border border-line-2 p-10 text-center space-y-3">
        <div className="font-display font-bold text-lg text-ink">
          {error || 'Страница не найдена'}
        </div>
        <div className="flex justify-center gap-2">
          <Link to="/communities" className="px-4 py-2 rounded-xl bg-brand text-white text-xs font-bold">
            К сообществам
          </Link>
          <Link to="/organizations" className="px-4 py-2 rounded-xl bg-surface text-ink text-xs font-bold">
            К организациям
          </Link>
        </div>
      </div>
    );
  }

  const isCommunity = org.orgType === 'COMMUNITY';
  const statusInfo = ORG_STATUS_LABELS[org.status] || { label: org.status, color: 'bg-slate-100 text-slate-700' };
  const canManage = Boolean(org.managedByViewer) || (user != null && user.id === org.ownerUserId);
  const isOwner = Boolean(
    user && (user.id === org.ownerUserId || org.viewerMemberRole === 'OWNER' || user.globalRole === 'ADMIN')
  );

  // Для обезличенной официальной организации скрываем технический аккаунт организации из списка подписчиков
  const visibleMembers = isCommunity
    ? members
    : members.filter((m) => m.userId !== org.ownerUserId);

  return (
    <div className="space-y-8 pb-16">
      <div className="bg-card rounded-3xl border border-line-2 p-6 sm:p-9 shadow-xs space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusInfo.color}`}>
              <BadgeCheck className="w-4 h-4" />
              <span>{isCommunity ? 'Открытое сообщество' : statusInfo.label}</span>
            </span>
            <span className="px-3 py-1 rounded-full bg-surface text-ink text-xs font-semibold">
              {ORG_TYPE_LABELS[org.orgType] || org.orgType}
            </span>
            {canManage && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-brand-tint text-brand-ink border border-brand-line text-xs font-bold">
                <Crown className="w-3.5 h-3.5" />
                <span>{isCommunity ? 'Вы управляете сообществом' : 'Аккаунт организации'}</span>
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {user && org.status === 'APPROVED' && !( !isCommunity && user.id === org.ownerUserId ) && (
              <button
                type="button"
                onClick={handleToggleSubscribe}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  org.subscribedByViewer
                    ? 'bg-brand-tint text-brand-ink border border-brand-line'
                    : 'bg-brand text-white hover:bg-brand-hover'
                }`}
              >
                <Bell className="w-3.5 h-3.5" />
                <span>
                  {org.subscribedByViewer
                    ? isCommunity
                      ? `Вы участник сообщества (${org.subscribersCount})`
                      : `Вы подписаны (${org.subscribersCount})`
                    : isCommunity
                    ? `Вступить в сообщество (${org.subscribersCount})`
                    : `Подписаться на организацию (${org.subscribersCount})`}
                </span>
              </button>
            )}

            {canManage && org.status === 'APPROVED' && (
              <Link
                to={`/my-organization?orgId=${org.id}`}
                className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-surface hover:bg-surface-2 text-ink text-xs font-bold"
              >
                <span>Настройки {isCommunity ? 'сообщества' : 'организации'}</span>
              </Link>
            )}

            {isOwner && !confirmDelete && (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isCommunity ? 'Удалить сообщество' : 'Удалить организацию'}</span>
              </button>
            )}

            {isOwner && confirmDelete && (
              <div className="inline-flex flex-wrap items-center gap-1.5 p-1.5 rounded-xl bg-rose-50 border border-rose-200">
                <span className="text-xs font-bold text-rose-900 px-1.5">Удалить навсегда?</span>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={handleDeleteOrganization}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold cursor-pointer"
                >
                  {deleting ? 'Удаление...' : 'Да, удалить'}
                </button>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={() => setConfirmDelete(false)}
                  className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  Отмена
                </button>
              </div>
            )}

            {user && !isOwner && (
              <Link
                to={`/support?targetType=ORGANIZATION&targetId=${org.id}&subject=${encodeURIComponent(
                  (isCommunity ? 'Обращение по сообществу: ' : 'Обращение по организации: ') + org.name
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
          <h1 className="font-display font-extrabold text-2xl sm:text-4xl text-ink">{org.name}</h1>
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted mt-2">
            <span className="inline-flex items-center gap-1 font-semibold text-ink">
              <MapPin className="w-4 h-4 text-brand" />
              {org.city}
            </span>
            <span>•</span>
            {isCommunity ? (
              <Link to={`/users/${org.ownerUserId}`} className="hover:text-brand-ink font-medium">
                Основатель сообщества: {org.representativeName}
              </Link>
            ) : (
              <span className="font-medium text-muted">
                Официальный профиль спортивной организации
              </span>
            )}
          </div>
        </div>

        <p className="text-ink/90 text-sm sm:text-base whitespace-pre-line leading-relaxed">
          {org.description}
        </p>

        <div className="flex flex-wrap gap-2">
          {org.sports.map((s) => (
            <span
              key={s.id}
              className="px-3 py-1 rounded-xl bg-brand-tint text-brand-ink border border-brand-line text-xs font-bold"
            >
              {s.name}
            </span>
          ))}
        </div>

        {/* Public Contacts & Links */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-surface/60 border border-line text-xs">
          <div>
            <div className="font-bold text-ink mb-0.5">Публичные контакты</div>
            <div className="text-muted">{org.publicContacts || 'Связь через обсуждения мероприятий'}</div>
          </div>
          {org.websiteUrl && (
            <div>
              <div className="font-bold text-ink mb-0.5">Официальный сайт</div>
              <a
                href={org.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-ink hover:underline inline-flex items-center gap-1 break-all"
              >
                <Globe className="w-3.5 h-3.5 shrink-0" />
                <span>{org.websiteUrl}</span>
              </a>
            </div>
          )}
          {org.socialUrl && (
            <div>
              <div className="font-bold text-ink mb-0.5">Страница в соцсетях</div>
              <a
                href={org.socialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-ink hover:underline inline-flex items-center gap-1 break-all"
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
          <h2 className="font-display font-extrabold text-xl text-ink">
            Мероприятия {isCommunity ? 'сообщества' : 'организации'} ({events.length})
          </h2>
          {canManage && org.status === 'APPROVED' && (
            <Link
              to={`/events/new?orgId=${org.id}`}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-bold shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>
                Создать мероприятие от {isCommunity ? 'сообщества' : 'организации'}
              </span>
            </Link>
          )}
        </div>

        {events.length === 0 ? (
          <div className="bg-card rounded-2xl border border-line-2 p-8 text-center text-xs text-muted">
            Пока нет опубликованных мероприятий.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {events.map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        )}
      </section>

      {/* MEMBERS / SUBSCRIBERS SECTION */}
      <section className="bg-card rounded-3xl border border-line-2 p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-display font-extrabold text-lg text-ink flex items-center gap-2">
              <Users className="w-5 h-5 text-brand" />
              <span>
                {isCommunity
                  ? `Участники и команда сообщества (${visibleMembers.length})`
                  : `Подписчики организации (${visibleMembers.length})`}
              </span>
            </h2>
            <p className="text-xs text-muted mt-0.5">
              {isCommunity
                ? 'Создатель и назначенные администраторы могут публиковать мероприятия от имени сообщества'
                : 'Участники платформы, подписанные на расписание и анонсы организации'}
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

        {visibleMembers.length === 0 ? (
          <div className="text-xs text-muted py-4">
            {isCommunity ? 'В сообществе пока нет участников.' : 'На организацию пока никто не подписан.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {visibleMembers.map((m) => {
              const isCreator =
                m.userId === org.ownerUserId || m.role === 'OWNER' || String(m.role) === 'CREATOR';
              const isAdminRole = m.role === 'ADMIN';
              return (
                <div
                  key={m.userId}
                  className="p-3.5 rounded-2xl border border-line bg-surface/50 flex items-center justify-between gap-2"
                >
                  <Link to={`/users/${m.userId}`} className="flex items-center gap-2.5 min-w-0">
                    {m.avatarUrl ? (
                      <img
                        src={m.avatarUrl}
                        alt={m.displayName}
                        className="w-9 h-9 rounded-full object-cover border border-line-2 shrink-0"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-brand text-white text-xs font-bold flex items-center justify-center shrink-0">
                        {m.displayName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-ink truncate hover:text-brand-ink">
                        {m.displayName}
                      </div>
                      <div className="text-[11px] text-muted flex items-center gap-1.5">
                        <span>{m.city || 'Россия'}</span>
                        {isCommunity && isCreator ? (
                          <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-bold text-[10px]">
                            Создатель
                          </span>
                        ) : isCommunity && isAdminRole ? (
                          <span className="px-1.5 py-0.5 rounded bg-brand-tint text-brand-ink font-bold text-[10px]">
                            Админ
                          </span>
                        ) : (
                          <span className="text-[10px] text-muted">
                            {isCommunity ? 'Участник' : 'Подписчик'}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>

                  {isCommunity && canManage && !isCreator && (
                    <button
                      type="button"
                      onClick={() =>
                        handleChangeMemberRole(m.userId, isAdminRole ? 'MEMBER' : 'ADMIN')
                      }
                      className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold shrink-0 transition-colors cursor-pointer ${
                        isAdminRole
                          ? 'bg-surface-2 hover:bg-rose-100 text-ink hover:text-rose-800'
                          : 'bg-brand-tint hover:bg-brand text-brand-ink hover:text-white'
                      }`}
                    >
                      <Shield className="w-3 h-3 inline mr-1" />
                      {isAdminRole ? 'Разжаловать' : 'Сделать админом'}
                    </button>
                  )}
                </div>
              );
            })}
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
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
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
    setConfirmDelete(false);
    setName(o.name);
    setOrgType(o.orgType);
    setCity(o.city);
    setDescription(o.description);
    setRepresentativeName(o.representativeName || o.name);
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
      } else {
        setSelectedOrg(null);
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

  const handleDeleteCurrentOrg = async () => {
    if (!selectedOrg) return;
    setDeleting(true);
    setError(null);
    setFeedback(null);
    try {
      await apiFetch(`/api/v1/organizations/${selectedOrg.id}`, { method: 'DELETE' });
      await refreshMe();
      await loadMyOrgs();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось удалить объединение');
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const handleSaveAndResubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrg) return;
    setSaving(true);
    setFeedback(null);
    setError(null);
    try {
      const isComm = selectedOrg.orgType === 'COMMUNITY';
      const updated = await apiFetch<OrganizationDto>(`/api/v1/organizations/${selectedOrg.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name,
          orgType: isComm ? 'COMMUNITY' : orgType,
          city,
          description,
          representativeName: isComm ? representativeName : name,
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
          : 'Данные успешно обновлены!'
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось сохранить изменения');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="h-80 rounded-3xl bg-surface animate-pulse" />;

  if (!selectedOrg) {
    return (
      <div className="bg-card rounded-3xl border border-line-2 p-10 text-center space-y-3">
        <div className="font-display font-bold text-lg text-ink">
          У вас пока нет управляемых организаций или сообществ
        </div>
        <p className="text-xs text-muted">
          Обычные участники могут создать открытое сообщество в разделе «Сообщества».
        </p>
        <div className="flex justify-center gap-2">
          <Link
            to="/communities"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand text-white text-xs font-bold"
          >
            Перейти в «Сообщества»
          </Link>
          <Link
            to="/organizations"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface text-ink text-xs font-bold"
          >
            Перейти в «Организации»
          </Link>
        </div>
      </div>
    );
  }

  const isSelectedCommunity = selectedOrg.orgType === 'COMMUNITY';
  const statusMeta = ORG_STATUS_LABELS[selectedOrg.status] || {
    label: selectedOrg.status,
    color: 'bg-slate-100 text-slate-700',
  };

  return (
    <div className="space-y-8 pb-16">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-ink">
            {isSelectedCommunity ? 'Управление сообществом' : 'Кабинет спортивной организации'}
          </h1>
          <p className="text-sm text-muted">
            {isSelectedCommunity
              ? 'Редактирование описания сообщества и публикация совместных тренировок'
              : 'Управление обезличенным профилем организации, статус модерации и публикация мероприятий'}
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

        <div className="flex flex-wrap items-center gap-2">
          {selectedOrg.status === 'APPROVED' && (
            <>
              <Link
                to={`/organizations/${selectedOrg.id}`}
                className="px-4 py-2.5 rounded-xl border border-line-2 text-xs font-bold text-ink bg-card"
              >
                Открыть публичную страницу
              </Link>
              <Link
                to={`/events/new?orgId=${selectedOrg.id}`}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand text-white text-xs font-bold shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Опубликовать мероприятие</span>
              </Link>
            </>
          )}

          {!confirmDelete ? (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isSelectedCommunity ? 'Удалить сообщество' : 'Удалить организацию'}</span>
            </button>
          ) : (
            <div className="inline-flex items-center gap-1.5 p-1.5 rounded-xl bg-rose-50 border border-rose-200">
              <span className="text-xs font-bold text-rose-900 px-1.5">Удалить?</span>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteCurrentOrg}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold cursor-pointer"
              >
                {deleting ? '...' : 'Да'}
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={() => setConfirmDelete(false)}
                className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Отмена
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Status Alert Banner */}
      <div className="bg-card rounded-3xl border border-line-2 p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className={`px-3.5 py-1 rounded-full text-xs font-bold border ${statusMeta.color}`}>
              {statusMeta.label}
            </span>
            <span className="text-xs font-semibold text-muted">
              Версия анкеты: #{selectedOrg.submissionVersion}
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
              {isSelectedCommunity
                ? 'Сообщество активно! Вы и назначенные администраторы можете публиковать разовые и регулярные сборы.'
                : 'Организация активна! Вы можете публиковать разовые и регулярные мероприятия от имени организации.'}
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
          className="lg:col-span-2 bg-card rounded-3xl border border-line-2 p-6 sm:p-8 shadow-xs space-y-4"
        >
          <h2 className="font-display font-bold text-lg text-ink">
            {isSelectedCommunity ? 'Сведения о сообществе' : 'Официальные сведения об организации'}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-ink mb-1">
                {isSelectedCommunity ? 'Название сообщества *' : 'Название организации *'}
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-line-2 bg-card text-sm text-ink"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-ink mb-1">Город / регион *</label>
              <RegionSelect value={city} onChange={setCity} />
            </div>
          </div>

          {!isSelectedCommunity && (
            <div>
              <label className="block text-xs font-bold text-ink mb-1">Тип организации *</label>
              <CustomSelect
                value={orgType}
                onChange={setOrgType}
                options={Object.entries(ORG_TYPE_LABELS)
                  .filter(([k]) => k !== 'COMMUNITY')
                  .map(([k, v]) => ({
                    value: k,
                    label: v,
                  }))}
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-ink mb-1">Описание деятельности *</label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-line-2 bg-card text-sm text-ink"
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
