'use client';

import { useState, useEffect } from 'react';

import { defaultSiteContent } from './defaultSiteContent';

export interface HeaderMenuItem {
  id: string;
  label: string;
  href: string;
  target?: string;
  order?: number;
  is_active?: boolean;
  active?: boolean;
}

const DEFAULT_HEADER_ITEMS: HeaderMenuItem[] = defaultSiteContent.header.menu_items;

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
  const [content, setContent] = useState<any>(defaultSiteContent);
  const [loading, setLoading] = useState(false);

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
