import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  BadgeCheck,
  Calendar,
  Check,
  Clock,
  Download,
  ExternalLink,
  FileText,
  Film,
  Flag,
  Image as ImageIcon,
  Link2,
  MapPin,
  MessageSquare,
  Paperclip,
  Plus,
  Repeat,
  Send,
  ShieldAlert,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import {
  apiFetch,
  ApiError,
  DAY_OF_WEEK_LABELS,
  formatDateTime,
  formatFileSize,
  SKILL_LABELS,
  uploadAttachmentFile,
} from '../api';
import { useAuth } from '../AuthContext';
import {
  AttachmentDto,
  DiscussionMessageDto,
  EventDetailDto,
} from '../types';

export const CreateEventPage: React.FC = () => {
  const { user, myOrganizations, sports, refreshSports } = useAuth();
  const navigate = useNavigate();

  const approvedOrgs = myOrganizations.filter((o) => o.status === 'APPROVED');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [sportId, setSportId] = useState<string>('');
  const [useNewSport, setUseNewSport] = useState(false);
  const [newSportName, setNewSportName] = useState('');
  const [newSportCategory, setNewSportCategory] = useState('Командные и игровые дисциплины');
  const [organizationId, setOrganizationId] = useState<string>('');
  const [city, setCity] = useState(user?.city || 'Москва');
  const [locationAddress, setLocationAddress] = useState('');
  const [startsAtLocal, setStartsAtLocal] = useState(() => {
    const d = new Date(Date.now() + 24 * 3600 * 1000);
    d.setMinutes(0, 0, 0);
    return d.toISOString().slice(0, 16);
  });
  const [durationMinutes, setDurationMinutes] = useState(90);
  const [joinMode, setJoinMode] = useState<'OPEN' | 'APPROVAL_REQUIRED'>('OPEN');
  const [skillLevel, setSkillLevel] = useState('ANY');
  const [activityFormat, setActivityFormat] = useState('Совместная тренировка / игра');
  const [participationConditions, setParticipationConditions] = useState('Участие бесплатное');
  const [whatToBring, setWhatToBring] = useState('Спортивная форма и вода');
  const [maxParticipants, setMaxParticipants] = useState<string>('12');

  // Recurring options
  const [recurring, setRecurring] = useState(false);
  const [recurringDayOfWeek, setRecurringDayOfWeek] = useState(6);
  const [recurringStartTimeLocal, setRecurringStartTimeLocal] = useState('10:00');

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (sports.length > 0 && !sportId) {
      setSportId(sports[0].id);
    }
  }, [sports]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const startIso = new Date(startsAtLocal).toISOString();
      const endIso = new Date(new Date(startsAtLocal).getTime() + durationMinutes * 60000).toISOString();

      const body = {
        title,
        description,
        sportId: useNewSport ? null : sportId,
        newSportName: useNewSport ? newSportName.trim() : null,
        newSportCategory: useNewSport ? newSportCategory.trim() : null,
        organizationId: organizationId || null,
        city,
        locationAddress,
        startsAt: startIso,
        endsAt: endIso,
        joinMode,
        skillLevel,
        activityFormat,
        participationConditions,
        whatToBring,
        maxParticipants: maxParticipants ? parseInt(maxParticipants, 10) : null,
        recurring,
        recurringDayOfWeek: recurring ? recurringDayOfWeek : null,
        recurringStartTimeLocal: recurring ? recurringStartTimeLocal : null,
        recurringDurationMinutes: durationMinutes,
      };

      const res = await apiFetch<EventDetailDto>('/api/v1/events', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      if (useNewSport) {
        await refreshSports();
      }
      navigate(`/events/${res.event.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось создать мероприятие');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-6">
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-9 shadow-xl space-y-6">
        <div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900">
            Создать спортивное мероприятие
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Опубликуйте разовую встречу или регулярную серию от своего имени либо от имени вашей одобренной организации
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Organizer choice */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
            <label className="block text-xs font-bold text-slate-700">От чьего имени публикуется мероприятие?</label>
            <select
              value={organizationId}
              onChange={(e) => setOrganizationId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
            >
              <option value="">Личное мероприятие (от моего имени: {user?.displayName})</option>
              {approvedOrgs.map((org) => (
                <option key={org.id} value={org.id}>
                  От имени проверенной организации: «{org.name}»
                </option>
              ))}
            </select>
            {myOrganizations.some((o) => o.status !== 'APPROVED') && approvedOrgs.length === 0 && (
              <p className="text-[11px] text-amber-700">
                Примечание: ваша организация пока не одобрена администратором, поэтому публикация от её имени станет доступна после верификации. Личные мероприятия можно создавать сразу.
              </p>
            )}
          </div>

          {/* Sport selection or dynamic creation */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700">Спортивное направление *</label>
              <button
                type="button"
                onClick={() => setUseNewSport(!useNewSport)}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{useNewSport ? 'Выбрать из существующего списка' : 'Нет нужного вида спорта? Добавить новый'}</span>
              </button>
            </div>

            {!useNewSport ? (
              <select
                value={sportId}
                onChange={(e) => setSportId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
              >
                {sports.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.category})
                  </option>
                ))}
              </select>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200">
                <div>
                  <label className="block text-[11px] font-bold text-blue-900 mb-1">
                    Название нового вида спорта *
                  </label>
                  <input
                    type="text"
                    required
                    value={newSportName}
                    onChange={(e) => setNewSportName(e.target.value)}
                    placeholder="Например: Падел-теннис, Сквош, Алтимат фрисби"
                    className="w-full px-3 py-2 rounded-xl border border-blue-300 text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-blue-900 mb-1">Категория</label>
                  <input
                    type="text"
                    value={newSportCategory}
                    onChange={(e) => setNewSportCategory(e.target.value)}
                    placeholder="Например: Ракеточные виды"
                    className="w-full px-3 py-2 rounded-xl border border-blue-300 text-sm bg-white"
                  />
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Название мероприятия *</label>
            <input
              type="text"
              required
              minLength={3}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Например: Вечерний баскетбол 5x5 в Лужниках"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Подробное описание *</label>
            <textarea
              rows={3}
              required
              minLength={10}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Опишите формат встречи, для кого она подходит, как найти площадку..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Город *</label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">Адрес или название площадки *</label>
              <input
                type="text"
                required
                value={locationAddress}
                onChange={(e) => setLocationAddress(e.target.value)}
                placeholder="Улица, дом, номер корта или ориентир сбора"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>
          </div>

          {/* Format: One-time or Recurring */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={recurring}
                  onChange={(e) => setRecurring(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-xs font-bold text-slate-900">
                  Сделать мероприятие регулярной еженедельной серией (генерируются встречи на 4 недели вперёд)
                </span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {recurring ? 'Дата первой встречи *' : 'Дата и время начала *'}
                </label>
                <input
                  type="datetime-local"
                  required
                  value={startsAtLocal}
                  onChange={(e) => setStartsAtLocal(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Длительность (минут)</label>
                <input
                  type="number"
                  min={30}
                  max={480}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(parseInt(e.target.value || '90', 10))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white"
                />
              </div>

              {recurring && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">День недели и время серии</label>
                  <div className="flex gap-1.5">
                    <select
                      value={recurringDayOfWeek}
                      onChange={(e) => setRecurringDayOfWeek(parseInt(e.target.value, 10))}
                      className="flex-1 px-2 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                    >
                      {Object.entries(DAY_OF_WEEK_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v}
                        </option>
                      ))}
                    </select>
                    <input
                      type="time"
                      value={recurringStartTimeLocal}
                      onChange={(e) => setRecurringStartTimeLocal(e.target.value)}
                      className="w-24 px-2 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Режим записи *</label>
              <select
                value={joinMode}
                onChange={(e) => setJoinMode(e.target.value as 'OPEN' | 'APPROVAL_REQUIRED')}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
              >
                <option value="OPEN">Свободное участие (мгновенная запись)</option>
                <option value="APPROVAL_REQUIRED">По заявке (с подтверждением организатором)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Рекомендуемый уровень</label>
              <select
                value={skillLevel}
                onChange={(e) => setSkillLevel(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
              >
                {Object.entries(SKILL_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Лимит участников (оставьте пустым, если без лимита)
              </label>
              <input
                type="number"
                min={2}
                max={500}
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(e.target.value)}
                placeholder="Например: 12"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Условия участия</label>
              <input
                type="text"
                value={participationConditions}
                onChange={(e) => setParticipationConditions(e.target.value)}
                placeholder="Бесплатно / Аренда зала делится поровну"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Что взять с собой</label>
              <input
                type="text"
                value={whatToBring}
                onChange={(e) => setWhatToBring(e.target.value)}
                placeholder="Кроссовки, вода, ракетка..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-5 py-3 rounded-xl border border-slate-300 text-xs font-bold text-slate-700"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-display font-bold text-sm shadow-lg shadow-blue-600/20"
            >
              {submitting ? 'Публикация...' : 'Опубликовать мероприятие'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const EventDetailPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [detail, setDetail] = useState<EventDetailDto | null>(null);
  const [messages, setMessages] = useState<DiscussionMessageDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);
  const [joinComment, setJoinComment] = useState('');
  const [submittingJoin, setSubmittingJoin] = useState(false);

  // Discussion form state
  const [msgText, setMsgText] = useState('');
  const [externalLinkUrl, setExternalLinkUrl] = useState('');
  const [externalVideoUrl, setExternalVideoUrl] = useState('');
  const [showLinkInputs, setShowLinkInputs] = useState(false);
  const [uploadedAttachments, setUploadedAttachments] = useState<AttachmentDto[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [lightboxImageUrl, setLightboxImageUrl] = useState<string | null>(null);

  // Admin moderation state
  const [adminReason, setAdminReason] = useState('');

  const loadData = async () => {
    if (!eventId) return;
    try {
      const [det, disc] = await Promise.all([
        apiFetch<EventDetailDto>(`/api/v1/events/${eventId}`),
        apiFetch<DiscussionMessageDto[]>(`/api/v1/events/${eventId}/discussions`),
      ]);
      setDetail(det);
      setMessages(disc);
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Мероприятие не найдено');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadData();
  }, [eventId]);

  if (loading) {
    return <div className="h-96 rounded-3xl bg-slate-200 animate-pulse" />;
  }

  if (!detail) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center space-y-3">
        <div className="text-xl font-display font-bold text-slate-900">Мероприятие не найдено</div>
        <Link to="/events" className="inline-block px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold">
          Вернуться в каталог
        </Link>
      </div>
    );
  }

  const { event, confirmedParticipants, pendingApplications, waitlistParticipants, seriesOccurrences } = detail;
  const isOrganizer = user != null && user.id === event.organizerUserId;
  const isAdmin = user?.globalRole === 'ADMIN';
  const isFull = event.maxParticipants != null && event.confirmedParticipantsCount >= event.maxParticipants;

  const handleJoinOrApply = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setActionError(null);
    setSubmittingJoin(true);
    try {
      const updated = await apiFetch<EventDetailDto>(`/api/v1/events/${event.id}/join`, {
        method: 'POST',
        body: JSON.stringify({ comment: joinComment }),
      });
      setDetail(updated);
      setJoinComment('');
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Не удалось записаться');
    } finally {
      setSubmittingJoin(false);
    }
  };

  const handleCancelMyParticipation = async () => {
    setActionError(null);
    try {
      const updated = await apiFetch<EventDetailDto>(`/api/v1/events/${event.id}/cancel-participation`, {
        method: 'POST',
      });
      setDetail(updated);
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Не удалось отменить участие');
    }
  };

  const handleDecision = async (participationId: string, decision: 'CONFIRMED' | 'REJECTED') => {
    const comment =
      decision === 'REJECTED'
        ? window.prompt('Укажите комментарий или причину отказа для участника:', 'К сожалению, все места для этого уровня заняты') || ''
        : 'Заявка подтверждена организатором';
    try {
      const updated = await apiFetch<EventDetailDto>(
        `/api/v1/events/${event.id}/participations/${participationId}/decision`,
        {
          method: 'POST',
          body: JSON.stringify({ decision, comment }),
        }
      );
      setDetail(updated);
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Ошибка обработки заявки');
    }
  };

  const handleCancelOccurrenceByOrganizer = async (cancelSeries: boolean) => {
    const reason = window.prompt(
      cancelSeries ? 'Причина отмены всей регулярной серии:' : 'Причина отмены этой встречи:',
      'Перенос по погодным условиям'
    );
    if (reason === null) return;
    try {
      const updated = await apiFetch<EventDetailDto>(`/api/v1/events/${event.id}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason, cancelEntireSeries: cancelSeries }),
      });
      setDetail(updated);
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Не удалось отменить встречу');
    }
  };

  const handleAdminUnpublish = async () => {
    const reason = adminReason.trim() || window.prompt('Укажите причину снятия мероприятия с публикации:', 'Нарушение правил оформления или жалоба пользователей') || '';
    if (!reason.trim()) return;
    try {
      const updated = await apiFetch<EventDetailDto>(`/api/v1/admin/events/${event.id}/unpublish`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
      setDetail(updated);
      setAdminReason('');
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Ошибка модерации мероприятия');
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingFile(true);
    setActionError(null);
    try {
      for (let i = 0; i < files.length; i++) {
        const uploaded = await uploadAttachmentFile(files[i], 'DISCUSSION');
        setUploadedAttachments((prev) => [...prev, uploaded]);
      }
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Ошибка загрузки файла');
    } finally {
      setUploadingFile(false);
      e.target.value = '';
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgText.trim()) return;
    setActionError(null);
    try {
      const created = await apiFetch<DiscussionMessageDto>(`/api/v1/events/${event.id}/discussions`, {
        method: 'POST',
        body: JSON.stringify({
          content: msgText,
          externalLinkUrl: externalLinkUrl.trim() || null,
          externalVideoUrl: externalVideoUrl.trim() || null,
          attachmentIds: uploadedAttachments.map((a) => a.id),
        }),
      });
      setMessages((prev) => [...prev, created]);
      setMsgText('');
      setExternalLinkUrl('');
      setExternalVideoUrl('');
      setUploadedAttachments([]);
      setShowLinkInputs(false);
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Не удалось отправить сообщение');
    }
  };

  const handleAdminHideMessage = async (messageId: string) => {
    const reason = window.prompt('Укажите причину скрытия сообщения модератором:', 'Некорректное сообщение / спам');
    if (!reason || !reason.trim()) return;
    try {
      const updatedMsg = await apiFetch<DiscussionMessageDto>(
        `/api/v1/admin/events/${event.id}/discussions/${messageId}/hide`,
        {
          method: 'POST',
          body: JSON.stringify({ reason }),
        }
      );
      setMessages((prev) => prev.map((m) => (m.id === messageId ? updatedMsg : m)));
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Не удалось скрыть сообщение');
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Status Banner if Unpublished or Cancelled */}
      {event.status !== 'PUBLISHED' && (
        <div className="p-5 rounded-3xl bg-rose-50 border-2 border-rose-200 flex items-start gap-3 text-rose-900">
          <ShieldAlert className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-display font-extrabold text-base">
              {event.status === 'UNPUBLISHED_BY_ADMIN'
                ? 'Мероприятие снято с публикации администратором платформы'
                : 'Встреча отменена организатором'}
            </div>
            <div className="text-xs mt-1">
              Причина: <span className="font-semibold">{event.moderationReason || event.cancellationReason || 'Не указана'}</span>. Присоединение новых участников заблокировано.
            </div>
          </div>
        </div>
      )}

      {actionError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-800 flex items-center justify-between">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* MAIN EVENT HEADER & DETAILS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-xl bg-blue-600 text-white text-xs font-bold">
                {event.sport.name}
              </span>
              <span className="px-3 py-1 rounded-xl bg-slate-100 text-slate-800 text-xs font-bold">
                {SKILL_LABELS[event.skillLevel] || event.skillLevel}
              </span>
              <span
                className={`px-3 py-1 rounded-xl text-xs font-bold ${
                  event.joinMode === 'OPEN'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-indigo-100 text-indigo-800'
                }`}
              >
                {event.joinMode === 'OPEN' ? 'Свободное участие' : 'Участие по заявке'}
              </span>
              {event.recurringOccurrence && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-orange-100 text-orange-800 text-xs font-bold">
                  <Repeat className="w-3.5 h-3.5" />
                  Регулярная серия
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <a
                href={`/api/v1/events/${event.id}/ics`}
                download
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>В календарь (.ics)</span>
              </a>
              {user && (
                <Link
                  to={`/support?targetType=EVENT&targetId=${event.id}&subject=${encodeURIComponent(
                    'Обращение по мероприятию: ' + event.title
                  )}`}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold"
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>Пожаловаться</span>
                </Link>
              )}
            </div>
          </div>

          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900">
            {event.title}
          </h1>

          <p className="text-slate-700 text-sm sm:text-base whitespace-pre-line leading-relaxed">
            {event.description}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/70 text-xs">
            <div className="space-y-2">
              <div className="flex items-start gap-2.5">
                <Calendar className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-900">Дата и время встречи</div>
                  <div className="text-slate-700">
                    {formatDateTime(event.startsAt)} — {formatDateTime(event.endsAt)}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-900">Место проведения</div>
                  <div className="text-slate-700">
                    {event.city}, {event.locationAddress}
                  </div>
                  <a
                    href={`https://www.openstreetmap.org/search?query=${encodeURIComponent(
                      event.city + ' ' + event.locationAddress
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline font-semibold inline-flex items-center gap-1 mt-0.5"
                  >
                    <span>Показать на карте OpenStreetMap</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div>
                <div className="font-bold text-slate-900">Условия участия</div>
                <div className="text-slate-700">{event.participationConditions || 'Свободные условия'}</div>
              </div>
              <div>
                <div className="font-bold text-slate-900">Что взять с собой</div>
                <div className="text-slate-700">{event.whatToBring || 'Спортивную форму по погоде'}</div>
              </div>
            </div>
          </div>

          {/* Series other dates if recurring */}
          {seriesOccurrences.length > 1 && (
            <div className="pt-2 space-y-2">
              <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Repeat className="w-4 h-4 text-orange-600" />
                <span>Другие даты этой регулярной серии (запись отдельно на каждую встречу):</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {seriesOccurrences.map((occ) => (
                  <Link
                    key={occ.id}
                    to={`/events/${occ.id}`}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      occ.id === event.id
                        ? 'bg-blue-600 text-white border-blue-600'
                        : occ.status !== 'PUBLISHED'
                        ? 'bg-rose-50 text-rose-700 border-rose-200 line-through'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-blue-400'
                    }`}
                  >
                    {formatDateTime(occ.startsAt)}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* SIDEBAR: PARTICIPATION ACTION, ORGANIZER & ADMIN CONTROLS */}
        <div className="space-y-5">
          {/* Participation Box */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase">Участники встречи</span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-900 font-display font-extrabold text-xs">
                <Users className="w-3.5 h-3.5 text-blue-600" />
                {event.confirmedParticipantsCount}
                {event.maxParticipants ? ` из ${event.maxParticipants}` : ' без лимита'}
              </span>
            </div>

            {/* Current viewer status */}
            {event.viewerParticipationStatus === 'CONFIRMED' ? (
              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-900 flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Ваше участие подтверждено! Вы в основном списке участников.</span>
                </div>
                <button
                  onClick={handleCancelMyParticipation}
                  className="w-full py-2.5 rounded-xl border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-bold"
                >
                  Отменить моё участие
                </button>
              </div>
            ) : event.viewerParticipationStatus === 'PENDING' ? (
              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs font-bold text-amber-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Ваша заявка отправлена и ожидает рассмотрения организатором.</span>
                </div>
                <button
                  onClick={handleCancelMyParticipation}
                  className="w-full py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold"
                >
                  Отозвать заявку
                </button>
              </div>
            ) : event.viewerParticipationStatus === 'WAITLISTED' ? (
              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-200 text-xs font-bold text-purple-900">
                  Вы находитесь в листе ожидания. При освобождении места система автоматически переведёт вас в основной состав!
                </div>
                <button
                  onClick={handleCancelMyParticipation}
                  className="w-full py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold"
                >
                  Покинуть лист ожидания
                </button>
              </div>
            ) : event.viewerParticipationStatus === 'REJECTED' ? (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-800">
                К сожалению, ваша заявка на эту встречу была отклонена организатором.
              </div>
            ) : event.status === 'PUBLISHED' ? (
              <div className="space-y-3">
                {event.joinMode === 'APPROVAL_REQUIRED' && (
                  <textarea
                    rows={2}
                    value={joinComment}
                    onChange={(e) => setJoinComment(e.target.value)}
                    placeholder="Короткий комментарий организатору (ваш уровень, опыт, экипировка)..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                )}
                <button
                  onClick={handleJoinOrApply}
                  disabled={submittingJoin}
                  className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-display font-bold text-sm shadow-lg shadow-blue-600/20 transition-all"
                >
                  {submittingJoin
                    ? 'Обработка...'
                    : event.joinMode === 'OPEN'
                    ? isFull
                      ? 'Встать в лист ожидания (Waitlist)'
                      : 'Участвовать (Свободный вход)'
                    : 'Подать заявку на участие'}
                </button>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-slate-100 text-xs text-slate-600 font-semibold text-center">
                Запись на мероприятие закрыта
              </div>
            )}

            {/* Organizer info */}
            <div className="pt-4 border-t border-slate-100 space-y-2 text-xs">
              <div className="font-bold text-slate-500 uppercase">Организатор</div>
              {event.organizationId ? (
                <Link
                  to={`/organizations/${event.organizationId}`}
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-blue-50/70 hover:bg-blue-100/70 text-blue-950 font-bold"
                >
                  <BadgeCheck className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>{event.organizationName}</span>
                </Link>
              ) : null}
              <Link
                to={`/users/${event.organizerUserId}`}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 font-semibold"
              >
                <span>Координатор: {event.organizerDisplayName}</span>
                <span className="text-blue-600">Профиль →</span>
              </Link>
            </div>

            {/* Organizer Controls */}
            {isOrganizer && event.status === 'PUBLISHED' && (
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <div className="text-[11px] font-bold text-slate-500 uppercase">Управление организатора</div>
                <button
                  onClick={() => handleCancelOccurrenceByOrganizer(false)}
                  className="w-full py-2 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold"
                >
                  Отменить эту встречу
                </button>
                {event.recurringOccurrence && (
                  <button
                    onClick={() => handleCancelOccurrenceByOrganizer(true)}
                    className="w-full py-2 rounded-xl border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-bold"
                  >
                    Отменить всю регулярную серию
                  </button>
                )}
              </div>
            )}

            {/* Admin Moderation Box */}
            {isAdmin && event.status === 'PUBLISHED' && (
              <div className="pt-3 border-t border-slate-200 space-y-2">
                <div className="text-[11px] font-bold text-rose-700 uppercase flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Модерация администратора</span>
                </div>
                <input
                  type="text"
                  value={adminReason}
                  onChange={(e) => setAdminReason(e.target.value)}
                  placeholder="Причина снятия с публикации..."
                  className="w-full px-3 py-1.5 rounded-xl border border-rose-200 text-xs"
                />
                <button
                  onClick={handleAdminUnpublish}
                  className="w-full py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
                >
                  Снять мероприятие с публикации
                </button>
              </div>
            )}
          </div>

          {/* Pending Applications (Visible to Organizer & Admin) */}
          {(isOrganizer || isAdmin) && pendingApplications.length > 0 && (
            <div className="bg-amber-50/70 rounded-3xl border border-amber-200 p-5 space-y-3">
              <div className="font-display font-bold text-sm text-amber-950 flex items-center justify-between">
                <span>Заявки на рассмотрении</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 text-xs">
                  {pendingApplications.length}
                </span>
              </div>
              <div className="space-y-2.5">
                {pendingApplications.map((app) => (
                  <div key={app.participationId} className="bg-white rounded-2xl p-3.5 border border-amber-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <Link
                        to={`/users/${app.userId}`}
                        className="font-bold text-xs text-slate-900 hover:text-blue-600"
                      >
                        {app.displayName}
                      </Link>
                      <span className="text-[10px] text-slate-500">{app.city}</span>
                    </div>
                    {app.requestComment && (
                      <p className="text-xs text-slate-600 italic">«{app.requestComment}»</p>
                    )}
                    {isOrganizer && (
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => handleDecision(app.participationId, 'CONFIRMED')}
                          className="flex-1 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                        >
                          Принять
                        </button>
                        <button
                          onClick={() => handleDecision(app.participationId, 'REJECTED')}
                          className="flex-1 py-1.5 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-bold"
                        >
                          Отклонить
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Confirmed Participants List */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-3">
            <div className="font-display font-bold text-sm text-slate-900">
              Подтверждённые участники ({confirmedParticipants.length})
            </div>
            {confirmedParticipants.length === 0 ? (
              <p className="text-xs text-slate-500">Пока никто не записался. Станьте первым участником!</p>
            ) : (
              <div className="space-y-2">
                {confirmedParticipants.map((p) => (
                  <Link
                    key={p.participationId}
                    to={`/users/${p.userId}`}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center">
                        {p.displayName.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-semibold text-slate-900">{p.displayName}</span>
                    </div>
                    <span className="text-slate-400">{p.city}</span>
                  </Link>
                ))}
              </div>
            )}

            {waitlistParticipants.length > 0 && (
              <div className="pt-3 border-t border-slate-100 space-y-1.5">
                <div className="text-xs font-bold text-slate-500">
                  Лист ожидания ({waitlistParticipants.length})
                </div>
                {waitlistParticipants.map((w) => (
                  <div key={w.participationId} className="text-xs text-slate-600">
                    • {w.displayName}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* DISCUSSION & MEDIA MESSENGER SECTION */}
      <section className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            <h2 className="font-display font-extrabold text-xl text-slate-900">
              Обсуждение мероприятия ({messages.length})
            </h2>
          </div>
          <span className="text-xs text-slate-500">
            Поддерживаются текст, фотографии, видео (MP4/WebM), документы (PDF/DOCX/TXT) и безопасные ссылки
          </span>
        </div>

        {/* Messages list */}
        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
          {messages.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-50 text-center text-xs text-slate-500">
              В обсуждении пока нет сообщений. Задайте вопрос организатору или поделитесь схемой проезда!
            </div>
          ) : (
            messages.map((m) => (
              <div
                key={m.id}
                className={`p-4 rounded-2xl border ${
                  m.status !== 'VISIBLE'
                    ? 'bg-rose-50/60 border-rose-200 opacity-75'
                    : m.authorIsOrganizer
                    ? 'bg-blue-50/50 border-blue-200'
                    : 'bg-slate-50/80 border-slate-200/80'
                } space-y-2.5`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/users/${m.authorUserId}`}
                      className="font-display font-bold text-xs text-slate-900 hover:text-blue-600"
                    >
                      {m.authorDisplayName}
                    </Link>
                    {m.authorIsOrganizer && (
                      <span className="px-2 py-0.5 rounded-md bg-blue-600 text-white text-[10px] font-bold">
                        Организатор
                      </span>
                    )}
                    {m.authorIsAdmin && (
                      <span className="px-2 py-0.5 rounded-md bg-slate-900 text-white text-[10px] font-bold">
                        Администратор
                      </span>
                    )}
                    <span className="text-[11px] text-slate-400">{formatDateTime(m.createdAt)}</span>
                  </div>

                  {isAdmin && m.status === 'VISIBLE' && (
                    <button
                      onClick={() => handleAdminHideMessage(m.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-800 text-[11px] font-bold"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Скрыть сообщение (Модерация)</span>
                    </button>
                  )}
                </div>

                {m.status !== 'VISIBLE' ? (
                  <div className="text-xs text-rose-800 font-semibold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Сообщение скрыто администратором. Причина: {m.moderationReason}</span>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-slate-800 whitespace-pre-line">{m.content}</p>

                    {/* External clickable link */}
                    {m.externalLinkUrl && (
                      <div>
                        <a
                          href={m.externalLinkUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-blue-200 text-blue-600 hover:bg-blue-50 text-xs font-semibold break-all"
                        >
                          <Link2 className="w-3.5 h-3.5 shrink-0" />
                          <span>{m.externalLinkUrl}</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      </div>
                    )}

                    {/* External video link */}
                    {m.externalVideoUrl && (
                      <div>
                        <a
                          href={m.externalVideoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 text-xs font-semibold"
                        >
                          <Film className="w-3.5 h-3.5 shrink-0" />
                          <span>Смотреть внешнее видео: {m.externalVideoUrl}</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      </div>
                    )}

                    {/* Attachments: Images, Videos, Documents */}
                    {m.attachments && m.attachments.length > 0 && (
                      <div className="flex flex-wrap gap-3 pt-1">
                        {m.attachments.map((att) => {
                          if (att.attachmentType === 'IMAGE') {
                            return (
                              <button
                                key={att.id}
                                type="button"
                                onClick={() => setLightboxImageUrl(att.downloadUrl)}
                                className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white"
                              >
                                <img
                                  src={att.downloadUrl}
                                  alt={att.originalFilename}
                                  className="h-36 w-auto max-w-xs object-cover group-hover:scale-105 transition-transform"
                                />
                              </button>
                            );
                          }
                          if (att.attachmentType === 'VIDEO') {
                            return (
                              <div key={att.id} className="w-full max-w-md rounded-xl overflow-hidden border border-slate-200 bg-black">
                                <video controls preload="metadata" className="w-full max-h-64">
                                  <source src={att.downloadUrl} type={att.mimeType} />
                                  Ваш браузер не поддерживает встроенное видео.
                                </video>
                                <div className="px-3 py-1.5 bg-slate-900 text-white text-[11px] flex justify-between">
                                  <span className="truncate">{att.originalFilename}</span>
                                  <span>{formatFileSize(att.fileSize)}</span>
                                </div>
                              </div>
                            );
                          }
                          return (
                            <a
                              key={att.id}
                              href={att.downloadUrl}
                              download
                              className="inline-flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 hover:border-blue-400 text-xs"
                            >
                              <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                              <div>
                                <div className="font-bold text-slate-900">{att.originalFilename}</div>
                                <div className="text-[10px] text-slate-500">
                                  Документ • {formatFileSize(att.fileSize)} • Скачать
                                </div>
                              </div>
                              <Download className="w-3.5 h-3.5 text-slate-400" />
                            </a>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))
          )}
        </div>

        {/* Compose Message Form */}
        {user ? (
          <form onSubmit={handleSendMessage} className="space-y-3 pt-3 border-t border-slate-100">
            {uploadedAttachments.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {uploadedAttachments.map((att) => (
                  <span
                    key={att.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-50 text-blue-800 text-xs font-semibold border border-blue-200"
                  >
                    {att.attachmentType === 'IMAGE' ? (
                      <ImageIcon className="w-3.5 h-3.5" />
                    ) : att.attachmentType === 'VIDEO' ? (
                      <Film className="w-3.5 h-3.5" />
                    ) : (
                      <FileText className="w-3.5 h-3.5" />
                    )}
                    <span>
                      {att.originalFilename} ({formatFileSize(att.fileSize)})
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setUploadedAttachments((prev) => prev.filter((x) => x.id !== att.id))
                      }
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {showLinkInputs && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Прикрепить веб-ссылку (http/https)
                  </label>
                  <input
                    type="url"
                    value={externalLinkUrl}
                    onChange={(e) => setExternalLinkUrl(e.target.value)}
                    placeholder="https://example.com/route-map"
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Ссылка на внешнее видео (при желании)
                  </label>
                  <input
                    type="url"
                    value={externalVideoUrl}
                    onChange={(e) => setExternalVideoUrl(e.target.value)}
                    placeholder="https://vk.com/video..."
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs bg-white"
                  />
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2.5">
              <textarea
                rows={2}
                required
                value={msgText}
                onChange={(e) => setMsgText(e.target.value)}
                placeholder="Задайте вопрос организатору, напишите комментарий или прикрепите фото/видео/файл..."
                className="flex-1 px-4 py-2.5 rounded-2xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <div className="flex sm:flex-col justify-end gap-2">
                <div className="flex gap-1.5">
                  <label
                    title="Прикрепить фото, видео или документ"
                    className="cursor-pointer inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold"
                  >
                    <Paperclip className="w-4 h-4" />
                    <span>{uploadingFile ? '...' : 'Файл'}</span>
                    <input
                      type="file"
                      multiple
                      accept=".jpg,.jpeg,.png,.webp,.gif,.mp4,.webm,.pdf,.txt,.doc,.docx,.xls,.xlsx,.ics"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => setShowLinkInputs(!showLinkInputs)}
                    className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold"
                  >
                    <Link2 className="w-4 h-4" />
                    <span>Ссылка</span>
                  </button>
                </div>

                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-display font-bold text-xs shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Отправить</span>
                </button>
              </div>
            </div>
          </form>
        ) : (
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-600">
            Чтобы написать сообщение или прикрепить медиафайл в обсуждение,{' '}
            <Link to="/login" className="font-bold text-blue-600">
              войдите в аккаунт
            </Link>
            .
          </div>
        )}
      </section>

      {/* Lightbox Modal for full-size images */}
      {lightboxImageUrl && (
        <div
          onClick={() => setLightboxImageUrl(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={lightboxImageUrl}
              alt="Полноразмерный просмотр"
              className="max-h-[85vh] w-auto rounded-2xl shadow-2xl"
            />
            <button
              onClick={() => setLightboxImageUrl(null)}
              className="absolute -top-3 -right-3 w-9 h-9 rounded-full bg-white text-slate-900 font-bold flex items-center justify-center shadow-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
