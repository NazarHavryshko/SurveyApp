import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, X, Check } from 'lucide-react';
import type { DictOption } from '../types/auth';

interface SearchableSelectProps {
  options: DictOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  icon?: React.ReactNode;
  emptyText?: string;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Оберіть зі списку...',
  disabled = false,
  icon,
  emptyText = 'Нічого не знайдено',
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedOption = useMemo(
    () => options.find((opt) => String(opt.id) === String(value)) ?? null,
    [options, value]
  );

  // Фільтрація: спочатку варіанти, що починаються з введених літер, потім інші збіги
  const filteredOptions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return options;

    const startsWith: DictOption[] = [];
    const includes: DictOption[] = [];

    for (const opt of options) {
      const lower = opt.name.toLowerCase();
      if (lower.startsWith(q)) {
        startsWith.push(opt);
      } else if (lower.includes(q)) {
        includes.push(opt);
      }
    }

    return [...startsWith, ...includes];
  }, [options, searchQuery]);

  // Закриття при кліку поза компонентом
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (disabled && isOpen) {
      setIsOpen(false);
      setSearchQuery('');
    }
  }, [disabled, isOpen]);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [searchQuery, isOpen]);

  const openDropdown = () => {
    if (disabled) return;
    setIsOpen(true);
    setSearchQuery('');
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleSelect = (option: DictOption) => {
    onChange(String(option.id));
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    onChange('');
    setSearchQuery('');
    setIsOpen(true);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (!isOpen && (e.key === 'ArrowDown' || e.key === 'Enter')) {
      e.preventDefault();
      openDropdown();
      return;
    }

    if (!isOpen) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        filteredOptions.length > 0 ? (prev + 1) % filteredOptions.length : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        filteredOptions.length > 0
          ? (prev - 1 + filteredOptions.length) % filteredOptions.length
          : 0
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredOptions[highlightedIndex]) {
        handleSelect(filteredOptions[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <div
        onClick={openDropdown}
        className={`relative flex items-center rounded-xl bg-app border transition ${
          isOpen ? 'border-accent' : 'border-line'
        } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-text'}`}
      >
        {icon && (
          <span className="text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
            {icon}
          </span>
        )}

        <input
          ref={inputRef}
          type="text"
          disabled={disabled}
          value={isOpen ? searchQuery : selectedOption?.name ?? ''}
          placeholder={isOpen && selectedOption ? selectedOption.name : placeholder}
          onFocus={() => {
            if (!disabled && !isOpen) {
              setIsOpen(true);
              setSearchQuery('');
            }
          }}
          onChange={(e) => {
            if (!isOpen) setIsOpen(true);
            setSearchQuery(e.target.value);
          }}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          className={`w-full py-3 pr-14 bg-transparent text-main placeholder:text-muted text-sm outline-none disabled:cursor-not-allowed ${
            icon ? 'pl-10' : 'pl-3.5'
          }`}
        />

        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {!disabled && (value || searchQuery) && (
            <button
              type="button"
              tabIndex={-1}
              onClick={handleClear}
              title="Очистити"
              className="p-1 rounded-md text-muted hover:text-main transition cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown
            className={`w-4 h-4 text-muted pointer-events-none transition-transform duration-150 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </div>
      </div>

      {isOpen && !disabled && (
        <ul className="absolute z-50 mt-1.5 w-full max-h-56 overflow-y-auto rounded-xl bg-card border border-line shadow-xl py-1 text-sm">
          {filteredOptions.length === 0 ? (
            <li className="px-3.5 py-2.5 text-xs text-muted text-center">{emptyText}</li>
          ) : (
            filteredOptions.map((opt, idx) => {
              const isSelected = String(opt.id) === String(value);
              const isHighlighted = idx === highlightedIndex;

              return (
                <li
                  key={opt.id}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelect(opt);
                  }}
                  className={`px-3.5 py-2.5 flex items-center justify-between gap-2 cursor-pointer transition ${
                    isSelected
                      ? 'bg-accent/15 text-accent font-semibold'
                      : isHighlighted
                      ? 'bg-app text-main'
                      : 'text-main hover:bg-app'
                  }`}
                >
                  <span className="truncate">{opt.name}</span>
                  {isSelected && <Check className="w-4 h-4 shrink-0 text-accent" />}
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}