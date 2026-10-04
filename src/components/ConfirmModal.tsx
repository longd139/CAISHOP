'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, Info, CheckCircle2, Trash2, X } from 'lucide-react';

export interface ConfirmModalProps {
  isOpen: boolean;
  title?: string;
  message: string | React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info' | 'success';
  isAlertOnly?: boolean; // If true, only shows 1 button (replaces alert())
  onConfirm: () => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy bỏ',
  type = 'danger',
  isAlertOnly = false,
  onConfirm,
  onCancel,
  isLoading = false,
}) => {
  // Handle ESC key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (onCancel) onCancel();
        else if (isAlertOnly) onConfirm();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel, onConfirm, isAlertOnly]);

  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return <Trash2 className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-slate-700" />;
    }
  };

  const getIconBg = () => {
    switch (type) {
      case 'danger':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-amber-50 border-amber-200';
      case 'success':
        return 'bg-emerald-50 border-emerald-200';
      case 'info':
      default:
        return 'bg-slate-100 border-slate-200';
    }
  };

  const getConfirmButtonStyles = () => {
    if (isAlertOnly) {
      return 'bg-slate-900 hover:bg-black text-white';
    }
    switch (type) {
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 text-white shadow-sm';
      case 'warning':
        return 'bg-amber-600 hover:bg-amber-700 text-white shadow-sm';
      case 'success':
        return 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm';
      case 'info':
      default:
        return 'bg-slate-900 hover:bg-black text-white';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          if (onCancel) onCancel();
          else if (isAlertOnly) onConfirm();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="bg-white border border-slate-200 rounded-lg shadow-xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-150"
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 pt-4 pb-1">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 ${getIconBg()}`}>
              {getIcon()}
            </div>
            <span className="text-xs font-mono font-bold tracking-wider uppercase text-slate-800">
              {title || (isAlertOnly ? 'THÔNG BÁO HỆ THỐNG' : 'XÁC NHẬN THAO TÁC')}
            </span>
          </div>

          <button
            type="button"
            onClick={onCancel || onConfirm}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-slate-100 transition-colors"
            aria-label="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="px-5 py-4 pl-16">
          <div className="text-sm text-slate-600 font-sans leading-relaxed">
            {message}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 px-5 py-3.5 bg-slate-50 border-t border-slate-100">
          {!isAlertOnly && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
            >
              {cancelText}
            </button>
          )}

          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5 ${getConfirmButtonStyles()}`}
          >
            {isLoading && (
              <span className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            <span>{isAlertOnly ? (confirmText === 'Xác nhận' ? 'Đã hiểu' : confirmText) : confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
