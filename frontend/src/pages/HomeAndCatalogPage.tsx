import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BadgeCheck,
  BellRing,
  Calendar,
  Compass,
  Map,
  MapPin,
  Plus,
  Repeat,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import { useAuth } from '../AuthContext';
import { apiFetch, SKILL_LABELS } from '../api';
import { EventCardDto, OrganizationDto } from '../types';
import { EventCard } from '../components/EventCard';

export const HomeAndCatalogPage: React.FC<{ catalogOnly?: boolean }> = ({ catalogOnly = false }) => {
  const { user, sports } = useAuth();
  const [events, setEvents] = useState<EventCardDto[]>([]);
  const [organizations, setOrganizations] = useState<OrganizationDto[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedSportId, setSelectedSportId] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [joinMode, setJoinMode] = useState<string>('');
  const [skillLevel, setSkillLevel] = useState<string>('');
  const [recurringFilter, setRecurringFilter] = useState<string>('');
  const [onlyAvailable, setOnlyAvailable] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');

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

      const [evList, orgList] = await Promise.all([
        apiFetch<EventCardDto[]>(`/api/v1/events?${params.toString()}`),
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

  useEffect(() => {
    fetchCatalog();
  }, [selectedSportId, joinMode, skillLevel, recurringFilter, onlyAvailable]);

  const handleResetFilters = () => {
    setSelectedSportId('');
    setCity('');
    setJoinMode('');
    setSkillLevel('');
    setRecurringFilter('');
    setOnlyAvailable(false);
    setSearchQuery('');
  };

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
              Присоединяйтесь к разовым и регулярным встречам, создавайте собственные активности в любом виде спорта, общайтесь с участниками и получайте автоматические напоминания в ВКонтакте.
            </p>

            <div className="flex flex-wrap items-center gap-3.5">
              <a
                href="#catalog"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-display font-bold text-sm shadow-lg shadow-blue-600/30 transition-all"
              >
                <Compass className="w-4 h-4" />
                <span>Найти мероприятие</span>
              </a>

              <Link
                to={user ? '/events/new' : '/register'}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-display font-bold text-sm transition-all"
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
                  <div className="font-bold text-white">Разовые и регулярные</div>
                  <div>Запись на конкретную дату серии и экспорт в календарь (.ics)</div>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-white">Проверенные клубы</div>
                  <div>Ручная верификация спортивных организаций администраторами</div>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Users className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-white">Спортивные знакомые</div>
                  <div>Поиск напарников по уровню подготовки и общим дисциплинам</div>
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

      {/* SPORT CHIPS */}
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

          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'grid'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              Карточки ({events.length})
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'map'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
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
            onClick={() => setSelectedSportId('')}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedSportId === ''
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            Все виды спорта
          </button>
          {sports.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedSportId(s.id === selectedSportId ? '' : s.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
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
                placeholder="Поиск по названию, адресу, виду спорта..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchCatalog()}
                placeholder="Город (например, Москва)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <select
                value={joinMode}
                onChange={(e) => setJoinMode(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Любой режим записи</option>
                <option value="OPEN">Свободное участие</option>
                <option value="APPROVAL_REQUIRED">По заявке организатору</option>
              </select>
            </div>

            <div>
              <select
                value={skillLevel}
                onChange={(e) => setSkillLevel(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Любой уровень подготовки</option>
                {Object.entries(SKILL_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
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

              <div className="flex items-center gap-1.5">
                <Repeat className="w-3.5 h-3.5 text-slate-500" />
                <select
                  value={recurringFilter}
                  onChange={(e) => setRecurringFilter(e.target.value)}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 text-xs bg-slate-50"
                >
                  <option value="">Разовые и регулярные</option>
                  <option value="false">Только разовые встречи</option>
                  <option value="true">Только регулярные серии</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleResetFilters}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Сбросить фильтры
              </button>
              <button
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
        ) : events.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-3">
            <div className="text-lg font-display font-bold text-slate-900">
              По выбранным фильтрам мероприятий пока не найдено
            </div>
            <p className="text-sm text-slate-600 max-w-md mx-auto">
              Попробуйте сбросить фильтры или создайте собственное мероприятие — вы также можете добавить новый вид спорта прямо в форме создания!
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-300 text-slate-700"
              >
                Сбросить фильтры
              </button>
              <Link
                to="/events/new"
                className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white"
              >
                Создать мероприятие
              </Link>
            </div>
          </div>
        ) : viewMode === 'map' ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-base text-slate-900">
                  География спортивных площадок и встреч
                </h3>
                <p className="text-xs text-slate-500">
                  Нажмите на локацию или карточку ниже, чтобы открыть подробности и схему проезда в OpenStreetMap
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {events.map((ev) => (
                <div
                  key={ev.id}
                  className="p-4 rounded-xl border border-slate-200 hover:border-blue-400 flex items-start justify-between gap-3"
                >
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-blue-600 uppercase">{ev.sport.name}</span>
                    <Link
                      to={`/events/${ev.id}`}
                      className="block font-display font-bold text-sm text-slate-900 hover:text-blue-600"
                    >
                      {ev.title}
                    </Link>
                    <div className="text-xs text-slate-600 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>
                        {ev.city}, {ev.locationAddress}
                      </span>
                    </div>
                  </div>
                  <a
                    href={`https://www.openstreetmap.org/search?query=${encodeURIComponent(
                      ev.city + ' ' + ev.locationAddress
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 text-blue-700 text-xs font-semibold shrink-0"
                  >
                    Открыть карту ↗
                  </a>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {events.map((ev) => (
              <EventCard key={ev.id} event={ev} />
            ))}
          </motion.div>
        )}
      </section>

      {/* VERIFIED ORGANIZATIONS PREVIEW */}
      {!catalogOnly && organizations.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display font-extrabold text-2xl text-slate-900">
                Проверенные спортивные клубы и сообщества
              </h2>
              <p className="text-sm text-slate-600">
                Организации, прошедшие ручную верификацию администраторами платформы
              </p>
            </div>
            <Link
              to="/organizations"
              className="text-sm font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
            >
              <span>Все клубы</span>
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
                    <span>Проверенная организация</span>
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
