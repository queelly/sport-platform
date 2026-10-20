import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Compass,
  ExternalLink,
  Globe,
  List,
  LocateFixed,
  Map as MapIcon,
  MapPin,
  Minus,
  Navigation,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Repeat,
  Search,
  SlidersHorizontal,
  Sparkles,
  X,
} from 'lucide-react';
import { useAuth } from '../AuthContext';
import { apiFetch, formatDateTime, SKILL_LABELS } from '../api';
import {
  EventCardDto,
  getRegionInfo,
  isOnlineEvent,
  OrganizationDto,
} from '../types';
import { EventCard, getSportCoverUrl, getSportEmoji } from '../components/EventCard';
import { getSelectedGlobalRegion } from '../components/Navbar';
import {
  GeocodedPlace,
  KNOWN_2GIS_VENUES,
  searchRealAddresses2Gis,
  VoiceSearchButton,
} from '../components/UiControls';
import { PartnersAndFriendsPage } from './SocialPages';

declare global {
  interface Window {
    L?: any;
  }
}

export function getRealEventCoords(ev: EventCardDto): { lat: number; lng: number } {
  if (typeof ev.latitude === 'number' && typeof ev.longitude === 'number') {
    return { lat: ev.latitude, lng: ev.longitude };
  }
  const addrLower = (ev.locationAddress || '').toLowerCase().replace('ё', 'е');
  const cityLower = (ev.city || '').toLowerCase().replace('ё', 'е');
  const matchedVenue = KNOWN_2GIS_VENUES.find(
    (v) =>
      v.city.toLowerCase().replace('ё', 'е') === cityLower &&
      (addrLower.includes(v.address.split(',')[0].toLowerCase().replace('ё', 'е')) ||
        v.address.toLowerCase().replace('ё', 'е').includes(addrLower))
  );
  if (matchedVenue) {
    return { lat: matchedVenue.lat, lng: matchedVenue.lng };
  }

  const info = getRegionInfo(ev.city);
  const baseLat = info?.lat ?? 55.7558;
  const baseLng = info?.lng ?? 37.6173;
  let hash = 0;
  const seed = `${ev.id}-${ev.locationAddress}`;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  const latOffset = ((hash % 1000) / 1000) * 0.03 - 0.015;
  const lngOffset = (((hash >> 10) % 1000) / 1000) * 0.04 - 0.02;
  return {
    lat: Number((baseLat + latOffset).toFixed(5)),
    lng: Number((baseLng + lngOffset).toFixed(5)),
  };
}

function formatShortTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '19:00';
  return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

function formatRelativeDayLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const now = new Date();
  const todayStr = now.toDateString();
  const tom = new Date(now);
  tom.setDate(now.getDate() + 1);
  if (d.toDateString() === todayStr) return 'Сегодня';
  if (d.toDateString() === tom.toDateString()) return 'Завтра';
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }).replace('.', '');
}

export const HomeAndCatalogPage: React.FC<{ catalogOnly?: boolean }> = ({ catalogOnly = false }) => {
  const { user, sports } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const viewParam = searchParams.get('view');
  const viewMode: 'map' | 'list' = catalogOnly
    ? viewParam === 'map'
      ? 'map'
      : 'list'
    : viewParam === 'list'
    ? 'list'
    : 'map';

  const urlQuery = searchParams.get('q') || '';

  const [events, setEvents] = useState<EventCardDto[]>([]);
  const [recommendedEvents, setRecommendedEvents] = useState<EventCardDto[]>([]);
  const [loading, setLoading] = useState(true);

  // Фильтры (без категорий спорта)
  const [selectedSportId, setSelectedSportId] = useState<string>('');
  const [city, setCity] = useState<string>(() => getSelectedGlobalRegion());
  const [joinMode, setJoinMode] = useState<string>('');
  const [skillLevel, setSkillLevel] = useState<string>('');
  const [formatFilter, setFormatFilter] = useState<'' | 'OFFLINE' | 'ONLINE'>('');
  const [recurringFilter, setRecurringFilter] = useState<string>('');
  const [onlyAvailable, setOnlyAvailable] = useState<boolean>(false);
  const [datePreset, setDatePreset] = useState<'' | 'today' | 'tomorrow' | 'weekend' | string>('');

  // Поиск реальных адресов 2ГИС прямо из поисковой строки
  const [addressSuggestions, setAddressSuggestions] = useState<GeocodedPlace[]>([]);
  const [showAddressDropdown, setShowAddressDropdown] = useState(false);
  const [searchedAddressPin, setSearchedAddressPin] = useState<GeocodedPlace | null>(null);

  // Выпадающие меню фильтрации
  const [openDropdown, setOpenDropdown] = useState<null | 'date' | 'sport' | 'format'>(null);
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [calendarMonthOffset, setCalendarMonthOffset] = useState(0);

  // Состояния карты
  const [listCollapsed, setListCollapsed] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventCardDto | null>(null);
  const [joiningEventId, setJoiningEventId] = useState<string | null>(null);
  const [joinFeedback, setJoinFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const filterBarRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onRegionChange = (e: Event) => {
      const customEv = e as CustomEvent<string>;
      setCity(customEv.detail || '');
      setSearchedAddressPin(null);
    };
    window.addEventListener('sp-region-change', onRegionChange);
    return () => window.removeEventListener('sp-region-change', onRegionChange);
  }, []);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (filterBarRef.current && !filterBarRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
        setShowAddressDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  // Подсказки реальных адресов 2ГИС при вводе в строку поиска
  useEffect(() => {
    let cancelled = false;
    const q = urlQuery.trim();
    if (!q || q.length < 2) {
      setAddressSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      const found = await searchRealAddresses2Gis(q, city);
      if (!cancelled) {
        setAddressSuggestions(found.slice(0, 5));
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [urlQuery, city]);

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
      if (urlQuery.trim()) params.set('q', urlQuery.trim());

      const [evList, allEvList] = await Promise.all([
        apiFetch<EventCardDto[]>(`/api/v1/events?${params.toString()}`),
        apiFetch<EventCardDto[]>('/api/v1/events'),
      ]);
      setEvents(evList);
      setRecommendedEvents(allEvList);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, [selectedSportId, city, joinMode, skillLevel, recurringFilter, onlyAvailable, urlQuery]);

  const setViewMode = (nextView: 'map' | 'list') => {
    const next = new URLSearchParams(searchParams);
    next.set('view', nextView);
    setSearchParams(next);
  };

  const handleResetFilters = () => {
    setSelectedSportId('');
    setJoinMode('');
    setSkillLevel('');
    setFormatFilter('');
    setRecurringFilter('');
    setOnlyAvailable(false);
    setDatePreset('');
    setSearchedAddressPin(null);
    if (urlQuery) {
      const next = new URLSearchParams(searchParams);
      next.delete('q');
      setSearchParams(next);
    }
  };

  const displayedEvents = useMemo(() => {
    let list = events;

    if (formatFilter === 'ONLINE') {
      list = list.filter((ev) => isOnlineEvent(ev.city, ev.locationAddress));
    } else if (formatFilter === 'OFFLINE') {
      list = list.filter((ev) => !isOnlineEvent(ev.city, ev.locationAddress));
    }

    if (datePreset) {
      const now = new Date();
      const todayIso = now.toISOString().slice(0, 10);
      const tom = new Date(now);
      tom.setDate(now.getDate() + 1);
      const tomIso = tom.toISOString().slice(0, 10);

      if (datePreset === 'today') {
        list = list.filter((ev) => ev.startsAt.slice(0, 10) === todayIso);
      } else if (datePreset === 'tomorrow') {
        list = list.filter((ev) => ev.startsAt.slice(0, 10) === tomIso);
      } else if (datePreset === 'weekend') {
        list = list.filter((ev) => {
          const d = new Date(ev.startsAt).getDay();
          return d === 0 || d === 6;
        });
      } else if (/^\d{4}-\d{2}-\d{2}$/.test(datePreset)) {
        list = list.filter((ev) => ev.startsAt.slice(0, 10) === datePreset);
      }
    }

    return list;
  }, [events, formatFilter, datePreset]);

  const mapEvents = useMemo(
    () => displayedEvents.filter((ev) => !isOnlineEvent(ev.city, ev.locationAddress)),
    [displayedEvents]
  );

  const selectedSportObj = sports.find((s) => s.id === selectedSportId);

  const dateFilterLabel = useMemo(() => {
    if (!datePreset) return 'Любое время';
    if (datePreset === 'today') return 'Сегодня';
    if (datePreset === 'tomorrow') return 'Завтра';
    if (datePreset === 'weekend') return 'На выходных';
    const d = new Date(datePreset);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
    }
    return 'Выбрана дата';
  }, [datePreset]);

  const calendarView = useMemo(() => {
    const base = new Date();
    const target = new Date(base.getFullYear(), base.getMonth() + calendarMonthOffset, 1);
    const year = target.getFullYear();
    const month = target.getMonth();
    const monthTitle = target.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
    const firstDow = (target.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: Array<{ day: number; iso: string } | null> = [];
    for (let i = 0; i < firstDow; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ day: d, iso });
    }
    return { monthTitle, days };
  }, [calendarMonthOffset]);

  const activeFiltersCount = [
    selectedSportId,
    joinMode,
    skillLevel,
    formatFilter,
    recurringFilter,
    onlyAvailable ? '1' : '',
    datePreset,
    urlQuery,
    searchedAddressPin ? '1' : '',
  ].filter(Boolean).length;

  const handleQuickJoin = async (ev: EventCardDto) => {
    if (!user) {
      navigate('/login');
      return;
    }
    setJoiningEventId(ev.id);
    setJoinFeedback(null);
    try {
      await apiFetch(`/api/v1/events/${ev.id}/join`, {
        method: 'POST',
        body: JSON.stringify({ comment: 'Быстрая запись через карту 2ГИС' }),
      });
      setJoinFeedback({
        type: 'ok',
        text:
          ev.joinMode === 'OPEN'
            ? 'Вы успешно записаны в состав участников!'
            : 'Заявка отправлена организатору встречи!',
      });
      await fetchCatalog();
    } catch (e: any) {
      setJoinFeedback({
        type: 'err',
        text: e?.message || 'Не удалось записаться (проверьте пересечение расписания)',
      });
    } finally {
      setJoiningEventId(null);
    }
  };

  return (
    <div
      className={
        viewMode === 'map'
          ? 'h-[calc(100dvh-56px)] flex flex-col bg-page overflow-hidden select-none'
          : 'min-h-[calc(100dvh-56px)] flex flex-col bg-page'
      }
    >
      {/* ПАНЕЛЬ ПОИСКА ПО АДРЕСАМ 2ГИС И ФИЛЬТРОВ (БЕЗ OVERFLOW-X-AUTO, ЧТОБЫ ВСЕ МЕНЮ ОТКРЫВАЛИСЬ) */}
      <div
        ref={filterBarRef}
        className="px-4 lg:px-6 py-2.5 bg-card border-b border-line-2 flex flex-wrap items-center justify-between gap-2.5 shrink-0 relative z-40"
      >
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
          {/* 0. Поиск по мероприятиям и реальным адресам 2ГИС */}
          <div className="relative min-w-[240px] sm:min-w-[320px] max-w-[440px] flex-1">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={urlQuery}
                onFocus={() => setShowAddressDropdown(true)}
                onChange={(e) => {
                  const val = e.target.value;
                  const next = new URLSearchParams(searchParams);
                  if (val) next.set('q', val);
                  else next.delete('q');
                  setSearchParams(next, { replace: true });
                  setShowAddressDropdown(true);
                }}
                placeholder="Поиск по адресу 2ГИС, улице, спорткомплексу или спорту..."
                className="w-full h-9 pl-9 pr-9 rounded-xl bg-surface/75 hover:bg-surface focus:bg-card border border-line-2 focus:border-brand text-[13px] font-medium text-ink placeholder:text-muted outline-none transition-colors"
              />
              <div className="absolute right-1 top-1/2 -translate-y-1/2">
                <VoiceSearchButton
                  onResult={(spoken) => {
                    const next = new URLSearchParams(searchParams);
                    next.set('q', spoken);
                    setSearchParams(next, { replace: true });
                    setShowAddressDropdown(true);
                  }}
                />
              </div>
            </div>

            {/* Выпадающий список найденных реальных адресов 2ГИС */}
            {showAddressDropdown && addressSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-card rounded-2xl border border-line-2 shadow-2xl py-1.5 z-[220] anim-fade">
                <div className="px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted flex items-center justify-between">
                  <span>📍 Реальные адреса на карте 2ГИС</span>
                  <span>Показать точку</span>
                </div>
                {addressSuggestions.map((place, idx) => (
                  <button
                    key={`${place.lat}-${place.lng}-${idx}`}
                    type="button"
                    onClick={() => {
                      setSearchedAddressPin(place);
                      setShowAddressDropdown(false);
                      // Очищаем строгий текстовый фильтр, если пользователь хочет просто посмотреть точку на карте и все события рядом
                      const streetPart = place.address.split(',')[0].trim();
                      const hasMatchingEvent = events.some((ev) =>
                        ev.locationAddress.toLowerCase().includes(streetPart.toLowerCase())
                      );
                      if (!hasMatchingEvent) {
                        const next = new URLSearchParams(searchParams);
                        next.delete('q');
                        next.set('view', 'map');
                        setSearchParams(next, { replace: true });
                      } else if (viewMode !== 'map') {
                        setViewMode('map');
                      }
                    }}
                    className="w-full px-3.5 py-2 text-left hover:bg-brand-tint/60 flex items-start justify-between gap-2 transition-colors cursor-pointer"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-ink truncate">
                        {place.address}
                      </div>
                      {place.subtitle && (
                        <div className="text-[11px] text-muted truncate">{place.subtitle}</div>
                      )}
                    </div>
                    <span className="font-mono text-[10px] font-bold text-brand-ink bg-brand-tint px-1.5 py-0.5 rounded shrink-0">
                      На карте →
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 1. КОГДА (Выпадающий календарь и пресеты дат) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenDropdown((prev) => (prev === 'date' ? null : 'date'))}
              className={`h-9 px-3.5 rounded-xl text-[13px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                datePreset || openDropdown === 'date'
                  ? 'bg-ink text-card font-semibold shadow-2xs'
                  : 'bg-surface/75 hover:bg-surface text-ink border border-line-2'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-brand shrink-0" />
              <span className="whitespace-nowrap">
                Когда: <strong className="font-bold">{datePreset ? dateFilterLabel : 'Любое время'}</strong>
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 opacity-70 transition-transform ${
                  openDropdown === 'date' ? 'rotate-180' : ''
                }`}
              />
            </button>

            {openDropdown === 'date' && (
              <div className="absolute left-0 top-full mt-2 w-[310px] bg-card rounded-2xl shadow-2xl border border-line-2 p-4 z-[220] anim-fade">
                <div className="grid grid-cols-2 gap-1.5 mb-3">
                  {[
                    { id: '', label: 'Любое время' },
                    { id: 'today', label: 'Сегодня' },
                    { id: 'tomorrow', label: 'Завтра' },
                    { id: 'weekend', label: 'На выходных' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setDatePreset(p.id);
                        setOpenDropdown(null);
                      }}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold text-left transition-colors cursor-pointer ${
                        datePreset === p.id
                          ? 'bg-brand text-white font-bold'
                          : 'bg-surface hover:bg-surface-2 text-ink'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                <div className="border-t border-line pt-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-ink capitalize">
                      {calendarView.monthTitle}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setCalendarMonthOffset((m) => m - 1)}
                        className="w-6 h-6 rounded-lg hover:bg-surface flex items-center justify-center text-muted hover:text-ink cursor-pointer"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setCalendarMonthOffset((m) => m + 1)}
                        className="w-6 h-6 rounded-lg hover:bg-surface flex items-center justify-center text-muted hover:text-ink cursor-pointer"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-muted mb-1">
                    {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((d) => (
                      <div key={d}>{d}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {calendarView.days.map((cell, idx) =>
                      cell ? (
                        <button
                          key={cell.iso}
                          type="button"
                          onClick={() => {
                            setDatePreset(cell.iso);
                            setOpenDropdown(null);
                          }}
                          className={`h-8 rounded-lg text-xs font-semibold flex items-center justify-center transition-colors cursor-pointer ${
                            datePreset === cell.iso
                              ? 'bg-brand text-white font-bold'
                              : 'hover:bg-surface text-ink'
                          }`}
                        >
                          {cell.day}
                        </button>
                      ) : (
                        <div key={`empty-${idx}`} />
                      )
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 2. ВИД СПОРТА (Выпадающий список без категорий) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenDropdown((prev) => (prev === 'sport' ? null : 'sport'))}
              className={`h-9 px-3.5 rounded-xl text-[13px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                selectedSportId || openDropdown === 'sport'
                  ? 'bg-ink text-card font-semibold shadow-2xs'
                  : 'bg-surface/75 hover:bg-surface text-ink border border-line-2'
              }`}
            >
              <span className="whitespace-nowrap">
                Спорт:{' '}
                <strong className="font-bold">
                  {selectedSportObj ? `${getSportEmoji(selectedSportObj.name)} ${selectedSportObj.name}` : 'Все виды'}
                </strong>
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 opacity-70 transition-transform ${
                  openDropdown === 'sport' ? 'rotate-180' : ''
                }`}
              />
            </button>

            {openDropdown === 'sport' && (
              <div className="absolute left-0 top-full mt-2 w-64 max-h-80 overflow-y-auto bg-card rounded-2xl shadow-2xl border border-line-2 p-1.5 z-[220] anim-fade">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSportId('');
                    setOpenDropdown(null);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[13px] font-medium transition-colors cursor-pointer ${
                    !selectedSportId ? 'bg-brand-tint text-brand-ink font-bold' : 'text-ink hover:bg-surface'
                  }`}
                >
                  <span>Все виды спорта</span>
                  {!selectedSportId && <Check className="w-4 h-4 text-brand" />}
                </button>
                {sports.map((s) => {
                  const active = selectedSportId === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setSelectedSportId(active ? '' : s.id);
                        setOpenDropdown(null);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[13px] font-medium transition-colors cursor-pointer ${
                        active ? 'bg-brand-tint text-brand-ink font-bold' : 'text-ink hover:bg-surface'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span>{getSportEmoji(s.name)}</span>
                        <span>{s.name}</span>
                      </span>
                      {active && <Check className="w-4 h-4 text-brand" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 3. ФОРМАТ (На площадке / Онлайн) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenDropdown((prev) => (prev === 'format' ? null : 'format'))}
              className={`h-9 px-3.5 rounded-xl text-[13px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                formatFilter || openDropdown === 'format'
                  ? 'bg-ink text-card font-semibold shadow-2xs'
                  : 'bg-surface/75 hover:bg-surface text-ink border border-line-2'
              }`}
            >
              <span className="whitespace-nowrap">
                {formatFilter === 'ONLINE'
                  ? '🌐 Онлайн'
                  : formatFilter === 'OFFLINE'
                  ? '📍 На площадке'
                  : 'Формат: Все'}
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 opacity-70 transition-transform ${
                  openDropdown === 'format' ? 'rotate-180' : ''
                }`}
              />
            </button>

            {openDropdown === 'format' && (
              <div className="absolute left-0 top-full mt-2 w-60 bg-card rounded-2xl shadow-2xl border border-line-2 p-1.5 z-[220] anim-fade">
                {[
                  { id: '', label: 'Любой формат' },
                  { id: 'OFFLINE', label: '📍 На площадке (офлайн)' },
                  { id: 'ONLINE', label: '🌐 Онлайн-трансляция' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setFormatFilter(opt.id as '' | 'OFFLINE' | 'ONLINE');
                      setOpenDropdown(null);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[13px] font-medium transition-colors cursor-pointer ${
                      formatFilter === opt.id
                        ? 'bg-brand-tint text-brand-ink font-bold'
                        : 'text-ink hover:bg-surface'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {formatFilter === opt.id && <Check className="w-4 h-4 text-brand" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Кнопка сброса фильтров */}
          {activeFiltersCount > 0 && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="h-9 px-3 rounded-xl text-xs font-semibold text-muted hover:text-ink hover:bg-surface transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Сбросить</span>
            </button>
          )}
        </div>

        {/* Расширенные фильтры */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowFiltersModal(true)}
            className={`h-9 px-3.5 rounded-xl text-[13px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              joinMode || skillLevel || onlyAvailable || recurringFilter
                ? 'bg-ink text-card'
                : 'bg-surface/75 hover:bg-surface text-ink border border-line-2'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-brand" />
            <span>Фильтры</span>
            {(joinMode || skillLevel || onlyAvailable || recurringFilter) && (
              <span className="w-2 h-2 rounded-full bg-brand" />
            )}
          </button>
        </div>
      </div>

      {/* ОСНОВНОЙ КОНТЕНТ: КАРТА 2ГИС ИЛИ КАТАЛОГ ВСТРЕЧ */}
      {viewMode === 'map' ? (
        <div className="relative flex-1 min-h-0 flex overflow-hidden">
          {/* ЛЕВАЯ КОЛОНКА СПИСКА СОБЫТИЙ РЯДОМ */}
          <div
            className={`${
              listCollapsed ? 'hidden' : 'flex'
            } w-full lg:w-[410px] shrink-0 bg-card border-r border-line-2 flex-col h-full z-20`}
          >
            <div className="px-4 py-3 border-b border-line-2 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <h2 className="text-sm font-display font-bold text-ink truncate">
                  События на карте
                </h2>
                <span className="font-mono text-xs font-bold text-muted bg-surface px-2 py-0.5 rounded-md border border-line">
                  {displayedEvents.length}
                </span>
                {city && (
                  <span className="text-[11px] font-semibold text-brand-ink bg-brand-tint px-2 py-0.5 rounded-md truncate">
                    {city}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className="h-8 px-2.5 rounded-lg bg-surface hover:bg-surface-2 text-ink text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <List className="w-3.5 h-3.5" />
                  <span>Каталог</span>
                </button>
                <button
                  type="button"
                  onClick={() => setListCollapsed(true)}
                  title="Свернуть список"
                  className="hidden lg:flex w-8 h-8 rounded-lg bg-surface hover:bg-surface-2 text-muted hover:text-ink items-center justify-center transition-colors cursor-pointer"
                >
                  <PanelLeftClose className="w-4 h-4" />
                </button>
              </div>
            </div>

            {searchedAddressPin && (
              <div className="px-4 py-2.5 bg-brand-tint/60 border-b border-brand/20 flex items-center justify-between gap-2 text-xs">
                <div className="min-w-0">
                  <div className="font-bold text-brand-ink truncate">
                    📍 {searchedAddressPin.address}
                  </div>
                  <div className="font-mono text-[10px] text-muted">
                    Координаты 2ГИС: {searchedAddressPin.lat.toFixed(4)}, {searchedAddressPin.lng.toFixed(4)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSearchedAddressPin(null)}
                  className="p-1 text-muted hover:text-ink cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Список встреч */}
            <div className="flex-1 overflow-y-auto divide-y divide-line">
              {loading ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <div key={n} className="h-24 rounded-2xl bg-surface animate-pulse" />
                  ))}
                </div>
              ) : displayedEvents.length === 0 ? (
                <div className="p-8 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-surface text-muted flex items-center justify-center mx-auto">
                    <Compass className="w-6 h-6" />
                  </div>
                  <div className="text-sm font-bold text-ink">
                    Событий по фильтрам не найдено
                  </div>
                  <p className="text-xs text-muted leading-relaxed">
                    Попробуйте сбросить фильтры, выбрать другой город или создайте собственную тренировку с привязкой к точке 2ГИС.
                  </p>
                  <div className="pt-1 flex flex-wrap justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setCity('');
                        handleResetFilters();
                      }}
                      className="px-3.5 py-2 rounded-xl bg-surface hover:bg-surface-2 text-ink text-xs font-semibold cursor-pointer"
                    >
                      Все города РФ
                    </button>
                    <Link
                      to="/events/new"
                      className="px-3.5 py-2 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-bold"
                    >
                      + Создать сбор
                    </Link>
                  </div>
                </div>
              ) : (
                displayedEvents.map((ev) => {
                  const isSelected = selectedEvent?.id === ev.id;
                  const online = isOnlineEvent(ev.city, ev.locationAddress);
                  const tzLabel = getRegionInfo(ev.city)?.tzLabel.split(' ')[0] || 'МСК';
                  const maxCap = ev.maxParticipants || 0;
                  const confirmed = ev.confirmedParticipantsCount || 0;
                  const spotsLeft = maxCap > 0 ? Math.max(0, maxCap - confirmed) : 10;
                  const fillPercent =
                    maxCap > 0
                      ? Math.min(100, Math.round((confirmed / maxCap) * 100))
                      : 35;

                  return (
                    <div
                      key={ev.id}
                      onClick={() => {
                        setSelectedEvent(ev);
                        setJoinFeedback(null);
                      }}
                      className={`px-4 py-3.5 cursor-pointer transition-colors ${
                        isSelected ? 'bg-brand-tint/70' : 'hover:bg-surface/70'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-[66px] shrink-0 text-center bg-surface rounded-xl py-2 px-1.5 border border-line/80">
                          <div className="font-mono text-sm font-bold text-ink leading-tight">
                            {formatShortTime(ev.startsAt)}
                          </div>
                          <div className="text-[11px] font-medium text-muted mt-0.5 truncate">
                            {formatRelativeDayLabel(ev.startsAt)}
                          </div>
                          <div className="font-mono text-[9px] font-bold text-brand-ink mt-0.5">
                            {online ? 'Онлайн' : tzLabel}
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-muted">
                              <span>{getSportEmoji(ev.sport.name)}</span>
                              <span>{ev.sport.name}</span>
                            </span>
                            <span className="ml-auto text-[11px] font-bold px-2 py-0.5 rounded-md bg-brand-tint text-brand-ink">
                              {ev.joinMode === 'OPEN' ? 'Открыто' : 'По заявке'}
                            </span>
                          </div>

                          <h3 className="font-bold text-ink text-sm leading-snug truncate mb-1">
                            {ev.title}
                          </h3>

                          <div className="text-xs text-muted truncate mb-2 flex items-center gap-1">
                            {online ? (
                              <>
                                <Globe className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                                <span className="text-indigo-700 font-medium truncate">
                                  Онлайн · {ev.locationAddress}
                                </span>
                              </>
                            ) : (
                              <>
                                <MapPin className="w-3.5 h-3.5 text-brand shrink-0" />
                                <span className="truncate">
                                  {ev.city}, {ev.locationAddress}
                                </span>
                              </>
                            )}
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-1.5 bg-surface-2 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-300"
                                style={{
                                  width: `${fillPercent}%`,
                                  backgroundColor: spotsLeft === 0 ? '#f59e0b' : '#00B956',
                                }}
                              />
                            </div>
                            <span className="font-mono text-[11px] font-semibold text-muted shrink-0">
                              {maxCap > 0
                                ? `${confirmed}/${maxCap} · ${spotsLeft > 0 ? `Свободно ${spotsLeft}` : 'Мест нет'}`
                                : `Участников: ${confirmed}`}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ПРАВАЯ ИНТЕРАКТИВНАЯ КАРТА 2ГИС */}
          <div className="relative flex-1 h-full bg-surface overflow-hidden">
            {listCollapsed && (
              <button
                type="button"
                onClick={() => setListCollapsed(false)}
                className="absolute top-4 left-4 z-[500] h-10 px-3.5 rounded-xl bg-card text-ink font-semibold text-xs shadow-lg border border-line flex items-center gap-2 hover:bg-surface transition-colors cursor-pointer"
              >
                <PanelLeftOpen className="w-4 h-4 text-brand" />
                <span>Показать список ({displayedEvents.length})</span>
              </button>
            )}

            <SportikusLeafletMap
              events={mapEvents}
              selectedCity={city}
              selectedEvent={selectedEvent}
              searchedAddressPin={searchedAddressPin}
              onSelectEvent={(ev) => {
                setSelectedEvent(ev);
                setJoinFeedback(null);
              }}
            />

            {/* ВЫДВИЖНАЯ КАРТОЧКА ВЫБРАННОГО СОБЫТИЯ НА КАРТЕ */}
            {selectedEvent && (
              <div className="fixed lg:absolute inset-0 lg:inset-y-0 lg:left-auto lg:right-0 z-[600] flex justify-end pointer-events-none">
                <div
                  onClick={() => setSelectedEvent(null)}
                  className="fixed inset-0 bg-black/30 backdrop-blur-[1px] lg:hidden pointer-events-auto"
                />
                <div className="relative w-full sm:w-[420px] bg-card h-full shadow-2xl border-l border-line flex flex-col z-10 overflow-hidden anim-drawer pointer-events-auto">
                  <div className="relative h-52 shrink-0 bg-surface">
                    <img
                      src={selectedEvent.coverImageUrl || getSportCoverUrl(selectedEvent.sport.name, selectedEvent.id)}
                      alt={selectedEvent.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/20" />
                    <button
                      type="button"
                      onClick={() => setSelectedEvent(null)}
                      aria-label="Закрыть панель"
                      className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/45 text-white backdrop-blur-md flex items-center justify-center hover:bg-black/65 transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>

                    <div className="absolute bottom-4 left-5 right-5">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="px-2.5 py-1 rounded-lg bg-white/20 backdrop-blur-md text-white text-xs font-semibold flex items-center gap-1.5">
                          <span>{getSportEmoji(selectedEvent.sport.name)}</span>
                          <span>{selectedEvent.sport.name}</span>
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-brand text-white text-xs font-bold">
                          {selectedEvent.joinMode === 'OPEN' ? 'Открытая запись' : 'По заявке'}
                        </span>
                      </div>
                      <h2 className="font-display text-lg font-bold text-white leading-tight line-clamp-2">
                        {selectedEvent.title}
                      </h2>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-5 space-y-4">
                    {joinFeedback && (
                      <div
                        className={`p-3.5 rounded-xl text-xs font-semibold border ${
                          joinFeedback.type === 'ok'
                            ? 'bg-brand-tint text-brand-ink border-brand/30'
                            : 'bg-rose-50 text-rose-800 border-rose-200'
                        }`}
                      >
                        {joinFeedback.text}
                      </div>
                    )}

                    <div className="grid grid-cols-1 gap-2.5">
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-surface">
                        <div className="w-10 h-10 rounded-lg bg-card flex items-center justify-center text-ink shrink-0 shadow-2xs">
                          <Clock className="w-5 h-5 text-brand" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-ink">
                            {formatDateTime(selectedEvent.startsAt)}
                          </div>
                          <div className="text-xs text-muted">
                            Часовой пояс: {getRegionInfo(selectedEvent.city)?.tzLabel || 'МСК (UTC+3)'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 rounded-xl bg-surface">
                        <div className="w-10 h-10 rounded-lg bg-card flex items-center justify-center text-ink shrink-0 shadow-2xs">
                          <MapPin className="w-5 h-5 text-brand" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-bold text-ink">
                            {isOnlineEvent(selectedEvent.city, selectedEvent.locationAddress)
                              ? '🌐 Онлайн-мероприятие'
                              : selectedEvent.city}
                          </div>
                          <div className="text-xs text-muted break-words">
                            {selectedEvent.locationAddress}
                          </div>
                          {!isOnlineEvent(selectedEvent.city, selectedEvent.locationAddress) && (
                            <div className="flex items-center gap-3 mt-2">
                              <a
                                href={`https://2gis.ru/search/${encodeURIComponent(
                                  `${selectedEvent.city} ${selectedEvent.locationAddress}`
                                )}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-ink hover:underline"
                              >
                                <MapPin className="w-3 h-3" />
                                <span>Открыть в 2ГИС</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                              <a
                                href={`https://yandex.ru/maps/?text=${encodeURIComponent(
                                  `${selectedEvent.city}, ${selectedEvent.locationAddress}`
                                )}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-muted hover:text-ink hover:underline"
                              >
                                <Navigation className="w-3 h-3" />
                                <span>Яндекс Карты</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border border-line space-y-2.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-semibold text-ink">Участники</span>
                        <span className="font-mono font-bold text-ink">
                          Занято {selectedEvent.confirmedParticipantsCount} из{' '}
                          {selectedEvent.maxParticipants || '∞'}
                        </span>
                      </div>
                      <div className="h-2 bg-surface-2 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-brand transition-all"
                          style={{
                            width: `${Math.min(
                              100,
                              Math.round(
                                (selectedEvent.confirmedParticipantsCount /
                                  Math.max(1, selectedEvent.maxParticipants || 10)) *
                                  100
                              )
                            )}%`,
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted">
                        <span>
                          Уровень: {SKILL_LABELS[selectedEvent.skillLevel] || selectedEvent.skillLevel}
                        </span>
                        <span>
                          {selectedEvent.recurringOccurrence ? '🔄 Повторяющаяся встреча' : 'Разовая встреча'}
                        </span>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xs font-bold text-muted uppercase tracking-wider mb-2">
                        Организатор
                      </h3>
                      <div className="flex items-center justify-between p-3 rounded-xl border border-line">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-brand text-white font-bold flex items-center justify-center shrink-0">
                            {(selectedEvent.organizationName || selectedEvent.organizerDisplayName)
                              .slice(0, 1)
                              .toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-bold text-ink truncate">
                              {selectedEvent.organizationName || selectedEvent.organizerDisplayName}
                            </div>
                            <div className="text-xs text-muted">
                              {selectedEvent.organizationId
                                ? 'Спортивный клуб / сообщество'
                                : 'Организатор встречи'}
                            </div>
                          </div>
                        </div>
                        {selectedEvent.organizationId && (
                          <Link
                            to={`/organizations/${selectedEvent.organizationId}`}
                            className="text-xs font-bold text-brand-ink hover:underline shrink-0"
                          >
                            Клуб →
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border-t border-line bg-card flex gap-2.5 shrink-0">
                    <Link
                      to={`/events/${selectedEvent.id}`}
                      className="h-11 px-4 rounded-xl bg-surface hover:bg-surface-2 text-ink font-semibold text-sm flex items-center justify-center transition-colors shrink-0"
                    >
                      Подробнее
                    </Link>
                    <button
                      type="button"
                      disabled={joiningEventId === selectedEvent.id}
                      onClick={() => handleQuickJoin(selectedEvent)}
                      className="flex-1 h-11 rounded-xl bg-brand hover:bg-brand-hover text-white font-display font-bold text-xs flex items-center justify-center transition-all cursor-pointer disabled:opacity-50"
                    >
                      {joiningEventId === selectedEvent.id
                        ? 'Отправка...'
                        : selectedEvent.joinMode === 'OPEN'
                        ? 'Записаться'
                        : 'Подать заявку'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* КАТАЛОГ ВСТРЕЧ (ЕДИНАЯ СЕТКА БЕЗ КАТЕГОРИЙ СПОРТА) */
        <div className="flex-1 flex flex-col justify-between">
          <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="font-display text-2xl font-extrabold text-ink tracking-tight">
                  {city ? `Каталог встреч — ${city}` : 'Каталог спортивных встреч'}
                </h1>
                <p className="text-xs sm:text-sm text-muted mt-0.5">
                  Найдено {displayedEvents.length} мероприятий с привязкой к точкам 2ГИС
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setViewMode('map')}
                  className="h-10 px-4 rounded-xl bg-card hover:bg-surface border border-line-2 text-ink text-xs font-bold inline-flex items-center gap-2 transition-colors cursor-pointer shadow-2xs"
                >
                  <MapIcon className="w-4 h-4 text-brand" />
                  <span>Открыть на карте 2ГИС</span>
                </button>
                <Link
                  to={user ? '/events/new' : '/login'}
                  className="h-10 px-4 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Создать сбор</span>
                </Link>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <div key={n} className="h-[340px] rounded-[22px] bg-card border border-line animate-pulse" />
                ))}
              </div>
            ) : displayedEvents.length === 0 ? (
              <div className="space-y-8">
                <div className="bg-card rounded-[22px] border border-line-2 p-8 text-center space-y-3 max-w-xl mx-auto">
                  <div className="text-lg font-bold text-ink">
                    По выбранным фильтрам событий не найдено
                  </div>
                  <p className="text-xs sm:text-sm text-muted">
                    {city
                      ? `В регионе «${city}» пока нет активных сборов по этим параметрам. Сбросьте фильтры или посмотрите рекомендуемые встречи ниже.`
                      : 'Попробуйте сбросить фильтры или выберите одну из рекомендуемых встреч ниже.'}
                  </p>
                  <div className="pt-2 flex flex-wrap justify-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        setCity('');
                        handleResetFilters();
                      }}
                      className="px-4 py-2.5 rounded-xl bg-surface hover:bg-surface-2 text-ink text-xs font-bold cursor-pointer"
                    >
                      Показать все регионы и сбросить фильтры
                    </button>
                    <Link
                      to="/events/new"
                      className="px-4 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-bold"
                    >
                      + Создать сбор
                    </Link>
                  </div>
                </div>

                {recommendedEvents.length > 0 && (
                  <section className="space-y-4">
                    <h2 className="text-lg font-bold text-ink flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-brand" />
                      <span>Рекомендуемые ближайшие события</span>
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                      {recommendedEvents.slice(0, 8).map((ev, i) => (
                        <EventCard key={ev.id} event={ev} index={i} />
                      ))}
                    </div>
                  </section>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {displayedEvents.map((ev, idx) => (
                  <EventCard key={ev.id} event={ev} index={idx} />
                ))}
              </div>
            )}
          </div>

          <footer className="mt-12 border-t border-line bg-card py-5 px-4 sm:px-6 lg:px-8">
            <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted">
              <div>
                <span className="font-bold text-ink">Точка Сбора</span> — спортивные сборы на карте 2ГИС, клубы и напарники
              </div>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Link to="/terms" className="hover:text-ink font-medium">
                  Пользовательское соглашение
                </Link>
                <Link to="/privacy" className="hover:text-ink font-medium">
                  Политика конфиденциальности
                </Link>
                <Link to="/support/chat" className="text-brand-ink hover:underline font-semibold">
                  Чат с поддержкой
                </Link>
                <Link to="/support" className="text-brand-ink hover:underline font-semibold">
                  Тикеты и обращения
                </Link>
              </div>
            </div>
          </footer>
        </div>
      )}

      {/* МОДАЛЬНОЕ ОКНО РАСШИРЕННЫХ ФИЛЬТРОВ */}
      {showFiltersModal && (
        <div className="fixed inset-0 z-[250] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            onClick={() => setShowFiltersModal(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs anim-fade"
          />
          <div className="relative w-full sm:max-w-lg bg-card rounded-t-3xl sm:rounded-3xl shadow-2xl border border-line overflow-hidden z-10 max-h-[90vh] flex flex-col anim-sheet">
            <div className="p-5 border-b border-line flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-ink">Расширенные фильтры</h2>
              <button
                type="button"
                onClick={() => setShowFiltersModal(false)}
                className="w-8 h-8 rounded-full bg-surface flex items-center justify-center text-muted hover:text-ink cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-5 flex-1">
              <div>
                <label className="block text-sm font-bold text-ink mb-2.5">
                  Уровень подготовки
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setSkillLevel('')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      !skillLevel
                        ? 'bg-ink text-card'
                        : 'bg-surface text-ink hover:bg-surface-2'
                    }`}
                  >
                    Любой уровень
                  </button>
                  {Object.entries(SKILL_LABELS).map(([k, label]) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setSkillLevel(skillLevel === k ? '' : k)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        skillLevel === k
                          ? 'bg-ink text-card'
                          : 'bg-surface text-ink hover:bg-surface-2'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-ink mb-2.5">
                  Формат записи
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: '', label: 'Все' },
                    { id: 'OPEN', label: 'Открытая запись' },
                    { id: 'APPROVAL_REQUIRED', label: 'По заявке' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setJoinMode(m.id)}
                      className={`px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        joinMode === m.id
                          ? 'bg-ink text-card'
                          : 'bg-surface text-ink hover:bg-surface-2'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2.5 pt-2 border-t border-line">
                <label className="flex items-center justify-between p-3 rounded-xl bg-surface cursor-pointer">
                  <div>
                    <div className="text-sm font-semibold text-ink">Только со свободными местами</div>
                    <div className="text-xs text-muted">Скрыть полностью заполненные группы</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={onlyAvailable}
                    onChange={(e) => setOnlyAvailable(e.target.checked)}
                    className="w-4 h-4 accent-brand rounded"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl bg-surface cursor-pointer">
                  <div>
                    <div className="text-sm font-semibold text-ink">Только повторяющиеся встречи</div>
                    <div className="text-xs text-muted">Еженедельные занятия по расписанию</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={recurringFilter === 'true'}
                    onChange={(e) => setRecurringFilter(e.target.checked ? 'true' : '')}
                    className="w-4 h-4 accent-brand rounded"
                  />
                </label>
              </div>
            </div>

            <div className="p-5 border-t border-line flex gap-3 bg-card">
              <button
                type="button"
                onClick={handleResetFilters}
                className="flex-1 h-11 rounded-xl bg-surface hover:bg-surface-2 text-ink font-semibold text-sm transition-colors cursor-pointer"
              >
                Сбросить
              </button>
              <button
                type="button"
                onClick={() => setShowFiltersModal(false)}
                className="flex-1 h-11 rounded-xl bg-brand hover:bg-brand-hover text-white font-semibold text-sm transition-colors cursor-pointer"
              >
                Показать ({displayedEvents.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ============================================================================
 * 2ГИС ИНТЕРАКТИВНАЯ КАРТА СПОРТИВНЫХ ПЛОЩАДОК И АДРЕСОВ
 * ============================================================================ */
const SportikusLeafletMap: React.FC<{
  events: EventCardDto[];
  selectedCity: string;
  selectedEvent: EventCardDto | null;
  searchedAddressPin: GeocodedPlace | null;
  onSelectEvent: (ev: EventCardDto) => void;
}> = ({ events, selectedCity, selectedEvent, searchedAddressPin, onSelectEvent }) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);

  const centerCoords = useMemo(() => {
    if (searchedAddressPin) {
      return { lat: searchedAddressPin.lat, lng: searchedAddressPin.lng };
    }
    if (selectedEvent && !isOnlineEvent(selectedEvent.city, selectedEvent.locationAddress)) {
      return getRealEventCoords(selectedEvent);
    }
    if (selectedCity && selectedCity !== 'Онлайн') {
      const info = getRegionInfo(selectedCity);
      if (info) return { lat: info.lat, lng: info.lng };
    }
    if (events.length > 0) {
      return getRealEventCoords(events[0]);
    }
    return { lat: 55.7558, lng: 37.6173 };
  }, [selectedCity, selectedEvent, searchedAddressPin, events]);

  useEffect(() => {
    const L = window.L;
    if (!L || !mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [centerCoords.lat, centerCoords.lng],
        zoom: 12,
        zoomControl: false,
        attributionControl: false,
      });

      L.tileLayer('https://tile{s}.maps.2gis.com/tiles?x={x}&y={y}&z={z}&v=1', {
        subdomains: ['0', '1', '2', '3'],
        maxZoom: 18,
      }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
      setTimeout(() => map.invalidateSize(), 100);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markersLayerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const zoom = searchedAddressPin ? 15 : selectedEvent ? 14 : 12;
    map.setView([centerCoords.lat, centerCoords.lng], zoom, {
      animate: true,
    });
  }, [centerCoords.lat, centerCoords.lng, selectedEvent?.id, searchedAddressPin?.address]);

  useEffect(() => {
    const L = window.L;
    const map = mapInstanceRef.current;
    const layer = markersLayerRef.current;
    if (!L || !map || !layer) return;

    layer.clearLayers();

    // Если пользователь выбрал конкретный адрес в поиске 2ГИС — ставим маркер адреса
    if (searchedAddressPin) {
      const addrIcon = L.divIcon({
        className: 'custom-2gis-address-pin',
        html: `<div style="
          display:inline-flex;align-items:center;gap:5px;
          padding:5px 11px;border-radius:999px;
          font-family:'Golos Text',sans-serif;font-weight:700;font-size:12px;
          background:#FF5A26;color:#FFFFFF;border:2px solid #FFFFFF;
          box-shadow:0 6px 18px rgba(255,90,38,0.45);
          transform:translate(-50%,-50%);white-space:nowrap;
        ">📍 ${searchedAddressPin.address.split(',')[0]}</div>`,
        iconSize: [140, 32],
        iconAnchor: [70, 16],
      });
      L.marker([searchedAddressPin.lat, searchedAddressPin.lng], { icon: addrIcon }).addTo(layer);
    }

    events.forEach((ev) => {
      const coords = getRealEventCoords(ev);
      const isSelected = selectedEvent?.id === ev.id;
      const emoji = getSportEmoji(ev.sport.name);
      const bg = isSelected ? '#00B956' : '#FFFFFF';
      const color = isSelected ? '#FFFFFF' : '#121417';
      const border = isSelected ? '3px solid #FFFFFF' : '2.5px solid #00B956';
      const scale = isSelected ? 'scale(1.18)' : 'scale(1)';

      const icon = L.divIcon({
        className: 'custom-2gis-pin',
        html: `<div style="
          width: 40px;
          height: 40px;
          border-radius: 9999px;
          background: ${bg};
          color: ${color};
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          border: ${border};
          box-shadow: 0 6px 18px rgba(18, 20, 23, 0.24);
          transform: ${scale};
          transition: transform 0.15s ease, background 0.15s ease;
          cursor: pointer;
        " title="${ev.title.replace(/"/g, '&quot;')} — ${ev.locationAddress.replace(/"/g, '&quot;')}">${emoji}</div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      const marker = L.marker([coords.lat, coords.lng], { icon });
      marker.on('click', () => onSelectEvent(ev));
      marker.addTo(layer);
    });
  }, [events, selectedEvent?.id, searchedAddressPin]);

  const handleZoom = (delta: number) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setZoom(mapInstanceRef.current.getZoom() + delta);
    }
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation || !mapInstanceRef.current) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        mapInstanceRef.current?.setView([pos.coords.latitude, pos.coords.longitude], 13);
      },
      () => {}
    );
  };

  const openIn2GisUrl = selectedEvent
    ? `https://2gis.ru/search/${encodeURIComponent(
        `${selectedEvent.city} ${selectedEvent.locationAddress}`
      )}`
    : searchedAddressPin
    ? `https://2gis.ru/?m=${searchedAddressPin.lng},${searchedAddressPin.lat}/16`
    : `https://2gis.ru/search/${encodeURIComponent(selectedCity || 'Москва спорт')}`;

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainerRef} className="w-full h-full z-10" />

      <div className="absolute right-4 top-1/2 -translate-y-1/2 z-[400] flex flex-col gap-2">
        <div className="bg-card rounded-xl shadow-lg border border-line-2 overflow-hidden flex flex-col">
          <button
            type="button"
            onClick={() => handleZoom(1)}
            aria-label="Приблизить карту"
            className="w-10 h-10 flex items-center justify-center text-ink hover:bg-surface transition-colors border-b border-line cursor-pointer"
          >
            <Plus className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => handleZoom(-1)}
            aria-label="Отдалить карту"
            className="w-10 h-10 flex items-center justify-center text-ink hover:bg-surface transition-colors cursor-pointer"
          >
            <Minus className="w-5 h-5" />
          </button>
        </div>

        <button
          type="button"
          onClick={handleLocateMe}
          title="Моё местоположение"
          aria-label="Моё местоположение"
          className="w-10 h-10 bg-card rounded-xl shadow-lg border border-line-2 flex items-center justify-center text-ink hover:bg-surface transition-colors cursor-pointer"
        >
          <LocateFixed className="w-5 h-5" />
        </button>
      </div>

      <div className="absolute right-3 bottom-3 z-[400] flex items-center gap-2">
        <a
          href={openIn2GisUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 rounded-xl bg-card/95 backdrop-blur-xs border border-line-2 shadow-md text-xs font-bold text-ink hover:border-brand flex items-center gap-1.5 transition-colors"
        >
          <span className="w-2 h-2 rounded-full bg-brand" />
          <span>Карта 2ГИС</span>
          <ExternalLink className="w-3 h-3 text-muted" />
        </a>
      </div>
    </div>
  );
};

export const RecommendedPage: React.FC = () => {
  const { user } = useAuth();
  const [section, setSection] = useState<'events' | 'partners' | 'clubs'>('events');
  const [events, setEvents] = useState<EventCardDto[]>([]);
  const [organizations, setOrganizations] = useState<OrganizationDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [evList, orgList] = await Promise.all([
          apiFetch<EventCardDto[]>('/api/v1/events'),
          apiFetch<OrganizationDto[]>('/api/v1/organizations'),
        ]);
        setEvents(evList);
        setOrganizations(orgList);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const personalizedEvents = useMemo(() => {
    if (!user || !user.sportInterests || user.sportInterests.length === 0) {
      return events;
    }
    const favIds = new Set(user.sportInterests.map((s) => s.sportId));
    const matched = events.filter(
      (e) => favIds.has(e.sport.id) || (user.city && e.city === user.city)
    );
    return matched.length > 0 ? matched : events;
  }, [events, user]);

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-7 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink tracking-tight">Для вас</h1>
          <p className="text-xs sm:text-sm text-muted mt-0.5">
            Персональные рекомендации тренировок, поиск напарников и проверенные спортивные клубы
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-card p-1 rounded-2xl border border-line-2">
          {[
            { id: 'events', label: 'Подборка событий' },
            { id: 'partners', label: 'Напарники и друзья' },
            { id: 'clubs', label: `Клубы (${organizations.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSection(tab.id as 'events' | 'partners' | 'clubs')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                section === tab.id
                  ? 'bg-ink text-card shadow-xs'
                  : 'text-muted hover:text-ink'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {section === 'events' && (
        <div className="space-y-6">
          {user && user.sportInterests && user.sportInterests.length > 0 ? (
            <div className="bg-card rounded-2xl border border-line-2 p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-xs font-bold text-muted">Ваши интересы:</span>
                {user.sportInterests.map((s) => (
                  <span
                    key={s.sportId}
                    className="px-3 py-1 rounded-full bg-brand-tint text-brand-ink text-xs font-bold"
                  >
                    {getSportEmoji(s.sportName)} {s.sportName}
                  </span>
                ))}
              </div>
              <Link to="/profile" className="text-xs font-bold text-brand-ink hover:underline">
                Изменить интересы →
              </Link>
            </div>
          ) : (
            <div className="bg-card rounded-2xl border border-line-2 p-5 flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="text-sm font-bold text-ink">
                  Настройте любимые виды спорта для точных рекомендаций
                </div>
                <p className="text-xs text-muted">
                  Укажите свои дисциплины и уровень подготовки в профиле, чтобы видеть подходящие тренировки первыми.
                </p>
              </div>
              <Link
                to={user ? '/profile' : '/login'}
                className="px-4 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-bold shrink-0"
              >
                {user ? 'Настроить интересы' : 'Войти в аккаунт'}
              </Link>
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="h-[340px] rounded-[22px] bg-card border border-line animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {personalizedEvents.map((ev, idx) => (
                <EventCard key={ev.id} event={ev} index={idx} />
              ))}
            </div>
          )}
        </div>
      )}

      {section === 'partners' && <PartnersAndFriendsPage />}

      {section === 'clubs' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-ink">Проверенные клубы и открытые сообщества</h2>
            <Link
              to="/organizations"
              className="text-xs font-bold text-brand-ink hover:underline inline-flex items-center gap-1"
            >
              <span>Открыть каталог клубов</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {organizations.map((org) => (
              <Link
                key={org.id}
                to={`/organizations/${org.id}`}
                className="bg-card rounded-[22px] border border-line-2 p-5 hover:shadow-lg transition-all flex flex-col justify-between gap-4"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-brand-tint text-brand-ink text-[11px] font-bold">
                      <BadgeCheck className="w-3.5 h-3.5" />
                      <span>
                        {org.orgType === 'COMMUNITY' ? 'Открытое комьюнити' : 'Официальный клуб'}
                      </span>
                    </span>
                    <span className="text-xs font-semibold text-muted">{org.city}</span>
                  </div>
                  <h3 className="text-base font-bold text-ink">{org.name}</h3>
                  <p className="text-xs text-muted line-clamp-2 leading-relaxed">
                    {org.description}
                  </p>
                </div>
                <div className="pt-3 border-t border-line flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted">
                    Подписчиков: {org.subscribersCount}
                  </span>
                  <span className="text-xs font-bold text-brand-ink">Перейти →</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const MyEventsPage: React.FC = () => {
  const { user } = useAuth();
  const [participating, setParticipating] = useState<EventCardDto[]>([]);
  const [organizing, setOrganizing] = useState<EventCardDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'participating' | 'organizing' | 'recurring'>('participating');

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    Promise.all([
      apiFetch<EventCardDto[]>('/api/v1/events/my/participations').catch(() => [] as EventCardDto[]),
      apiFetch<EventCardDto[]>('/api/v1/events/my/organized').catch(() => [] as EventCardDto[]),
    ])
      .then(([partEvs, orgEvs]) => {
        setParticipating(partEvs);
        setOrganizing(orgEvs);
      })
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-card border border-line flex items-center justify-center mx-auto text-brand">
          <Calendar className="w-7 h-7" />
        </div>
        <h1 className="font-display text-2xl font-extrabold text-ink">Мои сборы</h1>
        <p className="text-sm text-muted">
          Войдите в аккаунт, чтобы видеть свои предстоящие тренировки, заявки и созданные события.
        </p>
        <div className="flex justify-center gap-3 pt-2">
          <Link
            to="/login"
            className="h-11 px-6 rounded-xl bg-brand hover:bg-brand-hover text-white font-bold text-sm inline-flex items-center"
          >
            Войти
          </Link>
          <Link
            to="/register"
            className="h-11 px-6 rounded-xl bg-card border border-line-2 text-ink font-semibold text-sm inline-flex items-center"
          >
            Регистрация
          </Link>
        </div>
      </div>
    );
  }

  const recurring = useMemo(() => {
    const combined = [...organizing, ...participating];
    const seen = new Set<string>();
    return combined.filter((ev) => {
      if (!ev.recurringOccurrence || seen.has(ev.id)) return false;
      seen.add(ev.id);
      return true;
    });
  }, [organizing, participating]);

  const activeList =
    tab === 'participating'
      ? participating
      : tab === 'organizing'
      ? organizing
      : recurring;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-7 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink tracking-tight">Мои сборы и расписание</h1>
          <p className="text-xs sm:text-sm text-muted mt-0.5">
            Управляйте своими записями на тренировки и организованными встречами
          </p>
        </div>
        <Link
          to="/events/new"
          className="h-10 px-4 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Создать сбор</span>
        </Link>
      </div>

      <div className="flex border-b border-line overflow-x-auto no-scrollbar">
        {[
          { id: 'participating', label: 'Я участвую', count: participating.length },
          { id: 'organizing', label: 'Я организую', count: organizing.length },
          { id: 'recurring', label: 'Повторяющиеся встречи', count: recurring.length },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id as 'participating' | 'organizing' | 'recurring')}
            className={`px-5 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              tab === t.id
                ? 'border-brand text-ink'
                : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            <span>{t.label}</span>
            <span
              className={`font-mono px-2 py-0.5 rounded-full text-xs ${
                tab === t.id ? 'bg-brand-tint text-brand-ink' : 'bg-surface text-muted'
              }`}
            >
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-[320px] rounded-[22px] bg-card border border-line animate-pulse" />
          ))}
        </div>
      ) : activeList.length === 0 ? (
        <div className="bg-card rounded-[22px] border border-line-2 p-10 text-center space-y-3">
          <div className="text-base font-bold text-ink">
            {tab === 'participating'
              ? 'У вас пока нет активных записей на события'
              : tab === 'organizing'
              ? 'Вы пока не организовали ни одного события'
              : 'Нет повторяющихся встреч'}
          </div>
          <p className="text-xs text-muted max-w-md mx-auto">
            {tab === 'participating'
              ? 'Откройте карту 2ГИС или каталог встреч, чтобы выбрать тренировку рядом с вами.'
              : 'Создайте свою тренировку или спортивный сбор с привязкой к точке на карте 2ГИС.'}
          </p>
          <div className="pt-2">
            <Link
              to={tab === 'participating' ? '/events?view=list' : '/events/new'}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-bold"
            >
              {tab === 'participating' ? 'Найти события' : '+ Создать сбор'}
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {activeList.map((ev, idx) => (
            <EventCard key={ev.id} event={ev} index={idx} />
          ))}
        </div>
      )}
    </div>
  );
};
