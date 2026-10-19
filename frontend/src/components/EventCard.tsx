import React from 'react';
import { Link } from 'react-router-dom';
import {
  BadgeCheck,
  Calendar,
  CheckCircle2,
  Clock,
  MapPin,
  Repeat,
  ShieldAlert,
  Users,
} from 'lucide-react';
import { EventCardDto } from '../types';
import { formatDateTime, SKILL_LABELS } from '../api';

export const EventCard: React.FC<{ event: EventCardDto }> = ({ event }) => {
  const isFull =
    event.maxParticipants != null && event.confirmedParticipantsCount >= event.maxParticipants;

  return (
    <Link
      to={`/events/${event.id}`}
      className="group bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm hover:shadow-xl hover:border-blue-300 transition-all duration-200 flex flex-col justify-between"
    >
      <div>
        {/* Top badges */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200/60">
              {event.sport.name}
            </span>
            {event.recurringOccurrence && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200/60">
                <Repeat className="w-3 h-3" />
                Регулярная серия
              </span>
            )}
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${
                event.joinMode === 'OPEN'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                  : 'bg-indigo-50 text-indigo-700 border border-indigo-200/60'
              }`}
            >
              {event.joinMode === 'OPEN' ? 'Свободный вход' : 'По заявке'}
            </span>
          </div>

          {event.status !== 'PUBLISHED' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-100 text-rose-800">
              <ShieldAlert className="w-3.5 h-3.5" />
              {event.status === 'UNPUBLISHED_BY_ADMIN' ? 'Снято с публикации' : 'Отменено'}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="font-display font-bold text-lg text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-2">
          {event.title}
        </h3>

        <p className="text-sm text-slate-600 line-clamp-2 mb-4">{event.description}</p>

        {/* Metadata */}
        <div className="space-y-1.5 text-xs text-slate-600 mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="font-medium text-slate-800">{formatDateTime(event.startsAt)}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="truncate">
              {event.city}, {event.locationAddress}
            </span>
          </div>
        </div>
      </div>

      {/* Footer: Organizer & Spots */}
      <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between gap-2">
        <div className="min-w-0">
          {event.organizationName ? (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 truncate">
              <BadgeCheck className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="truncate">{event.organizationName}</span>
            </div>
          ) : (
            <div className="text-xs text-slate-600 truncate">
              Организатор: <span className="font-semibold text-slate-800">{event.organizerDisplayName}</span>
            </div>
          )}
          <div className="text-[11px] text-slate-500">{SKILL_LABELS[event.skillLevel] || event.skillLevel}</div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {event.viewerParticipationStatus === 'CONFIRMED' && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Вы записаны
            </span>
          )}
          {event.viewerParticipationStatus === 'PENDING' && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-100 text-amber-800 text-xs font-bold">
              <Clock className="w-3.5 h-3.5" />
              Заявка ждёт
            </span>
          )}
          <div
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold ${
              isFull ? 'bg-amber-50 text-amber-800' : 'bg-slate-100 text-slate-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
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
