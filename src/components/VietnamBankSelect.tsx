'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ChevronDown, Check, X, Search, Building2 } from 'lucide-react';
import { ALL_VIETNAMESE_BANKS, VietnamBankItem } from '@/lib/vietnamBanks';

export interface VietnamBankSelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
}

function normalizeStr(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .trim();
}

export function VietnamBankSelect({
  value,
  onChange,
  placeholder = 'Chọn hoặc nhập tên ngân hàng',
  className = '',
  disabled = false,
  required = false,
  id,
}: VietnamBankSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(value || '');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Đồng bộ giá trị query khi prop value từ ngoài thay đổi
  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        // Nếu user đang gõ dở nhưng chưa click item nào, vẫn lưu giá trị query đã gõ
        if (query.trim() && query !== value) {
          onChange(query.trim());
        } else if (!query.trim() && value) {
          setQuery(value);
        }
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, query, value, onChange]);

  // Bộ lọc tìm kiếm thông minh (khớp shortName, fullName, code, id, keywords cả không dấu)
  const filteredBanks = useMemo(() => {
    if (!query || !query.trim()) {
      return ALL_VIETNAMESE_BANKS;
    }
    const nq = normalizeStr(query);

    return ALL_VIETNAMESE_BANKS.filter((b) => {
      const nShort = normalizeStr(b.shortName);
      const nFull = normalizeStr(b.fullName);
      const nId = normalizeStr(b.id);
      const nKey = normalizeStr(b.keywords || '');

      return (
        nShort.includes(nq) ||
        nFull.includes(nq) ||
        nId.includes(nq) ||
        nKey.includes(nq)
      );
    });
  }, [query]);

  const handleSelectBank = (bank: VietnamBankItem) => {
    onChange(bank.shortName);
    setQuery(bank.shortName);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setQuery('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          type="text"
          required={required}
          disabled={disabled}
          value={query}
          placeholder={placeholder}
          autoComplete="off"
          onChange={(e) => {
            const nextVal = e.target.value;
            setQuery(nextVal);
            onChange(nextVal);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => {
            if (!disabled) {
              setIsOpen(true);
            }
          }}
          onClick={() => {
            if (!disabled && !isOpen) {
              setIsOpen(true);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setIsOpen(false);
            } else if (e.key === 'Enter') {
              if (isOpen && filteredBanks.length > 0) {
                e.preventDefault();
                handleSelectBank(filteredBanks[0]);
              }
            }
          }}
          className={`w-full h-10 pl-3 pr-14 text-xs rounded-lg border transition-all bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none ${
            isOpen
              ? 'border-slate-900 ring-1 ring-slate-900 shadow-xs'
              : 'border-slate-200 hover:border-slate-400'
          }`}
        />

        {/* Nút Clear & ChevronDown */}
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {query && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Xóa lựa chọn"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            tabIndex={-1}
            disabled={disabled}
            onClick={() => {
              if (!disabled) {
                setIsOpen((prev) => !prev);
                if (!isOpen && inputRef.current) {
                  inputRef.current.focus();
                }
              }
            }}
            className="p-1 rounded text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            title="Mở danh sách ngân hàng"
          >
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                isOpen ? 'rotate-180 text-slate-900' : ''
              }`}
            />
          </button>
        </div>
      </div>

      {/* DROPDOWN MENU TỰ CUSTOM - GIAO DIỆN TRẮNG HIỆN ĐẠI, KHÔNG BỊ POPUP ĐEN CỦA TRÌNH DUYỆT */}
      {isOpen && !disabled && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white border border-slate-200 rounded-xl shadow-2xl max-h-64 overflow-y-auto divide-y divide-slate-100 text-xs animate-in fade-in-50 zoom-in-95 duration-150">
          {filteredBanks.length > 0 ? (
            filteredBanks.map((bank) => {
              const isSelected = value === bank.shortName;
              return (
                <div
                  key={bank.id}
                  onClick={() => handleSelectBank(bank)}
                  className={`px-3.5 py-2.5 cursor-pointer transition-colors flex items-center justify-between gap-2.5 ${
                    isSelected
                      ? 'bg-slate-900 text-white'
                      : 'hover:bg-slate-50 text-slate-800'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                        {bank.shortName}
                      </span>
                    </div>
                    <p className={`text-[11px] truncate mt-0.5 leading-snug ${
                      isSelected ? 'text-white/80' : 'text-slate-500'
                    }`}>
                      {bank.fullName}
                    </p>
                  </div>

                  {isSelected && (
                    <Check className="w-4 h-4 text-white shrink-0" />
                  )}
                </div>
              );
            })
          ) : (
            <div className="p-3 text-center space-y-2">
              <p className="text-xs text-slate-500">
                Không tìm thấy ngân hàng khớp với &quot;<strong>{query}</strong>&quot;
              </p>
              <button
                type="button"
                onClick={() => {
                  onChange(query.trim());
                  setIsOpen(false);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-black transition-all cursor-pointer"
              >
                <span>Sử dụng tên này: &quot;{query.trim()}&quot;</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

