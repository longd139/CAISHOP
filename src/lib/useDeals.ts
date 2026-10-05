'use client';

import { useState, useEffect, useCallback } from 'react';
import { AVAILABLE_DEALS, CustomDeal } from '@/lib/useCart';

export function useDeals() {
  const [deals, setDeals] = useState<CustomDeal[]>(AVAILABLE_DEALS);
  const [loading, setLoading] = useState(true);

  const fetchDeals = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/deals');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setDeals(json.data);
        }
      }
    } catch (err) {
      console.error('Failed to load deals from server:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);

  return { deals, loading, refetch: fetchDeals };
}
