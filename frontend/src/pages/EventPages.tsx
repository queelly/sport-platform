import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  BadgeCheck,
  Calendar,
  Check,
  Clock,
  Download,
  Edit3,
  ExternalLink,
  FileText,
  Film,
  Flag,
  Image as ImageIcon,
  Link2,
  MapPin,
  MessageSquare,
  Navigation,
  Paperclip,
  Plus,
  Repeat,
  RotateCcw,
  Send,
  ShieldAlert,
  Sparkles,
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
  getBrowserLocalTzLabel,
  getRegionInfo,
  isOnlineEvent,
} from '../types';
import {
  CustomDateTimePicker,
  CustomSelect,
  Embedded2GisMiniMap,
  MapAddressPicker,
  RegionSelect,
  searchRealAddresses2Gis,
} from '../components/UiControls';
import { ScenicSportIllustration } from '../components/EventCard';

export const CreateEventPage: React.FC = () => {
  const { user, myOrganizations, sports, refreshSports, refreshMe } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedOrgId = searchParams.get('orgId') || '';

  const approvedOrgs = myOrganizations.filter((o) => o.status === 'APPROVED');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [sportId, setSportId] = useState<string>('');
  const [useNewSport, setUseNewSport] = useState(false);
  const [newSportName, setNewSportName] = useState('');
  const [organizationId, setOrganizationId] = useState<string>(preselectedOrgId);
  const [isOnline, setIsOnline] = useState(false);
  const [city, setCity] = useState(user?.city || 'Москва');
  const [locationAddress, setLocationAddress] = useState('');
  const [latitude, setLatitude] = useState<number | null>(() => getRegionInfo(user?.city || 'Москва')?.lat ?? 55.7558);
  const [longitude, setLongitude] = useState<number | null>(() => getRegionInfo(user?.city || 'Москва')?.lng ?? 37.6173);
  const [startsAtLocal, setStartsAtLocal] = useState(() => {
    const d = new Date(Date.now() + 24 * 3600 * 1000);
    d.setMinutes(0, 0, 0);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:00`;
  });
  const [durationMinutesStr, setDurationMinutesStr] = useState<string>('90');
  const [joinMode, setJoinMode] = useState<'OPEN' | 'APPROVAL_REQUIRED'>('OPEN');
  const [skillLevel, setSkillLevel] = useState('ANY');
  const [participationConditions, setParticipationConditions] = useState('Участие бесплатное');
  const [whatToBring, setWhatToBring] = useState('Спортивная форма и вода');
  const [maxParticipants, setMaxParticipants] = useState<string>('12');

  // Optional cover photo
  const [coverAttachment, setCoverAttachment] = useState<AttachmentDto | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);

  // Recurring options
  const [recurring, setRecurring] = useState(false);
  const [recurringDayOfWeek, setRecurringDayOfWeek] = useState(6);
  const [recurringStartTimeLocal, setRecurringStartTimeLocal] = useState('10:00');

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    refreshMe();
  }, []);

  useEffect(() => {
    if (sports.length > 0 && !sportId) {
      setSportId(sports[0].id);
    }
  }, [sports]);

  useEffect(() => {
    if (preselectedOrgId && approvedOrgs.some((o) => o.id === preselectedOrgId)) {
      setOrganizationId(preselectedOrgId);
    }
  }, [preselectedOrgId, approvedOrgs.length]);

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    setError(null);
    try {
      const uploaded = await uploadAttachmentFile(file, 'EVENT_COVER');
      setCoverAttachment(uploaded);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось загрузить обложку мероприятия');
    } finally {
      setUploadingCover(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedDuration = parseInt(durationMinutesStr.trim(), 10);
    const validDuration = Number.isFinite(parsedDuration) && parsedDuration >= 15 ? parsedDuration : 90;

    const startDate = new Date(startsAtLocal);
    if (isNaN(startDate.getTime()) || startDate.getTime() < Date.now() - 60000) {
      setError('Нельзя создать мероприятие в прошлом. Пожалуйста, выберите будущую дату и время начала.');
      return;
    }

    const parsedMax = maxParticipants.trim() ? parseInt(maxParticipants.trim(), 10) : null;
    if (parsedMax !== null && (isNaN(parsedMax) || parsedMax < 2)) {
      setError('Лимит участников должен быть не менее 2 человек (либо оставьте поле пустым для записи без лимита).');
      return;
    }

    setSubmitting(true);

    try {
      const startIso = startDate.toISOString();
      const endIso = new Date(startDate.getTime() + validDuration * 60000).toISOString();

      let finalLat = isOnline ? null : latitude;
      let finalLng = isOnline ? null : longitude;
      let finalAddress = isOnline ? locationAddress || 'Онлайн-платформа' : locationAddress.trim();

      if (!isOnline && finalAddress) {
        const geocoded = await searchRealAddresses2Gis(finalAddress, city);
        if (geocoded.length > 0 && (finalLat === null || finalLng === null)) {
          finalLat = geocoded[0].lat;
          finalLng = geocoded[0].lng;
        }
      }

      const body = {
        title,
        description,
        sportId: useNewSport ? null : sportId,
        newSportName: useNewSport ? newSportName.trim() : null,
        newSportCategory: useNewSport ? 'Спорт' : null,
        organizationId: organizationId || null,
        coverAttachmentId: coverAttachment?.id || null,
        city: isOnline ? 'Онлайн' : city,
        locationAddress: finalAddress,
        latitude: finalLat,
        longitude: finalLng,
        startsAt: startIso,
        endsAt: endIso,
        joinMode,
        skillLevel,
        activityFormat: '',
        participationConditions,
        whatToBring,
        maxParticipants: parsedMax,
        recurring,
        recurringDayOfWeek: recurring ? recurringDayOfWeek : null,
        recurringStartTimeLocal: recurring ? recurringStartTimeLocal : null,
        recurringDurationMinutes: validDuration,
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
            Создать спортивный сбор
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Опубликуйте разовую или регулярную встречу с привязкой к точному адресу на карте
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Organizer choice — shown ONLY when user has approved organizations/communities */}
          {approvedOrgs.length > 0 && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                От чьего имени публикуется мероприятие?
              </label>
              <CustomSelect
                value={organizationId}
                onChange={setOrganizationId}
                options={[
                  {
                    value: '',
                    label: `Личное мероприятие (от моего имени: ${user?.displayName || 'Участник'})`,
                  },
                  ...approvedOrgs.map((org) => ({
                    value: org.id,
                    label: `${
                      org.orgType === 'COMMUNITY' ? 'От имени сообщества' : 'От имени организации'
                    }: «${org.name}»`,
                  })),
                ]}
              />
            </div>
          )}

          {/* Sport selection (without sport categories) */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="block text-xs font-bold text-slate-700">Вид спорта *</label>
              <button
                type="button"
                onClick={() => setUseNewSport(!useNewSport)}
                className="text-xs font-bold text-brand-ink hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{useNewSport ? 'Выбрать из списка' : 'Добавить свой вид спорта'}</span>
              </button>
            </div>

            {!useNewSport ? (
              <CustomSelect
                value={sportId}
                onChange={setSportId}
                options={sports.map((s) => ({
                  value: s.id,
                  label: s.name,
                }))}
              />
            ) : (
              <div className="p-3 rounded-2xl bg-brand-tint/60 border border-brand/30">
                <input
                  type="text"
                  required
                  value={newSportName}
                  onChange={(e) => setNewSportName(e.target.value)}
                  placeholder="Введите название вида спорта (например: Падел, Сквош, Воркаут)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand/40 text-sm bg-white"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
            <div className="sm:col-span-2">
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
              <label className="block text-xs font-bold text-slate-700 mb-1">Обложка / фото площадки</label>
              {coverAttachment ? (
                <div className="relative rounded-xl overflow-hidden border border-slate-200 h-10 flex items-center justify-between px-3 bg-emerald-50 text-xs font-bold text-emerald-900">
                  <span className="truncate">{coverAttachment.originalFilename}</span>
                  <button
                    type="button"
                    onClick={() => setCoverAttachment(null)}
                    className="ml-2 text-rose-600 hover:text-rose-800"
                    title="Удалить обложку"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer w-full px-3.5 py-2.5 rounded-xl border border-dashed border-slate-300 hover:border-blue-400 bg-slate-50 hover:bg-blue-50/40 text-xs font-semibold text-slate-700 flex items-center justify-center gap-1.5 transition-colors">
                  <ImageIcon className="w-4 h-4 text-blue-600" />
                  <span>{uploadingCover ? 'Загрузка...' : 'Загрузить фото'}</span>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,.gif"
                    onChange={handleCoverUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
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

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isOnline}
                  onChange={(e) => setIsOnline(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-xs font-bold text-slate-900">
                  🌐 Онлайн-мероприятие (без привязки к физической карте, время по локальному поясу участника: {getBrowserLocalTzLabel()})
                </span>
              </label>
            </div>

            {isOnline ? (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Платформа проведения или ссылка на подключение (Zoom, Телемост, Discord, стрим) *
                </label>
                <input
                  type="text"
                  required
                  value={locationAddress}
                  onChange={(e) => setLocationAddress(e.target.value)}
                  placeholder="Например: Онлайн в Яндекс.Телемост / Zoom (ссылка в чате участников)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
                />
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Город / Регион *</label>
                  <RegionSelect
                    value={city}
                    onChange={(nextCity) => {
                      setCity(nextCity);
                      const info = getRegionInfo(nextCity);
                      if (info) {
                        setLatitude(info.lat);
                        setLongitude(info.lng);
                      }
                    }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Адрес площадки или выбор точки на карте *
                  </label>
                  <MapAddressPicker
                    city={city}
                    address={locationAddress}
                    latitude={latitude}
                    longitude={longitude}
                    onChange={(next) => {
                      setLocationAddress(next.address);
                      setLatitude(next.latitude);
                      setLongitude(next.longitude);
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Format: One-time or Recurring (#8) */}
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
                  Регулярные встречи (автоматически создаются встречи на 4 недели вперёд)
                </span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {recurring ? 'Дата первой встречи *' : 'Дата и время начала *'}
                </label>
                <CustomDateTimePicker
                  value={startsAtLocal}
                  onChange={setStartsAtLocal}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Длительность (минут)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={durationMinutesStr}
                  onChange={(e) => setDurationMinutesStr(e.target.value.replace(/\D/g, ''))}
                  placeholder="Например: 90"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {recurring && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">День недели повторения</label>
                  <div className="flex gap-1.5">
                    <div className="flex-1">
                      <CustomSelect
                        value={String(recurringDayOfWeek)}
                        onChange={(val) => setRecurringDayOfWeek(parseInt(val, 10))}
                        options={Object.entries(DAY_OF_WEEK_LABELS).map(([k, v]) => ({
                          value: k,
                          label: v,
                        }))}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Режим записи *</label>
              <CustomSelect
                value={joinMode}
                onChange={(val) => setJoinMode(val as 'OPEN' | 'APPROVAL_REQUIRED')}
                options={[
                  { value: 'OPEN', label: 'Свободное участие (мгновенно)' },
                  { value: 'APPROVAL_REQUIRED', label: 'По заявке организатору' },
                ]}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Рекомендуемый уровень</label>
              <CustomSelect
                value={skillLevel}
                onChange={setSkillLevel}
                options={Object.entries(SKILL_LABELS).map(([k, v]) => ({
                  value: k,
                  label: v,
                }))}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Лимит участников (пусто = без лимита)
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(e.target.value.replace(/\D/g, ''))}
                placeholder="Без ограничений"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="px-5 py-3 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50"
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
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [joinComment, setJoinComment] = useState('');
  const [submittingJoin, setSubmittingJoin] = useState(false);

  // Inline application rejection state (no window.prompt!)
  const [rejectingAppId, setRejectingAppId] = useState<string | null>(null);
  const [rejectReasonText, setRejectReasonText] = useState('К сожалению, все места для этого уровня заняты');

  // Organizer inline cancel / edit / delete modals
  const [showCancelBox, setShowCancelBox] = useState(false);
  const [cancelReasonText, setCancelReasonText] = useState('Перенос встречи по погодным/техническим причинам');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingEvent, setDeletingEvent] = useState(false);

  // Edit event form state
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editIsOnline, setEditIsOnline] = useState(false);
  const [editCity, setEditCity] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editLatitude, setEditLatitude] = useState<number | null>(null);
  const [editLongitude, setEditLongitude] = useState<number | null>(null);
  const [editStartsAtLocal, setEditStartsAtLocal] = useState('');
  const [editDurationStr, setEditDurationStr] = useState('90');
  const [editJoinMode, setEditJoinMode] = useState<'OPEN' | 'APPROVAL_REQUIRED'>('OPEN');
  const [editSkillLevel, setEditSkillLevel] = useState('ANY');
  const [editConditions, setEditConditions] = useState('');
  const [editWhatToBring, setEditWhatToBring] = useState('');
  const [editMaxParticipants, setEditMaxParticipants] = useState('');
  const [editCoverAttachmentId, setEditCoverAttachmentId] = useState<string | null>(null);
  const [editCoverFilename, setEditCoverFilename] = useState<string | null>(null);
  const [editRemoveCoverImage, setEditRemoveCoverImage] = useState(false);
  const [uploadingEditCover, setUploadingEditCover] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  // Discussion form state
  const [msgText, setMsgText] = useState('');
  const [attachedUrl, setAttachedUrl] = useState('');
  const [showLinkBar, setShowLinkBar] = useState(false);
  const [uploadedAttachments, setUploadedAttachments] = useState<AttachmentDto[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [lightboxImageUrl, setLightboxImageUrl] = useState<string | null>(null);

  // Admin moderation state
  const [adminReason, setAdminReason] = useState('');
  const [hidingMsgId, setHidingMsgId] = useState<string | null>(null);
  const [hideMsgReason, setHideMsgReason] = useState('Нарушение правил общения / спам');

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const prevMsgCountRef = useRef<number>(0);

  const loadData = async (silent = false) => {
    if (!eventId) return;
    try {
      const [det, disc] = await Promise.all([
        apiFetch<EventDetailDto>(`/api/v1/events/${eventId}`),
        apiFetch<DiscussionMessageDto[]>(`/api/v1/events/${eventId}/discussions`),
      ]);
      setDetail(det);
      setMessages(disc);
    } catch (err) {
      if (!silent) {
        setActionError(err instanceof ApiError ? err.message : 'Мероприятие не найдено');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    prevMsgCountRef.current = 0;
    loadData(false);

    // Real-time background polling for discussion & participants every 3.5s
    const interval = setInterval(() => {
      loadData(true);
    }, 3500);
    return () => clearInterval(interval);
  }, [eventId]);

  // Smart scroll: only scroll to bottom on initial load or when user is already near bottom (#16)
  useEffect(() => {
    if (messages.length > prevMsgCountRef.current) {
      const isInitial = prevMsgCountRef.current === 0;
      prevMsgCountRef.current = messages.length;
      const el = messagesContainerRef.current;
      if (el) {
        const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 140;
        if (isInitial || isNearBottom) {
          setTimeout(() => {
            if (messagesContainerRef.current) {
              messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
            }
          }, 50);
        }
      }
    }
  }, [messages.length]);

  const openEditEventModal = () => {
    if (!detail) return;
    const ev = detail.event;
    const online = isOnlineEvent(ev.city, ev.locationAddress);
    const region = getRegionInfo(ev.city) || getRegionInfo('Москва');
    setEditTitle(ev.title);
    setEditDesc(ev.description);
    setEditIsOnline(online);
    setEditCity(online ? 'Москва' : ev.city);
    setEditAddress(ev.locationAddress);
    setEditLatitude(ev.latitude ?? (region ? region.lat : 55.7512));
    setEditLongitude(ev.longitude ?? (region ? region.lng : 37.6184));
    const d = new Date(ev.startsAt);
    const pad = (n: number) => String(n).padStart(2, '0');
    setEditStartsAtLocal(
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
    );
    const durMins = Math.max(
      30,
      Math.round((new Date(ev.endsAt).getTime() - new Date(ev.startsAt).getTime()) / 60000)
    );
    setEditDurationStr(String(durMins));
    setEditJoinMode(ev.joinMode);
    setEditSkillLevel(ev.skillLevel);
    setEditConditions(ev.participationConditions || '');
    setEditWhatToBring(ev.whatToBring || '');
    setEditMaxParticipants(ev.maxParticipants ? String(ev.maxParticipants) : '');
    setEditCoverAttachmentId(null);
    setEditCoverFilename(null);
    setEditRemoveCoverImage(false);
    setShowEditModal(true);
  };

  const handleEditCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingEditCover(true);
    try {
      const uploaded = await uploadAttachmentFile(file, 'EVENT_COVER');
      setEditCoverAttachmentId(uploaded.id);
      setEditCoverFilename(uploaded.originalFilename);
      setEditRemoveCoverImage(false);
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Не удалось загрузить обложку');
    } finally {
      setUploadingEditCover(false);
      e.target.value = '';
    }
  };

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
  const isOrganizer = Boolean(event.managedByViewer) || (user != null && user.id === event.organizerUserId);
  const isAdmin = user?.globalRole === 'ADMIN';
  const isFull = event.maxParticipants != null && event.confirmedParticipantsCount >= event.maxParticipants;
  const isOnline = isOnlineEvent(event.city, event.locationAddress);
  const regionInfo = getRegionInfo(event.city);
  const tzLabel = isOnline ? getBrowserLocalTzLabel() : regionInfo?.tzLabel || 'МСК';

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

  const handleDecision = async (participationId: string, decision: 'CONFIRMED' | 'REJECTED', customComment?: string) => {
    const comment =
      decision === 'REJECTED'
        ? customComment?.trim() || 'К сожалению, заявка отклонена организатором'
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
      setRejectingAppId(null);
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Ошибка обработки заявки');
    }
  };

  const handleRemoveParticipant = async (participationId: string, displayName: string) => {
    setActionError(null);
    try {
      const updated = await apiFetch<EventDetailDto>(
        `/api/v1/events/${event.id}/participations/${participationId}`,
        {
          method: 'DELETE',
        }
      );
      setDetail(updated);
      setActionFeedback(`Участник «${displayName}» исключён из списка встречи.`);
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Не удалось исключить участника');
    }
  };

  const handleCancelOccurrenceByOrganizer = async (cancelSeries: boolean) => {
    if (!cancelReasonText.trim()) return;
    try {
      const updated = await apiFetch<EventDetailDto>(`/api/v1/events/${event.id}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason: cancelReasonText.trim(), cancelEntireSeries: cancelSeries }),
      });
      setDetail(updated);
      setShowCancelBox(false);
      setActionFeedback('Встреча отменена. Вы можете возобновить её или изменить дату в любой момент.');
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Не удалось отменить встречу');
    }
  };

  const handleRestoreByOrganizer = async () => {
    try {
      const updated = await apiFetch<EventDetailDto>(`/api/v1/events/${event.id}/restore`, {
        method: 'POST',
      });
      setDetail(updated);
      setActionFeedback('Встреча успешно возобновлена и снова открыта для записи в каталоге!');
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Не удалось возобновить встречу');
    }
  };

  const handleDeleteEventByOrganizer = async () => {
    setDeletingEvent(true);
    setActionError(null);
    try {
      await apiFetch(`/api/v1/events/${event.id}`, {
        method: 'DELETE',
      });
      navigate('/events');
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Не удалось удалить мероприятие');
      setDeletingEvent(false);
    }
  };

  const handleSaveEditedEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingEdit(true);
    setActionError(null);
    try {
      const startD = new Date(editStartsAtLocal);
      if (isNaN(startD.getTime()) || startD.getTime() < Date.now() - 60000) {
        setActionError('Нельзя перенести мероприятие в прошлое. Укажите будущую дату и время начала.');
        setSavingEdit(false);
        return;
      }
      const dur = parseInt(editDurationStr, 10) || 90;
      const endD = new Date(startD.getTime() + dur * 60000);
      const updated = await apiFetch<EventDetailDto>(`/api/v1/events/${event.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: editTitle,
          description: editDesc,
          city: editIsOnline ? 'Онлайн' : editCity,
          locationAddress: editIsOnline ? editAddress || 'Онлайн-платформа' : editAddress,
          latitude: editIsOnline ? null : editLatitude,
          longitude: editIsOnline ? null : editLongitude,
          startsAt: startD.toISOString(),
          endsAt: endD.toISOString(),
          joinMode: editJoinMode,
          skillLevel: editSkillLevel,
          participationConditions: editConditions,
          whatToBring: editWhatToBring,
          maxParticipants: editMaxParticipants.trim() ? parseInt(editMaxParticipants.trim(), 10) : null,
          coverAttachmentId: editCoverAttachmentId,
          removeCoverImage: editRemoveCoverImage,
        }),
      });
      setDetail(updated);
      setShowEditModal(false);
      setActionFeedback('Изменения мероприятия сохранены! Все участники увидят обновлённую информацию.');
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Не удалось обновить мероприятие');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleAdminUnpublish = async () => {
    const reason = adminReason.trim() || 'Нарушение правил оформления или жалоба пользователей';
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

  const handleAdminRepublish = async () => {
    try {
      const updated = await apiFetch<EventDetailDto>(`/api/v1/admin/events/${event.id}/republish`, {
        method: 'POST',
        body: JSON.stringify({ reason: adminReason.trim() || 'Возвращено в публикацию администратором' }),
      });
      setDetail(updated);
      setActionFeedback('Мероприятие возвращено в публикацию (разблокировано)!');
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Не удалось вернуть мероприятие в публикацию');
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

  const isVideoLink = (url: string) => {
    const lower = url.toLowerCase();
    return (
      lower.includes('vk.com/video') ||
      lower.includes('vkvideo.ru') ||
      lower.includes('youtube.com') ||
      lower.includes('youtu.be') ||
      lower.includes('rutube.ru') ||
      lower.endsWith('.mp4') ||
      lower.endsWith('.webm')
    );
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgText.trim() && uploadedAttachments.length === 0 && !attachedUrl.trim()) return;
    setActionError(null);
    const trimmedUrl = attachedUrl.trim();
    const isVid = trimmedUrl ? isVideoLink(trimmedUrl) : false;

    try {
      const created = await apiFetch<DiscussionMessageDto>(`/api/v1/events/${event.id}/discussions`, {
        method: 'POST',
        body: JSON.stringify({
          content: msgText.trim() || 'Прикреплённое вложение',
          externalLinkUrl: trimmedUrl && !isVid ? trimmedUrl : null,
          externalVideoUrl: trimmedUrl && isVid ? trimmedUrl : null,
          attachmentIds: uploadedAttachments.map((a) => a.id),
        }),
      });
      setMessages((prev) => [...prev, created]);
      setMsgText('');
      setAttachedUrl('');
      setUploadedAttachments([]);
      setShowLinkBar(false);
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Не удалось отправить сообщение');
    }
  };

  const handleAdminHideMessage = async (messageId: string) => {
    if (!hideMsgReason.trim()) return;
    try {
      const updatedMsg = await apiFetch<DiscussionMessageDto>(
        `/api/v1/admin/events/${event.id}/discussions/${messageId}/hide`,
        {
          method: 'POST',
          body: JSON.stringify({ reason: hideMsgReason.trim() }),
        }
      );
      setMessages((prev) => prev.map((m) => (m.id === messageId ? updatedMsg : m)));
      setHidingMsgId(null);
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Не удалось скрыть сообщение');
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Status Banner if Unpublished or Cancelled */}
      {event.status !== 'PUBLISHED' && (
        <div className="p-5 rounded-3xl bg-rose-50 border-2 border-rose-200 flex flex-wrap items-center justify-between gap-4 text-rose-900">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-display font-extrabold text-base">
                {event.status === 'UNPUBLISHED_BY_ADMIN'
                  ? 'Мероприятие снято с публикации администратором платформы'
                  : 'Встреча временно отменена или перенесена организатором'}
              </div>
              <div className="text-xs mt-1">
                Причина: <span className="font-semibold">{event.moderationReason || event.cancellationReason || 'Не указана'}</span>.
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isOrganizer && event.status === 'CANCELLED_BY_ORGANIZER' && (
              <button
                type="button"
                onClick={handleRestoreByOrganizer}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Возобновить встречу</span>
              </button>
            )}
            {isAdmin && event.status === 'UNPUBLISHED_BY_ADMIN' && (
              <button
                type="button"
                onClick={handleAdminRepublish}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Вернуть в публикацию (Разбанить)</span>
              </button>
            )}
          </div>
        </div>
      )}

      {actionFeedback && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-900 flex items-center justify-between">
          <span>{actionFeedback}</span>
          <button type="button" onClick={() => setActionFeedback(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {actionError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-800 flex items-center justify-between">
          <span>{actionError}</span>
          <button type="button" onClick={() => setActionError(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* MAIN EVENT HEADER & DETAILS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bento-card overflow-hidden">
          <div className="h-52 sm:h-60 w-full overflow-hidden bg-[#DDF4FA] relative">
            {event.coverImageUrl ? (
              <img
                src={event.coverImageUrl}
                alt={event.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <ScenicSportIllustration sportName={event.sport.name} variant={2} />
            )}
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-xl bg-blue-600 text-white text-xs font-bold">
                  {event.sport.name}
                </span>
                {isOnline && (
                  <span className="px-3 py-1 rounded-xl bg-indigo-600 text-white text-xs font-bold">
                    🌐 Онлайн
                  </span>
                )}
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
                    Регулярные встречи
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
              <div className="space-y-3">
                <div className="flex items-start gap-2.5">
                  <Calendar className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-slate-900">
                      Дата и время встречи ({tzLabel})
                    </div>
                    <div className="text-slate-700">
                      {formatDateTime(event.startsAt)} — {formatDateTime(event.endsAt)}
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="space-y-1.5">
                    <div className="font-bold text-slate-900">
                      {isOnline ? 'Формат и платформа подключения' : 'Место проведения'}
                    </div>
                    <div className="text-slate-700">
                      {isOnline
                        ? `🌐 Онлайн (${event.locationAddress})`
                        : `${event.city}, ${event.locationAddress}`}
                    </div>
                    {!isOnline && (
                      <div className="flex flex-wrap items-center gap-2 pt-0.5">
                        <a
                          href={
                            event.latitude != null && event.longitude != null
                              ? `https://2gis.ru/geo/${event.longitude},${event.latitude}`
                              : `https://2gis.ru/search/${encodeURIComponent(`${event.city} ${event.locationAddress}`)}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100/90 hover:bg-emerald-200 text-emerald-950 font-bold text-[11px] transition-colors"
                        >
                          <MapPin className="w-3 h-3 text-emerald-700" />
                          <span>Открыть на карте</span>
                          <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                        </a>
                        <a
                          href={`https://yandex.ru/maps/?text=${encodeURIComponent(
                            `${event.city}, ${event.locationAddress}`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-100/90 hover:bg-amber-200 text-amber-950 font-bold text-[11px] transition-colors"
                        >
                          <Navigation className="w-3 h-3 text-amber-700" />
                          <span>Яндекс Карты</span>
                          <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                        </a>
                      </div>
                    )}
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

            {!isOnline && (
              <Embedded2GisMiniMap
                city={event.city}
                address={event.locationAddress}
                latitude={event.latitude}
                longitude={event.longitude}
              />
            )}

            {/* Series other dates if recurring */}
            {seriesOccurrences.length > 1 && (
              <div className="pt-2 space-y-2">
                <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Repeat className="w-4 h-4 text-orange-600" />
                  <span>Расписание регулярных встреч (запись отдельно на каждую дату):</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {seriesOccurrences.map((occ) => (
                    <Link
                      key={occ.id}
                      to={`/events/${occ.id}`}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                        occ.id === event.id
                          ? 'bg-blue-600 text-white border-blue-600'
                          : occ.status !== 'PUBLISHED' || new Date(occ.startsAt).getTime() < Date.now()
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

            {/* Archived / Past check first: cannot join archived events */}
            {event.status === 'COMPLETED' || new Date(event.startsAt).getTime() < Date.now() ? (
              <div className="space-y-2.5">
                {event.viewerParticipationStatus === 'CONFIRMED' && (
                  <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-900 flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Вы принимали участие в этой встрече.</span>
                  </div>
                )}
                <div className="p-3.5 rounded-2xl bg-slate-100 border border-slate-200 text-xs text-slate-700 font-bold text-center">
                  Мероприятие завершено (в архиве). Запись закрыта.
                </div>
              </div>
            ) : isOrganizer ? (
              <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-xs font-bold text-blue-950 flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Вы являетесь организатором этой встречи и управляете составом участников.</span>
              </div>
            ) : event.viewerParticipationStatus === 'CONFIRMED' ? (
              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-900 flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Ваше участие подтверждено! Вы в основном списке участников.</span>
                </div>
                <button
                  type="button"
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
                  type="button"
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
                  type="button"
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
                  type="button"
                  onClick={handleJoinOrApply}
                  disabled={submittingJoin}
                  className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-display font-bold text-sm shadow-lg shadow-blue-600/20 transition-colors"
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
                <div className="flex items-center gap-2">
                  {event.organizerAvatarUrl ? (
                    <img
                      src={event.organizerAvatarUrl}
                      alt={event.organizerDisplayName}
                      className="w-6 h-6 rounded-full object-cover border border-slate-200"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center">
                      {event.organizerDisplayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span>{event.organizerDisplayName}</span>
                </div>
                <span className="text-blue-600">Профиль →</span>
              </Link>
            </div>

            {/* Flexible Organizer Controls (#6, #26) */}
            {isOrganizer && (
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <div className="text-[11px] font-bold text-slate-500 uppercase">Управление организатора</div>
                <button
                  type="button"
                  onClick={openEditEventModal}
                  className="w-full py-2.5 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-blue-900 text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                  <span>Изменить время, место, обложку или описание</span>
                </button>

                {event.status === 'PUBLISHED' && !showCancelBox && (
                  <button
                    type="button"
                    onClick={() => setShowCancelBox(true)}
                    className="w-full py-2 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold"
                  >
                    Отменить / приостановить встречу
                  </button>
                )}

                {event.status === 'PUBLISHED' && showCancelBox && (
                  <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 space-y-2">
                    <label className="block text-[11px] font-bold text-amber-950">
                      Укажите причину отмены для участников:
                    </label>
                    <input
                      type="text"
                      value={cancelReasonText}
                      onChange={(e) => setCancelReasonText(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-amber-300 text-xs bg-white"
                    />
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleCancelOccurrenceByOrganizer(false)}
                        className="flex-1 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold"
                      >
                        Отменить эту встречу
                      </button>
                      {event.recurringOccurrence && (
                        <button
                          type="button"
                          onClick={() => handleCancelOccurrenceByOrganizer(true)}
                          className="flex-1 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold"
                        >
                          Всю серию
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setShowCancelBox(false)}
                        className="px-2.5 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-600 text-[11px] font-bold"
                      >
                        Назад
                      </button>
                    </div>
                  </div>
                )}

                {event.status === 'CANCELLED_BY_ORGANIZER' && (
                  <button
                    type="button"
                    onClick={handleRestoreByOrganizer}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Возобновить встречу (Открыть запись)</span>
                  </button>
                )}

                {!showDeleteConfirm ? (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full py-2 rounded-xl border border-rose-200 bg-rose-50/70 hover:bg-rose-100 text-rose-700 text-xs font-bold inline-flex items-center justify-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Удалить мероприятие</span>
                  </button>
                ) : (
                  <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 space-y-2">
                    <div className="text-[11px] font-bold text-rose-900">
                      Удалить мероприятие навсегда? Записанным участникам придёт уведомление.
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        disabled={deletingEvent}
                        onClick={handleDeleteEventByOrganizer}
                        className="flex-1 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold"
                      >
                        {deletingEvent ? 'Удаление...' : 'Да, удалить'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(false)}
                        className="px-2.5 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-600 text-[11px] font-bold"
                      >
                        Отмена
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Admin Moderation Box (#30) */}
            {isAdmin && (
              <div className="pt-3 border-t border-slate-200 space-y-2">
                <div className="text-[11px] font-bold text-rose-700 uppercase flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Модерация администратора</span>
                </div>
                {event.status === 'PUBLISHED' ? (
                  <>
                    <input
                      type="text"
                      value={adminReason}
                      onChange={(e) => setAdminReason(e.target.value)}
                      placeholder="Причина снятия с публикации..."
                      className="w-full px-3 py-1.5 rounded-xl border border-rose-200 text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleAdminUnpublish}
                      className="w-full py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
                    >
                      Снять мероприятие с публикации
                    </button>
                  </>
                ) : event.status === 'UNPUBLISHED_BY_ADMIN' ? (
                  <button
                    type="button"
                    onClick={handleAdminRepublish}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Вернуть в публикацию (Разбанить)</span>
                  </button>
                ) : null}
              </div>
            )}
          </div>

          {/* Pending Applications (Approval strictly by Organizer / Community Admin #19, inline reject #20) */}
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
                      <div className="space-y-2 pt-1">
                        {rejectingAppId === app.participationId ? (
                          <div className="space-y-1.5 p-2.5 rounded-xl bg-rose-50 border border-rose-200">
                            <label className="block text-[10px] font-bold text-rose-900">
                              Причина отказа для участника:
                            </label>
                            <input
                              type="text"
                              value={rejectReasonText}
                              onChange={(e) => setRejectReasonText(e.target.value)}
                              placeholder="Укажите причину отказа..."
                              className="w-full px-2.5 py-1.5 rounded-lg border border-rose-300 text-xs bg-white"
                            />
                            <div className="flex gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleDecision(app.participationId, 'REJECTED', rejectReasonText)}
                                className="flex-1 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold"
                              >
                                Подтвердить отказ
                              </button>
                              <button
                                type="button"
                                onClick={() => setRejectingAppId(null)}
                                className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 text-slate-600 text-[11px] font-bold"
                              >
                                Отмена
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleDecision(app.participationId, 'CONFIRMED')}
                              className="flex-1 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                            >
                              Принять
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setRejectingAppId(app.participationId);
                                setRejectReasonText('К сожалению, все места для этого уровня заняты');
                              }}
                              className="flex-1 py-1.5 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-bold"
                            >
                              Отклонить
                            </button>
                          </div>
                        )}
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
                  <div
                    key={p.participationId}
                    className="flex items-center justify-between gap-2 p-2 rounded-xl hover:bg-slate-50 text-xs"
                  >
                    <Link
                      to={`/users/${p.userId}`}
                      className="flex items-center gap-2 min-w-0 flex-1"
                    >
                      {p.avatarUrl ? (
                        <img
                          src={p.avatarUrl}
                          alt={p.displayName}
                          className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0">
                          {p.displayName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="font-semibold text-slate-900 hover:text-blue-600 truncate">
                        {p.displayName}
                      </span>
                    </Link>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-slate-400">{p.city}</span>
                      {(isOrganizer || isAdmin) && p.userId !== event.organizerUserId && (
                        <button
                          type="button"
                          onClick={() => handleRemoveParticipant(p.participationId, p.displayName)}
                          title="Исключить участника из мероприятия"
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-bold transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Исключить</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {waitlistParticipants.length > 0 && (
              <div className="pt-3 border-t border-slate-100 space-y-1.5">
                <div className="text-xs font-bold text-slate-500">
                  Лист ожидания ({waitlistParticipants.length})
                </div>
                {waitlistParticipants.map((w) => (
                  <div
                    key={w.participationId}
                    className="flex items-center justify-between gap-2 text-xs text-slate-600 py-1"
                  >
                    <Link to={`/users/${w.userId}`} className="hover:text-blue-600 truncate">
                      • {w.displayName}
                    </Link>
                    {(isOrganizer || isAdmin) && (
                      <button
                        type="button"
                        onClick={() => handleRemoveParticipant(w.participationId, w.displayName)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-bold cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Исключить</span>
                      </button>
                    )}
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
            Автообновление в реальном времени • Фото, видео, документы и ссылки
          </span>
        </div>

        {/* Messages list */}
        <div
          ref={messagesContainerRef}
          className="space-y-4 max-h-[540px] overflow-y-auto pr-1 scroll-smooth"
        >
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

                  <div className="flex items-center gap-2">
                    {user && m.status === 'VISIBLE' && m.authorUserId !== user.id && (
                      <Link
                        to={`/support?targetType=DISCUSSION_MESSAGE&targetId=${m.id}&subject=${encodeURIComponent(
                          `Жалоба на сообщение от ${m.authorDisplayName} в «${event.title}»`
                        )}`}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 text-[11px] font-semibold transition-colors"
                      >
                        <Flag className="w-3 h-3" />
                        <span>Пожаловаться</span>
                      </Link>
                    )}

                    {isAdmin && m.status === 'VISIBLE' && (
                      <div>
                        {hidingMsgId === m.id ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={hideMsgReason}
                              onChange={(e) => setHideMsgReason(e.target.value)}
                              placeholder="Причина скрытия..."
                              className="px-2 py-1 rounded-lg border border-rose-300 text-xs bg-white"
                            />
                            <button
                              type="button"
                              onClick={() => handleAdminHideMessage(m.id)}
                              className="px-2.5 py-1 rounded-lg bg-rose-600 text-white text-[11px] font-bold"
                            >
                              Скрыть
                            </button>
                            <button
                              type="button"
                              onClick={() => setHidingMsgId(null)}
                              className="px-2 py-1 rounded-lg bg-slate-200 text-slate-700 text-[11px] font-bold"
                            >
                              ×
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setHidingMsgId(m.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-800 text-[11px] font-bold"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Скрыть сообщение</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
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
                          <span>Смотреть видео: {m.externalVideoUrl}</span>
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
                                className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white cursor-pointer"
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

        {/* Sleek Compose Message Form (#2) */}
        {user ? (
          <form onSubmit={handleSendMessage} className="space-y-2.5 pt-3 border-t border-slate-100">
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

            {showLinkBar && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-slate-50 border border-slate-200">
                <Link2 className="w-4 h-4 text-blue-600 shrink-0" />
                <input
                  type="url"
                  value={attachedUrl}
                  onChange={(e) => setAttachedUrl(e.target.value)}
                  placeholder="Вставьте ссылку на сайт, маршрут или видео (VK Видео / YouTube / Rutube)..."
                  className="flex-1 bg-transparent text-xs text-slate-800 focus:outline-none"
                />
                {attachedUrl && (
                  <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-bold shrink-0">
                    {isVideoLink(attachedUrl) ? 'Видео-ссылка' : 'Веб-ссылка'}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setAttachedUrl('');
                    setShowLinkBar(false);
                  }}
                  className="text-slate-400 hover:text-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-2xl p-2 focus-within:border-blue-500 focus-within:bg-white transition-colors">
              <label
                title="Прикрепить фото, видео или документ"
                className="cursor-pointer p-2.5 rounded-xl hover:bg-slate-200/70 text-slate-600 hover:text-blue-600 transition-colors shrink-0"
              >
                <Paperclip className="w-4 h-4" />
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
                title="Прикрепить ссылку или видео"
                onClick={() => setShowLinkBar(!showLinkBar)}
                className={`p-2.5 rounded-xl transition-colors shrink-0 ${
                  showLinkBar || attachedUrl
                    ? 'bg-blue-100 text-blue-700'
                    : 'hover:bg-slate-200/70 text-slate-600 hover:text-blue-600'
                }`}
              >
                <Link2 className="w-4 h-4" />
              </button>

              <textarea
                rows={1}
                value={msgText}
                onChange={(e) => setMsgText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
                placeholder={
                  uploadingFile
                    ? 'Загрузка файла...'
                    : 'Напишите сообщение в чат встречи (Enter — отправить)...'
                }
                className="flex-1 bg-transparent px-2 py-2 text-sm text-slate-900 focus:outline-none resize-none max-h-32"
              />

              <button
                type="submit"
                disabled={uploadingFile}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-display font-bold text-xs shadow-sm shrink-0 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Отправить</span>
              </button>
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

      {/* Edit Event Modal rendered via Portal so full-screen blur and top card header are never clipped */}
      {showEditModal &&
        createPortal(
          <div className="fixed inset-0 !m-0 z-[300] bg-slate-900/65 backdrop-blur-sm overflow-y-auto flex items-start justify-center p-4 sm:p-6">
            <div className="bg-white rounded-3xl border border-slate-200 max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-5 my-auto relative">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-extrabold text-xl text-slate-900">
                  Редактировать мероприятие
                </h3>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEditedEvent} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Название встречи *</label>
                  <input
                    type="text"
                    required
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Описание *</label>
                  <textarea
                    rows={3}
                    required
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                  />
                </div>

                {/* Cover image management (#6: replace or remove cover) */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs">
                    <div className="font-bold text-slate-800">Обложка мероприятия</div>
                    <div className="text-slate-500 mt-0.5">
                      {editRemoveCoverImage
                        ? 'Обложка будет удалена (вернётся стандартная иллюстрация)'
                        : editCoverFilename
                        ? `Загружена новая обложка: ${editCoverFilename}`
                        : event.coverImageUrl
                        ? 'Установлена пользовательская обложка'
                        : 'Используется стандартная иллюстрация'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="cursor-pointer px-3 py-2 rounded-xl bg-white border border-slate-300 hover:border-blue-400 text-xs font-bold text-slate-700 inline-flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                      <span>{uploadingEditCover ? 'Загрузка...' : 'Загрузить фото'}</span>
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.webp,.gif"
                        onChange={handleEditCoverUpload}
                        className="hidden"
                      />
                    </label>
                    {(event.coverImageUrl || editCoverAttachmentId) && !editRemoveCoverImage && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditCoverAttachmentId(null);
                          setEditCoverFilename(null);
                          setEditRemoveCoverImage(true);
                        }}
                        className="px-3 py-2 rounded-xl bg-rose-50 border border-rose-200 hover:bg-rose-100 text-xs font-bold text-rose-700 inline-flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Удалить обложку</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editIsOnline}
                      onChange={(e) => setEditIsOnline(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-xs font-bold text-slate-900">
                      🌐 Онлайн-мероприятие (время по локальному поясу участника: {getBrowserLocalTzLabel()})
                    </span>
                  </label>

                  {editIsOnline ? (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Платформа или ссылка на онлайн-подключение *
                      </label>
                      <input
                        type="text"
                        required
                        value={editAddress}
                        onChange={(e) => setEditAddress(e.target.value)}
                        placeholder="Zoom / Телемост / Discord / ссылка"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
                      />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Город / Регион *</label>
                        <RegionSelect
                          value={editCity}
                          onChange={(newCity) => {
                            setEditCity(newCity);
                            const reg = getRegionInfo(newCity);
                            if (reg) {
                              setEditLatitude(reg.lat);
                              setEditLongitude(reg.lng);
                            }
                          }}
                        />
                      </div>
                      <MapAddressPicker
                        city={editCity}
                        address={editAddress}
                        latitude={editLatitude}
                        longitude={editLongitude}
                        onChange={({ address, latitude, longitude }) => {
                          setEditAddress(address);
                          setEditLatitude(latitude);
                          setEditLongitude(longitude);
                        }}
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Новое время начала *</label>
                    <CustomDateTimePicker
                      value={editStartsAtLocal}
                      onChange={setEditStartsAtLocal}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Длительность (минут)</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={editDurationStr}
                      onChange={(e) => setEditDurationStr(e.target.value.replace(/\D/g, ''))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Режим записи</label>
                    <CustomSelect
                      value={editJoinMode}
                      onChange={(v) => setEditJoinMode(v as 'OPEN' | 'APPROVAL_REQUIRED')}
                      options={[
                        { value: 'OPEN', label: 'Свободное участие' },
                        { value: 'APPROVAL_REQUIRED', label: 'По заявке' },
                      ]}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Уровень</label>
                    <CustomSelect
                      value={editSkillLevel}
                      onChange={setEditSkillLevel}
                      options={Object.entries(SKILL_LABELS).map(([k, v]) => ({
                        value: k,
                        label: v,
                      }))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Лимит участников</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={editMaxParticipants}
                      onChange={(e) => setEditMaxParticipants(e.target.value.replace(/\D/g, ''))}
                      placeholder="Без лимита"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Условия участия</label>
                    <input
                      type="text"
                      value={editConditions}
                      onChange={(e) => setEditConditions(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Что взять с собой</label>
                    <input
                      type="text"
                      value={editWhatToBring}
                      onChange={(e) => setEditWhatToBring(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 cursor-pointer"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    disabled={savingEdit}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md cursor-pointer"
                  >
                    {savingEdit ? 'Сохранение...' : 'Сохранить изменения'}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* Lightbox Modal for full-size images rendered via Portal */}
      {lightboxImageUrl &&
        createPortal(
          <div
            onClick={() => setLightboxImageUrl(null)}
            className="fixed inset-0 !m-0 z-[310] bg-black/85 backdrop-blur-md overflow-y-auto flex items-start justify-center p-4 sm:p-6"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-4xl my-auto"
            >
              <img
                src={lightboxImageUrl}
                alt="Полноразмерный просмотр"
                className="max-h-[88vh] w-auto rounded-2xl shadow-2xl"
              />
              <button
                type="button"
                onClick={() => setLightboxImageUrl(null)}
                className="absolute -top-3 -right-3 w-9 h-9 rounded-full bg-white text-slate-900 font-bold flex items-center justify-center shadow-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
