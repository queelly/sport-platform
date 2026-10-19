import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  ExternalLink,
  FileText,
  HelpCircle,
  MessageCircle,
  Paperclip,
  Send,
  ShieldCheck,
  Sparkles,
  Ticket,
} from 'lucide-react';
import {
  apiFetch,
  ApiError,
  formatDateTime,
  TICKET_CATEGORY_LABELS,
  TICKET_STATUS_LABELS,
  uploadAttachmentFile,
} from '../api';
import { useAuth } from '../AuthContext';
import {
  NotificationDto,
  SupportConversationDto,
  SupportTicketDto,
  VkStatusDto,
} from '../types';

export const SupportPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState<'TICKETS' | 'CHAT'>('TICKETS');

  const [tickets, setTickets] = useState<SupportTicketDto[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicketDto | null>(null);
  const [chatConv, setChatConv] = useState<SupportConversationDto | null>(null);
  const [loading, setLoading] = useState(true);

  // New Ticket Form
  const [category, setCategory] = useState<string>(
    searchParams.get('targetType') === 'EVENT'
      ? 'EVENT_COMPLAINT'
      : searchParams.get('targetType') === 'USER'
      ? 'USER_COMPLAINT'
      : searchParams.get('targetType') === 'ORGANIZATION'
      ? 'ORGANIZATION_COMPLAINT'
      : 'TECHNICAL_ISSUE'
  );
  const [subject, setSubject] = useState(searchParams.get('subject') || '');
  const [description, setDescription] = useState('');
  const [targetType] = useState(searchParams.get('targetType') || '');
  const [targetId] = useState(searchParams.get('targetId') || '');
  const [attachmentId, setAttachmentId] = useState<string | null>(null);
  const [attachmentName, setAttachmentName] = useState<string>('');
  const [creatingTicket, setCreatingTicket] = useState(false);

  // Ticket Reply
  const [ticketReplyText, setTicketReplyText] = useState('');

  // Live Chat Input
  const [chatText, setChatText] = useState('');

  const loadSupportData = async () => {
    setLoading(true);
    try {
      const [tList, cDto] = await Promise.all([
        apiFetch<SupportTicketDto[]>('/api/v1/support/tickets/my'),
        apiFetch<SupportConversationDto>('/api/v1/support/chat'),
      ]);
      setTickets(tList);
      if (tList.length > 0 && !selectedTicket) {
        setSelectedTicket(tList[0]);
      } else if (selectedTicket) {
        const refreshed = tList.find((x) => x.id === selectedTicket.id);
        if (refreshed) setSelectedTicket(refreshed);
      }
      setChatConv(cDto);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSupportData();
  }, []);

  const handleUploadTicketAttachment = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const att = await uploadAttachmentFile(file, 'TICKET');
      setAttachmentId(att.id);
      setAttachmentName(att.originalFilename);
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Ошибка загрузки файла');
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
          targetType: targetType || null,
          targetId: targetId || null,
          attachmentId,
        }),
      });
      setTickets((prev) => [created, ...prev]);
      setSelectedTicket(created);
      setSubject('');
      setDescription('');
      setAttachmentId(null);
      setAttachmentName('');
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Не удалось создать тикет');
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
      setSelectedTicket(updated);
      setTickets((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
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

  return (
    <div className="space-y-8 pb-16">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900">
            Центр поддержки пользователей
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Два отдельных канала: структурированные тикеты для жалоб и обращений или быстрый чат с технической поддержкой
          </p>
        </div>

        <div className="flex gap-2 p-1 rounded-2xl bg-slate-200/80">
          <button
            onClick={() => setTab('TICKETS')}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              tab === 'TICKETS' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-700'
            }`}
          >
            <Ticket className="w-3.5 h-3.5" />
            <span>Система тикетов и жалоб ({tickets.length})</span>
          </button>

          <button
            onClick={() => setTab('CHAT')}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
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
                Создать новый тикет / жалобу
              </h2>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Категория *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                >
                  {Object.entries(TICKET_CATEGORY_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Тема обращения *</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Кратко укажите суть обращения"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
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
                  <span>{attachmentName || 'Приложить скриншот / документ'}</span>
                  <input type="file" onChange={handleUploadTicketAttachment} className="hidden" />
                </label>
              </div>

              <button
                type="submit"
                disabled={creatingTicket}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-display font-bold text-xs shadow-sm"
              >
                {creatingTicket ? 'Отправка...' : 'Зарегистрировать тикет'}
              </button>
            </form>

            {/* My Tickets List */}
            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-3">
              <div className="font-display font-bold text-sm text-slate-900">
                Мои обращения ({tickets.length})
              </div>
              {tickets.length === 0 ? (
                <p className="text-xs text-slate-500">У вас пока нет зарегистрированных тикетов.</p>
              ) : (
                <div className="space-y-2">
                  {tickets.map((t) => {
                    const st = TICKET_STATUS_LABELS[t.status] || {
                      label: t.status,
                      color: 'bg-slate-100 text-slate-700',
                    };
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setSelectedTicket(t)}
                        className={`w-full text-left p-3.5 rounded-2xl border transition-all space-y-1 ${
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
                      Категория: {TICKET_CATEGORY_LABELS[selectedTicket.category]} • Создан:{' '}
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

                <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                  {selectedTicket.messages.map((m) => (
                    <div
                      key={m.id}
                      className={`p-4 rounded-2xl border text-xs space-y-1.5 ${
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
                        <a
                          href={m.attachment.downloadUrl}
                          download
                          className="inline-flex items-center gap-1.5 text-blue-600 font-bold hover:underline pt-1"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Вложение: {m.attachment.originalFilename}</span>
                        </a>
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
                      placeholder="Написать дополнительный комментарий в тикет..."
                      className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-sm"
                    />
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-display font-bold text-xs"
                    >
                      Отправить
                    </button>
                  </form>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center text-xs text-slate-500">
                Выберите тикет слева или создайте новое обращение.
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
                <span>Прямой диалог с технической поддержкой</span>
              </h2>
              <p className="text-xs text-slate-500">
                Задайте быстрый вопрос администратору платформы без оформления официальной жалобы
              </p>
            </div>
            <button
              onClick={() => setTab('TICKETS')}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
            >
              Оформить официальный тикет →
            </button>
          </div>

          <div className="space-y-3 max-h-[420px] overflow-y-auto p-2">
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
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [vkStatus, setVkStatus] = useState<VkStatusDto | null>(null);
  const [simBotInput, setSimBotInput] = useState('');
  const [simBotReply, setSimBotReply] = useState<string | null>(null);
  const [reminderResult, setReminderResult] = useState<string | null>(null);

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
  }, []);

  const handleGenerateCode = async () => {
    const vk = await apiFetch<VkStatusDto>('/api/v1/vk/generate-code', { method: 'POST' });
    setVkStatus(vk);
    if (vk.activeLinkCode) {
      setSimBotInput(vk.activeLinkCode);
    }
  };

  const handleUnlinkVk = async () => {
    const vk = await apiFetch<VkStatusDto>('/api/v1/vk/unlink', { method: 'POST' });
    setVkStatus(vk);
  };

  const handleToggleVkEnabled = async (enabled: boolean) => {
    const vk = await apiFetch<VkStatusDto>(`/api/v1/vk/toggle-notifications?enabled=${enabled}`, {
      method: 'POST',
    });
    setVkStatus(vk);
  };

  const handleSimulateBotCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simBotInput.trim()) return;
    const res = await apiFetch<{ vkUserId: number; botReply: string; status: VkStatusDto }>(
      '/api/v1/vk/simulate-bot-message',
      {
        method: 'POST',
        body: JSON.stringify({ messageText: simBotInput }),
      }
    );
    setSimBotReply(res.botReply);
    setVkStatus(res.status);
  };

  const handleTriggerReminders = async () => {
    const res = await apiFetch<{ remindersDispatched: number }>('/api/v1/vk/trigger-reminders', {
      method: 'POST',
    });
    setReminderResult(
      `Планировщик напоминаний выполнен. Отправлено новых напоминаний о предстоящих встречах: ${res.remindersDispatched}.`
    );
    await loadAll();
  };

  const handleMarkAllRead = async () => {
    await apiFetch('/api/v1/notifications/read-all', { method: 'POST' });
    await loadAll();
  };

  return (
    <div className="space-y-8 pb-16">
      <div>
        <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900">
          Уведомления и интеграция с ботом ВКонтакте
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Привяжите аккаунт к VK-боту по одноразовому коду, чтобы не забыть о предстоящих тренировках и ответах организаторов
        </p>
      </div>

      {/* VK BOT INTEGRATION CARD */}
      {vkStatus && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white font-display font-extrabold flex items-center justify-center">
                VK
              </div>
              <div>
                <h2 className="font-display font-bold text-lg text-slate-900">
                  Интеграция с VK-ботом напоминаний
                </h2>
                <div className="text-xs text-slate-500">
                  Режим провайдера:{' '}
                  <span className="font-bold text-slate-800">
                    {vkStatus.mode === 'REAL'
                      ? 'Боевой VK Bots Long Poll API (REAL)'
                      : 'Локальный тестовый провайдер (TEST_LOG — работает без внешнего VK-токена)'}
                  </span>
                </div>
              </div>
            </div>

            {vkStatus.linked ? (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>VK привязан (ID: {vkStatus.vkUserId})</span>
              </span>
            ) : (
              <span className="px-3.5 py-1.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
                Аккаунт VK не привязан
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Step-by-step linking */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4 text-xs">
              <div className="font-display font-bold text-sm text-slate-900">
                Безопасная привязка аккаунта по одноразовому коду
              </div>
              <ol className="list-decimal list-inside space-y-1.5 text-slate-700">
                <li>Нажмите «Сгенерировать одноразовый код привязки» ниже.</li>
                <li>
                  Откройте диалог с сообществом ВКонтакте (в соответствии с правилами VK API пользователь сам начинает диалог).
                </li>
                <li>Отправьте полученный код вида <code className="font-bold">SP-XXXXXX</code> боту.</li>
              </ol>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  onClick={handleGenerateCode}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
                >
                  Сгенерировать код привязки
                </button>

                {vkStatus.linked && (
                  <>
                    <button
                      onClick={() => handleToggleVkEnabled(!vkStatus.notificationsEnabled)}
                      className="px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-700"
                    >
                      {vkStatus.notificationsEnabled
                        ? 'Приостановить доставку в VK'
                        : 'Включить доставку в VK'}
                    </button>
                    <button
                      onClick={handleUnlinkVk}
                      className="px-3.5 py-2.5 rounded-xl border border-rose-200 text-rose-700 font-bold"
                    >
                      Отвязать VK
                    </button>
                  </>
                )}

                <button
                  onClick={handleTriggerReminders}
                  className="px-3.5 py-2.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold"
                >
                  Проверить отправку напоминаний сейчас
                </button>
              </div>

              {vkStatus.activeLinkCode && (
                <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-950 flex items-center justify-between">
                  <div>
                    <div className="text-[11px] text-blue-700">Ваш одноразовый код (действует 15 мин):</div>
                    <div className="font-mono font-extrabold text-lg">{vkStatus.activeLinkCode}</div>
                  </div>
                  <a
                    href={vkStatus.clubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white text-blue-700 font-bold border border-blue-200"
                  >
                    <span>Открыть VK</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              {reminderResult && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 font-semibold">
                  {reminderResult}
                </div>
              )}
            </div>

            {/* Interactive VK Bot Terminal for testing commands in TEST_LOG or REAL mode */}
            <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-display font-bold text-sm flex items-center gap-1.5 text-lime-300">
                  <Sparkles className="w-4 h-4" />
                  <span>Интерактивный терминал команд VK-бота</span>
                </span>
                <span className="text-[10px] text-slate-400">Проверка без внешнего VK-токена</span>
              </div>
              <p className="text-slate-300">
                Отправьте сюда сгенерированный код <code className="text-white font-bold">SP-XXXXXX</code> или команды бота: <code className="text-lime-300">Мои мероприятия</code>, <code className="text-lime-300">Статус</code>, <code className="text-lime-300">Помощь</code>, <code className="text-lime-300">Отключить</code>, <code className="text-lime-300">Включить</code>.
              </p>

              <form onSubmit={handleSimulateBotCommand} className="flex gap-2">
                <input
                  type="text"
                  value={simBotInput}
                  onChange={(e) => setSimBotInput(e.target.value)}
                  placeholder="Введите SP-XXXXXX или команду «Мои мероприятия»..."
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold"
                >
                  Отправить боту
                </button>
              </form>

              <div className="flex flex-wrap gap-1.5">
                {['Помощь', 'Мои мероприятия', 'Статус', 'Отключить', 'Включить'].map((cmd) => (
                  <button
                    key={cmd}
                    type="button"
                    onClick={() => setSimBotInput(cmd)}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px]"
                  >
                    {cmd}
                  </button>
                ))}
              </div>

              {simBotReply && (
                <div className="p-3.5 rounded-xl bg-slate-800 border border-slate-700 whitespace-pre-line text-slate-100 leading-relaxed">
                  {simBotReply}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* IN-APP NOTIFICATIONS LIST */}
      <section className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-600" />
            <h2 className="font-display font-bold text-xl text-slate-900">
              Журнал уведомлений платформы ({notifications.length})
            </h2>
          </div>

          {notifications.some((n) => !n.read) && (
            <button
              onClick={handleMarkAllRead}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
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
                className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  n.read ? 'bg-white border-slate-200' : 'bg-blue-50/60 border-blue-300'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-display font-bold text-sm text-slate-900">{n.title}</span>
                    <span className="text-[11px] text-slate-400">{formatDateTime(n.createdAt)}</span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-semibold">
                      VK статус: {n.vkDeliveryStatus}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700">{n.message}</p>
                </div>

                {n.linkUrl && (
                  <Link
                    to={n.linkUrl}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-800 text-xs font-bold shrink-0 self-start sm:self-center transition-colors"
                  >
                    Перейти →
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
