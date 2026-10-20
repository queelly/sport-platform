import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  BellRing,
  Calendar,
  Compass,
  ExternalLink,
  Globe,
  Map,
  MapPin,
  Navigation,
  Plus,
  Repeat,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import { useAuth } from '../AuthContext';
import { apiFetch, SKILL_LABELS } from '../api';
import { EventCardDto, getRegionInfo, OrganizationDto } from '../types';
import { EventCard } from '../components/EventCard';
import { CustomSelect, RegionSelect } from '../components/UiControls';
import { getSelectedGlobalRegion } from '../components/Navbar';

export const HomeAndCatalogPage: React.FC<{ catalogOnly?: boolean }> = ({ catalogOnly = false }) => {
  const { user, sports } = useAuth();
  const [events, setEvents] = useState<EventCardDto[]>([]);
  const [recommendedEvents, setRecommendedEvents] = useState<EventCardDto[]>([]);
  const [organizations, setOrganizations] = useState<OrganizationDto[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedSportId, setSelectedSportId] = useState<string>('');
  const [city, setCity] = useState<string>(() => getSelectedGlobalRegion());
  const [joinMode, setJoinMode] = useState<string>('');
  const [skillLevel, setSkillLevel] = useState<string>('');
  const [recurringFilter, setRecurringFilter] = useState<string>('');
  const [onlyAvailable, setOnlyAvailable] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [selectedMapEvent, setSelectedMapEvent] = useState<EventCardDto | null>(null);

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

      const [evList, allEvList, orgList] = await Promise.all([
        apiFetch<EventCardDto[]>(`/api/v1/events?${params.toString()}`),
        apiFetch<EventCardDto[]>('/api/v1/events'),
        apiFetch<OrganizationDto[]>('/api/v1/organizations'),
      ]);
      setEvents(evList);
      setRecommendedEvents(allEvList);
      setOrganizations(orgList);
      if (evList.length > 0) {
        setSelectedMapEvent(evList[0]);
      } else if (allEvList.length > 0) {
        setSelectedMapEvent(allEvList[0]);
      }
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
    setRecurringFilter('');
    setOnlyAvailable(false);
    setSearchQuery('');
  };

  const mapEvents = events.length > 0 ? events : recommendedEvents;

  const activeMapCoords = useMemo(() => {
    const targetCity = selectedMapEvent?.city || city || 'Москва';
    const info = getRegionInfo(targetCity);
    return {
      lat: info?.lat ?? 55.7558,
      lon: info?.lng ?? 37.6173,
      city: targetCity,
      address: selectedMapEvent?.locationAddress || '',
    };
  }, [selectedMapEvent, city]);

  return (
    <div className="space-y-12 pb-16">
      {/* HERO SECTION (shown on root '/') */}
      {!catalogOnly && (
        <section className="relative overflow-hidden rounded-3xl bg-slate-900 text-white px-6 py-12 sm:px-12 sm:py-16 shadow-2xl">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-blue-600/25 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-semibold text-lime-300 mb-5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Единая платформа совместных тренировок, клубов и спортивных знакомых</span>
            </div>

            <h1 className="font-display font-extrabold text-3xl sm:text-5xl leading-tight mb-5">
              Найдите свой спорт, команду и проверенную площадку рядом с домом
            </h1>

            <p className="text-slate-300 text-base sm:text-lg max-w-2xl mb-8 leading-relaxed">
              Присоединяйтесь к разовым и еженедельным встречам, создавайте собственные активности в любом виде спорта, общайтесь с участниками и получайте автоматические напоминания в ВКонтакте.
            </p>

            <div className="flex flex-wrap items-center gap-3.5">
              <a
                href="#catalog"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-display font-bold text-sm shadow-lg shadow-blue-600/30 transition-colors"
              >
                <Compass className="w-4 h-4" />
                <span>Найти мероприятие</span>
              </a>

              <Link
                to={user ? '/events/new' : '/register'}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-display font-bold text-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>{user ? 'Создать свою встречу' : 'Регистрация участника или клуба'}</span>
              </Link>

              <Link
                to="/partners"
                className="inline-flex items-center gap-2 px-5 py-3.5 rounded-2xl text-slate-200 hover:text-white text-sm font-semibold transition-colors"
              >
                <Users className="w-4 h-4 text-emerald-400" />
                <span>Найти спортивного партнёра</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Value Chain Pills */}
            <div className="mt-10 pt-8 border-t border-white/10 grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs text-slate-300">
              <div className="flex items-start gap-2.5">
                <Calendar className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-white">Разовые и еженедельные</div>
                  <div>Запись на конкретную дату и экспорт в календарь (.ics)</div>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-white">Клубы и сообщества</div>
                  <div>Официальные клубы и открытые пользовательские сообщества</div>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Users className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-white">Спорт-Мэтч и знакомые</div>
                  <div>Интерактивный подбор напарников по уровню и дисциплинам</div>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <BellRing className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-white">VK-бот и поддержка</div>
                  <div>Напоминания о встречах в ВК, тикеты и чат техподдержки</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SPORT CHIPS & CATALOG */}
      <section id="catalog" className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900">
              Каталог спортивных мероприятий
            </h2>
            <p className="text-sm text-slate-600">
              Выберите направление из динамического справочника или создайте встречу по новому виду спорта
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors ${
                viewMode === 'grid'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              Карточки ({events.length})
            </button>
            <button
              type="button"
              onClick={() => setViewMode('map')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors ${
                viewMode === 'map'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              <Map className="w-3.5 h-3.5" />
              На карте города
            </button>
          </div>
        </div>

        {/* Sport quick pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <button
            type="button"
            onClick={() => setSelectedSportId('')}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
              selectedSportId === ''
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            Все виды спорта
          </button>
          {sports.map((s) => (
            <button
              type="button"
              key={s.id}
              onClick={() => setSelectedSportId(s.id === selectedSportId ? '' : s.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                selectedSportId === s.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>

        {/* FILTER BAR */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="relative lg:col-span-2">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchCatalog()}
                placeholder="Поиск по названию, адресу, виду спорта (даже с опечаткой)..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <RegionSelect
                value={city}
                onChange={setCity}
                allowAll
                allLabel="Все регионы РФ"
                placeholder="Выберите город / регион"
              />
            </div>

            <div>
              <CustomSelect
                value={joinMode}
                onChange={setJoinMode}
                options={[
                  { value: '', label: 'Любой режим записи' },
                  { value: 'OPEN', label: 'Свободное участие' },
                  { value: 'APPROVAL_REQUIRED', label: 'По заявке организатору' },
                ]}
              />
            </div>

            <div>
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
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-700">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={onlyAvailable}
                  onChange={(e) => setOnlyAvailable(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="font-medium">Только со свободными местами</span>
              </label>

              <div className="flex items-center gap-2 min-w-[220px]">
                <Repeat className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <CustomSelect
                  size="sm"
                  value={recurringFilter}
                  onChange={setRecurringFilter}
                  options={[
                    { value: '', label: 'Разовые и еженедельные' },
                    { value: 'false', label: 'Только разовые встречи' },
                    { value: 'true', label: 'Только еженедельно' },
                  ]}
                />
              </div>

              {city && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 font-semibold">
                  <Globe className="w-3.5 h-3.5" />
                  <span>
                    Регион: {city} ({getRegionInfo(city)?.tzLabel || 'МСК'})
                  </span>
                  <button
                    type="button"
                    onClick={() => setCity('')}
                    className="ml-1 text-blue-500 hover:text-blue-800 font-bold"
                    title="Показать все регионы"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Сбросить фильтры
              </button>
              <button
                type="button"
                onClick={fetchCatalog}
                className="px-4 py-1.5 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700"
              >
                Применить поиск
              </button>
            </div>
          </div>
        </div>

        {/* RESULTS OR INTERACTIVE MAP OVERVIEW */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-64 rounded-2xl bg-slate-200/70 animate-pulse" />
            ))}
          </div>
        ) : viewMode === 'map' ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-display font-bold text-lg text-slate-900">
                  Интерактивная карта спортивных площадок и встреч
                </h3>
                <p className="text-xs text-slate-500">
                  Выберите мероприятие из списка слева, чтобы посмотреть локацию на встроенной карте или построить маршрут в Яндекс Картах и 2ГИС
                </p>
              </div>
              {selectedMapEvent && (
                <div className="flex items-center gap-2">
                  <a
                    href={`https://yandex.ru/maps/?text=${encodeURIComponent(
                      `${selectedMapEvent.city}, ${selectedMapEvent.locationAddress}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-bold transition-colors"
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
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 text-xs font-bold transition-colors"
                  >
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Открыть в 2ГИС</span>
                    <ExternalLink className="w-3 h-3 opacity-60" />
                  </a>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Left list of pins */}
              <div className="lg:col-span-5 space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                {mapEvents.map((ev) => {
                  const isSelected = selectedMapEvent?.id === ev.id;
                  return (
                    <div
                      key={ev.id}
                      onClick={() => setSelectedMapEvent(ev)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-blue-50/70 border-blue-500 shadow-sm'
                          : 'bg-white border-slate-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[11px] font-bold text-blue-600 uppercase">
                          {ev.sport.name}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-500">
                          {getRegionInfo(ev.city)?.tzLabel || 'МСК'}
                        </span>
                      </div>
                      <div className="font-display font-bold text-sm text-slate-900 mt-0.5">
                        {ev.title}
                      </div>
                      <div className="text-xs text-slate-600 flex items-center gap-1.5 mt-1.5">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>
                          {ev.city}, {ev.locationAddress}
                        </span>
                      </div>
                      <div className="mt-3 pt-2.5 border-t border-slate-200/70 flex flex-wrap items-center justify-between gap-2">
                        <Link
                          to={`/events/${ev.id}`}
                          className="text-xs font-bold text-blue-600 hover:text-blue-800"
                        >
                          Открыть карточку встречи →
                        </Link>
                        <div className="flex items-center gap-1.5">
                          <a
                            href={`https://yandex.ru/maps/?text=${encodeURIComponent(
                              `${ev.city}, ${ev.locationAddress}`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="px-2 py-1 rounded-lg bg-amber-100/80 hover:bg-amber-200 text-amber-900 text-[11px] font-bold"
                          >
                            Яндекс.Карты
                          </a>
                          <a
                            href={`https://2gis.ru/search/${encodeURIComponent(
                              `${ev.city} ${ev.locationAddress}`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="px-2 py-1 rounded-lg bg-emerald-100/80 hover:bg-emerald-200 text-emerald-900 text-[11px] font-bold"
                          >
                            2ГИС
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Right embedded interactive map */}
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
                      <span className="font-bold text-lime-300">{selectedMapEvent.title}:</span>{' '}
                      <span>
                        {selectedMapEvent.city}, {selectedMapEvent.locationAddress}
                      </span>
                    </div>
                    <Link
                      to={`/events/${selectedMapEvent.id}`}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold"
                    >
                      Перейти к записи
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : events.length === 0 ? (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
              <div className="text-lg font-display font-bold text-slate-900">
                По точным параметрам фильтра совпадений не нашлось
              </div>
              <p className="text-sm text-slate-600 max-w-xl mx-auto">
                {city
                  ? `В регионе «${city}» по вашему запросу пока нет активных встреч. Ниже мы подобрали рекомендуемые мероприятия на платформе — или вы можете создать свою встречу первыми!`
                  : 'Попробуйте изменить поисковый запрос, сбросить фильтры или ознакомьтесь с рекомендуемыми спортивными встречами ниже.'}
              </p>
              <div className="pt-2 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  Показать все регионы и сбросить фильтры
                </button>
                <Link
                  to="/events/new"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700"
                >
                  + Создать мероприятие
                </Link>
              </div>
            </div>

            {recommendedEvents.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-bold text-lg text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <span>Рекомендуемые ближайшие мероприятия на платформе</span>
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {recommendedEvents.slice(0, 6).map((ev) => (
                    <EventCard key={ev.id} event={ev} />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {events.map((ev) => (
              <EventCard key={ev.id} event={ev} />
            ))}
          </div>
        )}
      </section>

      {/* VERIFIED ORGANIZATIONS PREVIEW */}
      {!catalogOnly && organizations.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display font-extrabold text-2xl text-slate-900">
                Спортивные клубы и открытые сообщества
              </h2>
              <p className="text-sm text-slate-600">
                Проверенные клубы и пользовательские сообщества для совместных тренировок
              </p>
            </div>
            <Link
              to="/organizations"
              className="text-sm font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
            >
              <span>Все клубы и сообщества</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {organizations.slice(0, 4).map((org) => (
              <Link
                key={org.id}
                to={`/organizations/${org.id}`}
                className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-lg hover:border-blue-300 transition-all flex items-start justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                    <BadgeCheck className="w-3.5 h-3.5" />
                    <span>
                      {org.orgType === 'COMMUNITY'
                        ? 'Открытое сообщество'
                        : 'Проверенная организация'}
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-lg text-slate-900">{org.name}</h3>
                  <p className="text-xs text-slate-600 line-clamp-2">{org.description}</p>
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-xs font-medium text-slate-500">{org.city}</span>
                    {org.sports.map((s) => (
                      <span
                        key={s.id}
                        className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-semibold"
                      >
                        {s.name}
                      </span>
                    ))}
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400 shrink-0 mt-1" />
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
