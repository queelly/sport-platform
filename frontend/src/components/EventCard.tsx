import React from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  BadgeCheck,
  Calendar,
  CheckCircle2,
  Clock,
  Flame,
  Footprints,
  MapPin,
  Repeat,
  ShieldAlert,
  Sparkles,
  Trophy,
  Users,
  Waves,
} from 'lucide-react';
import { EventCardDto, getRegionInfo } from '../types';
import { formatDateTime, SKILL_LABELS } from '../api';

function getSportVisualTheme(sportName: string): {
  gradient: string;
  Icon: React.FC<{ className?: string }>;
} {
  const s = sportName.toLowerCase();
  if (s.includes('бег') || s.includes('атлет') || s.includes('марафон')) {
    return { gradient: 'from-orange-500 via-amber-500 to-rose-500', Icon: Footprints };
  }
  if (s.includes('баскет') || s.includes('стритбол')) {
    return { gradient: 'from-amber-600 via-orange-600 to-red-600', Icon: Flame };
  }
  if (s.includes('теннис') || s.includes('падел') || s.includes('бадминтон') || s.includes('сквош')) {
    return { gradient: 'from-emerald-600 via-teal-600 to-cyan-600', Icon: Sparkles };
  }
  if (s.includes('плаван') || s.includes('вод') || s.includes('сап') || s.includes('каяк')) {
    return { gradient: 'from-sky-500 via-blue-600 to-indigo-600', Icon: Waves };
  }
  if (s.includes('футбол') || s.includes('волейбол') || s.includes('команд')) {
    return { gradient: 'from-blue-600 via-indigo-600 to-violet-700', Icon: Trophy };
  }
  return { gradient: 'from-indigo-600 via-blue-600 to-sky-600', Icon: Activity };
}

export const EventCard: React.FC<{ event: EventCardDto }> = ({ event }) => {
  const isFull =
    event.maxParticipants != null && event.confirmedParticipantsCount >= event.maxParticipants;

  const cleanTitle = event.title.replace(/\s*\(Регулярная серия\)/gi, '');
  const theme = getSportVisualTheme(event.sport.name);
  const SportIcon = theme.Icon;
  const regionInfo = getRegionInfo(event.city);

  return (
    <Link
      to={`/events/${event.id}`}
      className="group bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-sm hover:shadow-xl hover:border-blue-300 transition-all duration-200 flex flex-col justify-between"
    >
      <div>
        {/* Visual Cover Banner (#9) */}
        <div className="relative h-32 overflow-hidden bg-slate-900">
          {event.coverImageUrl ? (
            <img
              src={event.coverImageUrl}
              alt={cleanTitle}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div
              className={`w-full h-full bg-gradient-to-br ${theme.gradient} flex items-center justify-between px-5 relative overflow-hidden`}
            >
              <div className="absolute -right-4 -bottom-6 opacity-20 text-white pointer-events-none">
                <SportIcon className="w-32 h-32" />
              </div>
              <div className="relative z-10 flex items-center gap-2 text-white/95">
                <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <SportIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-xs font-extrabold uppercase tracking-wider">{event.sport.name}</div>
                  <div className="text-[11px] text-white/80">
                    {event.activityFormat && event.activityFormat !== 'Регулярная серия'
                      ? event.activityFormat
                      : SKILL_LABELS[event.skillLevel] || event.skillLevel}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Top overlay badges */}
          <div className="absolute top-2.5 left-3 right-3 flex flex-wrap items-center justify-between gap-1.5">
            <div className="flex flex-wrap items-center gap-1.5">
              {event.coverImageUrl && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-slate-900/80 text-white backdrop-blur-sm">
                  {event.sport.name}
                </span>
              )}
              {event.recurringOccurrence && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-white/95 text-orange-700 shadow-sm">
                  <Repeat className="w-3 h-3" />
                  Еженедельно
                </span>
              )}
            </div>

            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-[11px] font-bold shadow-sm ${
                event.joinMode === 'OPEN'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-indigo-600 text-white'
              }`}
            >
              {event.joinMode === 'OPEN' ? 'Свободный вход' : 'По заявке'}
            </span>
          </div>

          {event.status !== 'PUBLISHED' && (
            <div className="absolute bottom-2 left-3">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-rose-600 text-white shadow-sm">
                <ShieldAlert className="w-3 h-3" />
                {event.status === 'UNPUBLISHED_BY_ADMIN' ? 'Снято с публикации' : 'Отменено'}
              </span>
            </div>
          )}
        </div>

        {/* Body Content */}
        <div className="p-5 pb-3">
          <h3 className="font-display font-bold text-base sm:text-lg text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-1.5">
            {cleanTitle}
          </h3>

          <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 mb-3.5">{event.description}</p>

          <div className="space-y-1.5 text-xs text-slate-600">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="font-semibold text-slate-800 truncate">{formatDateTime(event.startsAt)}</span>
              </div>
              {regionInfo && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 shrink-0">
                  {regionInfo.tzLabel.split(' ')[0]}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="truncate">
                <strong className="font-semibold text-slate-700">{event.city}</strong>, {event.locationAddress}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer: Organizer Avatar & Spots (#9) */}
      <div className="px-5 py-3.5 border-t border-slate-100 flex items-center justify-between gap-2 bg-slate-50/40">
        <div className="flex items-center gap-2.5 min-w-0">
          {event.organizerAvatarUrl ? (
            <img
              src={event.organizerAvatarUrl}
              alt={event.organizerDisplayName}
              className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0 a11y-keep"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-display font-bold text-xs flex items-center justify-center shrink-0">
              {(event.organizationName || event.organizerDisplayName).charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            {event.organizationName ? (
              <div className="flex items-center gap-1 text-xs font-semibold text-slate-800 truncate">
                <BadgeCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="truncate">{event.organizationName}</span>
              </div>
            ) : (
              <div className="text-xs font-semibold text-slate-800 truncate">
                {event.organizerDisplayName}
              </div>
            )}
            <div className="text-[11px] text-slate-500 truncate">
              {SKILL_LABELS[event.skillLevel] || event.skillLevel}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {event.viewerParticipationStatus === 'CONFIRMED' && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-[11px] font-bold">
              <CheckCircle2 className="w-3 h-3" />
              Записаны
            </span>
          )}
          {event.viewerParticipationStatus === 'PENDING' && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-100 text-amber-800 text-[11px] font-bold">
              <Clock className="w-3 h-3" />
              Заявка
            </span>
          )}
          <div
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold ${
              isFull ? 'bg-amber-100 text-amber-900' : 'bg-white border border-slate-200 text-slate-800'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-blue-600" />
            <span>
              {event.confirmedParticipantsCount}
              {event.maxParticipants ? ` / ${event.maxParticipants}` : ''}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};
