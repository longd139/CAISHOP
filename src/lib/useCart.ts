'use client';

import { useState, useEffect, useCallback, useSyncExternalStore } from 'react';

export interface CartItem {
  variant_id: string;
  product_name: string;
  product_image: string;
  sku: string;
  color: string;
  size: string;
  price: number;
  quantity: number;
  available_qty: number;
}

import { AVAILABLE_DEALS, CustomDeal } from './deals';
export type { CustomDeal };
export { AVAILABLE_DEALS };

const CART_STORAGE_KEY = 'caishop_cart';
const DEAL_STORAGE_KEY = 'caishop_applied_deal';

const EMPTY_CART: CartItem[] = [];

// Module-level cached store
let cartMemory: CartItem[] | null = null;
let dealMemory: string | null | undefined = undefined;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (e) {
      console.error('Error notifying cart listener:', e);
    }
  });
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

// Listen for storage events from other tabs
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === CART_STORAGE_KEY) {
      cartMemory = null;
      notify();
    } else if (e.key === DEAL_STORAGE_KEY) {
      dealMemory = undefined;
      notify();
    }
  });
}

export function getSavedCart(): CartItem[] {
  if (typeof window === 'undefined') return EMPTY_CART;
  if (cartMemory === null) {
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        cartMemory = Array.isArray(parsed) ? parsed : [];
      } else {
        cartMemory = [];
      }
    } catch (e) {
      console.error('Failed to parse cart from localStorage', e);
      cartMemory = [];
    }
  }
  return cartMemory;
}

export function saveCartToStorage(items: CartItem[]) {
  cartMemory = items;
  if (typeof window !== 'undefined') {
    try {
      if (!items || items.length === 0) {
        localStorage.removeItem(CART_STORAGE_KEY);
      } else {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
      }
    } catch (e) {
      console.error('Failed to save cart to localStorage', e);
    }
  }
  notify();
}

export function getSavedAppliedDeal(): string | null {
  if (typeof window === 'undefined') return null;
  if (dealMemory === undefined) {
    try {
      dealMemory = localStorage.getItem(DEAL_STORAGE_KEY);
    } catch (e) {
      console.error('Failed to parse deal from localStorage', e);
      dealMemory = null;
    }
  }
  return dealMemory ?? null;
}

export function saveAppliedDealToStorage(code: string | null) {
  dealMemory = code;
  if (typeof window !== 'undefined') {
    try {
      if (!code) {
        localStorage.removeItem(DEAL_STORAGE_KEY);
      } else {
        localStorage.setItem(DEAL_STORAGE_KEY, code);
      }
    } catch (e) {
      console.error('Failed to save applied deal to localStorage', e);
    }
  }
  notify();
}

export function useCart() {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const cart = useSyncExternalStore(
    subscribe,
    getSavedCart,
    () => EMPTY_CART
  );

  const appliedDealCode = useSyncExternalStore(
    subscribe,
    getSavedAppliedDeal,
    () => null
  );

  const setCart = useCallback((action: CartItem[] | ((prev: CartItem[]) => CartItem[])) => {
    const current = getSavedCart();
    const next = typeof action === 'function' ? action(current) : action;
    saveCartToStorage(next);
  }, []);

  const setAppliedDealCode = useCallback((code: string | null) => {
    saveAppliedDealToStorage(code);
  }, []);

  const clearCart = useCallback(() => {
    saveCartToStorage([]);
    saveAppliedDealToStorage(null);
  }, []);

  const appliedDeal = AVAILABLE_DEALS.find((d) => d.code === appliedDealCode);

  return {
    cart,
    setCart,
    clearCart,
    appliedDealCode,
    appliedDeal,
    setAppliedDealCode,
    isHydrated,
  };
}
