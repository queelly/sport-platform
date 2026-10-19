import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Check,
  Flag,
  MapPin,
  Search,
  Sparkles,
  UserCheck,
  UserMinus,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { apiFetch, ApiError, SKILL_LABELS, uploadAttachmentFile } from '../api';
import { useAuth } from '../AuthContext';
import {
  EventCardDto,
  FriendshipDto,
  PublicUserProfileDto,
  SportInterestItemDto,
} from '../types';
import { EventCard } from '../components/EventCard';

export const MyProfilePage: React.FC = () => {
  const { user, sports, refreshMe } = useAuth();
  const [organizedEvents, setOrganizedEvents] = useState<EventCardDto[]>([]);
  const [participatingEvents, setParticipatingEvents] = useState<EventCardDto[]>([]);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Editable fields
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [city, setCity] = useState(user?.city || '');
  const [district, setDistrict] = useState(user?.district || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [preferredFormats, setPreferredFormats] = useState(user?.preferredFormats || '');
  const [preferredSchedule, setPreferredSchedule] = useState(user?.preferredSchedule || '');
  const [showInPartnerSearch, setShowInPartnerSearch] = useState(user?.showInPartnerSearch ?? true);
  const [showUpcomingEvents, setShowUpcomingEvents] = useState<'ALL' | 'FRIENDS_ONLY' | 'NONE'>(
    user?.showUpcomingEvents || 'ALL'
  );
  const [showFriendsList, setShowFriendsList] = useState<'ALL' | 'FRIENDS_ONLY' | 'NONE'>(
    user?.showFriendsList || 'ALL'
  );
  const [notifyInApp, setNotifyInApp] = useState(user?.notifyInApp ?? true);
  const [notifyVk, setNotifyVk] = useState(user?.notifyVk ?? true);
  const [avatarAttachmentId, setAvatarAttachmentId] = useState<string | undefined>(undefined);
  const [interests, setInterests] = useState<SportInterestItemDto[]>(user?.sportInterests || []);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName);
      setCity(user.city || '');
      setDistrict(user.district || '');
      setBio(user.bio || '');
      setPreferredFormats(user.preferredFormats || '');
      setPreferredSchedule(user.preferredSchedule || '');
      setShowInPartnerSearch(user.showInPartnerSearch);
      setShowUpcomingEvents(user.showUpcomingEvents);
      setShowFriendsList(user.showFriendsList);
      setNotifyInApp(user.notifyInApp);
      setNotifyVk(user.notifyVk);
      setInterests(user.sportInterests || []);
    }
  }, [user]);

  useEffect(() => {
    (async () => {
      try {
        const [orgEvs, partEvs] = await Promise.all([
          apiFetch<EventCardDto[]>('/api/v1/events/my/organized'),
          apiFetch<EventCardDto[]>('/api/v1/events/my/participations'),
        ]);
        setOrganizedEvents(orgEvs);
        setParticipatingEvents(partEvs);
      } catch {
        // ignore
      }
    })();
  }, []);

  const toggleSportInterest = (sportId: string, sportName: string) => {
    setInterests((prev) => {
      const exists = prev.find((x) => x.sportId === sportId);
      if (exists) {
        return prev.filter((x) => x.sportId !== sportId);
      }
      return [
        ...prev,
        {
          sportId,
          sportName,
          skillLevel: 'AMATEUR',
          primarySport: prev.length === 0,
          wantToTryNew: false,
          note: '',
        },
      ];
    });
  };

  const updateInterestLevel = (
    sportId: string,
    skillLevel: SportInterestItemDto['skillLevel']
  ) => {
    setInterests((prev) =>
      prev.map((x) => (x.sportId === sportId ? { ...x, skillLevel } : x))
    );
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const uploaded = await uploadAttachmentFile(file, 'AVATAR');
      setAvatarAttachmentId(uploaded.id);
      setFeedback('Аватар загружен! Нажмите «Сохранить профиль», чтобы применить.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось загрузить аватар');
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    setError(null);
    try {
      await apiFetch('/api/v1/profile/me', {
        method: 'PUT',
        body: JSON.stringify({
          displayName,
          city,
          district,
          bio,
          avatarAttachmentId,
          preferredFormats,
          preferredSchedule,
          showInPartnerSearch,
          showUpcomingEvents,
          showFriendsList,
          notifyInApp,
          notifyVk,
          sportInterests: interests,
        }),
      });
      await refreshMe();
      setFeedback('Профиль, спортивные интересы и настройки приватности успешно сохранены!');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Ошибка сохранения профиля');
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-10 pb-16">
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-9 shadow-sm space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.displayName}
                className="w-16 h-16 rounded-2xl object-cover border border-slate-200"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white font-display font-extrabold text-2xl flex items-center justify-center">
                {user.displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="font-display font-extrabold text-2xl text-slate-900">
                {user.displayName}
              </h1>
              <div className="text-xs text-slate-500">
                {user.email} • Роль: {user.globalRole === 'ADMIN' ? 'Администратор' : 'Участник / Организатор личных встреч'}
              </div>
              <label className="inline-block mt-1.5 cursor-pointer text-xs font-bold text-blue-600 hover:underline">
                <span>Загрузить фото профиля</span>
                <input type="file" accept=".jpg,.jpeg,.png,.webp" onChange={handleAvatarUpload} className="hidden" />
              </label>
            </div>
          </div>

          <div className="flex gap-2">
            <Link
              to="/notifications"
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold"
            >
              Настройки VK-бота и уведомлений
            </Link>
            <Link
              to="/events/new"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
            >
              Создать своё мероприятие
            </Link>
          </div>
        </div>

        {feedback && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-900">
            {feedback}
          </div>
        )}
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Отображаемое имя *</label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Город</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Район / метро</label>
              <input
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="Например: Хамовники"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">О себе и спортивном опыте</label>
            <textarea
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Расскажите о своих спортивных целях и любимых дисциплинах..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Предпочтительный формат занятий</label>
              <input
                type="text"
                value={preferredFormats}
                onChange={(e) => setPreferredFormats(e.target.value)}
                placeholder="Спарринги, командные игры 5x5, пробежки..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Удобные дни и время</label>
              <input
                type="text"
                value={preferredSchedule}
                onChange={(e) => setPreferredSchedule(e.target.value)}
                placeholder="Будни после 19:00, суббота утро"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>
          </div>

          {/* Sport interests */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-800">
              Мои спортивные интересы и уровень подготовки (используются для поиска партнёров)
            </label>
            <div className="flex flex-wrap gap-2">
              {sports.map((s) => {
                const active = interests.some((i) => i.sportId === s.id);
                return (
                  <button
                    type="button"
                    key={s.id}
                    onClick={() => toggleSportInterest(s.id, s.name)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      active ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {s.name}
                  </button>
                );
              })}
            </div>

            {interests.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {interests.map((item) => (
                  <div
                    key={item.sportId}
                    className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2 text-xs"
                  >
                    <span className="font-bold text-slate-900">{item.sportName}</span>
                    <select
                      value={item.skillLevel}
                      onChange={(e) =>
                        updateInterestLevel(
                          item.sportId,
                          e.target.value as SportInterestItemDto['skillLevel']
                        )
                      }
                      className="px-2.5 py-1 rounded-lg border border-slate-300 bg-white font-semibold"
                    >
                      {Object.entries(SKILL_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Privacy settings */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
            <div className="font-display font-bold text-sm text-slate-900">
              Настройки приватности и уведомлений
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showInPartnerSearch}
                  onChange={(e) => setShowInPartnerSearch(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600"
                />
                <span className="font-medium text-slate-800">Показывать меня в поиске спортивных партнёров</span>
              </label>

              <div>
                <span className="block font-bold text-slate-600 mb-1">Кто видит мои будущие записи:</span>
                <select
                  value={showUpcomingEvents}
                  onChange={(e) => setShowUpcomingEvents(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                >
                  <option value="ALL">Все пользователи</option>
                  <option value="FRIENDS_ONLY">Только мои знакомые</option>
                  <option value="NONE">Только я</option>
                </select>
              </div>

              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyVk}
                  onChange={(e) => setNotifyVk(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600"
                />
                <span className="font-medium text-slate-800">Разрешить отправку уведомлений в VK-бот</span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-display font-bold text-sm shadow-md shadow-blue-600/20"
          >
            {saving ? 'Сохранение...' : 'Сохранить профиль и настройки'}
          </button>
        </form>
      </div>

      {/* My Participations & Organized Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="space-y-4">
          <h2 className="font-display font-extrabold text-xl text-slate-900">
            Мои записи и заявки на участие ({participatingEvents.length})
          </h2>
          {participatingEvents.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 text-xs text-slate-500">
              Вы ещё не записались ни на одно мероприятие.
            </div>
          ) : (
            <div className="space-y-4">
              {participatingEvents.map((e) => (
                <EventCard key={e.id} event={e} />
              ))}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <h2 className="font-display font-extrabold text-xl text-slate-900">
            Мероприятия, которые я организую ({organizedEvents.length})
          </h2>
          {organizedEvents.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 text-xs text-slate-500">
              Вы ещё не создавали собственных мероприятий.
            </div>
          ) : (
            <div className="space-y-4">
              {organizedEvents.map((e) => (
                <EventCard key={e.id} event={e} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export const PublicUserProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<PublicUserProfileDto | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const p = await apiFetch<PublicUserProfileDto>(`/api/v1/users/${userId}`);
      setProfile(p);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const handleSendFriendRequest = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!profile) return;
    try {
      await apiFetch('/api/v1/friends/requests', {
        method: 'POST',
        body: JSON.stringify({
          targetUserId: profile.id,
          message: 'Привет! Увидел твой спортивный профиль, давай заниматься вместе!',
        }),
      });
      await loadProfile();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Не удалось отправить запрос');
    }
  };

  const handleRespondFriend = async (accept: boolean) => {
    if (!profile?.friendshipIdWithViewer) return;
    try {
      await apiFetch(`/api/v1/friends/${profile.friendshipIdWithViewer}/respond?accept=${accept}`, {
        method: 'POST',
      });
      await loadProfile();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Ошибка');
    }
  };

  if (loading) return <div className="h-80 rounded-3xl bg-slate-200 animate-pulse" />;
  if (!profile) return <div className="p-8 text-center">Профиль не найден</div>;

  return (
    <div className="space-y-8 pb-16">
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-9 shadow-sm space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white font-display font-extrabold text-2xl flex items-center justify-center">
              {profile.displayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900">
                {profile.displayName}
              </h1>
              <div className="flex items-center gap-2 text-xs text-slate-600 mt-1">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                <span>
                  {profile.city || 'Город не указан'}
                  {profile.district ? `, ${profile.district}` : ''}
                </span>
                <span>•</span>
                <span>Знакомых: {profile.friendsCount}</span>
              </div>
            </div>
          </div>

          {user && user.id !== profile.id && (
            <div className="flex flex-wrap items-center gap-2">
              {profile.friendshipStatusWithViewer === 'NONE' && (
                <button
                  onClick={handleSendFriendRequest}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Добавить в спортивные знакомые</span>
                </button>
              )}
              {profile.friendshipStatusWithViewer === 'ACCEPTED' && (
                <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-100 text-emerald-900 text-xs font-bold">
                  <UserCheck className="w-4 h-4" />
                  <span>Ваш спортивный знакомый</span>
                </span>
              )}
              {profile.friendshipStatusWithViewer === 'PENDING' &&
                (profile.friendshipIncomingForViewer ? (
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleRespondFriend(true)}
                      className="px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold"
                    >
                      Принять запрос
                    </button>
                    <button
                      onClick={() => handleRespondFriend(false)}
                      className="px-3 py-2 rounded-xl bg-rose-100 text-rose-800 text-xs font-bold"
                    >
                      Отклонить
                    </button>
                  </div>
                ) : (
                  <span className="px-4 py-2 rounded-xl bg-amber-100 text-amber-900 text-xs font-bold">
                    Запрос на знакомство отправлен
                  </span>
                ))}

              <Link
                to={`/support?targetType=USER&targetId=${profile.id}&subject=${encodeURIComponent(
                  'Жалоба на пользователя: ' + profile.displayName
                )}`}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold"
              >
                <Flag className="w-3.5 h-3.5" />
                <span>Пожаловаться</span>
              </Link>
            </div>
          )}
        </div>

        {profile.bio && <p className="text-sm text-slate-700">{profile.bio}</p>}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 text-xs">
          <div>
            <span className="font-bold text-slate-900 block">Предпочтительный формат:</span>
            <span className="text-slate-700">{profile.preferredFormats || 'Любые совместные тренировки'}</span>
          </div>
          <div>
            <span className="font-bold text-slate-900 block">Удобное время занятий:</span>
            <span className="text-slate-700">{profile.preferredSchedule || 'По договорённости'}</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-xs font-bold text-slate-500 uppercase">Спортивные интересы</div>
          <div className="flex flex-wrap gap-2">
            {profile.sportInterests.map((si) => (
              <span
                key={si.sportId}
                className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-800 border border-blue-200 text-xs font-bold"
              >
                {si.sportName} • {SKILL_LABELS[si.skillLevel] || si.skillLevel}
              </span>
            ))}
          </div>
        </div>
      </div>

      <section className="space-y-4">
        <h2 className="font-display font-extrabold text-xl text-slate-900">
          Мероприятия этого организатора ({profile.organizedEvents.length})
        </h2>
        {profile.organizedEvents.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 text-xs text-slate-500">
            Пока нет активных опубликованных мероприятий.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {profile.organizedEvents.map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export const PartnersAndFriendsPage: React.FC = () => {
  const { user, sports } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState<'PARTNERS' | 'FRIENDS'>('PARTNERS');
  const [partners, setPartners] = useState<PublicUserProfileDto[]>([]);
  const [friendships, setFriendships] = useState<FriendshipDto[]>([]);
  const [loading, setLoading] = useState(true);

  // Partner search filters
  const [sportId, setSportId] = useState('');
  const [city, setCity] = useState('');
  const [skillLevel, setSkillLevel] = useState('');
  const [q, setQ] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (sportId) params.set('sportId', sportId);
      if (city.trim()) params.set('city', city.trim());
      if (skillLevel) params.set('skillLevel', skillLevel);
      if (q.trim()) params.set('q', q.trim());

      const pList = await apiFetch<PublicUserProfileDto[]>(`/api/v1/partners/search?${params.toString()}`);
      setPartners(pList);

      if (user) {
        const fList = await apiFetch<FriendshipDto[]>('/api/v1/friends');
        setFriendships(fList);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [sportId, skillLevel, user]);

  const handleSendFriendRequest = async (targetUserId: string) => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      await apiFetch('/api/v1/friends/requests', {
        method: 'POST',
        body: JSON.stringify({
          targetUserId,
          message: 'Привет! Нашёл тебя в поиске спортивных партнёров, давай тренироваться вместе!',
        }),
      });
      await loadData();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Ошибка отправки запроса');
    }
  };

  const handleRespond = async (friendshipId: string, accept: boolean) => {
    try {
      await apiFetch(`/api/v1/friends/${friendshipId}/respond?accept=${accept}`, {
        method: 'POST',
      });
      await loadData();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Ошибка');
    }
  };

  const handleRemoveOrCancel = async (friendshipId: string) => {
    try {
      await apiFetch(`/api/v1/friends/${friendshipId}`, { method: 'DELETE' });
      await loadData();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Ошибка');
    }
  };

  const incomingRequests = friendships.filter((f) => f.status === 'PENDING' && f.incoming);
  const outgoingRequests = friendships.filter((f) => f.status === 'PENDING' && !f.incoming);
  const acceptedFriends = friendships.filter((f) => f.status === 'ACCEPTED');

  return (
    <div className="space-y-8 pb-16">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900">
            Поиск спортивных партнёров и Мои знакомые
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Находите напарников по интересующим дисциплинам и поддерживайте постоянные спортивные связи
          </p>
        </div>

        <div className="flex gap-2 p-1 rounded-2xl bg-slate-200/80">
          <button
            onClick={() => setTab('PARTNERS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              tab === 'PARTNERS' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-700'
            }`}
          >
            Поиск спортивных партнёров ({partners.length})
          </button>
          <button
            onClick={() => setTab('FRIENDS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              tab === 'FRIENDS' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-700'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Мои знакомые ({acceptedFriends.length})</span>
            {incomingRequests.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-rose-600 text-white text-[10px]">
                +{incomingRequests.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {tab === 'PARTNERS' ? (
        <div className="space-y-6">
          {/* Search filters */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadData()}
                placeholder="Имя или интересы..."
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm"
              />
            </div>

            <select
              value={sportId}
              onChange={(e) => setSportId(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
            >
              <option value="">Любой вид спорта</option>
              {sports.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            <select
              value={skillLevel}
              onChange={(e) => setSkillLevel(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
            >
              <option value="">Любой уровень</option>
              {Object.entries(SKILL_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>

            <div className="flex gap-2">
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Город..."
                className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 text-sm"
              />
              <button
                onClick={loadData}
                className="px-4 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold"
              >
                Найти
              </button>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[1, 2].map((n) => (
                <div key={n} className="h-48 rounded-2xl bg-slate-200 animate-pulse" />
              ))}
            </div>
          ) : partners.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-sm text-slate-600">
              Спортсменов по заданным критериям не найдено. Попробуйте сбросить фильтр.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {partners.map((p) => (
                <div
                  key={p.id}
                  className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <Link to={`/users/${p.id}`} className="flex items-center gap-3 group">
                        <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white font-display font-bold text-lg flex items-center justify-center">
                          {p.displayName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-display font-bold text-base text-slate-900 group-hover:text-blue-600">
                            {p.displayName}
                          </div>
                          <div className="text-xs text-slate-500">
                            {p.city || 'Город не указан'}
                            {p.district ? ` • ${p.district}` : ''}
                          </div>
                        </div>
                      </Link>

                      {/* Match badges */}
                      {p.matchReasons && p.matchReasons.length > 0 && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
                          <Sparkles className="w-3 h-3" />
                          <span>{p.matchReasons[0]}</span>
                        </span>
                      )}
                    </div>

                    {p.bio && <p className="text-xs text-slate-600 line-clamp-2">{p.bio}</p>}

                    <div className="flex flex-wrap gap-1.5">
                      {p.sportInterests.map((si) => (
                        <span
                          key={si.sportId}
                          className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold"
                        >
                          {si.sportName} ({SKILL_LABELS[si.skillLevel] || si.skillLevel})
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <Link
                      to={`/users/${p.id}`}
                      className="text-xs font-bold text-slate-700 hover:text-blue-600"
                    >
                      Открыть профиль и активности →
                    </Link>

                    {p.friendshipStatusWithViewer === 'NONE' && (
                      <button
                        onClick={() => handleSendFriendRequest(p.id)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Добавить в знакомые</span>
                      </button>
                    )}
                    {p.friendshipStatusWithViewer === 'PENDING' && (
                      <span className="px-3 py-1.5 rounded-xl bg-amber-100 text-amber-800 text-xs font-bold">
                        Запрос в ожидании
                      </span>
                    )}
                    {p.friendshipStatusWithViewer === 'ACCEPTED' && (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold">
                        <UserCheck className="w-3.5 h-3.5" />
                        В знакомых
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : !user ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center space-y-3">
          <div className="font-display font-bold text-lg">Войдите в аккаунт для управления списком знакомых</div>
          <Link to="/login" className="inline-block px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold">
            Войти
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Incoming Friend Requests */}
          {incomingRequests.length > 0 && (
            <section className="space-y-3">
              <h2 className="font-display font-bold text-lg text-slate-900">
                Входящие запросы на знакомство ({incomingRequests.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {incomingRequests.map((f) => (
                  <div
                    key={f.id}
                    className="bg-amber-50/70 rounded-2xl border border-amber-200 p-5 flex items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <Link
                        to={`/users/${f.friendUserId}`}
                        className="font-display font-bold text-sm text-slate-900 hover:text-blue-600"
                      >
                        {f.friendDisplayName}
                      </Link>
                      {f.message && <p className="text-xs text-slate-600 italic">«{f.message}»</p>}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => handleRespond(f.id, true)}
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Принять</span>
                      </button>
                      <button
                        onClick={() => handleRespond(f.id, false)}
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-rose-100 text-rose-800 text-xs font-bold"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Отклонить</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Outgoing Friend Requests */}
          {outgoingRequests.length > 0 && (
            <section className="space-y-3">
              <h2 className="font-display font-bold text-base text-slate-700">
                Исходящие запросы в ожидании ({outgoingRequests.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {outgoingRequests.map((f) => (
                  <div
                    key={f.id}
                    className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center justify-between gap-3"
                  >
                    <div>
                      <Link
                        to={`/users/${f.friendUserId}`}
                        className="font-bold text-sm text-slate-900 hover:text-blue-600"
                      >
                        {f.friendDisplayName}
                      </Link>
                      <div className="text-xs text-slate-500">Ожидает подтверждения</div>
                    </div>
                    <button
                      onClick={() => handleRemoveOrCancel(f.id)}
                      className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      Отменить запрос
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Accepted Friends List */}
          <section className="space-y-3">
            <h2 className="font-display font-bold text-lg text-slate-900">
              Подтверждённые спортивные знакомые ({acceptedFriends.length})
            </h2>
            {acceptedFriends.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs text-slate-500">
                В вашем списке спортивных знакомых пока никого нет. Перейдите на вкладку «Поиск спортивных партнёров», чтобы найти единомышленников!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {acceptedFriends.map((f) => (
                  <div
                    key={f.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5">
                      <Link
                        to={`/users/${f.friendUserId}`}
                        className="font-display font-bold text-base text-slate-900 hover:text-blue-600"
                      >
                        {f.friendDisplayName}
                      </Link>
                      <div className="text-xs text-slate-500">{f.friendCity || 'Москва'}</div>
                      <div className="flex flex-wrap gap-1">
                        {f.friendSports.map((s) => (
                          <span
                            key={s.sportId}
                            className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[11px] font-bold"
                          >
                            {s.sportName}
                          </span>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => handleRemoveOrCancel(f.id)}
                      title="Удалить из списка знакомых"
                      className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold"
                    >
                      <UserMinus className="w-3.5 h-3.5" />
                      <span>Удалить</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
};
