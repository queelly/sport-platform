import React, { useEffect, useRef, useState } from 'react';
import { Calendar, Check, ChevronDown, ChevronLeft, ChevronRight, Clock, MapPin, Search, X } from 'lucide-react';
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

  const filtered = searchable && search.trim()
    ? options.filter(
        (o) =>
          o.label.toLowerCase().replace('ё', 'е').includes(search.trim().toLowerCase().replace('ё', 'е')) ||
          o.value.toLowerCase().replace('ё', 'е').includes(search.trim().toLowerCase().replace('ё', 'е'))
      )
    : options;

  const sizeClasses =
    size === 'sm'
      ? 'px-3 py-1.5 text-xs rounded-xl min-h-[36px]'
      : 'px-3.5 py-2.5 text-sm rounded-xl min-h-[42px]';

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between gap-2 bg-white border transition-colors text-left font-medium ${sizeClasses} ${
          open
            ? 'border-blue-600 ring-2 ring-blue-500/15 text-slate-900'
            : 'border-slate-300 hover:border-slate-400 text-slate-800'
        }`}
      >
        <div className="flex-1 min-w-0 overflow-hidden group/marquee">
          <span
            className={`block whitespace-nowrap ${
              displayLabel.length > 22 ? 'group-hover/marquee:animate-marquee' : 'truncate'
            } ${!selectedOption ? 'text-slate-400 font-normal' : ''}`}
            title={displayLabel}
          >
            {displayLabel}
          </span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-150 ${
            open ? 'rotate-180 text-blue-600' : ''
          }`}
        />
      </button>

      {open && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 min-w-[220px] bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-900/10 py-1.5 max-h-72 overflow-y-auto">
          {searchable && (
            <div className="px-2.5 pb-1.5 pt-1 sticky top-0 bg-white border-b border-slate-100">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Поиск..."
                  autoFocus
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          )}

          {filtered.length === 0 ? (
            <div className="px-3.5 py-2.5 text-xs text-slate-400 text-center">Ничего не найдено</div>
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
                  className={`w-full flex items-center justify-between gap-2 px-3.5 py-2 text-left text-xs sm:text-sm transition-colors ${
                    active
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate">{opt.label}</div>
                    {opt.sublabel && <div className="text-[11px] text-slate-400 truncate">{opt.sublabel}</div>}
                  </div>
                  {active && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
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

  // If current value is a custom city not in predefined list, include it so it's visible
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
  // Monday = 0 ... Sunday = 6
  const startOffset = (firstDayOfMonth.getDay() + 6) % 7;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const todayFloor = new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate());

  const handleSelectDay = (day: number) => {
    const candidate = new Date(
      viewYear,
      viewMonth,
      day,
      safeDate.getHours(),
      safeDate.getMinutes()
    );
    if (candidate.getTime() < minDate.getTime()) {
      // If today is picked, bump time to at least next hour
      const nextHour = new Date(minDate.getTime() + 60 * 60_000);
      nextHour.setMinutes(0, 0, 0);
      onChange(toLocalIsoString(nextHour));
    } else {
      onChange(toLocalIsoString(candidate));
    }
  };

  const handleSelectTime = (hour: number, minute: number) => {
    const candidate = new Date(
      safeDate.getFullYear(),
      safeDate.getMonth(),
      safeDate.getDate(),
      hour,
      minute
    );
    if (candidate.getTime() < minDate.getTime()) {
      // Move to tomorrow if user picks an earlier time than now on today's date
      candidate.setDate(candidate.getDate() + 1);
    }
    onChange(toLocalIsoString(candidate));
  };

  const applyQuickPreset = (daysOffset: number, hour: number, minute: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    d.setHours(hour, minute, 0, 0);
    if (d.getTime() <= minDate.getTime()) {
      d.setDate(d.getDate() + 1);
    }
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
    onChange(toLocalIsoString(d));
    setOpen(false);
  };

  const formattedDisplay = safeDate.toLocaleString('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const hours = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];
  const minutes = [0, 15, 30, 45];

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl border bg-white text-sm font-medium transition-colors ${
          open ? 'border-blue-600 ring-2 ring-blue-500/15 text-slate-900' : 'border-slate-300 hover:border-slate-400 text-slate-800'
        }`}
      >
        <span className="flex items-center gap-2 truncate">
          <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
          <span className="truncate">{formattedDisplay}</span>
        </span>
        <Clock className="w-4 h-4 text-slate-400 shrink-0" />
      </button>

      {open && (
        <div className="absolute z-50 left-0 mt-2 w-[330px] sm:w-[370px] bg-white rounded-3xl border border-slate-200 shadow-2xl shadow-slate-900/15 p-4 space-y-3">
          {/* Quick Presets */}
          <div className="flex flex-wrap gap-1.5 pb-2 border-b border-slate-100">
            <button
              type="button"
              onClick={() => applyQuickPreset(0, 19, 0)}
              className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-semibold transition-colors"
            >
              Сегодня / Завтра 19:00
            </button>
            <button
              type="button"
              onClick={() => applyQuickPreset(1, 10, 0)}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition-colors"
            >
              Завтра 10:00
            </button>
            <button
              type="button"
              onClick={() => applyQuickPreset(2, 18, 30)}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition-colors"
            >
              Через 2 дня 18:30
            </button>
          </div>

          {/* Month Navigation */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                if (viewMonth === 0) {
                  setViewMonth(11);
                  setViewYear((y) => y - 1);
                } else {
                  setViewMonth((m) => m - 1);
                }
              }}
              className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-600"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="font-display font-bold text-sm text-slate-900">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </div>
            <button
              type="button"
              onClick={() => {
                if (viewMonth === 11) {
                  setViewMonth(0);
                  setViewYear((y) => y + 1);
                } else {
                  setViewMonth((m) => m + 1);
                }
              }}
              className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-600"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {WEEKDAYS_SHORT.map((w) => (
              <div key={w} className="text-[11px] font-bold text-slate-400 py-1">
                {w}
              </div>
            ))}
            {Array.from({ length: startOffset }).map((_, idx) => (
              <div key={`empty-${idx}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const day = idx + 1;
              const cellDate = new Date(viewYear, viewMonth, day);
              const isPast = cellDate.getTime() < todayFloor.getTime();
              const isSelected =
                safeDate.getFullYear() === viewYear &&
                safeDate.getMonth() === viewMonth &&
                safeDate.getDate() === day;

              return (
                <button
                  key={day}
                  type="button"
                  disabled={isPast}
                  onClick={() => handleSelectDay(day)}
                  className={`h-8 rounded-xl text-xs font-semibold transition-colors ${
                    isPast
                      ? 'text-slate-300 cursor-not-allowed'
                      : isSelected
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-700 hover:bg-blue-50 hover:text-blue-700'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Time Picker */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span>Время начала (часы и минуты):</span>
              <span className="text-blue-600">
                {pad2(safeDate.getHours())}:{pad2(safeDate.getMinutes())}
              </span>
            </div>
            <div className="grid grid-cols-8 gap-1">
              {hours.map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => handleSelectTime(h, safeDate.getMinutes())}
                  className={`py-1 rounded-lg text-xs font-semibold transition-colors ${
                    safeDate.getHours() === h
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {pad2(h)}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {minutes.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => handleSelectTime(safeDate.getHours(), m)}
                  className={`py-1 rounded-lg text-xs font-semibold transition-colors ${
                    safeDate.getMinutes() === m
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  :{pad2(m)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-4 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800"
            >
              Готово
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
