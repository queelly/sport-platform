import React, { useEffect, useRef, useState } from 'react';
import {
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  LocateFixed,
  MapPin,
  Search,
} from 'lucide-react';
import { getRegionInfo, RUSSIAN_REGIONS } from '../types';

export interface SelectOption {
  value: string;
  label: string;
  sublabel?: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (val: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  size?: 'sm' | 'md';
  searchable?: boolean;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Выберите...',
  className = '',
  size = 'md',
  searchable = false,
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find((o) => o.value === value);
  const displayLabel = selectedOption ? selectedOption.label : placeholder;

  const filtered =
    searchable && search.trim()
      ? options.filter(
          (o) =>
            o.label.toLowerCase().replace('ё', 'е').includes(search.trim().toLowerCase().replace('ё', 'е')) ||
            o.value.toLowerCase().replace('ё', 'е').includes(search.trim().toLowerCase().replace('ё', 'е'))
        )
      : options;

  const sizeClasses =
    size === 'sm'
      ? 'px-3.5 py-2 text-xs rounded-xl min-h-[38px]'
      : 'px-4 py-2.5 text-sm rounded-xl min-h-[44px]';

  return (
    <div ref={containerRef} className={`relative ${open ? 'z-[120]' : 'z-10'} ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        title={displayLabel}
        className={`w-full flex items-center justify-between gap-2.5 bg-card hover:bg-surface/60 border transition-colors text-left font-semibold cursor-pointer ${sizeClasses} ${
          open
            ? 'border-brand ring-2 ring-brand/20 text-ink'
            : 'border-line-2 hover:border-brand/60 text-ink'
        }`}
      >
        <div className="flex-1 min-w-0 overflow-hidden">
          <span
            className={`block truncate ${!selectedOption ? 'text-muted font-medium' : 'text-ink'}`}
          >
            {displayLabel}
          </span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-brand shrink-0 transition-transform duration-150 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div className="absolute z-[130] left-0 top-full mt-1.5 min-w-[250px] w-max max-w-[360px] bg-card rounded-2xl border border-line-2 shadow-2xl py-1.5 max-h-72 overflow-y-auto anim-fade">
          {searchable && (
            <div className="px-3 pb-2 pt-1 sticky top-0 bg-card border-b border-line z-10">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Быстрый поиск..."
                  autoFocus
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-line-2 bg-surface/60 text-xs font-medium text-ink focus:outline-none focus:border-brand"
                />
              </div>
            </div>
          )}

          {filtered.length === 0 ? (
            <div className="px-4 py-3 text-xs text-muted text-center">Ничего не найдено</div>
          ) : (
            filtered.map((opt) => {
              const active = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                    setSearch('');
                  }}
                  className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 text-left text-xs sm:text-sm transition-colors cursor-pointer ${
                    active
                      ? 'bg-brand-tint text-brand-ink font-bold'
                      : 'text-ink hover:bg-surface/70'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="leading-snug">{opt.label}</div>
                    {opt.sublabel && (
                      <div className="text-[11px] text-muted mt-0.5">{opt.sublabel}</div>
                    )}
                  </div>
                  {active && <Check className="w-4 h-4 text-brand shrink-0" />}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

interface RegionSelectProps {
  value: string;
  onChange: (val: string) => void;
  allowAll?: boolean;
  allLabel?: string;
  placeholder?: string;
  className?: string;
  size?: 'sm' | 'md';
}

export const RegionSelect: React.FC<RegionSelectProps> = ({
  value,
  onChange,
  allowAll = false,
  allLabel = 'Все регионы России',
  placeholder = 'Выберите регион или город...',
  className = '',
  size = 'md',
}) => {
  const options: SelectOption[] = [
    ...(allowAll ? [{ value: '', label: allLabel, sublabel: 'Показывать события со всех часовых поясов' }] : []),
    ...RUSSIAN_REGIONS.map((r) => ({
      value: r.value,
      label: r.label,
      sublabel: `Часовой пояс: ${r.tzLabel}`,
    })),
  ];

  if (value && !options.some((o) => o.value.toLowerCase() === value.toLowerCase())) {
    options.push({
      value,
      label: value,
      sublabel: 'Выбранный населённый пункт',
    });
  }

  return (
    <CustomSelect
      value={value}
      onChange={onChange}
      options={options}
      placeholder={placeholder}
      className={className}
      size={size}
      searchable
    />
  );
};

interface CustomDateTimePickerProps {
  value: string; // YYYY-MM-DDTHH:mm
  onChange: (val: string) => void;
  minDate?: Date;
  className?: string;
}

const MONTH_NAMES = [
  'Январь',
  'Февраль',
  'Март',
  'Апрель',
  'Май',
  'Июнь',
  'Июль',
  'Август',
  'Сентябрь',
  'Октябрь',
  'Ноябрь',
  'Декабрь',
];

const WEEKDAYS_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

function toLocalIsoString(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(
    d.getMinutes()
  )}`;
}

export const CustomDateTimePicker: React.FC<CustomDateTimePickerProps> = ({
  value,
  onChange,
  minDate = new Date(),
  className = '',
}) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const parsed = value ? new Date(value) : new Date(Date.now() + 24 * 3600_000);
  const safeDate = isNaN(parsed.getTime()) ? new Date(Date.now() + 24 * 3600_000) : parsed;

  const [viewYear, setViewYear] = useState(safeDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(safeDate.getMonth());

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
  const startOffset = (firstDayOfMonth.getDay() + 6) % 7;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const todayFloor = new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate());

  const handleSelectDay = (day: number) => {
    const candidate = new Date(
      viewYear,
      viewMonth,
      day,
      safeDate.getHours(),
      safeDate.getMinutes(),
      0,
      0
    );
    if (candidate.getTime() < minDate.getTime()) {
      const bumped = new Date(minDate.getTime() + 3600_000);
      bumped.setMinutes(0, 0, 0);
      onChange(toLocalIsoString(bumped));
    } else {
      onChange(toLocalIsoString(candidate));
    }
  };

  const handleSelectHour = (hour: number) => {
    const candidate = new Date(
      safeDate.getFullYear(),
      safeDate.getMonth(),
      safeDate.getDate(),
      hour,
      safeDate.getMinutes(),
      0,
      0
    );
    if (candidate.getTime() < minDate.getTime()) return;
    onChange(toLocalIsoString(candidate));
  };

  const handleSelectMinute = (minute: number) => {
    const candidate = new Date(
      safeDate.getFullYear(),
      safeDate.getMonth(),
      safeDate.getDate(),
      safeDate.getHours(),
      minute,
      0,
      0
    );
    if (candidate.getTime() < minDate.getTime()) return;
    onChange(toLocalIsoString(candidate));
  };

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const formattedDisplay = new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(safeDate);

  const hours = Array.from({ length: 18 }, (_, i) => i + 6);
  const minutes = [0, 15, 30, 45];

  return (
    <div ref={containerRef} className={`relative ${open ? 'z-[120]' : 'z-10'} ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl border bg-card hover:bg-surface/60 text-sm font-bold transition-all min-h-[44px] cursor-pointer ${
          open
            ? 'border-brand ring-2 ring-brand/20 text-ink'
            : 'border-line-2 hover:border-brand/60 text-ink'
        }`}
      >
        <span className="inline-flex items-center gap-2 truncate">
          <Calendar className="w-4 h-4 text-brand shrink-0" />
          <span className="truncate">{formattedDisplay}</span>
        </span>
        <ChevronDown
          className={`w-4 h-4 text-brand shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute z-[130] left-0 top-full mt-2 w-80 sm:w-96 bg-card rounded-2xl border border-line-2 shadow-2xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-xl hover:bg-surface text-ink"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="font-display font-bold text-sm text-ink">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </div>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-xl hover:bg-surface text-ink"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {WEEKDAYS_SHORT.map((wd) => (
              <div key={wd} className="text-[11px] font-bold text-muted py-1">
                {wd}
              </div>
            ))}
            {Array.from({ length: startOffset }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }, (_, idx) => {
              const day = idx + 1;
              const cellDate = new Date(viewYear, viewMonth, day);
              const isPastDay = cellDate.getTime() < todayFloor.getTime();
              const isSelected =
                safeDate.getFullYear() === viewYear &&
                safeDate.getMonth() === viewMonth &&
                safeDate.getDate() === day;

              return (
                <button
                  key={day}
                  type="button"
                  disabled={isPastDay}
                  onClick={() => handleSelectDay(day)}
                  className={`h-8 rounded-xl text-xs font-bold transition-all ${
                    isSelected
                      ? 'bg-brand text-white shadow-sm'
                      : isPastDay
                      ? 'text-muted/40 cursor-not-allowed'
                      : 'text-ink hover:bg-brand-tint hover:text-brand-ink'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          <div className="pt-3 border-t border-line space-y-2.5">
            <div className="flex items-center justify-between gap-2 text-xs font-bold text-ink">
              <span className="inline-flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-brand" />
                <span>Время (ЧЧ:ММ или кнопками)</span>
              </span>
              <FreeTimeInput
                safeDate={safeDate}
                minDate={minDate}
                onApply={(h, m) => {
                  const candidate = new Date(
                    safeDate.getFullYear(),
                    safeDate.getMonth(),
                    safeDate.getDate(),
                    h,
                    m,
                    0,
                    0
                  );
                  onChange(toLocalIsoString(candidate));
                }}
              />
            </div>

            <div className="space-y-1.5">
              <div className="text-[10px] font-bold text-muted uppercase">Быстрый выбор часа</div>
              <div className="grid grid-cols-6 gap-1">
                {hours.map((h) => {
                  const candidate = new Date(
                    safeDate.getFullYear(),
                    safeDate.getMonth(),
                    safeDate.getDate(),
                    h,
                    59
                  );
                  const disabled = candidate.getTime() < minDate.getTime();
                  const active = safeDate.getHours() === h;
                  return (
                    <button
                      key={h}
                      type="button"
                      disabled={disabled}
                      onClick={() => handleSelectHour(h)}
                      className={`py-1 rounded-lg text-xs font-mono font-bold transition-colors ${
                        active
                          ? 'bg-brand text-white'
                          : disabled
                          ? 'text-muted/40 cursor-not-allowed'
                          : 'bg-surface text-ink hover:bg-brand-tint'
                      }`}
                    >
                      {pad2(h)}:00
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="text-[10px] font-bold text-muted uppercase">Быстрый выбор минут</div>
              <div className="grid grid-cols-4 gap-1.5">
                {minutes.map((m) => {
                  const active = safeDate.getMinutes() === m;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => handleSelectMinute(m)}
                      className={`py-1 rounded-lg text-xs font-mono font-bold transition-colors ${
                        active
                          ? 'bg-brand text-white'
                          : 'bg-surface text-ink hover:bg-brand-tint'
                      }`}
                    >
                      :{pad2(m)}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-line flex items-center justify-between gap-2">
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => {
                  const d = new Date(Date.now() + 24 * 3600_000);
                  d.setHours(19, 0, 0, 0);
                  onChange(toLocalIsoString(d));
                  setViewYear(d.getFullYear());
                  setViewMonth(d.getMonth());
                }}
                className="px-2.5 py-1 rounded-lg bg-surface hover:bg-brand-tint text-[11px] font-bold text-ink"
              >
                Завтра 19:00
              </button>
              <button
                type="button"
                onClick={() => {
                  const d = new Date();
                  const daysUntilSat = (6 - d.getDay() + 7) % 7 || 7;
                  d.setDate(d.getDate() + daysUntilSat);
                  d.setHours(11, 0, 0, 0);
                  onChange(toLocalIsoString(d));
                  setViewYear(d.getFullYear());
                  setViewMonth(d.getMonth());
                }}
                className="px-2.5 py-1 rounded-lg bg-surface hover:bg-brand-tint text-[11px] font-bold text-ink"
              >
                В субботу 11:00
              </button>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-3.5 py-1.5 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-bold"
            >
              Готово
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const FreeTimeInput: React.FC<{
  safeDate: Date;
  minDate: Date;
  onApply: (h: number, m: number) => void;
}> = ({ safeDate, minDate, onApply }) => {
  const formatted = `${pad2(safeDate.getHours())}:${pad2(safeDate.getMinutes())}`;
  const [draft, setDraft] = useState(formatted);
  const [focused, setFocused] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!focused) {
      setDraft(`${pad2(safeDate.getHours())}:${pad2(safeDate.getMinutes())}`);
      setErr(null);
    }
  }, [safeDate, focused]);

  const tryCommit = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) {
      setErr('Укажите ЧЧ:ММ');
      return;
    }
    const match = trimmed.match(/^(\d{1,2})[:.\-\s]?(\d{2})$/);
    if (!match) {
      setErr('Формат ЧЧ:ММ');
      return;
    }
    const h = Number(match[1]);
    const m = Number(match[2]);
    if (h < 0 || h > 23 || m < 0 || m > 59) {
      setErr('00:00–23:59');
      return;
    }
    const candidate = new Date(
      safeDate.getFullYear(),
      safeDate.getMonth(),
      safeDate.getDate(),
      h,
      m,
      0,
      0
    );
    if (candidate.getTime() < minDate.getTime()) {
      setErr('Время в прошлом');
      return;
    }
    setErr(null);
    onApply(h, m);
  };

  return (
    <div className="flex flex-col items-end">
      <input
        type="text"
        value={draft}
        aria-label="Время начала ЧЧ:ММ"
        placeholder="19:00"
        onFocus={() => setFocused(true)}
        onChange={(e) => {
          const val = e.target.value;
          setDraft(val);
          if (/^\d{2}:\d{2}$/.test(val.trim())) {
            tryCommit(val);
          } else {
            setErr(null);
          }
        }}
        onBlur={() => {
          setFocused(false);
          if (draft.trim()) {
            tryCommit(draft);
          } else {
            setDraft(formatted);
            setErr(null);
          }
        }}
        className="w-20 text-center font-mono text-xs font-bold text-brand-ink bg-brand-tint border border-brand/30 rounded-lg px-2 py-1"
      />
      {err && <span className="text-[10px] font-bold text-rose-600 mt-0.5">{err}</span>}
    </div>
  );
};

export const VoiceSearchButton: React.FC<{
  onResult: (transcript: string) => void;
  className?: string;
}> = ({ onResult, className = '' }) => {
  const [listening, setListening] = useState(false);
  const [unsupportedMsg, setUnsupportedMsg] = useState<string | null>(null);

  const handleToggleVoice = () => {
    const SpeechRecognitionCtor =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      setUnsupportedMsg('Голосовой ввод не поддерживается браузером');
      setTimeout(() => setUnsupportedMsg(null), 4000);
      return;
    }
    if (listening) return;
    try {
      const recognition = new SpeechRecognitionCtor();
      recognition.lang = 'ru-RU';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      setListening(true);
      setUnsupportedMsg(null);

      recognition.onresult = (event: any) => {
        const text = event?.results?.[0]?.[0]?.transcript;
        if (text) {
          onResult(text.trim());
        }
        setListening(false);
      };
      recognition.onerror = () => {
        setListening(false);
      };
      recognition.onend = () => {
        setListening(false);
      };
      recognition.start();
    } catch {
      setListening(false);
    }
  };

  return (
    <div className={`inline-flex items-center ${className}`}>
      <button
        type="button"
        onClick={handleToggleVoice}
        title={listening ? 'Слушаю... говорите запрос' : 'Голосовой поиск на русском языке'}
        aria-label="Голосовой поиск"
        className={`p-2 rounded-xl transition-all cursor-pointer ${
          listening
            ? 'bg-rose-500 text-white animate-pulse shadow-sm'
            : 'text-muted hover:text-brand hover:bg-brand-tint'
        }`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" x2="12" y1="19" y2="22" />
        </svg>
      </button>
      {unsupportedMsg && (
        <span className="ml-1.5 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg">
          {unsupportedMsg}
        </span>
      )}
    </div>
  );
};

/* ============================================================================
 * 2ГИС ГЕОКОДЕР И ИНТЕРАКТИВНЫЙ ВЫБОР ТОЧКИ НА КАРТЕ (MapAddressPicker)
 * ============================================================================ */

export interface GeocodedPlace {
  address: string;
  city: string;
  lat: number;
  lng: number;
  subtitle?: string;
}

// Встроенный справочник реальных спортивных комплексов и адресов 2ГИС для мгновенного автодополнения
export const KNOWN_2GIS_VENUES: GeocodedPlace[] = [
  {
    city: 'Москва',
    address: 'Лужнецкая набережная, 24, СК «Лужники»',
    lat: 55.7158,
    lng: 37.5537,
    subtitle: 'Олимпийский комплекс Лужники · Хамовники',
  },
  {
    city: 'Москва',
    address: 'Крымский Вал, 9, Парк Горького (Спортивный центр)',
    lat: 55.7312,
    lng: 37.6032,
    subtitle: 'Парк культуры и отдыха им. Горького',
  },
  {
    city: 'Москва',
    address: 'Пресненский Вал, 27, Теннисный центр «Пресня»',
    lat: 55.7684,
    lng: 37.5641,
    subtitle: 'Пресненский район · Корты и манеж',
  },
  {
    city: 'Москва',
    address: 'Сокольнический Вал, 1Б, Манеж «Спартак»',
    lat: 55.7923,
    lng: 37.6712,
    subtitle: 'Парк Сокольники · Крытые футбольные поля',
  },
  {
    city: 'Москва',
    address: 'Ленинградский проспект, 36, ВТБ Арена Парк',
    lat: 55.7915,
    lng: 37.5598,
    subtitle: 'Динамо · Спортивный квартал',
  },
  {
    city: 'Москва',
    address: 'Крылатская улица, 2, Гребной канал и Велотрек',
    lat: 55.7569,
    lng: 37.4272,
    subtitle: 'Крылатское · Циклические виды спорта',
  },
  {
    city: 'Москва',
    address: 'Проспект Мира, 119, ВДНХ (Спортивная зона)',
    lat: 55.8263,
    lng: 37.6377,
    subtitle: 'Останкинский район · Воркаут и корты',
  },
  {
    city: 'Санкт-Петербург',
    address: 'Футбольная аллея, 8, Крестовский остров (Газпром Арена)',
    lat: 59.9727,
    lng: 30.2214,
    subtitle: 'Приморский парк Победы · Беговые и игровые трассы',
  },
  {
    city: 'Санкт-Петербург',
    address: 'Инженерная улица, 13, Клуб «Волейбол-Сити»',
    lat: 59.9368,
    lng: 30.3385,
    subtitle: 'Центральный район',
  },
  {
    city: 'Санкт-Петербург',
    address: 'Елагин остров, 4, ЦПКиО им. Кирова (Спортплощадки)',
    lat: 59.9794,
    lng: 30.2603,
    subtitle: 'Петроградский район · Волейбол, бег и теннис',
  },
  {
    city: 'Новосибирск',
    address: 'Улица Немировича-Данченко, 160, Сибирь-Арена',
    lat: 54.9965,
    lng: 82.8996,
    subtitle: 'Кировский район · Спортивный парк',
  },
  {
    city: 'Екатеринбург',
    address: 'Улица Репина, 5, Екатеринбург Арена',
    lat: 56.8325,
    lng: 60.5736,
    subtitle: 'Верх-Исетский район · Легкоатлетический и игровой комплекс',
  },
  {
    city: 'Казань',
    address: 'Проспект Ямашева, 115А, Ак Барс Арена',
    lat: 55.8209,
    lng: 49.1609,
    subtitle: 'Ново-Савиновский район',
  },
];

function formatNominatimAddress(item: any, fallbackCity: string): GeocodedPlace {
  const addr = item.address || {};
  const detectedCity =
    addr.city ||
    addr.town ||
    addr.village ||
    addr.municipality ||
    addr.state ||
    fallbackCity ||
    'Москва';

  const road = addr.road || addr.pedestrian || addr.footway || addr.square || '';
  const house = addr.house_number || '';
  const venue =
    item.name && item.name !== road && item.name !== detectedCity ? item.name : addr.Amenity || addr.leisure || '';

  const parts: string[] = [];
  if (road) {
    parts.push(house ? `${road}, ${house}` : road);
  }
  if (venue && !parts.some((p) => p.toLowerCase().includes(venue.toLowerCase()))) {
    parts.push(venue);
  }

  let formattedAddress = parts.join(', ');
  if (!formattedAddress && item.display_name) {
    formattedAddress = String(item.display_name)
      .split(',')
      .slice(0, 3)
      .map((s: string) => s.trim())
      .join(', ');
  }

  const suburb = addr.suburb || addr.city_district || addr.neighbourhood || '';

  return {
    city: detectedCity,
    address: formattedAddress || 'Точка на карте 2ГИС',
    lat: Number(Number(item.lat).toFixed(5)),
    lng: Number(Number(item.lon).toFixed(5)),
    subtitle: [detectedCity, suburb].filter(Boolean).join(' · '),
  };
}

export async function searchRealAddresses2Gis(
  query: string,
  city: string
): Promise<GeocodedPlace[]> {
  const q = query.trim();
  const normalizedQ = q.toLowerCase().replace('ё', 'е');
  const normalizedCity = city.trim().toLowerCase().replace('ё', 'е');

  // 1. Локальные точные совпадения по базе площадок 2ГИС
  const localMatches = KNOWN_2GIS_VENUES.filter((v) => {
    const cityOk = !normalizedCity || v.city.toLowerCase().replace('ё', 'е').includes(normalizedCity);
    if (!q) return cityOk;
    const text = `${v.address} ${v.subtitle || ''} ${v.city}`.toLowerCase().replace('ё', 'е');
    return cityOk && text.includes(normalizedQ);
  });

  if (!q || q.length < 2) {
    return localMatches.slice(0, 6);
  }

  // 2. Живой геокодинг реальных улиц, домов и спортивных объектов РФ
  try {
    const fullQuery = city ? `${city}, ${q}` : q;
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(
      fullQuery
    )}&countrycodes=ru&addressdetails=1&limit=6&accept-language=ru`;
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return localMatches;
    const data = await res.json();
    if (!Array.isArray(data)) return localMatches;

    const remotePlaces = data.map((item) => formatNominatimAddress(item, city || 'Москва'));
    const combined: GeocodedPlace[] = [...localMatches];
    for (const rp of remotePlaces) {
      if (
        !combined.some(
          (c) =>
            c.address.toLowerCase() === rp.address.toLowerCase() ||
            (Math.abs(c.lat - rp.lat) < 0.0005 && Math.abs(c.lng - rp.lng) < 0.0005)
        )
      ) {
        combined.push(rp);
      }
    }
    return combined.slice(0, 7);
  } catch {
    return localMatches;
  }
}

export async function reverseGeocode2GisPoint(
  lat: number,
  lng: number,
  fallbackCity: string
): Promise<GeocodedPlace> {
  const roundedLat = Number(lat.toFixed(5));
  const roundedLng = Number(lng.toFixed(5));

  // Проверим, нет ли рядом известной спортплощадки (< 150 метров)
  const nearKnown = KNOWN_2GIS_VENUES.find(
    (v) => Math.abs(v.lat - roundedLat) < 0.0012 && Math.abs(v.lng - roundedLng) < 0.0018
  );
  if (nearKnown) {
    return {
      ...nearKnown,
      lat: roundedLat,
      lng: roundedLng,
    };
  }

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${roundedLat}&lon=${roundedLng}&addressdetails=1&accept-language=ru`;
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      const data = await res.json();
      if (data && (data.address || data.display_name)) {
        const parsed = formatNominatimAddress(
          { ...data, lat: roundedLat, lon: roundedLng },
          fallbackCity
        );
        return parsed;
      }
    }
  } catch {
    // fallback below
  }

  return {
    city: fallbackCity || 'Москва',
    address: `Координаты 2ГИС: ${roundedLat}, ${roundedLng}`,
    lat: roundedLat,
    lng: roundedLng,
    subtitle: 'Точка выбрана на карте 2ГИС',
  };
}

interface MapAddressPickerProps {
  city: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  onChange: (next: { address: string; latitude: number; longitude: number; detectedCity?: string }) => void;
}

export const MapAddressPicker: React.FC<MapAddressPickerProps> = ({
  city,
  address,
  latitude,
  longitude,
  onChange,
}) => {
  const regionInfo = getRegionInfo(city);
  const defaultLat = regionInfo?.lat ?? 55.7558;
  const defaultLng = regionInfo?.lng ?? 37.6173;

  const currentLat = latitude ?? defaultLat;
  const currentLng = longitude ?? defaultLng;

  const [suggestions, setSuggestions] = useState<GeocodedPlace[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searching, setSearching] = useState(false);
  const [reverseLoading, setReverseLoading] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const prevCityRef = useRef<string>(city);

  // Закрытие списка подсказок при клике вне
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  // Инициализация карты 2ГИС для выбора координат кликом или перетаскиванием пина
  useEffect(() => {
    const L = (window as any).L;
    if (!L || !mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [currentLat, currentLng],
        zoom: latitude && longitude ? 15 : 12,
        zoomControl: true,
        attributionControl: false,
      });

      L.tileLayer('https://tile{s}.maps.2gis.com/tiles?x={x}&y={y}&z={z}&v=1', {
        subdomains: ['0', '1', '2', '3'],
        maxZoom: 18,
      }).addTo(map);

      const pinIcon = L.divIcon({
        className: 'sp-2gis-picker-pin',
        html: `<div style="
          display:inline-flex;align-items:center;gap:5px;
          padding:5px 10px;border-radius:999px;
          font-family:'Golos Text',sans-serif;font-weight:700;font-size:12px;
          background:#00B956;color:#FFFFFF;border:2px solid #FFFFFF;
          box-shadow:0 6px 18px rgba(0,185,86,0.45);
          transform:translate(-50%,-50%);white-space:nowrap;cursor:grab;
        ">📍 Точка сбора</div>`,
        iconSize: [110, 30],
        iconAnchor: [55, 15],
      });

      const marker = L.marker([currentLat, currentLng], {
        icon: pinIcon,
        draggable: true,
      }).addTo(map);

      const handlePickCoords = async (lat: number, lng: number) => {
        setReverseLoading(true);
        const resolved = await reverseGeocode2GisPoint(lat, lng, city);
        setReverseLoading(false);
        onChange({
          address: resolved.address,
          latitude: resolved.lat,
          longitude: resolved.lng,
          detectedCity: resolved.city,
        });
      };

      map.on('click', (e: any) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        handlePickCoords(lat, lng);
      });

      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        handlePickCoords(pos.lat, pos.lng);
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;
      setTimeout(() => map.invalidateSize(), 120);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, []);

  // Если сменился город в селекторе — перелетаем на центр нового города
  useEffect(() => {
    if (prevCityRef.current !== city && mapInstanceRef.current) {
      prevCityRef.current = city;
      const info = getRegionInfo(city);
      if (info) {
        mapInstanceRef.current.setView([info.lat, info.lng], 12, { animate: true });
        if (markerRef.current) {
          markerRef.current.setLatLng([info.lat, info.lng]);
        }
      }
    }
  }, [city]);

  // Синхронизация маркера при выборе адреса из подсказки
  useEffect(() => {
    if (latitude !== null && longitude !== null && mapInstanceRef.current && markerRef.current) {
      markerRef.current.setLatLng([latitude, longitude]);
      mapInstanceRef.current.setView([latitude, longitude], 15, { animate: true });
    }
  }, [latitude, longitude]);

  // Живой поиск адресов при вводе
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      setSearching(true);
      const res = await searchRealAddresses2Gis(address, city);
      if (!cancelled) {
        setSuggestions(res);
        setSearching(false);
      }
    }, 260);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [address, city]);

  const handleSelectPlace = (place: GeocodedPlace) => {
    setShowSuggestions(false);
    onChange({
      address: place.address,
      latitude: place.lat,
      longitude: place.lng,
      detectedCity: place.city,
    });
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setReverseLoading(true);
        const resolved = await reverseGeocode2GisPoint(lat, lng, city);
        setReverseLoading(false);
        onChange({
          address: resolved.address,
          latitude: resolved.lat,
          longitude: resolved.lng,
          detectedCity: resolved.city,
        });
      },
      () => {
        // ignore
      }
    );
  };

  return (
    <div ref={wrapperRef} className="space-y-3">
      {/* Поле поиска реального адреса 2ГИС с автодополнением */}
      <div className="relative">
        <div className="relative flex items-center">
          <MapPin className="w-4 h-4 text-brand absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            required
            value={address}
            onFocus={() => setShowSuggestions(true)}
            onChange={(e) => {
              const val = e.target.value;
              onChange({
                address: val,
                latitude: latitude ?? defaultLat,
                longitude: longitude ?? defaultLng,
              });
              setShowSuggestions(true);
            }}
            placeholder="Введите улицу, дом или спорткомплекс (или кликните на карту 2ГИС ниже)..."
            className="w-full pl-10 pr-28 py-2.5 rounded-xl border border-line-2 bg-card focus:border-brand text-sm font-medium text-ink outline-none"
          />
          <button
            type="button"
            onClick={async () => {
              setSearching(true);
              const res = await searchRealAddresses2Gis(address, city);
              setSuggestions(res);
              setSearching(false);
              if (res.length > 0) {
                handleSelectPlace(res[0]);
              } else {
                setShowSuggestions(true);
              }
            }}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-brand-tint hover:bg-brand text-brand-ink hover:text-white text-xs font-bold transition-colors cursor-pointer"
          >
            {searching ? 'Поиск...' : 'Найти в 2ГИС'}
          </button>
        </div>

        {/* Выпадающий список найденных реальных адресов */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-[140] left-0 right-0 top-full mt-1.5 bg-card rounded-2xl border border-line-2 shadow-2xl py-1.5 max-h-64 overflow-y-auto anim-fade">
            <div className="px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted flex items-center justify-between">
              <span>Адреса и площадки 2ГИС ({city || 'Россия'})</span>
              <span>Кликните для привязки координат</span>
            </div>
            {suggestions.map((item, idx) => (
              <button
                key={`${item.lat}-${item.lng}-${idx}`}
                type="button"
                onClick={() => handleSelectPlace(item)}
                className="w-full px-3.5 py-2.5 text-left hover:bg-brand-tint/60 flex items-start justify-between gap-3 transition-colors cursor-pointer"
              >
                <div className="min-w-0">
                  <div className="text-xs sm:text-sm font-bold text-ink truncate">
                    {item.address}
                  </div>
                  {item.subtitle && (
                    <div className="text-[11px] text-muted truncate">{item.subtitle}</div>
                  )}
                </div>
                <span className="font-mono text-[10px] font-bold text-brand-ink bg-brand-tint px-2 py-0.5 rounded-md shrink-0">
                  {item.lat.toFixed(4)}, {item.lng.toFixed(4)}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Интерактивная карта 2ГИС для выбора точки кликом */}
      <div className="rounded-2xl border border-line-2 overflow-hidden bg-surface relative">
        <div ref={mapContainerRef} className="w-full h-56 sm:h-64 z-10" />

        {/* Верхняя плашка подсказки */}
        <div className="absolute top-2.5 left-2.5 right-2.5 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
          <div className="px-3 py-1.5 rounded-xl bg-card/95 backdrop-blur-md border border-line-2 shadow-sm text-[11px] font-semibold text-ink">
            {reverseLoading
              ? '⏳ Определяем точный адрес точки 2ГИС...'
              : '👆 Кликните в любое место на карте 2ГИС или перетащите маркер для точной привязки'}
          </div>
          <button
            type="button"
            onClick={handleLocateMe}
            className="pointer-events-auto px-2.5 py-1.5 rounded-xl bg-card/95 hover:bg-card border border-line-2 shadow-sm text-[11px] font-bold text-ink inline-flex items-center gap-1.5 cursor-pointer"
          >
            <LocateFixed className="w-3.5 h-3.5 text-brand" />
            <span>Моя геопозиция</span>
          </button>
        </div>

        {/* Нижняя строка привязанных координат */}
        <div className="px-3.5 py-2 bg-card border-t border-line flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brand" />
            <span className="font-semibold text-ink">Координаты точки:</span>
            <span className="font-mono font-bold text-brand-ink bg-brand-tint px-2 py-0.5 rounded-md">
              {currentLat.toFixed(5)}, {currentLng.toFixed(5)}
            </span>
          </div>
          <a
            href={`https://2gis.ru/?m=${currentLng},${currentLat}/16`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-ink hover:underline"
          >
            <span>Открыть эту точку в 2ГИС</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
};

/* Встроенная мини-карта 2ГИС для карточки мероприятия (EventDetailPage) */
export const Embedded2GisMiniMap: React.FC<{
  city: string;
  address: string;
  latitude?: number | null;
  longitude?: number | null;
  title?: string;
}> = ({ city, address, latitude, longitude }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  const info = getRegionInfo(city);
  const [coords, setCoords] = useState<{ lat: number; lng: number }>(() => ({
    lat: latitude ?? info?.lat ?? 55.7558,
    lng: longitude ?? info?.lng ?? 37.6173,
  }));

  useEffect(() => {
    let cancelled = false;
    if (latitude && longitude) {
      setCoords({ lat: latitude, lng: longitude });
      return;
    }
    // Если у события не были сохранены координаты — геокодируем его реальный адрес
    searchRealAddresses2Gis(address, city).then((list) => {
      if (!cancelled && list.length > 0) {
        setCoords({ lat: list[0].lat, lng: list[0].lng });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [city, address, latitude, longitude]);

  useEffect(() => {
    const L = (window as any).L;
    if (!L || !containerRef.current) return;

    if (!mapRef.current) {
      const map = L.map(containerRef.current, {
        center: [coords.lat, coords.lng],
        zoom: 15,
        zoomControl: true,
        attributionControl: false,
      });

      L.tileLayer('https://tile{s}.maps.2gis.com/tiles?x={x}&y={y}&z={z}&v=1', {
        subdomains: ['0', '1', '2', '3'],
        maxZoom: 18,
      }).addTo(map);

      const pinIcon = L.divIcon({
        className: 'sp-2gis-detail-pin',
        html: `<div style="
          display:inline-flex;align-items:center;gap:5px;
          padding:5px 11px;border-radius:999px;
          font-family:'Golos Text',sans-serif;font-weight:700;font-size:12px;
          background:#00B956;color:#FFFFFF;border:2px solid #FFFFFF;
          box-shadow:0 6px 18px rgba(0,185,86,0.45);
          transform:translate(-50%,-50%);white-space:nowrap;
        ">📍 Место сбора</div>`,
        iconSize: [110, 30],
        iconAnchor: [55, 15],
      });

      markerRef.current = L.marker([coords.lat, coords.lng], { icon: pinIcon }).addTo(map);
      mapRef.current = map;
      setTimeout(() => map.invalidateSize(), 120);
    } else {
      mapRef.current.setView([coords.lat, coords.lng], 15);
      if (markerRef.current) {
        markerRef.current.setLatLng([coords.lat, coords.lng]);
      }
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, [coords.lat, coords.lng]);

  return (
    <div className="rounded-2xl border border-line-2 overflow-hidden bg-surface">
      <div ref={containerRef} className="w-full h-48 sm:h-56 z-10" />
      <div className="px-3.5 py-2 bg-card border-t border-line flex flex-wrap items-center justify-between gap-2 text-[11px]">
        <span className="font-mono font-semibold text-muted">
          Координаты 2ГИС: {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
        </span>
        <a
          href={`https://2gis.ru/search/${encodeURIComponent(`${city} ${address}`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-bold text-brand-ink hover:underline"
        >
          <span>Построить маршрут в 2ГИС</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
};
