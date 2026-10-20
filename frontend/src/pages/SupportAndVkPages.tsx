import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  Download,
  ExternalLink,
  FileText,
  HelpCircle,
  Image as ImageIcon,
  MessageCircle,
  Paperclip,
  Send,
  ShieldCheck,
  Sparkles,
  Ticket,
  X,
} from 'lucide-react';
import {
  apiFetch,
  ApiError,
  formatDateTime,
  getAuthToken,
  TICKET_CATEGORY_LABELS,
  TICKET_STATUS_LABELS,
  uploadAttachmentFile,
} from '../api';
import { useAuth } from '../AuthContext';
import {
  EventCardDto,
  NotificationDto,
  OrganizationDto,
  PublicUserProfileDto,
  SupportConversationDto,
  SupportTicketDto,
  VkStatusDto,
} from '../types';
import { CustomSelect } from '../components/UiControls';

const GENERAL_SUPPORT_CATEGORIES: Record<string, string> = {
  TECHNICAL_ISSUE: 'Техническая проблема',
  ACCOUNT_ISSUE: 'Проблема с аккаунтом',
  NOTIFICATION_ISSUE: 'Проблема с уведомлениями / VK',
  OTHER: 'Другое обращение в поддержку',
};

export const SupportPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const [tab, setTab] = useState<'TICKETS' | 'CHAT'>(() =>
    location.pathname.endsWith('/chat') || searchParams.get('tab') === 'CHAT' ? 'CHAT' : 'TICKETS'
  );

  const [tickets, setTickets] = useState<SupportTicketDto[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [chatConv, setChatConv] = useState<SupportConversationDto | null>(null);
  const [loading, setLoading] = useState(true);

  // Contextual complaint parameters passed from a specific user profile, event, discussion message, or organization
  const initialTargetType = searchParams.get('targetType') || '';
  const initialTargetId = searchParams.get('targetId') || '';
  const initialSubject = searchParams.get('subject') || '';
  const isContextualComplaint = Boolean(initialTargetType && initialTargetId);

  const resolveCategoryFromTarget = (tType: string) => {
    if (tType === 'EVENT') return 'EVENT_COMPLAINT';
    if (tType === 'USER' || tType === 'DISCUSSION_MESSAGE') return 'USER_COMPLAINT';
    if (tType === 'ORGANIZATION') return 'ORGANIZATION_COMPLAINT';
    return 'TECHNICAL_ISSUE';
  };

  const [category, setCategory] = useState<string>(() =>
    resolveCategoryFromTarget(initialTargetType)
  );
  const [subject, setSubject] = useState(initialSubject);
  const [description, setDescription] = useState('');
  const [targetType, setTargetType] = useState<string>(initialTargetType);
  const [targetId, setTargetId] = useState<string>(initialTargetId);
  const [attachmentId, setAttachmentId] = useState<string | null>(null);
  const [attachmentName, setAttachmentName] = useState<string>('');
  const [creatingTicket, setCreatingTicket] = useState(false);

  // Ticket Reply
  const [ticketReplyText, setTicketReplyText] = useState('');

  // Live Chat Input
  const [chatText, setChatText] = useState('');

  const ticketMessagesRef = useRef<HTMLDivElement>(null);
  const liveChatMessagesRef = useRef<HTMLDivElement>(null);
  const prevTicketMsgLenRef = useRef<number>(0);
  const prevTicketIdRef = useRef<string | null>(null);
  const prevChatMsgLenRef = useRef<number>(0);

  const selectedTicket = tickets.find((t) => t.id === selectedTicketId) || tickets[0] || null;

  useEffect(() => {
    if (location.pathname.endsWith('/chat') || searchParams.get('tab') === 'CHAT') {
      setTab('CHAT');
    }
    const nextType = searchParams.get('targetType') || '';
    const nextId = searchParams.get('targetId') || '';
    const nextSubject = searchParams.get('subject') || '';
    setTargetType(nextType);
    setTargetId(nextId);
    setCategory(resolveCategoryFromTarget(nextType));
    if (nextSubject) {
      setSubject(nextSubject);
    }
  }, [location.pathname, searchParams]);

  const loadSupportData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [tList, cDto] = await Promise.all([
        apiFetch<SupportTicketDto[]>('/api/v1/support/tickets/my'),
        apiFetch<SupportConversationDto>('/api/v1/support/chat'),
      ]);
      setTickets(tList);
      setSelectedTicketId((prev) => {
        if (prev && tList.some((x) => x.id === prev)) return prev;
        return tList.length > 0 ? tList[0].id : null;
      });
      setChatConv(cDto);
    } catch {
      // ignore
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadSupportData(false);

    // Real-time background polling every 3s (#21, #24)
    const interval = setInterval(() => {
      loadSupportData(true);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Smart scroll ticket messages: only scroll if ticket switched, initial load, or user is near bottom (#16)
  useEffect(() => {
    const count = selectedTicket?.messages?.length || 0;
    const ticketSwitched = selectedTicket?.id !== prevTicketIdRef.current;
    const container = ticketMessagesRef.current;
    const isNearBottom =
      !container ||
      container.scrollHeight - container.scrollTop - container.clientHeight < 140;

    if (ticketSwitched || (count > prevTicketMsgLenRef.current && (prevTicketMsgLenRef.current === 0 || isNearBottom))) {
      setTimeout(() => {
        if (ticketMessagesRef.current) {
          ticketMessagesRef.current.scrollTop = ticketMessagesRef.current.scrollHeight;
        }
      }, 50);
    }
    prevTicketIdRef.current = selectedTicket?.id || null;
    prevTicketMsgLenRef.current = count;
  }, [selectedTicket?.id, selectedTicket?.messages?.length]);

  // Smart scroll live support chat: only scroll on initial load or when user is near bottom (#16)
  useEffect(() => {
    const count = chatConv?.messages?.length || 0;
    const container = liveChatMessagesRef.current;
    const isNearBottom =
      !container ||
      container.scrollHeight - container.scrollTop - container.clientHeight < 140;

    if (count > prevChatMsgLenRef.current && (prevChatMsgLenRef.current === 0 || isNearBottom)) {
      setTimeout(() => {
        if (liveChatMessagesRef.current) {
          liveChatMessagesRef.current.scrollTop = liveChatMessagesRef.current.scrollHeight;
        }
      }, 50);
    }
    prevChatMsgLenRef.current = count;
  }, [chatConv?.messages?.length, tab]);

  const handleUploadTicketAttachment = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const att = await uploadAttachmentFile(file, 'TICKET');
      setAttachmentId(att.id);
      setAttachmentName(att.originalFilename);
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Ошибка загрузки файла');
    } finally {
      e.target.value = '';
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingTicket(true);
    try {
      const created = await apiFetch<SupportTicketDto>('/api/v1/support/tickets', {
        method: 'POST',
        body: JSON.stringify({
          category,
          subject,
          description,
          targetType: isContextualComplaint ? targetType : null,
          targetId: isContextualComplaint ? targetId : null,
          attachmentId,
        }),
      });
      setTickets((prev) => [created, ...prev]);
      setSelectedTicketId(created.id);
      if (!isContextualComplaint) {
        setSubject('');
      }
      setDescription('');
      setAttachmentId(null);
      setAttachmentName('');
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Не удалось создать обращение');
    } finally {
      setCreatingTicket(false);
    }
  };

  const handleReplyTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !ticketReplyText.trim()) return;
    try {
      const updated = await apiFetch<SupportTicketDto>(
        `/api/v1/support/tickets/${selectedTicket.id}/reply`,
        {
          method: 'POST',
          body: JSON.stringify({ content: ticketReplyText }),
        }
      );
      setTickets((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
      setSelectedTicketId(updated.id);
      setTicketReplyText('');
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Ошибка отправки ответа');
    }
  };

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatText.trim()) return;
    try {
      const updated = await apiFetch<SupportConversationDto>('/api/v1/support/chat/messages', {
        method: 'POST',
        body: JSON.stringify({ content: chatText }),
      });
      setChatConv(updated);
      setChatText('');
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Не удалось отправить сообщение');
    }
  };

  const buildDownloadUrl = (url: string) => {
    const token = getAuthToken();
    if (!token) return url;
    return url.includes('?') ? `${url}&token=${encodeURIComponent(token)}` : `${url}?token=${encodeURIComponent(token)}`;
  };

  return (
    <div className="space-y-8 pb-16">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900">
            Центр поддержки пользователей
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Технические обращения в поддержку, отслеживание ваших обращений и живой чат с администратором
          </p>
        </div>

        <div className="flex gap-2 p-1 rounded-2xl bg-slate-200/80">
          <button
            type="button"
            onClick={() => setTab('TICKETS')}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              tab === 'TICKETS' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-700'
            }`}
          >
            <Ticket className="w-3.5 h-3.5" />
            <span>Мои обращения ({tickets.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setTab('CHAT')}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              tab === 'CHAT' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-700'
            }`}
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>Чат технической поддержки</span>
          </button>
        </div>
      </div>

      {tab === 'TICKETS' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column: Create Ticket + List */}
          <div className="space-y-6">
            <form
              onSubmit={handleCreateTicket}
              className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-3.5"
            >
              <h2 className="font-display font-bold text-base text-slate-900">
                {isContextualComplaint ? 'Отправка жалобы модератору' : 'Создать обращение в поддержку'}
              </h2>

              {isContextualComplaint ? (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 space-y-1.5 text-xs text-rose-950">
                  <div className="font-bold text-rose-900">
                    Категория: {TICKET_CATEGORY_LABELS[category] || category}
                  </div>
                  <div className="text-[11px] text-rose-800">
                    Объект жалобы зафиксирован ({targetType === 'EVENT'
                      ? 'Мероприятие'
                      : targetType === 'USER'
                      ? 'Профиль пользователя'
                      : targetType === 'DISCUSSION_MESSAGE'
                      ? 'Сообщение в обсуждении'
                      : 'Организация / сообщество'}{' '}
                    #{targetId.slice(0, 8)}) и не может быть изменён вручную.
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Категория вопроса *</label>
                    <CustomSelect
                      size="sm"
                      value={category}
                      onChange={setCategory}
                      options={Object.entries(GENERAL_SUPPORT_CATEGORIES).map(([k, v]) => ({
                        value: k,
                        label: v,
                      }))}
                    />
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 leading-relaxed">
                    Чтобы пожаловаться на конкретного пользователя, мероприятие, организацию или сообщение, нажмите кнопку <strong>«Пожаловаться»</strong> непосредственно на соответствующей странице.
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Тема обращения *</label>
                <input
                  type="text"
                  required
                  readOnly={isContextualComplaint}
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Кратко укажите суть обращения"
                  className={`w-full px-3 py-2 rounded-xl border border-slate-300 text-xs ${
                    isContextualComplaint ? 'bg-slate-100 text-slate-700 cursor-not-allowed' : ''
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Подробное описание *</label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Опишите проблему, укажите детали..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="cursor-pointer inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:underline">
                  <Paperclip className="w-3.5 h-3.5" />
                  <span className="truncate max-w-[210px]">
                    {attachmentName || 'Приложить скриншот / документ'}
                  </span>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,.gif,.pdf,.txt,.doc,.docx"
                    onChange={handleUploadTicketAttachment}
                    className="hidden"
                  />
                </label>
                {attachmentName && (
                  <button
                    type="button"
                    onClick={() => {
                      setAttachmentId(null);
                      setAttachmentName('');
                    }}
                    className="text-slate-400 hover:text-rose-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={creatingTicket}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-display font-bold text-xs shadow-sm"
              >
                {creatingTicket ? 'Отправка...' : 'Отправить обращение'}
              </button>
            </form>

            {/* My Tickets List */}
            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-3">
              <div className="font-display font-bold text-sm text-slate-900">
                Мои обращения ({tickets.length})
              </div>
              {loading && tickets.length === 0 ? (
                <div className="h-24 rounded-2xl bg-slate-100 animate-pulse" />
              ) : tickets.length === 0 ? (
                <p className="text-xs text-slate-500">У вас пока нет зарегистрированных обращений.</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {tickets.map((t) => {
                    const st = TICKET_STATUS_LABELS[t.status] || {
                      label: t.status,
                      color: 'bg-slate-100 text-slate-700',
                    };
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setSelectedTicketId(t.id)}
                        className={`w-full text-left p-3.5 rounded-2xl border transition-colors space-y-1 ${
                          selectedTicket?.id === t.id
                            ? 'bg-blue-50/70 border-blue-400'
                            : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono font-bold text-xs text-blue-700">
                            {t.ticketNumber}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${st.color}`}>
                            {st.label}
                          </span>
                        </div>
                        <div className="font-bold text-xs text-slate-900 line-clamp-1">{t.subject}</div>
                        <div className="text-[11px] text-slate-500">
                          {TICKET_CATEGORY_LABELS[t.category] || t.category} • {formatDateTime(t.updatedAt)}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right column: Selected Ticket Thread */}
          <div className="lg:col-span-2">
            {selectedTicket ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
                <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-extrabold text-sm text-blue-600">
                        {selectedTicket.ticketNumber}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          TICKET_STATUS_LABELS[selectedTicket.status]?.color || 'bg-slate-100'
                        }`}
                      >
                        {TICKET_STATUS_LABELS[selectedTicket.status]?.label || selectedTicket.status}
                      </span>
                    </div>
                    <h2 className="font-display font-bold text-xl text-slate-900 mt-1">
                      {selectedTicket.subject}
                    </h2>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Категория: {TICKET_CATEGORY_LABELS[selectedTicket.category]} • Создано:{' '}
                      {formatDateTime(selectedTicket.createdAt)}
                    </div>
                  </div>
                </div>

                {selectedTicket.resolutionSummary && (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950">
                    <span className="font-bold block mb-0.5">Итог рассмотрения администратором:</span>
                    {selectedTicket.resolutionSummary}
                  </div>
                )}

                <div
                  ref={ticketMessagesRef}
                  className="space-y-3 max-h-[420px] overflow-y-auto pr-1 scroll-smooth"
                >
                  {selectedTicket.messages.map((m) => (
                    <div
                      key={m.id}
                      className={`p-4 rounded-2xl border text-xs space-y-2 ${
                        m.adminReply
                          ? 'bg-blue-50/70 border-blue-200 ml-4'
                          : 'bg-slate-50 border-slate-200 mr-4'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">
                          {m.authorDisplayName}{' '}
                          {m.adminReply && (
                            <span className="ml-1 px-2 py-0.5 rounded bg-slate-900 text-white text-[10px]">
                              Администратор поддержки
                            </span>
                          )}
                        </span>
                        <span className="text-slate-400">{formatDateTime(m.createdAt)}</span>
                      </div>
                      <p className="text-sm text-slate-800 whitespace-pre-line">{m.content}</p>
                      {m.attachment && (
                        <div className="pt-1 space-y-2">
                          {m.attachment.attachmentType === 'IMAGE' && (
                            <a
                              href={buildDownloadUrl(m.attachment.downloadUrl)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-block rounded-xl overflow-hidden border border-slate-200 bg-white"
                            >
                              <img
                                src={buildDownloadUrl(m.attachment.downloadUrl)}
                                alt={m.attachment.originalFilename}
                                className="max-h-52 w-auto object-contain"
                              />
                            </a>
                          )}
                          <div>
                            <a
                              href={buildDownloadUrl(m.attachment.downloadUrl)}
                              download={m.attachment.originalFilename}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-blue-400 text-blue-600 font-bold text-xs"
                            >
                              {m.attachment.attachmentType === 'IMAGE' ? (
                                <ImageIcon className="w-3.5 h-3.5" />
                              ) : (
                                <FileText className="w-3.5 h-3.5" />
                              )}
                              <span>Скачать вложение: {m.attachment.originalFilename}</span>
                              <Download className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {selectedTicket.status !== 'CLOSED' && (
                  <form onSubmit={handleReplyTicket} className="flex gap-2 pt-3 border-t border-slate-100">
                    <input
                      type="text"
                      required
                      value={ticketReplyText}
                      onChange={(e) => setTicketReplyText(e.target.value)}
                      placeholder="Написать ответ в обращение (обновляется автоматически)..."
                      className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-sm"
                    />
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-display font-bold text-xs"
                    >
                      Отправить
                    </button>
                  </form>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center text-xs text-slate-500">
                Выберите обращение слева или создайте новое обращение.
              </div>
            )}
          </div>
        </div>
      ) : (
        /* LIVE SUPPORT CHAT */
        <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-100">
            <div>
              <h2 className="font-display font-bold text-lg text-slate-900 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-blue-600" />
                <span>Прямой диалог с технической поддержкой (Live-чат)</span>
              </h2>
              <p className="text-xs text-slate-500">
                Сообщения обновляются в реальном времени без перезагрузки страницы
              </p>
            </div>
            <button
              type="button"
              onClick={() => setTab('TICKETS')}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
            >
              Оформить официальное обращение →
            </button>
          </div>

          <div
            ref={liveChatMessagesRef}
            className="space-y-3 max-h-[420px] overflow-y-auto p-2 scroll-smooth"
          >
            {!chatConv || chatConv.messages.length === 0 ? (
              <div className="p-8 rounded-2xl bg-slate-50 text-center text-xs text-slate-500">
                Напишите ваш вопрос ниже — администратор ответит вам в этом диалоге.
              </div>
            ) : (
              chatConv.messages.map((m) => (
                <div
                  key={m.id}
                  className={`p-4 rounded-2xl border text-xs space-y-1 ${
                    m.fromAdmin
                      ? 'bg-emerald-50/70 border-emerald-200 mr-8'
                      : 'bg-blue-50/70 border-blue-200 ml-8'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">
                      {m.fromAdmin ? `Администратор (${m.senderDisplayName})` : 'Вы'}
                    </span>
                    <span className="text-slate-400">{formatDateTime(m.createdAt)}</span>
                  </div>
                  <p className="text-sm text-slate-800 whitespace-pre-line">{m.content}</p>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleSendChatMessage} className="flex gap-2.5 pt-3 border-t border-slate-100">
            <input
              type="text"
              required
              value={chatText}
              onChange={(e) => setChatText(e.target.value)}
              placeholder="Введите вопрос для технической поддержки..."
              className="flex-1 px-4 py-3 rounded-2xl border border-slate-300 text-sm"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-display font-bold text-xs shadow-sm"
            >
              <Send className="w-4 h-4" />
              <span>Отправить</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export const NotificationsAndVkPage: React.FC = () => {
  const { refreshUnreadCount } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [vkStatus, setVkStatus] = useState<VkStatusDto | null>(null);
  const [vkActionFeedback, setVkActionFeedback] = useState<string | null>(null);
  const [connectingVk, setConnectingVk] = useState(false);

  const loadAll = async () => {
    try {
      const [nList, vk] = await Promise.all([
        apiFetch<NotificationDto[]>('/api/v1/notifications'),
        apiFetch<VkStatusDto>('/api/v1/vk/status'),
      ]);
      setNotifications(nList);
      setVkStatus(vk);
      await refreshUnreadCount();
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadAll();
    const onUpdated = () => {
      loadAll();
    };
    window.addEventListener('sp-notifications-updated', onUpdated);
    return () => window.removeEventListener('sp-notifications-updated', onUpdated);
  }, []);

  useEffect(() => {
    if (!vkStatus?.activeLinkCode || vkStatus.linked) return;
    const interval = setInterval(async () => {
      try {
        const vk = await apiFetch<VkStatusDto>('/api/v1/vk/status');
        setVkStatus(vk);
        if (vk.linked) {
          setVkActionFeedback('Аккаунт ВКонтакте успешно привязан к вашему профилю!');
        }
      } catch {
        // ignore
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [vkStatus?.activeLinkCode, vkStatus?.linked]);

  const buildVkBotDeepLink = (clubUrl: string, code: string) => {
    const match = clubUrl.match(/club(\d+)/i);
    if (match?.[1]) {
      return `https://vk.com/write-${match[1]}?ref=${encodeURIComponent(code)}`;
    }
    const sep = clubUrl.includes('?') ? '&' : '?';
    return `${clubUrl}${sep}ref=${encodeURIComponent(code)}`;
  };

  const handleOneClickConnectVk = async () => {
    setConnectingVk(true);
    setVkActionFeedback(null);
    try {
      const vk = await apiFetch<VkStatusDto>('/api/v1/vk/generate-code', { method: 'POST' });
      setVkStatus(vk);
      const code = vk.activeLinkCode || '';
      if (code) {
        try {
          await navigator.clipboard.writeText(code);
        } catch {
          // ignore clipboard permission errors
        }
        const deepLink = buildVkBotDeepLink(vk.clubUrl, code);
        window.open(deepLink, '_blank', 'noopener,noreferrer');
        setVkActionFeedback(
          'Диалог с сообществом ВКонтакте открыт. Нажмите «Начать» или отправьте сообщение в диалоге, чтобы завершить привязку.'
        );
      }
    } catch (err) {
      setVkActionFeedback(
        err instanceof ApiError ? err.message : 'Не удалось подготовить подключение ВКонтакте'
      );
    } finally {
      setConnectingVk(false);
    }
  };

  const handleUnlinkVk = async () => {
    const vk = await apiFetch<VkStatusDto>('/api/v1/vk/unlink', { method: 'POST' });
    setVkStatus(vk);
    setVkActionFeedback('Аккаунт ВКонтакте отвязан от профиля.');
  };

  const handleToggleVkEnabled = async (enabled: boolean) => {
    const vk = await apiFetch<VkStatusDto>(`/api/v1/vk/toggle-notifications?enabled=${enabled}`, {
      method: 'POST',
    });
    setVkStatus(vk);
  };

  const handleMarkSingleRead = async (n: NotificationDto, shouldNavigate = false) => {
    if (!n.read) {
      setNotifications((prev) =>
        prev.map((item) => (item.id === n.id ? { ...item, read: true } : item))
      );
      try {
        await apiFetch(`/api/v1/notifications/${n.id}/read`, { method: 'POST' });
      } catch {
        // ignore
      }
      await refreshUnreadCount();
      window.dispatchEvent(new CustomEvent('sp-notifications-updated'));
    }
    if (shouldNavigate && n.linkUrl) {
      navigate(n.linkUrl);
    }
  };

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
    try {
      await apiFetch('/api/v1/notifications/read-all', { method: 'POST' });
    } catch {
      // ignore
    }
    await refreshUnreadCount();
    window.dispatchEvent(new CustomEvent('sp-notifications-updated'));
  };

  return (
    <div className="space-y-8 pb-16">
      <div>
        <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900">
          Уведомления
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Оповещения о предстоящих тренировках, новых записях участников и ответах организаторов
        </p>
      </div>

      {/* VK NOTIFICATIONS CARD */}
      {vkStatus && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white font-display font-extrabold flex items-center justify-center">
                VK
              </div>
              <div>
                <h2 className="font-display font-bold text-lg text-slate-900">
                  Уведомления ВКонтакте
                </h2>
                <p className="text-xs text-slate-500">
                  Получайте мгновенные напоминания о сборах в личные сообщения ВКонтакте
                </p>
              </div>
            </div>

            {vkStatus.linked ? (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>Аккаунт ВКонтакте подключён</span>
              </span>
            ) : (
              <span className="px-3.5 py-1.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
                Не подключено
              </span>
            )}
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4 text-xs">
            <p className="text-slate-700 leading-relaxed">
              Подключите бота ВКонтакте, чтобы не пропускать изменения расписания, подтверждения участия и напоминания перед началом тренировки.
            </p>

            <div className="flex flex-wrap items-center gap-2.5">
              {!vkStatus.linked ? (
                <button
                  type="button"
                  disabled={connectingVk}
                  onClick={handleOneClickConnectVk}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-display font-bold text-xs shadow-sm transition-colors cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>
                    {connectingVk ? 'Подготовка ссылки...' : 'Подключить уведомления ВКонтакте'}
                  </span>
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => handleToggleVkEnabled(!vkStatus.notificationsEnabled)}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-700 cursor-pointer"
                  >
                    {vkStatus.notificationsEnabled
                      ? 'Приостановить доставку в VK'
                      : 'Включить доставку в VK'}
                  </button>
                  <button
                    type="button"
                    onClick={handleUnlinkVk}
                    className="px-4 py-2.5 rounded-xl border border-rose-200 text-rose-700 font-bold cursor-pointer"
                  >
                    Отвязать аккаунт
                  </button>
                </>
              )}
            </div>

            {vkActionFeedback && (
              <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-950 font-semibold leading-relaxed">
                {vkActionFeedback}
              </div>
            )}

            {!vkStatus.linked && vkStatus.activeLinkCode && (
              <div className="p-3.5 rounded-xl bg-white border border-slate-200 text-slate-700 flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs text-slate-600">
                  Код привязки вашего профиля:{' '}
                  <strong className="font-mono text-slate-900">{vkStatus.activeLinkCode}</strong>
                </div>
                <a
                  href={buildVkBotDeepLink(vkStatus.clubUrl, vkStatus.activeLinkCode)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 font-bold border border-blue-200"
                >
                  <span>Открыть диалог ВКонтакте</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* IN-APP NOTIFICATIONS LIST */}
      <section className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-600" />
            <h2 className="font-display font-bold text-xl text-slate-900">
              Все уведомления ({notifications.length})
            </h2>
          </div>

          {notifications.some((n) => !n.read) && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Отметить все как прочитанные</span>
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-50 text-center text-xs text-slate-500">
            У вас пока нет уведомлений.
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => handleMarkSingleRead(n, Boolean(n.linkUrl))}
                className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                  n.linkUrl ? 'cursor-pointer' : ''
                } ${
                  n.read
                    ? 'bg-white border-slate-200'
                    : 'bg-blue-50/60 border-blue-300 hover:bg-blue-50'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                    )}
                    <span className="font-display font-bold text-sm text-slate-900">{n.title}</span>
                    <span className="text-[11px] text-slate-400">{formatDateTime(n.createdAt)}</span>
                  </div>
                  <p className="text-xs text-slate-700">{n.message}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                  {!n.read && !n.linkUrl && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkSingleRead(n, false);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer"
                    >
                      Прочитано
                    </button>
                  )}
                  {n.linkUrl && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkSingleRead(n, true);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-800 text-xs font-bold transition-colors cursor-pointer"
                    >
                      Перейти →
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
