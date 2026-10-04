'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  badge?: string;
  badgeClass?: string;
  count?: number;
  group?: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  dropdownClassName?: string;
  variant?: 'atelier' | 'admin' | 'status-badge';
  size?: 'sm' | 'md';
  disabled?: boolean;
}

export function CustomSelect({
  value,
  onChange,
  options,
  placeholder = 'Chọn một mục...',
  className = '',
  dropdownClassName = '',
  variant = 'atelier',
  size = 'md',
  disabled = false,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const selectedOption = options.find((opt) => opt.value === value);

  // Group options if any have group property
  const hasGroups = options.some((opt) => opt.group);
  const groupedOptions = hasGroups
    ? options.reduce<Record<string, SelectOption[]>>((acc, opt) => {
        const grp = opt.group || 'Khác';
        if (!acc[grp]) acc[grp] = [];
        acc[grp].push(opt);
        return acc;
      }, {})
    : null;

  // Variant-specific styles
  const isAtelier = variant === 'atelier';
  const isAdmin = variant === 'admin';
  const isStatusBadge = variant === 'status-badge';

  const triggerBaseClass = (() => {
    if (isStatusBadge) {
      if (selectedOption?.badgeClass) {
        return `inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-[11px] font-medium border cursor-pointer transition-all ${selectedOption.badgeClass}`;
      }
      return 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-[11px] font-medium border cursor-pointer transition-all bg-slate-50 border-slate-200 text-slate-700';
    }

    if (isAdmin) {
      return `flex items-center justify-between gap-2 px-3 ${
        size === 'sm' ? 'py-1.5 text-xs' : 'py-2 text-xs'
      } bg-white border border-slate-200 rounded-md hover:border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-900 transition-colors cursor-pointer text-slate-800 font-medium`;
    }

    // Atelier high-fashion theme
    return `flex items-center justify-between gap-3 px-3.5 ${
      size === 'sm' ? 'h-8 text-[10px]' : 'h-9 text-[11px]'
    } font-mono tracking-wide uppercase border hairline bg-white text-[#0a0a0a] hover:border-black transition-colors cursor-pointer select-none`;
  })();

  return (
    <div ref={containerRef} className={`relative inline-block text-left ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`${triggerBaseClass} ${isOpen ? (isAtelier ? 'border-black ring-1 ring-black' : 'border-slate-900 ring-1 ring-slate-900') : ''} disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`shrink-0 transition-transform duration-200 ${
            isStatusBadge ? 'w-3 h-3' : size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'
          } ${isOpen ? 'rotate-180 text-black' : isAtelier ? 'text-[#0a0a0a]/60' : 'text-slate-400'}`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute left-0 mt-1 min-w-full w-max z-50 overflow-hidden shadow-xl border ${
            isAtelier
              ? 'bg-white border-[#0a0a0a] rounded-none py-1 animate-in fade-in zoom-in-95 duration-150'
              : 'bg-white border-slate-200 rounded-md py-1 animate-in fade-in zoom-in-95 duration-150'
          } ${dropdownClassName}`}
          style={{ maxHeight: '320px', overflowY: 'auto' }}
        >
          {groupedOptions ? (
            Object.entries(groupedOptions).map(([groupTitle, items]) => (
              <div key={groupTitle} className="border-b last:border-b-0 border-slate-100">
                <div
                  className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider ${
                    isAtelier ? 'text-black/40 font-mono bg-black/[0.02]' : 'text-slate-400 bg-slate-50'
                  }`}
                >
                  {groupTitle}
                </div>
                {items.map((opt) => {
                  const isSelected = opt.value === value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        onChange(opt.value);
                        setIsOpen(false);
                      }}
                      className={`w-full text-left flex items-center justify-between gap-3 px-3 py-2 text-xs transition-colors cursor-pointer ${
                        isSelected
                          ? isAtelier
                            ? 'bg-black text-white font-medium'
                            : 'bg-slate-900 text-white font-medium'
                          : isAtelier
                          ? 'text-[#0a0a0a] hover:bg-black/5 font-mono uppercase text-[11px]'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span>{opt.label}</span>
                        {opt.count !== undefined && (
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded ${
                              isSelected ? 'bg-white/20 text-white' : 'bg-black/5 text-black/60'
                            }`}
                          >
                            {opt.count}
                          </span>
                        )}
                      </div>
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          ) : (
            options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left flex items-center justify-between gap-3 px-3.5 py-2.5 transition-colors cursor-pointer ${
                    isAtelier
                      ? isSelected
                        ? 'bg-[#0a0a0a] text-white font-semibold font-mono text-[11px] uppercase tracking-wide'
                        : 'text-[#0a0a0a] hover:bg-black/5 font-mono text-[11px] uppercase tracking-wide'
                      : isSelected
                      ? 'bg-slate-900 text-white font-medium text-xs'
                      : 'text-slate-700 hover:bg-slate-50 text-xs'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {opt.badgeClass ? (
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${opt.badgeClass}`}>
                        {opt.label}
                      </span>
                    ) : (
                      <span>{opt.label}</span>
                    )}
                    {opt.count !== undefined && (
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-black/5 text-black/60'
                        }`}
                      >
                        ({opt.count})
                      </span>
                    )}
                  </div>
                  {isSelected && (
                    <Check
                      className={`w-3.5 h-3.5 shrink-0 ${isSelected && isAtelier ? 'text-white' : ''}`}
                    />
                  )}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
