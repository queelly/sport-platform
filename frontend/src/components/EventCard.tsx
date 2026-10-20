import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Repeat } from 'lucide-react';
import { EventCardDto, getBrowserLocalTzLabel, getRegionInfo, isOnlineEvent } from '../types';
import { formatDateTime } from '../api';

export function getSportEmoji(sportName: string): string {
  const lower = (sportName || '').toLowerCase();
  if (lower.includes('футбол')) return '⚽';
  if (lower.includes('баскет') || lower.includes('стритбол')) return '🏀';
  if (lower.includes('волей')) return '🏐';
  if (lower.includes('бег') || lower.includes('пробеж') || lower.includes('атлет')) return '🏃';
  if (lower.includes('теннис') || lower.includes('падел') || lower.includes('бадминтон')) return '🎾';
  if (lower.includes('плав')) return '🏊';
  if (lower.includes('вело')) return '🚴';
  if (lower.includes('йог') || lower.includes('стретч') || lower.includes('пилатес')) return '🧘';
  if (lower.includes('лыж') || lower.includes('сноу')) return '⛷️';
  if (lower.includes('бокс') || lower.includes('борьб') || lower.includes('самбо')) return '🥊';
  if (lower.includes('шахмат')) return '♟️';
  if (lower.includes('воркаут') || lower.includes('кроссфит') || lower.includes('силов')) return '💪';
  return '🏆';
}

const SPORT_COVER_POOL: Record<string, string> = {
  футбол: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=900&q=80',
  баскетбол: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=900&q=80',
  волейбол: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?auto=format&fit=crop&w=900&q=80',
  бег: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=900&q=80',
  теннис: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=900&q=80',
  вело: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=900&q=80',
  плав: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?auto=format&fit=crop&w=900&q=80',
  йога: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=900&q=80',
  воркаут: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=900&q=80',
};

export function getSportCoverUrl(sportName: string, fallbackSeed = ''): string {
  const lower = (sportName || '').toLowerCase();
  for (const [key, url] of Object.entries(SPORT_COVER_POOL)) {
    if (lower.includes(key)) return url;
  }
  const pool = Object.values(SPORT_COVER_POOL);
  const idx = fallbackSeed ? fallbackSeed.charCodeAt(0) % pool.length : 0;
  return pool[idx];
}

export const ScenicSportIllustration: React.FC<{
  sportName: string;
  className?: string;
  variant?: number;
}> = ({ sportName, className = 'w-full h-full' }) => {
  const lower = sportName.toLowerCase();
  const bgGradient =
    lower.includes('футбол') || lower.includes('гольф')
      ? 'from-emerald-700 via-teal-800 to-slate-900'
      : lower.includes('бег') || lower.includes('вело') || lower.includes('лыж')
      ? 'from-sky-700 via-cyan-800 to-slate-900'
      : lower.includes('баскет') || lower.includes('волей') || lower.includes('теннис')
      ? 'from-amber-600 via-orange-800 to-slate-900'
      : 'from-teal-700 via-emerald-800 to-slate-900';

  const sportEmoji = getSportEmoji(sportName);

  return (
    <div
      className={`event-card-cover-banner relative overflow-hidden bg-gradient-to-br ${bgGradient} flex items-center justify-center select-none ${className}`}
    >
      <div className="absolute -right-8 -bottom-8 w-36 h-36 rounded-full bg-white/10 blur-xl" />
      <div className="absolute left-6 top-6 w-20 h-20 rounded-full bg-[#04D793]/20 blur-lg" />
      <span className="text-5xl opacity-90 drop-shadow-md">{sportEmoji}</span>
    </div>
  );
};

interface EventCardProps {
  event: EventCardDto;
  variant?: 'tall' | 'horizontal' | 'default';
  index?: number;
  active?: boolean;
  onOpen?: () => void;
}

export const EventCard: React.FC<EventCardProps> = ({
  event,
  active = false,
  onOpen,
}) => {
  const isOnline = isOnlineEvent(event.city, event.locationAddress);
  const regionInfo = getRegionInfo(event.city);
  const tzLabel = isOnline
    ? getBrowserLocalTzLabel()
    : regionInfo?.tzLabel.split(' ')[0] || 'МСК';

  const capacity = event.maxParticipants || 0;
  const confirmed = event.confirmedParticipantsCount || 0;
  const freeSpots = capacity > 0 ? Math.max(0, capacity - confirmed) : null;
  const fillPct =
    capacity > 0
      ? Math.min(100, Math.max(0, Math.round((confirmed / capacity) * 100)))
      : 35;

  const statusBadge =
    event.viewerParticipationStatus === 'CONFIRMED'
      ? { label: 'Вы записаны ✓', cls: 'bg-brand-tint text-brand-ink border border-brand-line' }
      : event.viewerParticipationStatus === 'PENDING'
      ? { label: 'Заявка отправлена', cls: 'bg-amber-50 text-amber-800 border border-amber-200' }
      : event.viewerParticipationStatus === 'WAITLISTED'
      ? { label: 'Вы в очереди', cls: 'bg-surface-2 text-ink' }
      : null;

  const coverSrc = event.coverImageUrl || getSportCoverUrl(event.sport.name, event.id);

  return (
    <article
      className={`anim-rise group w-full flex flex-col text-left rounded-[22px] bg-card overflow-hidden border transition-[box-shadow,border-color] justify-between ${
        active
          ? 'border-brand ring-2 ring-brand/40 shadow-[0_4px_24px_rgba(4,215,147,0.3)]'
          : 'border-line-2 shadow-sm hover:shadow-md hover:border-brand/40'
      }`}
    >
      {/* Top Cover Banner (Sportikus 185px style) */}
      <Link
        to={`/events/${event.id}`}
        onClick={(e) => {
          if (onOpen) {
            e.preventDefault();
            onOpen();
          }
        }}
        className="relative h-[180px] sm:h-[190px] w-full bg-slate-800 overflow-hidden shrink-0 block"
      >
        <img
          src={coverSrc}
          alt={event.title}
          className="event-card-cover-banner w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

        {/* Top-left Pill (Online or Entry Mode / Category) */}
        <span className="absolute top-3.5 left-3.5 bg-[#04D793] dark:bg-[#D5F45B] text-white dark:text-[#111315] font-bold text-xs sm:text-sm px-3.5 py-1.5 rounded-full shadow-sm select-none">
          {isOnline
            ? '🌐 Онлайн'
            : event.joinMode === 'OPEN'
            ? 'Свободная запись'
            : 'По заявке'}
        </span>

        {/* Top-right Pill (Sport Name) */}
        <span className="absolute top-3.5 right-3.5 bg-white/95 dark:bg-card/95 text-slate-900 dark:text-ink font-bold text-xs sm:text-sm px-3.5 py-1.5 rounded-full shadow-sm select-none">
          {getSportEmoji(event.sport.name)} {event.sport.name}
        </span>

        {/* Bottom-left badges (Category / Recurring) */}
        <div className="absolute bottom-3 left-3.5 right-3.5 flex flex-wrap items-center gap-1.5 pointer-events-none">
          {event.activityFormat && (
            <span className="px-2.5 py-1 rounded-full bg-black/65 backdrop-blur-xs text-white text-[11px] font-semibold">
              {event.activityFormat}
            </span>
          )}
          {event.recurringOccurrence && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/65 backdrop-blur-xs text-white text-[11px] font-semibold">
              <Repeat className="w-3 h-3" />
              <span>Повторяющиеся встречи</span>
            </span>
          )}
        </div>
      </Link>

      {/* Card Content Body */}
      <div className="p-4 sm:p-5 flex flex-col gap-3 flex-1 justify-between">
        <div className="flex flex-col gap-2">
          {/* Sport & City/Timezone Row */}
          <div className="flex items-center justify-between text-xs sm:text-sm font-medium text-muted">
            <span className="truncate">{event.organizationName || event.sport.name}</span>
            <span className="shrink-0 ml-2">
              {isOnline ? tzLabel : `${event.city} · ${tzLabel}`}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-lg sm:text-[19px] font-bold text-ink leading-snug line-clamp-2">
            <Link
              to={`/events/${event.id}`}
              onClick={(e) => {
                if (onOpen) {
                  e.preventDefault();
                  onOpen();
                }
              }}
              className="hover:text-brand-ink transition-colors"
            >
              {event.title}
            </Link>
          </h3>

          {/* Date & Time */}
          <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-ink">
            <Calendar className="w-4 h-4 text-ink shrink-0" />
            <span>{formatDateTime(event.startsAt)}</span>
          </div>

          {/* Location */}
          <div className="flex items-start gap-2 text-ink">
            <MapPin className="w-4 h-4 text-ink shrink-0 mt-0.5" />
            <div className="flex flex-col min-w-0">
              <span className="text-xs sm:text-sm font-bold text-ink leading-tight truncate">
                {event.locationAddress}
              </span>
              <span className="text-[11px] sm:text-xs text-muted leading-tight mt-0.5 truncate">
                {isOnline ? 'Онлайн-подключение' : event.city}
              </span>
            </div>
          </div>
        </div>

        {/* Capacity Progress Bar (Sportikus exact style) */}
        <div className="pt-2 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="font-bold text-[#04D793] dark:text-[#D5F45B]">
              {freeSpots !== null
                ? freeSpots > 0
                  ? `Свободно ${freeSpots} мест`
                  : 'Мест нет (очередь)'
                : `Участвуют: ${confirmed}`}
            </span>
            <span className="font-medium text-muted">
              {capacity > 0 ? `${confirmed} из ${capacity}` : 'Без лимита'}
            </span>
          </div>
          <div className="w-full h-1.5 sm:h-2 bg-slate-100 dark:bg-surface-2 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-[#04D793] dark:bg-[#D5F45B] transition-all"
              style={{ width: `${fillPct}%` }}
            />
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-1">
          {statusBadge ? (
            <Link
              to={`/events/${event.id}`}
              className={`w-full py-3 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center transition-colors ${statusBadge.cls}`}
            >
              {statusBadge.label}
            </Link>
          ) : (
            <Link
              to={`/events/${event.id}`}
              onClick={(e) => {
                if (onOpen) {
                  e.preventDefault();
                  onOpen();
                }
              }}
              className="w-full py-3 sm:py-3.5 rounded-xl bg-[#04D793] hover:bg-[#03c485] dark:bg-[#D5F45B] dark:hover:bg-[#c4e447] text-white dark:text-[#111315] font-bold text-sm sm:text-base flex items-center justify-center transition-colors shadow-sm text-center"
            >
              Подробнее
            </Link>
          )}
        </div>
      </div>
    </article>
  );
};
