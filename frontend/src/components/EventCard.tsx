import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  BadgeCheck,
  Calendar,
  Heart,
  MapPin,
  Repeat,
  Users,
} from 'lucide-react';
import { EventCardDto, getRegionInfo } from '../types';
import { formatDateTime, SKILL_LABELS } from '../api';

/**
 * Scenic vector landscape illustration in the exact style of Reference 2 (Travenly)
 * and Reference 1 (Sherwood Island nature header).
 */
export const ScenicSportIllustration: React.FC<{
  sportName: string;
  className?: string;
  variant?: number;
}> = ({ sportName, className = 'w-full h-full', variant }) => {
  const lower = sportName.toLowerCase();
  const paletteIndex =
    variant !== undefined
      ? variant % 4
      : lower.includes('футбол') || lower.includes('бег') || lower.includes('гольф')
      ? 0
      : lower.includes('баскет') || lower.includes('волей') || lower.includes('теннис')
      ? 1
      : lower.includes('плав') || lower.includes('лыж') || lower.includes('хоккей') || lower.includes('сап')
      ? 2
      : 3;

  const palettes = [
    {
      skyTop: '#8BD3E6',
      skyBottom: '#DDF4FA',
      sun: '#FFF3B0',
      farHill: '#5FA87A',
      midHill: '#6CC04A',
      nearHill: '#9BE15D',
      accent: '#16B672',
    },
    {
      skyTop: '#93D8F8',
      skyBottom: '#E6F7FF',
      sun: '#FFE89E',
      farHill: '#4A9B7F',
      midHill: '#58B970',
      nearHill: '#8CD968',
      accent: '#0EA5E9',
    },
    {
      skyTop: '#7EC8E3',
      skyBottom: '#D8F3FA',
      sun: '#FFF7C2',
      farHill: '#3E8E7E',
      midHill: '#4EB396',
      nearHill: '#7ED9B4',
      accent: '#14B8A6',
    },
    {
      skyTop: '#A0D9B4',
      skyBottom: '#E8F8F0',
      sun: '#FFF0A8',
      farHill: '#4A8C6F',
      midHill: '#63B85B',
      nearHill: '#99DF67',
      accent: '#16B672',
    },
  ];

  const p = palettes[paletteIndex];

  return (
    <svg
      viewBox="0 0 400 260"
      preserveAspectRatio="xMidYMid slice"
      className={`event-card-cover-banner select-none ${className}`}
    >
      <defs>
        <linearGradient id={`sky-${paletteIndex}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={p.skyTop} />
          <stop offset="100%" stopColor={p.skyBottom} />
        </linearGradient>
      </defs>

      {/* Sky */}
      <rect width="400" height="260" fill={`url(#sky-${paletteIndex})`} />

      {/* Soft Sun */}
      <circle cx="315" cy="64" r="28" fill={p.sun} opacity="0.85" />

      {/* Fluffy Travenly Clouds */}
      <g fill="#FFFFFF" opacity="0.85">
        <rect x="42" y="46" width="76" height="20" rx="10" />
        <circle cx="66" cy="44" r="14" />
        <circle cx="88" cy="40" r="17" />
        <rect x="210" y="68" width="64" height="16" rx="8" opacity="0.7" />
        <circle cx="232" cy="66" r="11" opacity="0.7" />
      </g>

      {/* Far Mountain / Hill */}
      <path
        d="M-20 200 Q75 105 175 165 T360 135 L420 180 L420 260 L-20 260 Z"
        fill={p.farHill}
      />

      {/* Mid Rolling Green Hill */}
      <path
        d="M-20 210 Q110 130 240 178 T420 155 L420 260 L-20 260 Z"
        fill={p.midHill}
      />

      {/* Foreground Meadow with Diagonal Field Stripes (Travenly style) */}
      <path
        d="M-20 225 Q150 165 310 205 T420 195 L420 260 L-20 260 Z"
        fill={p.nearHill}
      />
      <path
        d="M40 260 L130 190 L165 192 L85 260 Z"
        fill="#FFFFFF"
        opacity="0.16"
      />
      <path
        d="M175 260 L245 196 L280 202 L220 260 Z"
        fill="#FFFFFF"
        opacity="0.14"
      />

      {/* Stylized Pine / Park Trees */}
      <g fill="#2E6F4E" opacity="0.85">
        <polygon points="58,142 46,174 70,174" />
        <polygon points="58,128 49,154 67,154" />
        <polygon points="348,124 335,160 361,160" />
        <polygon points="348,108 338,138 358,138" />
      </g>
    </svg>
  );
};

interface EventCardProps {
  event: EventCardDto;
  variant?: 'tall' | 'horizontal' | 'default';
  index?: number;
}

export const EventCard: React.FC<EventCardProps> = ({
  event,
  variant = 'default',
  index = 0,
}) => {
  const isFull =
    event.maxParticipants != null && event.confirmedParticipantsCount >= event.maxParticipants;
  const regionInfo = getRegionInfo(event.city);

  // VARIANT 1: HORIZONTAL COMPACT CARD (Reference 2 "Event Dates" section)
  if (variant === 'horizontal') {
    return (
      <Link
        to={`/events/${event.id}`}
        className="group bento-card bento-card-hover p-3.5 flex items-center justify-between gap-3.5"
      >
        <div className="w-20 h-20 rounded-2xl overflow-hidden relative shrink-0 bg-[#E7F8F0]">
          {event.coverImageUrl ? (
            <img
              src={event.coverImageUrl}
              alt={event.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <ScenicSportIllustration sportName={event.sport.name} variant={index} />
          )}
          <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-lg bg-white/90 backdrop-blur-sm text-[10px] font-extrabold text-[#1A2622]">
            {event.sport.name}
          </span>
        </div>

        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-1.5">
            <h3 className="font-display font-extrabold text-sm sm:text-base text-[#1A2622] group-hover:text-[#16B672] transition-colors truncate">
              {event.title}
            </h3>
            {event.organizationName && (
              <BadgeCheck className="w-4 h-4 text-[#16B672] shrink-0" />
            )}
          </div>

          <div className="text-xs text-[#7E8E89] flex items-center gap-1 truncate">
            <MapPin className="w-3.5 h-3.5 text-[#16B672] shrink-0" />
            <span className="truncate">
              {event.city}, {event.locationAddress}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-0.5">
            <span className="text-xs font-extrabold text-[#16B672]">
              {formatDateTime(event.startsAt)}
            </span>
            <span className="text-[11px] font-bold text-[#7E8E89]">
              • Участников: {event.confirmedParticipantsCount}
              {event.maxParticipants ? `/${event.maxParticipants}` : ''}
            </span>
            {event.recurringOccurrence && (
              <span className="px-2 py-0.5 rounded-md bg-[#FFF3E6] text-[#D97706] text-[10px] font-extrabold">
                Еженедельно
              </span>
            )}
          </div>
        </div>

        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all ${
            event.viewerParticipationStatus === 'CONFIRMED'
              ? 'bg-[#16B672] text-white shadow-md shadow-[#16B672]/30'
              : 'bg-[#E7F8F0] text-[#16B672] group-hover:bg-[#16B672] group-hover:text-white group-hover:shadow-md group-hover:shadow-[#16B672]/30'
          }`}
          title="Перейти к мероприятию"
        >
          <Heart
            className={`w-4 h-4 ${
              event.viewerParticipationStatus === 'CONFIRMED' ? 'fill-current' : ''
            }`}
          />
        </div>
      </Link>
    );
  }

  // VARIANT 2: TALL SCENIC CARD (Reference 2 "Discover World" section)
  if (variant === 'tall') {
    return (
      <Link
        to={`/events/${event.id}`}
        className="group relative h-80 rounded-[28px] overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between p-3 bg-[#DDF4FA]"
      >
        {/* Background illustration or cover image */}
        <div className="absolute inset-0">
          {event.coverImageUrl ? (
            <img
              src={event.coverImageUrl}
              alt={event.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <ScenicSportIllustration sportName={event.sport.name} variant={index} />
          )}
        </div>

        {/* Top badges over sky */}
        <div className="relative z-10 flex items-center justify-between gap-2 px-1 pt-1">
          <span className="px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-[#1A2622] font-display font-extrabold text-xs shadow-sm">
            {event.sport.name}
          </span>
          <div className="flex items-center gap-1.5">
            {event.recurringOccurrence && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FF7849] text-white text-[10px] font-extrabold shadow-sm">
                <Repeat className="w-3 h-3" />
                Еженедельно
              </span>
            )}
            <span className="px-2.5 py-1 rounded-full bg-black/35 backdrop-blur-md text-white text-[10px] font-bold">
              {regionInfo?.tzLabel || 'МСК'}
            </span>
          </div>
        </div>

        {/* Floating White Bottom Card (exact Travenly card style) */}
        <div className="relative z-10 bg-white rounded-2xl p-4 shadow-lg flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-1">
            <h3 className="font-display font-extrabold text-base text-[#1A2622] group-hover:text-[#16B672] transition-colors truncate">
              {event.title}
            </h3>
            <div className="text-xs text-[#7E8E89] truncate flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-[#16B672] shrink-0" />
              <span className="truncate">
                {event.city}, {event.locationAddress}
              </span>
            </div>
            <div className="flex items-center gap-2 pt-0.5">
              <span className="text-xs font-extrabold text-[#16B672]">
                {formatDateTime(event.startsAt)}
              </span>
              <span className="text-[11px] font-semibold text-[#7E8E89]">
                • {event.confirmedParticipantsCount}
                {event.maxParticipants ? `/${event.maxParticipants} мест` : ' уч.'}
              </span>
            </div>
          </div>

          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all ${
              isFull
                ? 'bg-amber-100 text-amber-700'
                : 'bg-[#16B672] text-white shadow-md shadow-[#16B672]/35 group-hover:scale-105'
            }`}
          >
            <Heart className="w-4 h-4 fill-current" />
          </div>
        </div>
      </Link>
    );
  }

  // VARIANT 3: DEFAULT BENTO EVENT CARD (Combines Scenic Header + Clean Details)
  return (
    <Link
      to={`/events/${event.id}`}
      className="group bento-card bento-card-hover overflow-hidden flex flex-col justify-between"
    >
      <div>
        <div className="relative h-40 w-full overflow-hidden bg-[#DDF4FA]">
          {event.coverImageUrl ? (
            <img
              src={event.coverImageUrl}
              alt={event.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <ScenicSportIllustration sportName={event.sport.name} variant={index} />
          )}

          <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
            <span className="px-3 py-1 rounded-full bg-white/95 backdrop-blur-sm text-[#1A2622] font-display font-extrabold text-xs shadow-sm">
              {event.sport.name}
            </span>

            <div className="flex items-center gap-1.5">
              {event.recurringOccurrence && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FF7849] text-white text-[10px] font-extrabold shadow-sm">
                  <Repeat className="w-3 h-3" />
                  Еженедельно
                </span>
              )}
              <span
                className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold shadow-sm backdrop-blur-sm ${
                  event.joinMode === 'OPEN'
                    ? 'bg-[#16B672]/95 text-white'
                    : 'bg-white/95 text-[#1A2622]'
                }`}
              >
                {event.joinMode === 'OPEN' ? 'Свободный вход' : 'По заявке'}
              </span>
            </div>
          </div>

          {event.viewerParticipationStatus && (
            <div className="absolute bottom-2.5 right-3">
              <span className="px-2.5 py-1 rounded-full bg-white/95 text-[#11995E] text-[10px] font-extrabold shadow-sm">
                {event.viewerParticipationStatus === 'CONFIRMED'
                  ? '✓ Вы записаны'
                  : event.viewerParticipationStatus === 'PENDING'
                  ? '⏳ Заявка на рассмотрении'
                  : 'В листе ожидания'}
              </span>
            </div>
          )}
        </div>

        <div className="p-5 space-y-2.5">
          <div className="flex items-center justify-between gap-2 text-[11px] font-bold text-[#7E8E89]">
            <span>{SKILL_LABELS[event.skillLevel] || event.skillLevel}</span>
            <span>{regionInfo?.tzLabel || 'МСК'}</span>
          </div>

          <h3 className="font-display font-extrabold text-lg text-[#1A2622] group-hover:text-[#16B672] transition-colors line-clamp-2 leading-snug">
            {event.title}
          </h3>

          <div className="space-y-1.5 pt-1 text-xs text-[#5A6B65]">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#16B672] shrink-0" />
              <span className="font-bold text-[#1A2622]">{formatDateTime(event.startsAt)}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#16B672] shrink-0" />
              <span className="truncate">
                {event.city}, {event.locationAddress}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 py-3.5 bg-[#F7FAF8] border-t border-[#E8F2EE] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {event.organizerAvatarUrl ? (
            <img
              src={event.organizerAvatarUrl}
              alt={event.organizerDisplayName}
              className="w-7 h-7 rounded-full object-cover border border-[#DCEAE4] shrink-0"
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-[#16B672] text-white text-xs font-extrabold flex items-center justify-center shrink-0">
              {(event.organizationName || event.organizerDisplayName || 'С').charAt(0).toUpperCase()}
            </div>
          )}
          <div className="truncate text-xs font-bold text-[#1A2622]">
            {event.organizationName ? (
              <span className="inline-flex items-center gap-1 text-[#11995E]">
                <BadgeCheck className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{event.organizationName}</span>
              </span>
            ) : (
              <span className="truncate">{event.organizerDisplayName}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold ${
              isFull ? 'bg-amber-100 text-amber-800' : 'bg-[#E7F8F0] text-[#11995E]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>
              {event.confirmedParticipantsCount}
              {event.maxParticipants ? `/${event.maxParticipants}` : ''}
            </span>
          </span>
          <div className="w-7 h-7 rounded-full bg-[#16B672] text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
            <ArrowUpRight className="w-4 h-4" />
          </div>
        </div>
      </div>
    </Link>
  );
};
