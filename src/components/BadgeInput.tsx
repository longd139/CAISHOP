'use client';

import React, { useRef, useState } from 'react';
import { X } from 'lucide-react';

export interface BadgeInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  chipClassName?: string;
  chipRounded?: 'full' | 'md';
  inputClassName?: string;
  maxBadges?: number;
  /** Tuỳ chọn: trả về mã màu hex để hiển thị chấm màu bên trong badge (dùng cho badge màu sắc). */
  getDotColor?: (label: string) => string | undefined;
}

export const BadgeInput: React.FC<BadgeInputProps> = ({
  value,
  onChange,
  placeholder = 'Nhập rồi nhấn Enter...',
  chipClassName = 'bg-slate-900 text-white',
  chipRounded = 'full',
  inputClassName = '',
  maxBadges = 40,
  getDotColor,
}) => {
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const addLabel = (raw: string, current: string[]) => {
    const label = raw.trim().replace(/\s+/g, ' ');
    if (!label) return current;
    if (current.some(item => item.toLowerCase() === label.toLowerCase())) {
      setError(`"${label}" đã có trong danh sách.`);
      return current;
    }
    if (current.length >= maxBadges) {
      setError(`Chỉ có thể thêm tối đa ${maxBadges} giá trị.`);
      return current;
    }
    setError(null);
    return [...current, label];
  };

  const commitDraft = () => {
    if (!draft.trim()) return;
    const next = addLabel(draft, value);
    if (next !== value) {
      onChange(next);
      setDraft('');
    }
  };

  const handleDraftChange = (raw: string) => {
    if (!raw.includes(',')) {
      setDraft(raw);
      if (error) setError(null);
      return;
    }
    // Cho phép nhập/dán nhiều giá trị ngăn cách bằng dấu phẩy
    const parts = raw.split(',');
    let next = value;
    parts.slice(0, -1).forEach(part => {
      next = addLabel(part, next);
    });
    if (next !== value) {
      onChange(next);
      setError(null);
    }
    setDraft(parts[parts.length - 1]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitDraft();
      return;
    }
    if (e.key === 'Tab' && draft.trim()) {
      commitDraft();
      return;
    }
    if (e.key === 'Backspace' && !draft && value.length > 0) {
      e.preventDefault();
      removeAt(value.length - 1);
    }
  };

  const removeAt = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
    setError(null);
    inputRef.current?.focus();
  };

  return (
    <div>
      <div
        className={`flex flex-wrap items-center gap-1.5 px-2 py-1.5 bg-white border rounded-md transition-colors ${
          error ? 'border-rose-300' : 'border-slate-200 focus-within:border-slate-900'
        }`}
      >
        {value.map((item, index) => {
          const dotColor = getDotColor?.(item);
          return (
            <span
              key={`${item}-${index}`}
              className={`inline-flex items-center gap-1.5 py-0.5 pl-2 pr-1 text-xs font-medium ${
                chipRounded === 'md' ? 'rounded-md' : 'rounded-full'
              } ${chipClassName}`}
            >
              {dotColor && (
                <span
                  className="w-2.5 h-2.5 rounded-full shadow-[inset_0_0_0_1px_rgba(0,0,0,0.18)]"
                  style={{ backgroundColor: dotColor }}
                />
              )}
              <span>{item}</span>
              <button
                type="button"
                aria-label={`Xóa ${item}`}
                onClick={() => removeAt(index)}
                className="p-0.5 rounded-full opacity-70 hover:opacity-100 hover:bg-white/20 transition-opacity cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          );
        })}

        <input
          ref={inputRef}
          type="text"
          autoComplete="off"
          value={draft}
          placeholder={value.length === 0 ? placeholder : ''}
          onChange={e => handleDraftChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={commitDraft}
          className={`flex-1 min-w-[150px] px-1.5 py-0.5 text-xs bg-transparent focus:outline-none ${inputClassName}`}
        />
      </div>

      {error && <p className="text-[10px] text-rose-600 mt-1">{error}</p>}
    </div>
  );
};
