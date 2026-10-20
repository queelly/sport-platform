import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  Calendar,
  Compass,
  ExternalLink,
  Globe,
  Heart,
  Map,
  MapPin,
  Navigation,
  Plus,
  Repeat,
  Search,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Trophy,
  Users,
} from 'lucide-react';
import { useAuth } from '../AuthContext';
import { apiFetch, formatDateTime, SKILL_LABELS } from '../api';
import {
  EVENT_CATEGORIES,
  EventCardDto,
  getRegionInfo,
  isOnlineEvent,
  OrganizationDto,
  PublicUserProfileDto,
} from '../types';
import { EventCard, ScenicSportIllustration } from '../components/EventCard';
import { CustomSelect, RegionSelect, VoiceSearchButton } from '../components/UiControls';
import { getSelectedGlobalRegion } from '../components/Navbar';

export const HomeAndCatalogPage: React.FC<{ catalogOnly?: boolean }> = ({ catalogOnly = false }) => {
  const { user, sports } = useAuth();
  const [events, setEvents] = useState<EventCardDto[]>([]);
  const [recommendedEvents, setRecommendedEvents] = useState<EventCardDto[]>([]);
  const [organizations, setOrganizations] = useState<OrganizationDto[]>([]);
  const [partners, setPartners] = useState<PublicUserProfileDto[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedSportId, setSelectedSportId] = useState<string>('');
  const [city, setCity] = useState<string>(() => getSelectedGlobalRegion());
  const [joinMode, setJoinMode] = useState<string>('');
  const [skillLevel, setSkillLevel] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [recurringFilter, setRecurringFilter] = useState<string>('');
  const [onlyAvailable, setOnlyAvailable] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showFiltersPanel, setShowFiltersPanel] = useState<boolean>(catalogOnly);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [selectedMapEvent, setSelectedMapEvent] = useState<EventCardDto | null>(null);
  const [selectedDayOffset, setSelectedDayOffset] = useState<number | null>(null);

  useEffect(() => {
    const onRegionChange = (e: Event) => {
      const customEv = e as CustomEvent<string>;
      setCity(customEv.detail || '');
    };
    window.addEventListener('sp-region-change', onRegionChange);
    return () => window.removeEventListener('sp-region-change', onRegionChange);
  }, []);

  const fetchCatalog = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedSportId) params.set('sportId', selectedSportId);
      if (city.trim()) params.set('city', city.trim());
      if (joinMode) params.set('joinMode', joinMode);
      if (skillLevel) params.set('skillLevel', skillLevel);
      if (recurringFilter === 'true') params.set('recurring', 'true');
      if (recurringFilter === 'false') params.set('recurring', 'false');
      if (onlyAvailable) params.set('onlyAvailableSpots', 'true');
      if (searchQuery.trim()) params.set('q', searchQuery.trim());

      const [evList, allEvList, orgList, partnerList] = await Promise.all([
        apiFetch<EventCardDto[]>(`/api/v1/events?${params.toString()}`),
        apiFetch<EventCardDto[]>('/api/v1/events'),
        apiFetch<OrganizationDto[]>('/api/v1/organizations'),
        apiFetch<PublicUserProfileDto[]>('/api/v1/partners/search').catch(() => [] as PublicUserProfileDto[]),
      ]);
      setEvents(evList);
      setRecommendedEvents(allEvList);
      setOrganizations(orgList);
      setPartners(partnerList);
      const firstOffline =
        evList.find((ev) => !isOnlineEvent(ev.city, ev.locationAddress)) ||
        allEvList.find((ev) => !isOnlineEvent(ev.city, ev.locationAddress)) ||
        null;
      setSelectedMapEvent(firstOffline);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, [selectedSportId, city, joinMode, skillLevel, recurringFilter, onlyAvailable]);

  // Debounced live search when typing searchQuery
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCatalog();
    }, 320);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleResetFilters = () => {
    setSelectedSportId('');
    setCity('');
    setJoinMode('');
    setSkillLevel('');
    setCategoryFilter('');
    setRecurringFilter('');
    setOnlyAvailable(false);
    setSearchQuery('');
    setSelectedDayOffset(null);
  };

  // Exclude online events without physical address from map view (#7)
  const mapEvents = useMemo(() => {
    const base = events.length > 0 ? events : recommendedEvents;
    return base.filter((ev) => !isOnlineEvent(ev.city, ev.locationAddress));
  }, [events, recommendedEvents]);

  const activeMapCoords = useMemo(() => {
    const targetCity =
      selectedMapEvent && !isOnlineEvent(selectedMapEvent.city, selectedMapEvent.locationAddress)
        ? selectedMapEvent.city
        : city && city !== 'Онлайн'
        ? city
        : 'Москва';
    const info = getRegionInfo(targetCity);
    return {
      lat: info?.lat ?? 55.7558,
      lon: info?.lng ?? 37.6173,
      city: targetCity,
      address: selectedMapEvent?.locationAddress || '',
    };
  }, [selectedMapEvent, city]);

  // Next 12 days strip for Reference 2 "Event Dates 🚀"
  const dateStripDays = useMemo(() => {
    const today = new Date();
    const weekNames = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    return Array.from({ length: 12 }, (_, idx) => {
      const d = new Date(today);
      d.setDate(today.getDate() + idx);
      return {
        offset: idx,
        dateObj: d,
        dayName: weekNames[d.getDay()],
        dayNum: d.getDate(),
        isoDate: d.toISOString().slice(0, 10),
      };
    });
  }, []);

  // Filtered events by date strip and category/online filter
  const displayedEvents = useMemo(() => {
    let list = events;
    if (categoryFilter === 'ONLINE') {
      list = list.filter((ev) => isOnlineEvent(ev.city, ev.locationAddress));
    } else if (categoryFilter) {
      list = list.filter((ev) =>
        (ev.activityFormat || '').toLowerCase().includes(categoryFilter.toLowerCase())
      );
    }
    if (selectedDayOffset === null) return list;
    const targetIso = dateStripDays[selectedDayOffset]?.isoDate;
    if (!targetIso) return list;
    const matching = list.filter((ev) => ev.startsAt.slice(0, 10) === targetIso);
    return matching;
  }, [events, categoryFilter, selectedDayOffset, dateStripDays]);

  // Mini calendar days for Bento Widget #1 (Översikt)
  const eventDayNumbers = useMemo(() => {
    const set = new Set<number>();
    recommendedEvents.forEach((ev) => {
      const d = new Date(ev.startsAt);
      if (!Number.isNaN(d.getTime())) {
        set.add(d.getDate());
      }
    });
    return set;
  }, [recommendedEvents]);

  const featuredEvent = events[0] || recommendedEvents[0] || null;

  const currentDateFormatted = useMemo(() => {
    return new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'long',
      weekday: 'short',
    }).format(new Date());
  }, []);

  return (
    <div className="space-y-6 pb-8">
      {/* TOP SCENIC WELCOME HEADER + TRAVENLY SEARCH BAR (Ref 1 + Ref 2) */}
      <section className="bento-card overflow-hidden relative p-5 sm:p-7 bg-gradient-to-r from-[#D9F2E6] via-[#E9F8F1] to-[#D4EEFC] border border-white">
        {/* Decorative soft scenic hills in background */}
        <svg
          viewBox="0 0 900 220"
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full pointer-events-none select-none opacity-55 a11y-decorative"
        >
          <circle cx="780" cy="48" r="32" fill="#FFF6BA" />
          <path d="M0 175 Q220 95 470 155 T900 125 L900 220 L0 220 Z" fill="#9EE2B8" opacity="0.55" />
          <path d="M0 195 Q340 135 660 180 T900 165 L900 220 L0 220 Z" fill="#5BC889" opacity="0.45" />
        </svg>

        <div className="relative z-10 flex flex-col gap-5">
          {/* Top greeting row + Right Weather/Region/Date pill (Ref 1 top bar + Ref 2 header) */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 backdrop-blur-xs text-[#11995E] text-xs font-extrabold mb-2 shadow-2xs">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Спортивная экосистема «Точка Сбора»</span>
              </div>
              <h1 className="font-display font-black text-2xl sm:text-3xl text-[#1A2622] tracking-tight">
                {user
                  ? `Привет, ${user.displayName.split(' ')[0]}! 👋`
                  : 'Добро пожаловать в Точку Сбора! 👋'}
              </h1>
              <p className="text-xs sm:text-sm font-semibold text-slate-600 mt-1">
                Находите спортивные тренировки, соревнования, фестивали, квесты и напарников в своём городе или онлайн
              </p>
            </div>

            {/* Right Scenic Info Pill (Ref 1 top-right status widget) */}
            <div className="flex items-center gap-3 bg-white/90 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-xs border border-white">
              <div className="w-9 h-9 rounded-xl bg-[#E7F8F0] text-[#16B672] flex items-center justify-center">
                <Sun className="w-5 h-5" />
              </div>
              <div className="text-xs">
                <div className="font-display font-extrabold text-slate-900 capitalize">
                  {currentDateFormatted}
                </div>
                <div className="text-[11px] font-bold text-[#16B672] flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  <span>{city || 'Все регионы РФ'}</span>
                  <span>•</span>
                  <span>{getRegionInfo(city)?.tzLabel.split(' ')[0] || 'МСК'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Travenly Search Bar + Voice Search (#9) */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="relative flex-1 flex items-center">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchCatalog()}
                placeholder="Найти тренировку, соревнование, площадку или вид спорта (можно голосом)..."
                className="w-full h-12 pl-11 pr-14 rounded-2xl bg-white border border-white shadow-sm text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#16B672]"
              />
              <div className="absolute right-1.5 top-1/2 -translate-y-1/2">
                <VoiceSearchButton
                  onResult={(spoken) => setSearchQuery(spoken)}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowFiltersPanel((prev) => !prev)}
                title="Расширенные фильтры"
                className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-all shadow-sm ${
                  showFiltersPanel
                    ? 'bg-slate-900 text-white'
                    : 'bg-[#16B672] hover:bg-[#11995E] text-white shadow-[#16B672]/25'
                }`}
              >
                <SlidersHorizontal className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={fetchCatalog}
                className="h-12 px-6 rounded-2xl bg-[#16B672] hover:bg-[#11995E] text-white font-display font-extrabold text-sm shadow-md shadow-[#16B672]/25 transition-all cursor-pointer"
              >
                Найти
              </button>

              <Link
                to={user ? '/events/new' : '/register'}
                className="h-12 px-4 rounded-2xl bg-white/95 hover:bg-white text-slate-900 font-display font-extrabold text-xs sm:text-sm inline-flex items-center gap-1.5 shadow-sm border border-white transition-all"
              >
                <Plus className="w-4 h-4 text-[#16B672]" />
                <span className="hidden sm:inline">Создать сбор</span>
              </Link>
            </div>
          </div>

          {/* Quick Category Pills (#11: Тренировки, Соревнования, Фестивали, Квесты, Онлайн) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
            <button
              type="button"
              onClick={() => setCategoryFilter('')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                categoryFilter === ''
                  ? 'bg-[#16B672] text-white shadow-sm'
                  : 'bg-white/85 text-slate-700 hover:bg-white'
              }`}
            >
              Все форматы
            </button>
            {EVENT_CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setCategoryFilter(categoryFilter === cat.value ? '' : cat.value)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                  categoryFilter === cat.value
                    ? 'bg-[#16B672] text-white shadow-sm'
                    : 'bg-white/85 text-slate-700 hover:bg-white'
                }`}
              >
                {cat.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setCategoryFilter(categoryFilter === 'ONLINE' ? '' : 'ONLINE')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                categoryFilter === 'ONLINE'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white/85 text-indigo-700 hover:bg-white'
              }`}
            >
              🌐 Онлайн-мероприятия
            </button>
          </div>

          {/* Collapsible Advanced Filters Drawer */}
          {showFiltersPanel && (
            <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 border border-slate-100 shadow-sm space-y-3 animate-fadeIn">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                <RegionSelect
                  value={city}
                  onChange={setCity}
                  allowAll
                  allLabel="Все регионы РФ"
                  placeholder="Выберите город / регион"
                />

                <CustomSelect
                  value={selectedSportId}
                  onChange={setSelectedSportId}
                  options={[
                    { value: '', label: 'Все виды спорта' },
                    ...sports.map((s) => ({ value: s.id, label: s.name })),
                  ]}
                />

                <CustomSelect
                  value={categoryFilter}
                  onChange={setCategoryFilter}
                  options={[
                    { value: '', label: 'Любая категория события' },
                    ...EVENT_CATEGORIES,
                    { value: 'ONLINE', label: '🌐 Онлайн-формат' },
                  ]}
                />

                <CustomSelect
                  value={joinMode}
                  onChange={setJoinMode}
                  options={[
                    { value: '', label: 'Любой режим записи' },
                    { value: 'OPEN', label: 'Свободный вход' },
                    { value: 'APPROVAL_REQUIRED', label: 'По заявке организатору' },
                  ]}
                />

                <CustomSelect
                  value={skillLevel}
                  onChange={setSkillLevel}
                  options={[
                    { value: '', label: 'Любой уровень подготовки' },
                    ...Object.entries(SKILL_LABELS).map(([k, v]) => ({
                      value: k,
                      label: v,
                    })),
                  ]}
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
                <div className="flex flex-wrap items-center gap-4">
                  <label className="inline-flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={onlyAvailable}
                      onChange={(e) => setOnlyAvailable(e.target.checked)}
                      className="rounded border-slate-300 text-[#16B672] focus:ring-[#16B672]"
                    />
                    <span>Только со свободными местами</span>
                  </label>

                  <div className="flex items-center gap-2 min-w-[240px]">
                    <Repeat className="w-3.5 h-3.5 text-[#16B672] shrink-0" />
                    <CustomSelect
                      size="sm"
                      value={recurringFilter}
                      onChange={setRecurringFilter}
                      options={[
                        { value: '', label: 'Разовые и повторяющиеся встречи' },
                        { value: 'false', label: 'Только разовые встречи' },
                        { value: 'true', label: 'Повторяющиеся встречи' },
                      ]}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-3 py-1.5 rounded-xl font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                >
                  Сбросить фильтры
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* REFERENCE 1: 6-WIDGET BENTO DASHBOARD GRID (3 Columns × 2 Rows, shown on '/') */}
      {!catalogOnly && (
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* WIDGET 1: Översikt (Сводка + Мини-календарь месяца) */}
          <div className="bento-card p-5 flex flex-col justify-between gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display font-extrabold text-base text-slate-900">
                  Сводка месяца 📅
                </h2>
                <p className="text-[11px] font-semibold text-slate-500">
                  Календарь активностей и статистика
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-[#E7F8F0] text-[#11995E] text-[11px] font-extrabold">
                Активно
              </span>
            </div>

            <div className="grid grid-cols-12 gap-3 items-center">
              {/* Left stats column */}
              <div className="col-span-5 space-y-2.5 pr-2 border-r border-slate-100">
                <div>
                  <div className="text-[11px] font-bold text-slate-400">Активных встреч</div>
                  <div className="font-display font-black text-xl text-slate-900">
                    {recommendedEvents.length}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] font-bold text-slate-400">Видов спорта</div>
                  <div className="font-display font-black text-xl text-[#16B672]">
                    {sports.length}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] font-bold text-slate-400">Клубов и комьюнити</div>
                  <div className="font-display font-black text-xl text-slate-900">
                    {organizations.length}
                  </div>
                </div>
              </div>

              {/* Right mini calendar grid */}
              <div className="col-span-7">
                <div className="grid grid-cols-7 gap-1 text-center text-[9px] font-extrabold text-slate-400 mb-1">
                  {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((d) => (
                    <span key={d}>{d}</span>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1 text-center">
                  {Array.from({ length: 28 }, (_, i) => i + 1).map((dayNum) => {
                    const hasEvent = eventDayNumbers.has(dayNum) || dayNum % 4 === 0;
                    const isToday = dayNum === new Date().getDate();
                    return (
                      <div
                        key={dayNum}
                        className={`h-6 rounded-lg flex items-center justify-center text-[10px] font-extrabold transition-colors ${
                          isToday
                            ? 'bg-slate-900 text-white'
                            : hasEvent
                            ? 'bg-[#16B672] text-white shadow-2xs'
                            : 'text-slate-600 bg-[#F7FAF8]'
                        }`}
                      >
                        {dayNum}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* WIDGET 2: Uppgifter (Ближайшие встречи с прогресс-барами мест) */}
          <div className="bento-card p-5 flex flex-col justify-between gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display font-extrabold text-base text-slate-900">
                  Набор в группы ⚡
                </h2>
                <p className="text-[11px] font-semibold text-slate-500">
                  Заполненность ближайших тренировок
                </p>
              </div>
              <Link
                to="/events"
                className="text-xs font-extrabold text-[#16B672] hover:underline"
              >
                Все →
              </Link>
            </div>

            <div className="space-y-3">
              {(events.length > 0 ? events : recommendedEvents).slice(0, 3).map((ev) => {
                const maxP = ev.maxParticipants || Math.max(12, ev.confirmedParticipantsCount + 4);
                const pct = Math.min(100, Math.round((ev.confirmedParticipantsCount / maxP) * 100));
                return (
                  <Link
                    key={ev.id}
                    to={`/events/${ev.id}`}
                    className="block p-2.5 rounded-2xl bg-[#F7FAF8] hover:bg-[#E7F8F0]/60 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-display font-extrabold text-slate-900 truncate">
                        {ev.title}
                      </span>
                      <span className="font-extrabold text-[#11995E] shrink-0">
                        {ev.confirmedParticipantsCount} / {maxP}
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 rounded-full bg-white overflow-hidden p-0.5">
                      <div
                        className="h-full rounded-full bg-[#16B672] transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* WIDGET 3: Senaste bilden (Встреча дня / Избранная площадка) */}
          <div className="bento-card p-5 flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-extrabold text-base text-slate-900">
                Встреча дня 🌟
              </h2>
              {featuredEvent && (
                <span className="px-2.5 py-0.5 rounded-full bg-[#E7F8F0] text-[#11995E] text-[10px] font-extrabold">
                  {featuredEvent.sport.name}
                </span>
              )}
            </div>

            {featuredEvent ? (
              <Link
                to={`/events/${featuredEvent.id}`}
                className="group relative rounded-2xl overflow-hidden h-44 flex items-end p-3.5 bg-[#DDF4FA]"
              >
                <div className="absolute inset-0">
                  {featuredEvent.coverImageUrl ? (
                    <img
                      src={featuredEvent.coverImageUrl}
                      alt={featuredEvent.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <ScenicSportIllustration sportName={featuredEvent.sport.name} variant={1} />
                  )}
                </div>
                <div className="relative z-10 w-full bg-white/95 backdrop-blur-md rounded-xl p-3 shadow-sm flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-display font-extrabold text-xs text-slate-900 truncate">
                      {featuredEvent.title}
                    </div>
                    <div className="text-[11px] font-semibold text-slate-500 truncate mt-0.5">
                      {featuredEvent.city} • {formatDateTime(featuredEvent.startsAt)}
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-[#16B672] text-white flex items-center justify-center shrink-0">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            ) : (
              <div className="h-44 rounded-2xl bg-[#F7FAF8] flex items-center justify-center text-xs text-slate-400">
                Загрузка события...
              </div>
            )}
          </div>

          {/* WIDGET 4: Samlingar (Коллекция видов спорта со счётчиками и прогресс-баром) */}
          <div className="bento-card p-5 flex flex-col justify-between gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display font-extrabold text-base text-slate-900">
                  Виды спорта 🏆
                </h2>
                <p className="text-[11px] font-semibold text-slate-500">
                  Нажмите для быстрой фильтрации
                </p>
              </div>
              {selectedSportId && (
                <button
                  type="button"
                  onClick={() => setSelectedSportId('')}
                  className="text-xs font-extrabold text-[#16B672]"
                >
                  Все
                </button>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {sports.slice(0, 6).map((s, idx) => {
                const count = recommendedEvents.filter((e) => e.sport.id === s.id).length;
                const active = selectedSportId === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSelectedSportId(active ? '' : s.id)}
                    className={`p-3 rounded-2xl text-left transition-all border ${
                      active
                        ? 'bg-[#16B672] text-white border-[#16B672] shadow-sm'
                        : 'bg-[#F7FAF8] hover:bg-[#E7F8F0]/70 text-slate-800 border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Trophy
                        className={`w-4 h-4 ${active ? 'text-white' : 'text-[#16B672]'}`}
                      />
                      <span
                        className={`text-[10px] font-extrabold ${
                          active ? 'text-white/90' : 'text-slate-400'
                        }`}
                      >
                        {count} сб.
                      </span>
                    </div>
                    <div className="font-display font-extrabold text-xs mt-2 truncate">
                      {s.name}
                    </div>
                    <div
                      className={`mt-1.5 h-1 rounded-full overflow-hidden ${
                        active ? 'bg-white/30' : 'bg-slate-200'
                      }`}
                    >
                      <div
                        className={`h-full rounded-full ${
                          active ? 'bg-white' : 'bg-[#16B672]'
                        }`}
                        style={{ width: `${Math.min(100, 35 + ((idx * 19) % 65))}%` }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* WIDGET 5: Min ö (Интерактивная карта площадок города) */}
          <div className="bento-card p-5 flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display font-extrabold text-base text-slate-900">
                  Карта площадок 🗺️
                </h2>
                <p className="text-[11px] font-semibold text-slate-500">
                  {activeMapCoords.city} • Яндекс Карты и 2ГИС
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setViewMode(viewMode === 'map' ? 'grid' : 'map');
                  document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-3 py-1.5 rounded-xl bg-[#16B672] hover:bg-[#11995E] text-white text-xs font-extrabold shadow-xs cursor-pointer"
              >
                {viewMode === 'map' ? 'К списку' : 'Открыть карту'}
              </button>
            </div>

            <div className="relative h-36 rounded-2xl overflow-hidden border border-slate-100 bg-[#E7F8F0]">
              <iframe
                title="Мини-карта площадок"
                src={`https://yandex.ru/map-widget/v1/?ll=${activeMapCoords.lon}%2C${activeMapCoords.lat}&z=11&pt=${activeMapCoords.lon},${activeMapCoords.lat},pm2rdm`}
                className="w-full h-full border-0"
                loading="lazy"
              />
            </div>

            <div className="flex items-center justify-between gap-2 text-[11px] font-bold">
              <a
                href={`https://yandex.ru/maps/?text=${encodeURIComponent(
                  `${activeMapCoords.city} ${activeMapCoords.address}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-700 hover:underline inline-flex items-center gap-1"
              >
                <Navigation className="w-3 h-3" />
                <span>Яндекс.Карты</span>
              </a>
              <a
                href={`https://2gis.ru/search/${encodeURIComponent(
                  `${activeMapCoords.city} ${activeMapCoords.address}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#11995E] hover:underline inline-flex items-center gap-1"
              >
                <MapPin className="w-3 h-3" />
                <span>Открыть в 2ГИС</span>
              </a>
            </div>
          </div>

          {/* WIDGET 6: Invånare (Спортивные напарники 2×4 круглых аватара + кнопка Спорт-Мэтч) */}
          <div className="bento-card p-5 flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display font-extrabold text-base text-slate-900">
                  Участники и напарники 🤝
                </h2>
                <p className="text-[11px] font-semibold text-slate-500">
                  Открыты для совместных тренировок
                </p>
              </div>
              <Link
                to="/partners"
                className="px-3 py-1.5 rounded-xl bg-[#16B672] hover:bg-[#11995E] text-white text-xs font-extrabold shadow-xs"
              >
                Спорт-Мэтч
              </Link>
            </div>

            <div className="grid grid-cols-4 gap-2 pt-1">
              {(partners.length > 0
                ? partners.slice(0, 8)
                : [
                    { id: '1', displayName: 'Алексей', city: 'Москва' },
                    { id: '2', displayName: 'Мария', city: 'Красноярск' },
                    { id: '3', displayName: 'Дмитрий', city: 'Санкт-Петербург' },
                    { id: '4', displayName: 'Екатерина', city: 'Казань' },
                    { id: '5', displayName: 'Илья', city: 'Новосибирск' },
                    { id: '6', displayName: 'Анна', city: 'Екатеринбург' },
                    { id: '7', displayName: 'Максим', city: 'Орёл' },
                    { id: '8', displayName: 'Ольга', city: 'Краснодар' },
                  ]
              ).map((p: any, idx: number) => (
                <Link
                  key={p.id || idx}
                  to={p.id && p.id.length > 5 ? `/users/${p.id}` : '/partners'}
                  className="flex flex-col items-center text-center group"
                >
                  {p.avatarUrl ? (
                    <img
                      src={p.avatarUrl}
                      alt={p.displayName}
                      className="w-11 h-11 rounded-full object-cover border-2 border-[#E7F8F0] group-hover:border-[#16B672] transition-colors a11y-keep"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-[#E7F8F0] text-[#11995E] font-display font-extrabold text-xs flex items-center justify-center border-2 border-white shadow-2xs group-hover:bg-[#16B672] group-hover:text-white transition-colors">
                      {(p.displayName || 'У').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-[10px] font-bold text-slate-700 mt-1 truncate max-w-[60px]">
                    {(p.displayName || 'Атлет').split(' ')[0]}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* REFERENCE 2: "Discover World" TALL SCENIC CARDS ROW */}
      {!catalogOnly && (events.length > 0 || recommendedEvents.length > 0) && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display font-extrabold text-xl sm:text-2xl text-slate-900">
                Популярные спортивные сборы 🌍
              </h2>
              <p className="text-xs font-semibold text-slate-500">
                Главные события недели с открытой регистрацией
              </p>
            </div>

            {/* Sport quick pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setSelectedSportId('')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold whitespace-nowrap transition-all ${
                  selectedSportId === ''
                    ? 'bg-[#16B672] text-white shadow-sm shadow-[#16B672]/25'
                    : 'bg-white text-slate-600 hover:bg-[#E7F8F0] hover:text-[#11995E]'
                }`}
              >
                Рекомендуемые
              </button>
              {sports.slice(0, 5).map((s) => (
                <button
                  type="button"
                  key={s.id}
                  onClick={() => setSelectedSportId(s.id === selectedSportId ? '' : s.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold whitespace-nowrap transition-all ${
                    selectedSportId === s.id
                      ? 'bg-[#16B672] text-white shadow-sm shadow-[#16B672]/25'
                      : 'bg-white text-slate-600 hover:bg-[#E7F8F0] hover:text-[#11995E]'
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {(events.length > 0 ? events : recommendedEvents).slice(0, 3).map((ev, idx) => (
              <EventCard key={ev.id} event={ev} variant="tall" index={idx} />
            ))}
          </div>
        </section>
      )}

      {/* REFERENCE 2: "Event Dates 🚀" HORIZONTAL DATE CAPSULE STRIP + CATALOG */}
      <section id="catalog" className="bento-card p-5 sm:p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display font-extrabold text-xl text-slate-900">
              Расписание и каталог встреч 🚀
            </h2>
            <p className="text-xs font-semibold text-slate-500">
              Выберите день недели или просмотрите все доступные тренировки ({displayedEvents.length})
            </p>
          </div>

          <div className="flex items-center gap-2">
            {city && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#E7F8F0] text-[#11995E] text-xs font-extrabold">
                <Globe className="w-3.5 h-3.5" />
                <span>{city}</span>
                <button
                  type="button"
                  onClick={() => setCity('')}
                  className="ml-1 hover:text-slate-900"
                  title="Все регионы"
                >
                  ×
                </button>
              </div>
            )}

            <div className="flex items-center gap-1 bg-[#F4F8F6] p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                  viewMode === 'grid'
                    ? 'bg-[#16B672] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Список ({displayedEvents.length})
              </button>
              <button
                type="button"
                onClick={() => setViewMode('map')}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                  viewMode === 'map'
                    ? 'bg-[#16B672] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Map className="w-3.5 h-3.5" />
                <span>На карте</span>
              </button>
            </div>
          </div>
        </div>

        {/* Horizontal Date Capsule Strip (Reference 2 exact vertical green pill highlight) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setSelectedDayOffset(null)}
            className={`px-4 py-3 rounded-full text-xs font-extrabold shrink-0 transition-all cursor-pointer ${
              selectedDayOffset === null
                ? 'bg-[#16B672] text-white shadow-md shadow-[#16B672]/30'
                : 'bg-[#F7FAF8] text-slate-600 hover:bg-[#E7F8F0]'
            }`}
          >
            Все дни
          </button>
          {dateStripDays.map((d) => {
            const active = selectedDayOffset === d.offset;
            return (
              <button
                key={d.offset}
                type="button"
                onClick={() => setSelectedDayOffset(active ? null : d.offset)}
                className={`w-12 py-2.5 rounded-full flex flex-col items-center justify-center gap-1 shrink-0 transition-all cursor-pointer ${
                  active
                    ? 'bg-[#16B672] text-white shadow-md shadow-[#16B672]/30 scale-105'
                    : 'bg-[#F7FAF8] text-slate-600 hover:bg-[#E7F8F0]'
                }`}
              >
                <span className={`text-[10px] font-bold ${active ? 'text-white/90' : 'text-slate-400'}`}>
                  {d.dayName}
                </span>
                <span className="font-display font-black text-xs">{d.dayNum}</span>
              </button>
            );
          })}
        </div>

        {/* Catalog Content: Loading / Map / Empty / Horizontal & Default Cards */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-28 rounded-3xl bg-[#F4F8F6] animate-pulse" />
            ))}
          </div>
        ) : viewMode === 'map' ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs font-semibold text-slate-600">
                Выберите площадку слева, чтобы увидеть её на карте или открыть навигатор
              </div>
              {selectedMapEvent && (
                <div className="flex items-center gap-2">
                  <a
                    href={`https://yandex.ru/maps/?text=${encodeURIComponent(
                      `${selectedMapEvent.city}, ${selectedMapEvent.locationAddress}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-extrabold transition-colors"
                  >
                    <Navigation className="w-3.5 h-3.5 text-amber-600" />
                    <span>Яндекс Карты</span>
                    <ExternalLink className="w-3 h-3 opacity-60" />
                  </a>
                  <a
                    href={`https://2gis.ru/search/${encodeURIComponent(
                      `${selectedMapEvent.city} ${selectedMapEvent.locationAddress}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#E7F8F0] hover:bg-[#D2F2E3] text-[#11995E] text-xs font-extrabold transition-colors"
                  >
                    <MapPin className="w-3.5 h-3.5 text-[#16B672]" />
                    <span>Открыть в 2ГИС</span>
                    <ExternalLink className="w-3 h-3 opacity-60" />
                  </a>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              <div className="lg:col-span-5 space-y-2.5 max-h-[440px] overflow-y-auto pr-1">
                {mapEvents.map((ev) => {
                  const isSelected = selectedMapEvent?.id === ev.id;
                  return (
                    <div
                      key={ev.id}
                      onClick={() => setSelectedMapEvent(ev)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-[#E7F8F0]/70 border-[#16B672] shadow-xs'
                          : 'bg-[#F7FAF8] border-transparent hover:border-[#16B672]/40'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[11px] font-extrabold text-[#16B672] uppercase">
                          {ev.sport.name}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-400">
                          {getRegionInfo(ev.city)?.tzLabel || 'МСК'}
                        </span>
                      </div>
                      <div className="font-display font-extrabold text-sm text-slate-900 mt-0.5">
                        {ev.title}
                      </div>
                      <div className="text-xs text-slate-600 flex items-center gap-1.5 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-[#16B672] shrink-0" />
                        <span>
                          {ev.city}, {ev.locationAddress}
                        </span>
                      </div>
                      <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between">
                        <Link
                          to={`/events/${ev.id}`}
                          className="text-xs font-extrabold text-[#11995E] hover:underline"
                        >
                          Открыть встречу →
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="lg:col-span-7 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 flex flex-col min-h-[420px]">
                <iframe
                  title="Интерактивная карта площадки"
                  src={`https://yandex.ru/map-widget/v1/?ll=${activeMapCoords.lon}%2C${activeMapCoords.lat}&z=12&pt=${activeMapCoords.lon},${activeMapCoords.lat},pm2rdm`}
                  className="w-full flex-1 min-h-[370px] border-0"
                  loading="lazy"
                />
                {selectedMapEvent && (
                  <div className="p-3.5 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div>
                      <span className="font-bold text-[#16B672]">{selectedMapEvent.title}:</span>{' '}
                      <span>
                        {selectedMapEvent.city}, {selectedMapEvent.locationAddress}
                      </span>
                    </div>
                    <Link
                      to={`/events/${selectedMapEvent.id}`}
                      className="px-3.5 py-1.5 rounded-xl bg-[#16B672] hover:bg-[#11995E] text-white font-bold"
                    >
                      Перейти к записи
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : displayedEvents.length === 0 ? (
          <div className="space-y-6">
            <div className="bg-[#F7FAF8] rounded-3xl p-8 text-center space-y-3">
              <div className="text-lg font-display font-extrabold text-slate-900">
                По выбранным параметрам точных совпадений не нашлось
              </div>
              <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto">
                {city
                  ? `В регионе «${city}» по вашему запросу пока нет активных сборов. Посмотрите рекомендуемые встречи ниже или создайте свою тренировку!`
                  : 'Попробуйте изменить поисковый запрос, сбросить фильтры или выберите одну из рекомендуемых тренировок ниже.'}
              </p>
              <div className="pt-2 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-4 py-2.5 rounded-2xl text-xs font-extrabold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                >
                  Показать все регионы и сбросить фильтры
                </button>
                <Link
                  to="/events/new"
                  className="px-4 py-2.5 rounded-2xl text-xs font-extrabold bg-[#16B672] text-white hover:bg-[#11995E]"
                >
                  + Создать свою встречу
                </Link>
              </div>
            </div>

            {recommendedEvents.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-display font-extrabold text-base text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#16B672]" />
                  <span>Рекомендуемые ближайшие мероприятия</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {recommendedEvents.slice(0, 6).map((ev, idx) => (
                    <EventCard key={ev.id} event={ev} variant="horizontal" index={idx} />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : catalogOnly ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {displayedEvents.map((ev, idx) => (
              <EventCard key={ev.id} event={ev} variant="default" index={idx} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayedEvents.map((ev, idx) => (
              <EventCard key={ev.id} event={ev} variant="horizontal" index={idx} />
            ))}
          </div>
        )}
      </section>

      {/* REFERENCE 1 BOTTOM STRIP: "Anteckningar" (3-Column Clubs & Open Communities Strip) */}
      {!catalogOnly && organizations.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display font-extrabold text-xl text-slate-900">
                Проверенные клубы и открытые комьюнити 🏛️
              </h2>
              <p className="text-xs font-semibold text-slate-500">
                Вступайте в городские сообщества и следите за расписанием любимых организаторов
              </p>
            </div>
            <Link
              to="/organizations"
              className="text-xs sm:text-sm font-extrabold text-[#16B672] hover:text-[#11995E] inline-flex items-center gap-1"
            >
              <span>Все клубы ({organizations.length})</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {organizations.slice(0, 3).map((org) => (
              <Link
                key={org.id}
                to={`/organizations/${org.id}`}
                className="bento-card bento-card-hover p-5 flex flex-col justify-between gap-4"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#E7F8F0] text-[#11995E] text-[11px] font-extrabold">
                      <BadgeCheck className="w-3.5 h-3.5" />
                      <span>
                        {org.orgType === 'COMMUNITY' ? 'Открытое комьюнити' : 'Официальный клуб'}
                      </span>
                    </span>
                    <span className="text-[11px] font-bold text-slate-400">{org.city}</span>
                  </div>

                  <h3 className="font-display font-extrabold text-base text-slate-900">
                    {org.name}
                  </h3>
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {org.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1">
                    {org.sports.slice(0, 2).map((s) => (
                      <span
                        key={s.id}
                        className="px-2 py-0.5 rounded-lg bg-[#F7FAF8] text-slate-700 text-[10px] font-bold"
                      >
                        {s.name}
                      </span>
                    ))}
                  </div>
                  <div className="w-8 h-8 rounded-full bg-[#E7F8F0] text-[#16B672] flex items-center justify-center shrink-0">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
