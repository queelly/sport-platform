import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Calendar,
  Check,
  Flame,
  Flag,
  Heart,
  MapPin,
  MessageCircle,
  Plus,
  Search,
  Send,
  SkipForward,
  Sparkles,
  UserCheck,
  UserMinus,
  UserPlus,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { apiFetch, ApiError, formatDateTime, SKILL_LABELS, uploadAttachmentFile } from '../api';
import { useAuth } from '../AuthContext';
import {
  DirectMessageDto,
  EventCardDto,
  FriendshipDto,
  PublicUserProfileDto,
  SportDto,
  SportInterestItemDto,
  UserSummaryDto,
} from '../types';
import { EventCard } from '../components/EventCard';
import { CustomSelect, RegionSelect, VoiceSearchButton } from '../components/UiControls';

/**
 * 1-on-1 Direct Messages Modal between accepted friends (#15)
 */
const DirectChatModal: React.FC<{
  friendUserId: string;
  friendDisplayName: string;
  onClose: () => void;
}> = ({ friendUserId, friendDisplayName, onClose }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<DirectMessageDto[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevLenRef = useRef<number>(0);

  const loadMessages = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const list = await apiFetch<DirectMessageDto[]>(`/api/v1/friends/${friendUserId}/messages`);
      setMessages(list);
    } catch (err) {
      if (!silent) {
        setError(err instanceof ApiError ? err.message : 'Не удалось загрузить переписку');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    prevLenRef.current = 0;
    loadMessages(false);
    const timer = setInterval(() => {
      loadMessages(true);
    }, 3000);
    return () => clearInterval(timer);
  }, [friendUserId]);

  // Smart scroll: only scroll to bottom on initial load or when user is near bottom (#16)
  useEffect(() => {
    if (messages.length > prevLenRef.current) {
      const isInitial = prevLenRef.current === 0;
      prevLenRef.current = messages.length;
      const el = containerRef.current;
      if (el) {
        const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 140;
        if (isInitial || isNearBottom) {
          setTimeout(() => {
            if (containerRef.current) {
              containerRef.current.scrollTop = containerRef.current.scrollHeight;
            }
          }, 40);
        }
      }
    }
  }, [messages.length]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    setError(null);
    try {
      const created = await apiFetch<DirectMessageDto>(`/api/v1/friends/${friendUserId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content: text.trim() }),
      });
      setMessages((prev) => [...prev, created]);
      setText('');
      setTimeout(() => {
        if (containerRef.current) {
          containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
      }, 40);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось отправить сообщение');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-5 sm:p-6 shadow-2xl flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
          <div>
            <div className="text-[11px] font-extrabold text-[#16B672] uppercase tracking-wider">
              Личные сообщения со знакомым
            </div>
            <h3 className="font-display font-extrabold text-lg text-slate-900">
              {friendDisplayName}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-800">
            {error}
          </div>
        )}

        <div
          ref={containerRef}
          className="flex-1 overflow-y-auto py-4 space-y-2.5 min-h-[260px] max-h-[420px] pr-1"
        >
          {loading ? (
            <div className="h-40 rounded-2xl bg-slate-100 animate-pulse" />
          ) : messages.length === 0 ? (
            <div className="p-8 rounded-2xl bg-[#F7FAF8] text-center text-xs text-slate-500">
              Сообщений пока нет. Договоритесь о совместной тренировке или времени встречи!
            </div>
          ) : (
            messages.map((m) => {
              const isMine = m.senderUserId === user?.id;
              return (
                <div
                  key={m.id}
                  className={`p-3.5 rounded-2xl text-xs space-y-1 max-w-[85%] ${
                    isMine
                      ? 'ml-auto bg-[#16B672] text-white'
                      : 'mr-auto bg-[#F4F8F6] text-slate-900 border border-slate-200/70'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-extrabold">
                      {isMine ? 'Вы' : m.senderDisplayName}
                    </span>
                    <span className={`text-[10px] ${isMine ? 'text-white/80' : 'text-slate-400'}`}>
                      {formatDateTime(m.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-line leading-relaxed">{m.content}</p>
                </div>
              );
            })
          )}
        </div>

        <form onSubmit={handleSend} className="pt-3 border-t border-slate-100 flex gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Напишите сообщение знакомому..."
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#16B672]"
          />
          <button
            type="submit"
            disabled={sending || !text.trim()}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#16B672] hover:bg-[#11995E] disabled:opacity-50 text-white font-display font-bold text-xs shadow-sm"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Отправить</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export const MyProfilePage: React.FC = () => {
  const { user, sports, refreshMe, refreshSports, updateCurrentUserSummary } = useAuth();
  const [organizedEvents, setOrganizedEvents] = useState<EventCardDto[]>([]);
  const [participatingEvents, setParticipatingEvents] = useState<EventCardDto[]>([]);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Editable fields
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [city, setCity] = useState(user?.city || 'Москва');
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

  // Add new sport directly inside profile (#15)
  const [showAddSportForm, setShowAddSportForm] = useState(false);
  const [newSportName, setNewSportName] = useState('');
  const [newSportCategory, setNewSportCategory] = useState('Индивидуальные и командные дисциплины');
  const [creatingSport, setCreatingSport] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName);
      setCity(user.city || 'Москва');
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

  const handleAddCustomSportInProfile = async () => {
    if (!newSportName.trim()) return;
    setCreatingSport(true);
    setError(null);
    try {
      const created = await apiFetch<SportDto>('/api/v1/sports', {
        method: 'POST',
        body: JSON.stringify({
          name: newSportName.trim(),
          category: newSportCategory.trim() || 'Пользовательские виды спорта',
          description: 'Добавлено участником из личного кабинета',
        }),
      });
      await refreshSports();
      setInterests((prev) => {
        if (prev.some((x) => x.sportId === created.id)) return prev;
        return [
          ...prev,
          {
            sportId: created.id,
            sportName: created.name,
            skillLevel: 'AMATEUR',
            primarySport: prev.length === 0,
            wantToTryNew: false,
            note: '',
          },
        ];
      });
      setNewSportName('');
      setShowAddSportForm(false);
      setFeedback(`Вид спорта «${created.name}» добавлен в каталог и в ваши интересы!`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось добавить вид спорта');
    } finally {
      setCreatingSport(false);
    }
  };

  // Immediate avatar save & Navbar update (#12)
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    try {
      const uploaded = await uploadAttachmentFile(file, 'AVATAR');
      setAvatarAttachmentId(uploaded.id);
      const updated = await apiFetch<UserSummaryDto>('/api/v1/profile/me', {
        method: 'PUT',
        body: JSON.stringify({
          displayName,
          city,
          district,
          bio,
          avatarAttachmentId: uploaded.id,
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
      updateCurrentUserSummary(updated);
      await refreshMe();
      setFeedback('Фото профиля обновлено! Изменения сразу отображены в шапке сайта и в вашей анкете.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось загрузить аватар');
    } finally {
      e.target.value = '';
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    setError(null);
    try {
      const updated = await apiFetch<UserSummaryDto>('/api/v1/profile/me', {
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
      updateCurrentUserSummary(updated);
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
                className="w-16 h-16 rounded-2xl object-cover border border-slate-200 shadow-sm"
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
                {user.email} • Роль:{' '}
                {user.globalRole === 'ADMIN'
                  ? 'Администратор'
                  : 'Участник / Организатор встреч и сообществ'}
              </div>
              <label className="inline-block mt-1.5 cursor-pointer text-xs font-bold text-blue-600 hover:underline">
                <span>Изменить фото профиля (применяется мгновенно)</span>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,.gif"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
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
              <label className="block text-xs font-bold text-slate-700 mb-1">Город / Регион</label>
              <RegionSelect value={city} onChange={setCity} />
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
              placeholder="Расскажите о своих спортивных целях, любимых дисциплинах и кого ищете для совместных тренировок..."
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

          {/* Sport interests + Add custom sport (#15) */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="block text-xs font-bold text-slate-800">
                Мои спортивные интересы и уровень подготовки (используются для Спорт-Мэтча и поиска партнёров)
              </label>
              <button
                type="button"
                onClick={() => setShowAddSportForm(!showAddSportForm)}
                className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{showAddSportForm ? 'Скрыть добавление' : 'Добавить новый вид спорта'}</span>
              </button>
            </div>

            {showAddSportForm && (
              <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200 flex flex-col sm:flex-row items-stretch sm:items-end gap-2.5">
                <div className="flex-1">
                  <label className="block text-[11px] font-bold text-blue-900 mb-1">
                    Название нового вида спорта *
                  </label>
                  <input
                    type="text"
                    value={newSportName}
                    onChange={(e) => setNewSportName(e.target.value)}
                    placeholder="Например: Сквош, Падел, Сапбординг, Боулдеринг..."
                    className="w-full px-3 py-2 rounded-xl border border-blue-300 text-xs bg-white"
                  />
                </div>
                <div className="sm:w-56">
                  <label className="block text-[11px] font-bold text-blue-900 mb-1">Категория</label>
                  <input
                    type="text"
                    value={newSportCategory}
                    onChange={(e) => setNewSportCategory(e.target.value)}
                    placeholder="Категория"
                    className="w-full px-3 py-2 rounded-xl border border-blue-300 text-xs bg-white"
                  />
                </div>
                <button
                  type="button"
                  disabled={creatingSport || !newSportName.trim()}
                  onClick={handleAddCustomSportInProfile}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold shrink-0"
                >
                  {creatingSport ? '...' : '+ Добавить'}
                </button>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {sports.map((s) => {
                const active = interests.some((i) => i.sportId === s.id);
                return (
                  <button
                    type="button"
                    key={s.id}
                    onClick={() => toggleSportInterest(s.id, s.name)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
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
                    <div className="w-44">
                      <CustomSelect
                        size="sm"
                        value={item.skillLevel}
                        onChange={(val) =>
                          updateInterestLevel(
                            item.sportId,
                            val as SportInterestItemDto['skillLevel']
                          )
                        }
                        options={Object.entries(SKILL_LABELS).map(([k, v]) => ({
                          value: k,
                          label: v,
                        }))}
                      />
                    </div>
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showInPartnerSearch}
                  onChange={(e) => setShowInPartnerSearch(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600"
                />
                <span className="font-medium text-slate-800">Показывать меня в Спорт-Мэтче и поиске партнёров</span>
              </label>

              <div>
                <span className="block font-bold text-slate-600 mb-1">Кто видит мои будущие записи:</span>
                <CustomSelect
                  size="sm"
                  value={showUpcomingEvents}
                  onChange={(v) => setShowUpcomingEvents(v as any)}
                  options={[
                    { value: 'ALL', label: 'Все пользователи' },
                    { value: 'FRIENDS_ONLY', label: 'Только мои знакомые' },
                    { value: 'NONE', label: 'Только я' },
                  ]}
                />
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
  const [inviteMessage, setInviteMessage] = useState('');
  const [showInviteInput, setShowInviteInput] = useState(false);
  const [showDirectChat, setShowDirectChat] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadProfile = async (silent = false) => {
    if (!userId) return;
    if (!silent) setLoading(true);
    try {
      const p = await apiFetch<PublicUserProfileDto>(`/api/v1/users/${userId}`);
      setProfile(p);
    } catch {
      // ignore
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile(false);
  }, [userId]);

  const handleSendFriendRequest = async (customMsg?: string) => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!profile) return;
    setActionError(null);
    try {
      await apiFetch('/api/v1/friends/requests', {
        method: 'POST',
        body: JSON.stringify({
          targetUserId: profile.id,
          message:
            customMsg?.trim() ||
            'Привет! Увидел твой спортивный профиль, давай заниматься вместе!',
        }),
      });
      setShowInviteInput(false);
      // Update state in-place without full page skeleton reload (#14)
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              friendshipStatusWithViewer: 'PENDING',
              friendshipIncomingForViewer: false,
            }
          : prev
      );
      await loadProfile(true);
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Не удалось отправить запрос');
    }
  };

  const handleRespondFriend = async (accept: boolean) => {
    if (!profile?.friendshipIdWithViewer) return;
    setActionError(null);
    try {
      await apiFetch(`/api/v1/friends/${profile.friendshipIdWithViewer}/respond?accept=${accept}`, {
        method: 'POST',
      });
      await loadProfile(true);
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Ошибка обработки запроса');
    }
  };

  if (loading) return <div className="h-80 rounded-3xl bg-slate-200 animate-pulse" />;
  if (!profile) return <div className="p-8 text-center">Профиль не найден</div>;

  const viewerSportIds = new Set((user?.sportInterests || []).map((s) => s.sportId));

  return (
    <div className="space-y-8 pb-16">
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-9 shadow-sm space-y-5">
        {actionError && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-800">
            {actionError}
          </div>
        )}

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.displayName}
                className="w-16 h-16 rounded-2xl object-cover border border-slate-200 shadow-sm"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white font-display font-extrabold text-2xl flex items-center justify-center">
                {profile.displayName.charAt(0).toUpperCase()}
              </div>
            )}
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
                <>
                  <button
                    type="button"
                    onClick={() => handleSendFriendRequest()}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Добавить в спортивные знакомые</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowInviteInput(!showInviteInput)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 text-xs font-bold"
                  >
                    <Zap className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Пригласить на тренировку</span>
                  </button>
                </>
              )}
              {profile.friendshipStatusWithViewer === 'ACCEPTED' && (
                <>
                  <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-100 text-emerald-900 text-xs font-bold">
                    <UserCheck className="w-4 h-4" />
                    <span>Ваш спортивный знакомый</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowDirectChat(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#16B672] hover:bg-[#11995E] text-white text-xs font-bold shadow-sm"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Написать сообщение</span>
                  </button>
                </>
              )}
              {profile.friendshipStatusWithViewer === 'PENDING' &&
                (profile.friendshipIncomingForViewer ? (
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleRespondFriend(true)}
                      className="px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold"
                    >
                      Принять запрос
                    </button>
                    <button
                      type="button"
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

        {showInviteInput && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={inviteMessage}
              onChange={(e) => setInviteMessage(e.target.value)}
              placeholder="Напишите предложение (например: Привет! Пойдём завтра в 19:00 на корт в Лужниках?)..."
              className="flex-1 px-3.5 py-2 rounded-xl border border-emerald-300 text-xs bg-white"
            />
            <button
              type="button"
              onClick={() => handleSendFriendRequest(inviteMessage)}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
            >
              Отправить приглашение
            </button>
          </div>
        )}

        {profile.matchReasons && profile.matchReasons.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {profile.matchReasons.map((r, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#E7F8F0] text-[#11995E] text-xs font-extrabold"
              >
                <Sparkles className="w-3 h-3" />
                <span>{r}</span>
              </span>
            ))}
          </div>
        )}

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
            {profile.sportInterests.map((si) => {
              const isCommon = viewerSportIds.has(si.sportId);
              return (
                <span
                  key={si.sportId}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold ${
                    isCommon
                      ? 'bg-[#E7F8F0] text-[#11995E] border-[#16B672]'
                      : 'bg-blue-50 text-blue-800 border-blue-200'
                  }`}
                >
                  {isCommon ? '🤝 Общий спорт: ' : ''}
                  {si.sportName} • {SKILL_LABELS[si.skillLevel] || si.skillLevel}
                </span>
              );
            })}
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

      {showDirectChat && (
        <DirectChatModal
          friendUserId={profile.id}
          friendDisplayName={profile.displayName}
          onClose={() => setShowDirectChat(false)}
        />
      )}
    </div>
  );
};

export const PartnersAndFriendsPage: React.FC = () => {
  const { user, sports } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState<'PARTNERS' | 'MATCH' | 'FRIENDS'>('PARTNERS');
  const [partners, setPartners] = useState<PublicUserProfileDto[]>([]);
  const [recommendedPartners, setRecommendedPartners] = useState<PublicUserProfileDto[]>([]);
  const [friendships, setFriendships] = useState<FriendshipDto[]>([]);
  const [loading, setLoading] = useState(true);

  // Partner search filters
  const [sportId, setSportId] = useState('');
  const [city, setCity] = useState('');
  const [skillLevel, setSkillLevel] = useState('');
  const [q, setQ] = useState('');

  // Sport-Match (Dating-style deck) state (#10)
  const [matchIndex, setMatchIndex] = useState(0);
  const [customInviteMsg, setCustomInviteMsg] = useState('');
  const [matchSentFeedback, setMatchSentFeedback] = useState<string | null>(null);

  // Active 1-on-1 Direct Chat Friend (#15)
  const [activeChatFriend, setActiveChatFriend] = useState<{
    userId: string;
    displayName: string;
  } | null>(null);

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const params = new URLSearchParams();
      if (sportId) params.set('sportId', sportId);
      if (city.trim()) params.set('city', city.trim());
      if (skillLevel) params.set('skillLevel', skillLevel);
      if (q.trim()) params.set('q', q.trim());

      const [pList, allPList] = await Promise.all([
        apiFetch<PublicUserProfileDto[]>(`/api/v1/partners/search?${params.toString()}`),
        apiFetch<PublicUserProfileDto[]>('/api/v1/partners/search'),
      ]);
      setPartners(pList);
      setRecommendedPartners(allPList);
      if (!silent) {
        setMatchIndex(0);
      }

      if (user) {
        const fList = await apiFetch<FriendshipDto[]>('/api/v1/friends');
        setFriendships(fList);
      }
    } catch {
      // ignore
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadData(false);
  }, [sportId, city, skillLevel, user]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData(false);
    }, 320);
    return () => clearTimeout(timer);
  }, [q]);

  // In-place update without full-page skeleton reload (#14)
  const handleSendFriendRequest = async (targetUserId: string, customMessage?: string) => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      await apiFetch('/api/v1/friends/requests', {
        method: 'POST',
        body: JSON.stringify({
          targetUserId,
          message:
            customMessage?.trim() ||
            'Привет! Нашёл твою анкету в Спорт-Мэтче, давай проведём совместную тренировку!',
        }),
      });
      setMatchSentFeedback('Заявка на совместную тренировку отправлена!');
      setCustomInviteMsg('');
      setPartners((prev) =>
        prev.map((p) =>
          p.id === targetUserId
            ? { ...p, friendshipStatusWithViewer: 'PENDING', friendshipIncomingForViewer: false }
            : p
        )
      );
      setRecommendedPartners((prev) =>
        prev.map((p) =>
          p.id === targetUserId
            ? { ...p, friendshipStatusWithViewer: 'PENDING', friendshipIncomingForViewer: false }
            : p
        )
      );
      await loadData(true);
    } catch (err) {
      setMatchSentFeedback(err instanceof ApiError ? err.message : 'Ошибка отправки запроса');
    }
  };

  const handleRespond = async (friendshipId: string, accept: boolean) => {
    try {
      await apiFetch(`/api/v1/friends/${friendshipId}/respond?accept=${accept}`, {
        method: 'POST',
      });
      await loadData(true);
    } catch (err) {
      setMatchSentFeedback(err instanceof ApiError ? err.message : 'Ошибка обработки заявки');
    }
  };

  const handleRemoveOrCancel = async (friendshipId: string) => {
    try {
      await apiFetch(`/api/v1/friends/${friendshipId}`, { method: 'DELETE' });
      setFriendships((prev) => prev.filter((f) => f.id !== friendshipId));
      await loadData(true);
    } catch (err) {
      setMatchSentFeedback(err instanceof ApiError ? err.message : 'Ошибка удаления');
    }
  };

  const incomingRequests = friendships.filter((f) => f.status === 'PENDING' && f.incoming);
  const outgoingRequests = friendships.filter((f) => f.status === 'PENDING' && !f.incoming);
  const acceptedFriends = friendships.filter((f) => f.status === 'ACCEPTED');

  const deckList = partners.length > 0 ? partners : recommendedPartners;
  const currentMatchCard = deckList.length > 0 ? deckList[matchIndex % deckList.length] : null;
  const viewerSportIds = new Set((user?.sportInterests || []).map((s) => s.sportId));

  const computeCompatibility = (p: PublicUserProfileDto) => {
    let score = 78;
    if (p.matchReasons && p.matchReasons.length > 0) score += 12;
    if (user?.city && p.city && user.city.toLowerCase() === p.city.toLowerCase()) score += 7;
    return Math.min(99, score);
  };

  return (
    <div className="space-y-8 pb-16">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900">
            Спорт-Мэтч, Поиск напарников и Знакомые
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Находите напарников по общему виду спорта, уровню и графику тренировок
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5 p-1 rounded-2xl bg-slate-200/80">
          <button
            type="button"
            onClick={() => setTab('PARTNERS')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors ${
              tab === 'PARTNERS' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-700'
            }`}
          >
            Каталог анкет ({partners.length})
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('MATCH');
              setMatchSentFeedback(null);
            }}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors ${
              tab === 'MATCH'
                ? 'bg-gradient-to-r from-orange-500 to-rose-600 text-white shadow-sm'
                : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Спорт-Мэтч (Дейтинг)</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('FRIENDS')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
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

      {matchSentFeedback && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-900 flex items-center justify-between">
          <span>{matchSentFeedback}</span>
          <button type="button" onClick={() => setMatchSentFeedback(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* TAB: SPORT-MATCH INTERACTIVE DATING DECK (#10) */}
      {tab === 'MATCH' ? (
        <div className="max-w-xl mx-auto space-y-4">
          {currentMatchCard ? (
            <div className="bento-card overflow-hidden">
              {/* Top scenic banner of the match card (Ref 2 style) */}
              <div className="bg-gradient-to-r from-[#D9F2E6] via-[#E9F8F1] to-[#D4EEFC] text-slate-900 p-6 sm:p-8 relative border-b border-slate-100">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="p-1 rounded-full border-2 border-dashed border-[#16B672] bg-white/60">
                      {currentMatchCard.avatarUrl ? (
                        <img
                          src={currentMatchCard.avatarUrl}
                          alt={currentMatchCard.displayName}
                          className="w-20 h-20 rounded-full object-cover shadow-md"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-[#16B672] text-white font-display font-extrabold text-3xl flex items-center justify-center shadow-md">
                          {currentMatchCard.displayName.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/90 text-[#11995E] text-[11px] font-extrabold mb-1.5 shadow-2xs">
                        <Sparkles className="w-3 h-3" />
                        <span>Совместимость {computeCompatibility(currentMatchCard)}%</span>
                      </div>
                      <h2 className="font-display font-black text-2xl text-slate-900">
                        {currentMatchCard.displayName}
                      </h2>
                      <div className="text-xs font-bold text-slate-600 flex items-center gap-1.5 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-[#16B672]" />
                        <span>
                          {currentMatchCard.city || 'Москва'}
                          {currentMatchCard.district ? ` • ${currentMatchCard.district}` : ''}
                        </span>
                      </div>
                    </div>
                  </div>

                  <span className="px-3 py-1 rounded-full bg-white/85 text-xs font-extrabold text-slate-700 shadow-2xs">
                    Анкета {(matchIndex % deckList.length) + 1} / {deckList.length}
                  </span>
                </div>
              </div>

              <div className="p-6 sm:p-8 space-y-5">
                {currentMatchCard.matchReasons && currentMatchCard.matchReasons.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {currentMatchCard.matchReasons.map((r, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 rounded-full bg-[#FFF3E6] text-[#D97706] text-xs font-extrabold"
                      >
                        🔥 {r}
                      </span>
                    ))}
                  </div>
                )}

                <p className="text-sm text-slate-700 leading-relaxed">
                  {currentMatchCard.bio ||
                    'Участник открыт к совместным тренировкам, спаррингам и командным выездам.'}
                </p>

                <div className="space-y-2">
                  <div className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                    Дисциплины и уровень
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {currentMatchCard.sportInterests.map((si) => {
                      const isCommon = viewerSportIds.has(si.sportId);
                      return (
                        <span
                          key={si.sportId}
                          className={`px-3 py-1.5 rounded-xl text-xs font-extrabold ${
                            isCommon
                              ? 'bg-[#16B672] text-white shadow-2xs'
                              : 'bg-[#E7F8F0] text-[#11995E]'
                          }`}
                        >
                          {isCommon ? '🤝 Общий спорт: ' : ''}
                          {si.sportName} • {SKILL_LABELS[si.skillLevel] || si.skillLevel}
                        </span>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-[#F7FAF8] border border-slate-100 text-xs">
                  <div>
                    <div className="font-extrabold text-slate-900 flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 text-[#16B672]" />
                      <span>Формат тренировок</span>
                    </div>
                    <div className="text-slate-600 mt-0.5 font-semibold">
                      {currentMatchCard.preferredFormats || 'Спарринги и командные игры'}
                    </div>
                  </div>
                  <div>
                    <div className="font-extrabold text-slate-900 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-[#16B672]" />
                      <span>Когда удобно</span>
                    </div>
                    <div className="text-slate-600 mt-0.5 font-semibold">
                      {currentMatchCard.preferredSchedule || 'Вечера будней и выходные'}
                    </div>
                  </div>
                </div>

                {/* Quick personalized training invite */}
                <div className="space-y-2.5 pt-2 border-t border-slate-100">
                  <input
                    type="text"
                    value={customInviteMsg}
                    onChange={(e) => setCustomInviteMsg(e.target.value)}
                    placeholder="Напишите сообщение для мэтча (например: Пойдём на тренировку в субботу?)..."
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-xs font-semibold bg-[#F7FAF8] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#16B672]"
                  />

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setMatchSentFeedback(null);
                        setMatchIndex((i) => i + 1);
                      }}
                      className="inline-flex items-center justify-center gap-1.5 py-3 px-4 rounded-2xl border border-slate-200 hover:bg-[#F7FAF8] text-slate-700 font-display font-extrabold text-xs transition-colors cursor-pointer"
                    >
                      <SkipForward className="w-4 h-4" />
                      <span>Следующая анкета</span>
                    </button>

                    <Link
                      to={`/users/${currentMatchCard.id}`}
                      className="inline-flex items-center justify-center gap-1.5 py-3 px-4 rounded-2xl bg-[#F4F8F6] hover:bg-[#E7F8F0] text-slate-800 font-display font-extrabold text-xs transition-colors"
                    >
                      <span>Открыть профиль</span>
                    </Link>

                    <button
                      type="button"
                      onClick={() => {
                        handleSendFriendRequest(currentMatchCard.id, customInviteMsg);
                        setMatchIndex((i) => i + 1);
                      }}
                      className="col-span-2 sm:col-span-1 inline-flex items-center justify-center gap-1.5 py-3 px-4 rounded-2xl bg-[#16B672] hover:bg-[#11995E] text-white font-display font-extrabold text-xs shadow-md shadow-[#16B672]/25 transition-all cursor-pointer"
                    >
                      <Heart className="w-4 h-4 fill-current" />
                      <span>Предложить тренировку</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center text-sm text-slate-600">
              Анкеты загружаются...
            </div>
          )}
        </div>
      ) : tab === 'PARTNERS' ? (
        <div className="space-y-6">
          {/* Search filters + Voice Search (#9) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadData(false)}
                placeholder="Имя, вид спорта или интересы..."
                className="w-full pl-9 pr-12 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="absolute right-1.5 top-1/2 -translate-y-1/2">
                <VoiceSearchButton onResult={(spoken) => setQ(spoken)} />
              </div>
            </div>

            <CustomSelect
              value={sportId}
              onChange={setSportId}
              options={[
                { value: '', label: 'Любой вид спорта' },
                ...sports.map((s) => ({ value: s.id, label: s.name })),
              ]}
            />

            <CustomSelect
              value={skillLevel}
              onChange={setSkillLevel}
              options={[
                { value: '', label: 'Любой уровень подготовки' },
                ...Object.entries(SKILL_LABELS).map(([k, v]) => ({ value: k, label: v })),
              ]}
            />

            <RegionSelect
              value={city}
              onChange={setCity}
              allowAll
              allLabel="Все города РФ"
              placeholder="Город..."
            />
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[1, 2].map((n) => (
                <div key={n} className="h-48 rounded-2xl bg-slate-200 animate-pulse" />
              ))}
            </div>
          ) : partners.length === 0 ? (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
                <div className="font-display font-bold text-base text-slate-900">
                  По точным параметрам фильтра анкет не нашлось
                </div>
                <p className="text-xs text-slate-600 max-w-md mx-auto">
                  Попробуйте сбросить фильтры или посмотрите рекомендуемых спортивных напарников ниже.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSportId('');
                    setCity('');
                    setSkillLevel('');
                    setQ('');
                  }}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold"
                >
                  Сбросить фильтры
                </button>
              </div>

              {recommendedPartners.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-display font-bold text-base text-slate-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <span>Рекомендуемые спортивные партнёры на платформе</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {recommendedPartners.map((p) => (
                      <div
                        key={p.id}
                        className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between space-y-4"
                      >
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <Link to={`/users/${p.id}`} className="flex items-center gap-3 group">
                              {p.avatarUrl ? (
                                <img
                                  src={p.avatarUrl}
                                  alt={p.displayName}
                                  className="w-12 h-12 rounded-2xl object-cover border border-slate-200"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white font-display font-bold text-lg flex items-center justify-center">
                                  {p.displayName.charAt(0).toUpperCase()}
                                </div>
                              )}
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
                          </div>
                          {p.bio && <p className="text-xs text-slate-600 line-clamp-2">{p.bio}</p>}
                          <div className="flex flex-wrap gap-1.5">
                            {p.sportInterests.map((si) => {
                              const isCommon = viewerSportIds.has(si.sportId);
                              return (
                                <span
                                  key={si.sportId}
                                  className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                                    isCommon
                                      ? 'bg-[#E7F8F0] text-[#11995E] border border-[#16B672]'
                                      : 'bg-blue-50 text-blue-700'
                                  }`}
                                >
                                  {isCommon ? '🤝 Общий спорт: ' : ''}
                                  {si.sportName} ({SKILL_LABELS[si.skillLevel] || si.skillLevel})
                                </span>
                              );
                            })}
                          </div>
                        </div>
                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                          <Link
                            to={`/users/${p.id}`}
                            className="text-xs font-bold text-slate-700 hover:text-blue-600"
                          >
                            Открыть профиль →
                          </Link>
                          {p.friendshipStatusWithViewer === 'NONE' && (
                            <button
                              type="button"
                              onClick={() => handleSendFriendRequest(p.id)}
                              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
                            >
                              <UserPlus className="w-3.5 h-3.5" />
                              <span>Предложить тренировку</span>
                            </button>
                          )}
                          {p.friendshipStatusWithViewer === 'PENDING' && (
                            <span className="px-3 py-1.5 rounded-xl bg-amber-100 text-amber-800 text-xs font-bold">
                              Запрос в ожидании
                            </span>
                          )}
                          {p.friendshipStatusWithViewer === 'ACCEPTED' && (
                            <button
                              type="button"
                              onClick={() =>
                                setActiveChatFriend({
                                  userId: p.id,
                                  displayName: p.displayName,
                                })
                              }
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#16B672] text-white text-xs font-bold"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span>Личный чат</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
                        {p.avatarUrl ? (
                          <img
                            src={p.avatarUrl}
                            alt={p.displayName}
                            className="w-12 h-12 rounded-2xl object-cover border border-slate-200"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white font-display font-bold text-lg flex items-center justify-center">
                            {p.displayName.charAt(0).toUpperCase()}
                          </div>
                        )}
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
                      {p.sportInterests.map((si) => {
                        const isCommon = viewerSportIds.has(si.sportId);
                        return (
                          <span
                            key={si.sportId}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                              isCommon
                                ? 'bg-[#E7F8F0] text-[#11995E] border border-[#16B672]'
                                : 'bg-blue-50 text-blue-700'
                            }`}
                          >
                            {isCommon ? '🤝 Общий спорт: ' : ''}
                            {si.sportName} ({SKILL_LABELS[si.skillLevel] || si.skillLevel})
                          </span>
                        );
                      })}
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
                        type="button"
                        onClick={() => handleSendFriendRequest(p.id)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Предложить тренировку</span>
                      </button>
                    )}
                    {p.friendshipStatusWithViewer === 'PENDING' && (
                      <span className="px-3 py-1.5 rounded-xl bg-amber-100 text-amber-800 text-xs font-bold">
                        Запрос в ожидании
                      </span>
                    )}
                    {p.friendshipStatusWithViewer === 'ACCEPTED' && (
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold">
                          <UserCheck className="w-3.5 h-3.5" />
                          В знакомых
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setActiveChatFriend({
                              userId: p.id,
                              displayName: p.displayName,
                            })
                          }
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#16B672] hover:bg-[#11995E] text-white text-xs font-bold"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>Чат</span>
                        </button>
                      </div>
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
                        type="button"
                        onClick={() => handleRespond(f.id, true)}
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Принять</span>
                      </button>
                      <button
                        type="button"
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
                      type="button"
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
                В вашем списке спортивных знакомых пока никого нет. Перейдите на вкладку «Спорт-Мэтч» или «Каталог анкет», чтобы найти единомышленников!
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
                        {f.friendSports.map((s) => {
                          const isCommon = viewerSportIds.has(s.sportId);
                          return (
                            <span
                              key={s.sportId}
                              className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                                isCommon
                                  ? 'bg-[#E7F8F0] text-[#11995E] border border-[#16B672]'
                                  : 'bg-blue-50 text-blue-700'
                              }`}
                            >
                              {isCommon ? '🤝 ' : ''}
                              {s.sportName}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          setActiveChatFriend({
                            userId: f.friendUserId,
                            displayName: f.friendDisplayName,
                          })
                        }
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#16B672] hover:bg-[#11995E] text-white text-xs font-bold shadow-xs"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Написать</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveOrCancel(f.id)}
                        title="Удалить из списка знакомых"
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold"
                      >
                        <UserMinus className="w-3.5 h-3.5" />
                        <span>Удалить</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* 1-on-1 Direct Chat Modal (#15) */}
      {activeChatFriend && (
        <DirectChatModal
          friendUserId={activeChatFriend.userId}
          friendDisplayName={activeChatFriend.displayName}
          onClose={() => setActiveChatFriend(null)}
        />
      )}
    </div>
  );
};
