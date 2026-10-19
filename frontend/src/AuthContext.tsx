import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiFetch, getAccessToken, setAccessToken } from './api';
import { AuthResponse, OrganizationDto, SportDto, UserSummaryDto } from './types';

interface AuthContextValue {
  user: UserSummaryDto | null;
  myOrganizations: OrganizationDto[];
  sports: SportDto[];
  unreadNotificationsCount: number;
  loading: boolean;
  setSessionFromAuthResponse: (auth: AuthResponse) => void;
  refreshMe: () => Promise<void>;
  refreshSports: () => Promise<void>;
  refreshUnreadCount: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSummaryDto | null>(null);
  const [myOrganizations, setMyOrganizations] = useState<OrganizationDto[]>([]);
  const [sports, setSports] = useState<SportDto[]>([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshSports = async () => {
    try {
      const list = await apiFetch<SportDto[]>('/api/v1/sports');
      setSports(list);
    } catch {
      // ignore
    }
  };

  const refreshUnreadCount = async () => {
    if (!getAccessToken()) {
      setUnreadNotificationsCount(0);
      return;
    }
    try {
      const res = await apiFetch<{ unreadCount: number }>('/api/v1/notifications/unread-count');
      setUnreadNotificationsCount(res.unreadCount);
    } catch {
      // ignore
    }
  };

  const refreshMe = async () => {
    try {
      const auth = await apiFetch<AuthResponse>('/api/v1/auth/me');
      if (auth.accessToken) {
        setAccessToken(auth.accessToken);
      }
      setUser(auth.user);
      setMyOrganizations(auth.myOrganizations || []);
      await refreshUnreadCount();
    } catch {
      setAccessToken(null);
      setUser(null);
      setMyOrganizations([]);
    }
  };

  useEffect(() => {
    (async () => {
      await refreshSports();
      await refreshMe();
      setLoading(false);
    })();
  }, []);

  const setSessionFromAuthResponse = (auth: AuthResponse) => {
    setAccessToken(auth.accessToken);
    setUser(auth.user);
    setMyOrganizations(auth.myOrganizations || []);
    refreshUnreadCount();
  };

  const logout = async () => {
    try {
      await apiFetch('/api/v1/auth/logout', { method: 'POST', body: JSON.stringify({}) });
    } catch {
      // ignore
    }
    setAccessToken(null);
    setUser(null);
    setMyOrganizations([]);
    setUnreadNotificationsCount(0);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        myOrganizations,
        sports,
        unreadNotificationsCount,
        loading,
        setSessionFromAuthResponse,
        refreshMe,
        refreshSports,
        refreshUnreadCount,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
