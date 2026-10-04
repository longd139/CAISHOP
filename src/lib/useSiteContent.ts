'use client';

import { useState, useEffect } from 'react';

export interface HeaderMenuItem {
  id: string;
  label: string;
  href: string;
  target?: string;
  order?: number;
  is_active?: boolean;
  active?: boolean;
}

const DEFAULT_HEADER_ITEMS: HeaderMenuItem[] = [
  { id: 'h-1', label: 'NEW', href: '/#hero', order: 1, is_active: true },
  { id: 'h-2', label: 'PRODUCT', href: '/products', order: 2, is_active: true },
  { id: 'h-3', label: 'STUDIO', href: '/#studio', order: 3, is_active: true },
  { id: 'h-4', label: 'ABOUT', href: '/#manifesto', order: 4, is_active: true },
];

export function useHeaderNav() {
  const [items, setItems] = useState<HeaderMenuItem[]>(DEFAULT_HEADER_ITEMS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const res = await fetch('/api/content');
        if (res.ok) {
          const data = await res.json();
          const siteData = data.data || data.content;
          const rawItems = siteData?.header?.menu_items || siteData?.header?.items;
          if (rawItems && Array.isArray(rawItems)) {
            const activeItems = rawItems
              .filter((it: HeaderMenuItem) => it.is_active !== false && it.active !== false)
              .sort((a: HeaderMenuItem, b: HeaderMenuItem) => (a.order || 0) - (b.order || 0));
            if (isMounted && activeItems.length > 0) {
              setItems(activeItems);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load dynamic header nav:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  return { items, loading };
}

export function useSiteContent() {
  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const res = await fetch('/api/content');
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data && isMounted) {
            setContent(data.data);
          }
        }
      } catch (err) {
        console.error('Failed to load site content:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  return { content, loading };
}
