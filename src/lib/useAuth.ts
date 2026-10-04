'use client';

import { useState, useEffect, useCallback } from 'react';

export interface AuthUser {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  role: 'ADMIN' | 'USER';
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();

    const handleAuthChange = () => {
      refreshUser();
    };

    window.addEventListener('auth-change', handleAuthChange);
    window.addEventListener('focus', handleAuthChange);
    return () => {
      window.removeEventListener('auth-change', handleAuthChange);
      window.removeEventListener('focus', handleAuthChange);
    };
  }, [refreshUser]);

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return {
    user,
    loading,
    refreshUser,
    logout,
    isLoggedIn: !!user,
    isAdmin: user?.role === 'ADMIN',
  };
}
