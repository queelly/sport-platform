import React, { useEffect, useRef, useState } from 'react';
import { Calendar, Check, ChevronDown, ChevronLeft, ChevronRight, Clock, Search } from 'lucide-react';
import { RUSSIAN_REGIONS } from '../types';

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
    <div ref={containerRef} className={`relative ${className}`}>
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
        <div className="absolute z-50 left-0 mt-1.5 min-w-[250px] w-max max-w-[340px] bg-card rounded-2xl border border-line-2 shadow-2xl py-1.5 max-h-72 overflow-y-auto anim-fade">
          {searchable && (
            <div className="px-3 pb-2 pt-1 sticky top-0 bg-card border-b border-line">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Быстрый поиск региона..."
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
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center justify-between gap-2 px-4 py-2.5 rounded-2xl border bg-[#F7FAF8] hover:bg-white text-sm font-bold transition-all min-h-[44px] ${
          open
            ? 'border-[#16B672] bg-white ring-3 ring-[#16B672]/15 text-[#1A2622]'
            : 'border-[#DCEAE4] hover:border-[#16B672]/50 text-[#1A2622]'
        }`}
      >
        <span className="inline-flex items-center gap-2 truncate">
          <Calendar className="w-4 h-4 text-[#16B672] shrink-0" />
          <span className="truncate">{formattedDisplay}</span>
        </span>
        <ChevronDown
          className={`w-4 h-4 text-[#16B672] shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute z-50 left-0 mt-2 w-80 sm:w-96 bg-white rounded-3xl border border-[#DCEAE4] shadow-2xl shadow-emerald-950/15 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-xl hover:bg-[#F7FAF8] text-[#1A2622]"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="font-display font-extrabold text-sm text-[#1A2622]">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </div>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-xl hover:bg-[#F7FAF8] text-[#1A2622]"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {WEEKDAYS_SHORT.map((wd) => (
              <div key={wd} className="text-[11px] font-extrabold text-[#7E8E89] py-1">
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
                  className={`h-8 rounded-xl text-xs font-extrabold transition-all ${
                    isSelected
                      ? 'bg-[#16B672] text-white shadow-md shadow-emerald-500/30'
                      : isPastDay
                      ? 'text-slate-300 cursor-not-allowed'
                      : 'text-[#1A2622] hover:bg-[#E7F8F0] hover:text-[#11995E]'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          <div className="pt-3 border-t border-[#EEF4F1] space-y-2.5">
            <div className="flex items-center justify-between gap-2 text-xs font-extrabold text-[#1A2622]">
              <span className="inline-flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#16B672]" />
                <span>Время (вручную ЧЧ:ММ или кнопками)</span>
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
              <div className="text-[10px] font-bold text-[#7E8E89] uppercase">Быстрый выбор часа</div>
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
                      className={`py-1 rounded-lg text-xs font-bold transition-colors ${
                        active
                          ? 'bg-[#16B672] text-white'
                          : disabled
                          ? 'text-slate-300 cursor-not-allowed'
                          : 'bg-[#F7FAF8] text-[#1A2622] hover:bg-[#E7F8F0]'
                      }`}
                    >
                      {pad2(h)}:00
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="text-[10px] font-bold text-[#7E8E89] uppercase">Быстрый выбор минут</div>
              <div className="grid grid-cols-4 gap-1.5">
                {minutes.map((m) => {
                  const active = safeDate.getMinutes() === m;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => handleSelectMinute(m)}
                      className={`py-1 rounded-lg text-xs font-bold transition-colors ${
                        active
                          ? 'bg-[#16B672] text-white'
                          : 'bg-[#F7FAF8] text-[#1A2622] hover:bg-[#E7F8F0]'
                      }`}
                    >
                      :{pad2(m)}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-[#EEF4F1] flex items-center justify-between gap-2">
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
                className="px-2.5 py-1 rounded-lg bg-[#F7FAF8] hover:bg-[#E7F8F0] text-[11px] font-bold text-[#1A2622]"
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
                className="px-2.5 py-1 rounded-lg bg-[#F7FAF8] hover:bg-[#E7F8F0] text-[11px] font-bold text-[#1A2622]"
              >
                В субботу 11:00
              </button>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-3.5 py-1.5 rounded-xl bg-[#16B672] hover:bg-[#11995E] text-white text-xs font-extrabold"
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
        className="w-20 text-center font-mono text-xs font-extrabold text-[#11995E] bg-[#E7F8F0] border border-[#16B672]/30 rounded-lg px-2 py-1"
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
      setUnsupportedMsg('Голосовой ввод не поддерживается вашим браузером (используйте Chrome/Edge/Safari)');
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
        className={`p-2 rounded-xl transition-all ${
          listening
            ? 'bg-rose-500 text-white animate-pulse shadow-sm'
            : 'text-slate-400 hover:text-[#16B672] hover:bg-[#E7F8F0]'
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

