'use client';

import React, { useEffect, useRef, useState } from 'react';

export interface VndInputProps {
  value: number;
  onChange: (value: number) => void;
  className?: string;
  inputClassName?: string;
  placeholder?: string;
}

const formatVnd = (value: number) => value.toLocaleString('vi-VN');

/**
 * Ô nhập tiền tệ theo chuẩn Việt Nam: chỉ nhận chữ số và tự định dạng phân cách nghìn (VD: 130.000đ).
 */
export const VndInput: React.FC<VndInputProps> = ({
  value,
  onChange,
  className = '',
  inputClassName = '',
  placeholder = '0',
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const lastValueRef = useRef(value);
  const [text, setText] = useState(() => (value ? formatVnd(value) : ''));

  // Đồng bộ khi giá trị bị thay đổi từ bên ngoài (VD: cập nhật giá đồng loạt)
  useEffect(() => {
    if (value !== lastValueRef.current) {
      lastValueRef.current = value;
      setText(value ? formatVnd(value) : '');
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const el = e.target;
    const caretDigits = el.value.slice(0, el.selectionStart ?? el.value.length).replace(/\D/g, '').length;
    const digits = el.value.replace(/\D/g, '').replace(/^0+(?=\d)/, '').slice(0, 15);
    const next = digits ? Number(digits) : 0;
    const formatted = digits ? formatVnd(Number(digits)) : '';

    lastValueRef.current = next;
    setText(formatted);
    onChange(next);

    let caret = 0;
    let counted = 0;
    while (caret < formatted.length && counted < caretDigits) {
      if (/\d/.test(formatted[caret])) counted += 1;
      caret += 1;
    }

    if (inputRef.current) {
      inputRef.current.value = formatted;
      inputRef.current.setSelectionRange(caret, caret);
    }
  };

  return (
    <div
      className={`flex items-center gap-1 border border-slate-200 rounded bg-white transition-colors focus-within:border-slate-400 ${className}`}
    >
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={text}
        placeholder={placeholder}
        onChange={handleChange}
        onFocus={e => e.target.select()}
        className={`w-full min-w-0 flex-1 bg-transparent text-xs focus:outline-none ${inputClassName}`}
      />
      <span className="shrink-0 text-[10px] font-semibold text-slate-400">đ</span>
    </div>
  );
};
