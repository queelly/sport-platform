import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Calendar,
  Check,
  ExternalLink,
  History,
  MessageCircle,
  Send,
  ShieldAlert,
  Ticket,
  X,
} from 'lucide-react';
import {
  apiFetch,
  ApiError,
  formatDateTime,
  ORG_STATUS_LABELS,
  ORG_TYPE_LABELS,
  TICKET_CATEGORY_LABELS,
  TICKET_STATUS_LABELS,
} from '../api';
import {
  AuditLogDto,
  EventCardDto,
  OrganizationDto,
  SupportConversationDto,
  SupportTicketDto,
} from '../types';

export const AdminDashboardPage: React.FC = () => {
  const [tab, setTab] = useState<'ORGS' | 'EVENTS' | 'TICKETS' | 'CHATS' | 'AUDIT'>('ORGS');

  const [orgs, setOrgs] = useState<OrganizationDto[]>([]);
  const [events, setEvents] = useState<EventCardDto[]>([]);
  const [tickets, setTickets] = useState<SupportTicketDto[]>([]);
  const [chats, setChats] = useState<SupportConversationDto[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogDto[]>([]);

  const [selectedTicket, setSelectedTicket] = useState<SupportTicketDto | null>(null);
  const [ticketReply, setTicketReply] = useState('');
  const [ticketStatus, setTicketStatus] = useState<SupportTicketDto['status']>('IN_PROGRESS');
  const [resolutionSummary, setResolutionSummary] = useState('');

  const [selectedChat, setSelectedChat] = useState<SupportConversationDto | null>(null);
  const [chatReply, setChatReply] = useState('');

  const [orgReasons, setOrgReasons] = useState<Record<string, string>>({});
  const [eventReasons, setEventReasons] = useState<Record<string, string>>({});

  const loadAdminData = async () => {
    try {
      const [oList, eList, tList, cList, aList] = await Promise.all([
        apiFetch<OrganizationDto[]>('/api/v1/admin/organizations'),
        apiFetch<EventCardDto[]>('/api/v1/admin/events'),
        apiFetch<SupportTicketDto[]>('/api/v1/admin/tickets'),
        apiFetch<SupportConversationDto[]>('/api/v1/admin/support-chats'),
        apiFetch<AuditLogDto[]>('/api/v1/admin/audit-logs'),
      ]);
      setOrgs(oList);
      setEvents(eList);
      setTickets(tList);
      setChats(cList);
      setAuditLogs(aList);
      if (tList.length > 0 && !selectedTicket) setSelectedTicket(tList[0]);
      if (cList.length > 0 && !selectedChat) setSelectedChat(cList[0]);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleModerateOrg = async (
    orgId: string,
    decision: 'APPROVED' | 'REJECTED' | 'NEEDS_REVISION'
  ) => {
    const reason =
      orgReasons[orgId]?.trim() ||
      (decision === 'APPROVED'
        ? 'Организация проверена и допущена администратором'
        : window.prompt('Укажите причину отклонения / возврата на доработку для организации:') || '');
    if ((decision === 'REJECTED' || decision === 'NEEDS_REVISION') && !reason.trim()) {
      alert('При отказе необходимо указать понятную причину');
      return;
    }
    try {
      await apiFetch(`/api/v1/admin/organizations/${orgId}/decision`, {
        method: 'POST',
        body: JSON.stringify({
          decision,
          reason,
          adminNotes: 'Обработано через админ-панель',
        }),
      });
      await loadAdminData();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Ошибка модерации организации');
    }
  };

  const handleUnpublishEvent = async (eventId: string) => {
    const reason =
      eventReasons[eventId]?.trim() ||
      window.prompt('Укажите причину снятия мероприятия с публикации:', 'Нарушение правил платформы') ||
      '';
    if (!reason.trim()) return;
    try {
      await apiFetch(`/api/v1/admin/events/${eventId}/unpublish`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
      await loadAdminData();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Ошибка снятия мероприятия с публикации');
    }
  };

  const handleAdminReplyTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !ticketReply.trim()) return;
    try {
      const updated = await apiFetch<SupportTicketDto>(
        `/api/v1/admin/tickets/${selectedTicket.id}/reply`,
        {
          method: 'POST',
          body: JSON.stringify({
            content: ticketReply,
            newStatus: ticketStatus,
            resolutionSummary: resolutionSummary.trim() || null,
          }),
        }
      );
      setSelectedTicket(updated);
      setTicketReply('');
      await loadAdminData();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Ошибка ответа в тикет');
    }
  };

  const handleAdminReplyChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChat || !chatReply.trim()) return;
    try {
      const updated = await apiFetch<SupportConversationDto>(
        `/api/v1/admin/support-chats/${selectedChat.id}/reply`,
        {
          method: 'POST',
          body: JSON.stringify({ content: chatReply }),
        }
      );
      setSelectedChat(updated);
      setChatReply('');
      await loadAdminData();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Ошибка ответа в чат');
    }
  };

  const pendingOrgsCount = orgs.filter((o) => o.status === 'PENDING_REVIEW').length;
  const openTicketsCount = tickets.filter((t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length;
  const unreadChatsCount = chats.filter((c) => c.unreadByAdmin).length;

  return (
    <div className="space-y-8 pb-16">
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-display font-extrabold text-2xl sm:text-3xl">
                Панель администратора и модерации
              </h1>
              <p className="text-xs sm:text-sm text-slate-300">
                Допуск организаций, модерация мероприятий и сообщений, обработка тикетов, чат техподдержки и аудит
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          <button
            onClick={() => setTab('ORGS')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              tab === 'ORGS' ? 'bg-blue-600 text-white' : 'bg-white/10 text-slate-200 hover:bg-white/20'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Организации ({orgs.length})</span>
            {pendingOrgsCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px]">
                {pendingOrgsCount} ждут
              </span>
            )}
          </button>

          <button
            onClick={() => setTab('EVENTS')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              tab === 'EVENTS' ? 'bg-blue-600 text-white' : 'bg-white/10 text-slate-200 hover:bg-white/20'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Модерация мероприятий ({events.length})</span>
          </button>

          <button
            onClick={() => setTab('TICKETS')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              tab === 'TICKETS' ? 'bg-blue-600 text-white' : 'bg-white/10 text-slate-200 hover:bg-white/20'
            }`}
          >
            <Ticket className="w-4 h-4" />
            <span>Тикеты и жалобы ({tickets.length})</span>
            {openTicketsCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px]">
                {openTicketsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setTab('CHATS')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              tab === 'CHATS' ? 'bg-blue-600 text-white' : 'bg-white/10 text-slate-200 hover:bg-white/20'
            }`}
          >
            <MessageCircle className="w-4 h-4" />
            <span>Чат техподдержки ({chats.length})</span>
            {unreadChatsCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-emerald-400 text-slate-950 text-[10px]">
                +{unreadChatsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setTab('AUDIT')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              tab === 'AUDIT' ? 'bg-blue-600 text-white' : 'bg-white/10 text-slate-200 hover:bg-white/20'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Журнал действий ({auditLogs.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: ORGANIZATIONS MODERATION */}
      {tab === 'ORGS' && (
        <div className="space-y-4">
          {orgs.map((org) => {
            const st = ORG_STATUS_LABELS[org.status] || {
              label: org.status,
              color: 'bg-slate-100 text-slate-700',
            };
            return (
              <div
                key={org.id}
                className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${st.color}`}>
                      {st.label}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      Версия подачи #{org.submissionVersion} • {ORG_TYPE_LABELS[org.orgType]}
                    </span>
                  </div>
                  <Link
                    to={`/organizations/${org.id}`}
                    className="text-xs font-bold text-blue-600 hover:underline"
                  >
                    Открыть карточку организации →
                  </Link>
                </div>

                <div>
                  <h3 className="font-display font-bold text-xl text-slate-900">{org.name}</h3>
                  <div className="text-xs text-slate-600 mt-1">
                    Город: <span className="font-semibold">{org.city}</span> • Представитель:{' '}
                    <span className="font-semibold">{org.representativeName}</span> • Контакт для модератора:{' '}
                    <span className="font-semibold text-blue-700">{org.moderationContact}</span>
                  </div>
                </div>

                <p className="text-sm text-slate-700">{org.description}</p>

                <div className="flex flex-wrap gap-3 text-xs">
                  {org.verificationLink && (
                    <a
                      href={org.verificationLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-blue-600 font-bold hover:underline"
                    >
                      <span>Ссылка для проверки: {org.verificationLink}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {org.extraModerationInfo && (
                    <span className="text-slate-600">
                      Пояснение заявителя: <strong>{org.extraModerationInfo}</strong>
                    </span>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                  <input
                    type="text"
                    value={orgReasons[org.id] || ''}
                    onChange={(e) =>
                      setOrgReasons((prev) => ({ ...prev, [org.id]: e.target.value }))
                    }
                    placeholder="Причина отказа или комментарий модератора..."
                    className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
                  />

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleModerateOrg(org.id, 'APPROVED')}
                      className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Одобрить допуск</span>
                    </button>

                    <button
                      onClick={() => handleModerateOrg(org.id, 'REJECTED')}
                      className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Отклонить с причиной</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: EVENTS MODERATION */}
      {tab === 'EVENTS' && (
        <div className="space-y-4">
          {events.map((ev) => (
            <div
              key={ev.id}
              className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs font-bold">
                    {ev.sport.name}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-md text-xs font-bold ${
                      ev.status === 'PUBLISHED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {ev.status}
                  </span>
                  <span className="text-xs text-slate-500">{formatDateTime(ev.startsAt)}</span>
                </div>
                <Link
                  to={`/events/${ev.id}`}
                  className="font-display font-bold text-base text-slate-900 hover:text-blue-600 block"
                >
                  {ev.title}
                </Link>
                <div className="text-xs text-slate-600">
                  Организатор: {ev.organizerDisplayName}{' '}
                  {ev.organizationName ? `(${ev.organizationName})` : ''} • {ev.city},{' '}
                  {ev.locationAddress}
                </div>
                {ev.moderationReason && (
                  <div className="text-xs text-rose-700 font-semibold">
                    Причина модерации: {ev.moderationReason}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <Link
                  to={`/events/${ev.id}`}
                  className="px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700"
                >
                  Открыть и модерировать сообщения
                </Link>
                {ev.status === 'PUBLISHED' && (
                  <>
                    <input
                      type="text"
                      value={eventReasons[ev.id] || ''}
                      onChange={(e) =>
                        setEventReasons((prev) => ({ ...prev, [ev.id]: e.target.value }))
                      }
                      placeholder="Причина снятия..."
                      className="px-3 py-2 rounded-xl border border-rose-200 text-xs"
                    />
                    <button
                      onClick={() => handleUnpublishEvent(ev.id)}
                      className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
                    >
                      Снять с публикации
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: ADMIN TICKETS WORKSPACE */}
      {tab === 'TICKETS' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-2.5">
            <h2 className="font-display font-bold text-base text-slate-900">
              Все обращения и жалобы ({tickets.length})
            </h2>
            {tickets.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setSelectedTicket(t);
                  setTicketStatus(t.status);
                  setResolutionSummary(t.resolutionSummary || '');
                }}
                className={`w-full text-left p-3.5 rounded-2xl border text-xs space-y-1 ${
                  selectedTicket?.id === t.id
                    ? 'bg-blue-50 border-blue-400'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-blue-700">{t.ticketNumber}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      TICKET_STATUS_LABELS[t.status]?.color
                    }`}
                  >
                    {TICKET_STATUS_LABELS[t.status]?.label || t.status}
                  </span>
                </div>
                <div className="font-bold text-slate-900 line-clamp-1">{t.subject}</div>
                <div className="text-slate-500">
                  От: {t.authorDisplayName} ({t.authorEmail})
                </div>
              </button>
            ))}
          </div>

          <div className="lg:col-span-2">
            {selectedTicket ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div>
                    <span className="font-mono font-bold text-sm text-blue-600">
                      {selectedTicket.ticketNumber}
                    </span>
                    <h3 className="font-display font-bold text-xl text-slate-900">
                      {selectedTicket.subject}
                    </h3>
                    <div className="text-xs text-slate-500">
                      Автор: {selectedTicket.authorDisplayName} • Категория:{' '}
                      {TICKET_CATEGORY_LABELS[selectedTicket.category]}
                    </div>
                  </div>
                  {selectedTicket.targetType === 'EVENT' && selectedTicket.targetId && (
                    <Link
                      to={`/events/${selectedTicket.targetId}`}
                      className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 text-xs font-bold"
                    >
                      Перейти к мероприятию →
                    </Link>
                  )}
                </div>

                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {selectedTicket.messages.map((m) => (
                    <div
                      key={m.id}
                      className={`p-3.5 rounded-2xl border text-xs ${
                        m.adminReply
                          ? 'bg-blue-50/70 border-blue-200 ml-6'
                          : 'bg-slate-50 border-slate-200 mr-6'
                      }`}
                    >
                      <div className="font-bold text-slate-900 mb-1">
                        {m.authorDisplayName} ({formatDateTime(m.createdAt)})
                      </div>
                      <p className="text-slate-800 whitespace-pre-line">{m.content}</p>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleAdminReplyTicket} className="space-y-3 pt-3 border-t border-slate-100">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Новый статус тикета
                      </label>
                      <select
                        value={ticketStatus}
                        onChange={(e) => setTicketStatus(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                      >
                        {Object.entries(TICKET_STATUS_LABELS).map(([k, v]) => (
                          <option key={k} value={k}>
                            {v.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Резюме решения (необязательно)
                      </label>
                      <input
                        type="text"
                        value={resolutionSummary}
                        onChange={(e) => setResolutionSummary(e.target.value)}
                        placeholder="Краткий итог рассмотрения..."
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={ticketReply}
                      onChange={(e) => setTicketReply(e.target.value)}
                      placeholder="Введите официальный ответ администратора пользователю..."
                      className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-sm"
                    />
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-display font-bold text-xs"
                    >
                      Ответить и обновить статус
                    </button>
                  </div>
                </form>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* TAB 4: ADMIN LIVE SUPPORT CHATS */}
      {tab === 'CHATS' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-2.5">
            <h2 className="font-display font-bold text-base text-slate-900">
              Диалоги чата техподдержки ({chats.length})
            </h2>
            {chats.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedChat(c)}
                className={`w-full text-left p-3.5 rounded-2xl border text-xs space-y-1 ${
                  selectedChat?.id === c.id
                    ? 'bg-blue-50 border-blue-400'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{c.userDisplayName}</span>
                  {c.unreadByAdmin && (
                    <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-bold">
                      Ждёт ответа
                    </span>
                  )}
                </div>
                <div className="text-slate-500">{c.userEmail}</div>
                <div className="text-slate-700 line-clamp-1">{c.lastMessagePreview}</div>
              </button>
            ))}
          </div>

          <div className="lg:col-span-2">
            {selectedChat ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-5">
                <div className="pb-3 border-b border-slate-100">
                  <h3 className="font-display font-bold text-lg text-slate-900">
                    Чат с пользователем: {selectedChat.userDisplayName} ({selectedChat.userEmail})
                  </h3>
                </div>

                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {selectedChat.messages.map((m) => (
                    <div
                      key={m.id}
                      className={`p-3.5 rounded-2xl border text-xs ${
                        m.fromAdmin
                          ? 'bg-emerald-50 border-emerald-200 ml-6'
                          : 'bg-slate-50 border-slate-200 mr-6'
                      }`}
                    >
                      <div className="font-bold text-slate-900 mb-1">
                        {m.senderDisplayName} ({formatDateTime(m.createdAt)})
                      </div>
                      <p className="text-slate-800">{m.content}</p>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleAdminReplyChat} className="flex gap-2 pt-3 border-t border-slate-100">
                  <input
                    type="text"
                    required
                    value={chatReply}
                    onChange={(e) => setChatReply(e.target.value)}
                    placeholder="Написать ответ в чат технической поддержки..."
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-sm"
                  />
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-display font-bold text-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Ответить</span>
                  </button>
                </form>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* TAB 5: AUDIT LOG */}
      {tab === 'AUDIT' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h2 className="font-display font-bold text-lg text-slate-900">
            Журнал модерационных и административных решений
          </h2>
          {auditLogs.length === 0 ? (
            <p className="text-xs text-slate-500">Записей пока нет.</p>
          ) : (
            <div className="space-y-2.5">
              {auditLogs.map((l) => (
                <div
                  key={l.id}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs flex flex-wrap items-center justify-between gap-2"
                >
                  <div>
                    <span className="font-bold text-slate-900">{l.actionType}</span> • Объект:{' '}
                    <span className="font-mono">{l.targetType}</span> ({l.previousState} →{' '}
                    <span className="font-bold text-blue-700">{l.newState}</span>)
                    {l.reason && <div className="text-slate-600 mt-0.5">Причина: {l.reason}</div>}
                  </div>
                  <div className="text-slate-500">
                    {l.adminDisplayName} • {formatDateTime(l.createdAt)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
