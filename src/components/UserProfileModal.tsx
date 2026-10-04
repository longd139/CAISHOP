'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AuthUser } from '@/lib/useAuth';
import { User, Mail, Shield, ShoppingBag, LogOut, ExternalLink, X, Award, CheckCircle2 } from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: AuthUser | null;
  logout: () => Promise<void>;
  onOpenCart?: () => void;
  cartCount?: number;
}

export function UserProfileModal({
  isOpen,
  onClose,
  user,
  logout,
  onOpenCart,
  cartCount = 0,
}: UserProfileModalProps) {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !user) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 transition-opacity"
    >
      <div
        className="w-full max-w-md bg-white rounded-lg border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50">
          <div>
            <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 block">
              Tài khoản cá nhân
            </span>
            <h2 id="profile-modal-title" className="text-base font-semibold text-slate-900">
              Hồ sơ thành viên
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5">
          {/* Identity card */}
          <div className="flex items-center gap-3.5 p-3.5 rounded-md bg-slate-50 border border-slate-200">
            <div className="w-11 h-11 rounded-full bg-slate-900 text-white font-semibold flex items-center justify-center text-sm shrink-0">
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-slate-900 truncate">
                  {user.name}
                </h3>
                <span
                  className={`inline-flex items-center px-1.5 py-0.5 rounded-sm text-[10px] font-medium border ${
                    user.role === 'ADMIN'
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}
                >
                  {user.role === 'ADMIN' ? 'Quản trị' : 'Thành viên'}
                </span>
              </div>
              <p className="text-xs text-slate-500 truncate mt-0.5">
                {user.phone ? `SĐT: ${user.phone}` : ''}
                {user.phone && user.email ? ' • ' : ''}
                {user.email || ''}
              </p>
            </div>
          </div>

          {/* Membership tier preview */}
          <div className="p-3.5 rounded-md border border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-700 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-500" />
                <span>Cấp bậc hội viên:</span>
              </span>
              <span className="font-semibold text-slate-900">
                {cartCount >= 4 ? 'Hội viên Vàng (-10%)' : cartCount >= 2 ? 'Hội viên Bạc (-5%)' : 'Hội viên Đồng'}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 leading-relaxed">
              Chiết khấu độc quyền được tự động tính vào giỏ hàng khi bạn thêm từ 2 sản phẩm trở lên.
            </div>
          </div>

          {/* Quick actions */}
          <div className="space-y-2">
            {/* Open Cart */}
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onOpenCart) onOpenCart();
              }}
              className="w-full h-10 px-4 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-medium flex items-center justify-between transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-slate-600" />
                <span>Xem giỏ hàng hiện tại</span>
              </span>
              <span className="font-mono text-[11px] font-semibold text-slate-900">
                {cartCount} món
              </span>
            </button>

            {/* Admin Dashboard shortcut if admin */}
            {user.role === 'ADMIN' && (
              <Link
                href="/admin"
                onClick={onClose}
                className="w-full h-10 px-4 rounded-md border border-blue-200 bg-blue-50/60 hover:bg-blue-100/60 text-blue-900 text-xs font-medium flex items-center justify-between transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-600" />
                  <span>Vào Bảng điều hành Admin</span>
                </span>
                <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
              </Link>
            )}

            {/* Catalog browse */}
            <Link
              href="/products"
              onClick={onClose}
              className="w-full h-10 px-4 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-medium flex items-center justify-between transition-colors"
            >
              <span className="flex items-center gap-2">
                <span>Khám phá bộ sưu tập sản phẩm</span>
              </span>
              <span className="text-slate-400">→</span>
            </Link>
          </div>
        </div>

        {/* Footer / Logout */}
        <div className="px-5 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-mono">
            Phiên ID: #{user.id.slice(-6).toUpperCase()}
          </span>
          <button
            type="button"
            onClick={async () => {
              await logout();
              onClose();
            }}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </div>
    </div>
  );
}
