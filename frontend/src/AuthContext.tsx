import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiFetch, getAccessToken, setAccessToken } from './api';
import { AuthResponse, OrganizationDto, SportDto, UserSummaryDto } from './types';

export interface SavedAccountSession {
  user: UserSummaryDto;
  accessToken: string;
  refreshToken?: string;
  myOrganizations: OrganizationDto[];
}

interface AuthContextValue {
  user: UserSummaryDto | null;
  myOrganizations: OrganizationDto[];
  sports: SportDto[];
  unreadNotificationsCount: number;
  loading: boolean;
  savedSessions: SavedAccountSession[];
  setSessionFromAuthResponse: (auth: AuthResponse) => void;
  updateCurrentUserSummary: (updated: UserSummaryDto) => void;
  switchAccount: (targetUserId: string) => Promise<void>;
  removeSavedAccount: (targetUserId: string) => void;
  refreshMe: () => Promise<void>;
  refreshSports: () => Promise<void>;
  refreshUnreadCount: () => Promise<void>;
  logout: () => Promise<void>;
}

const SAVED_SESSIONS_KEY = 'sp_saved_sessions_v1';

function loadSavedSessions(): SavedAccountSession[] {
  try {
    const raw = localStorage.getItem(SAVED_SESSIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistSavedSessions(list: SavedAccountSession[]) {
  try {
    localStorage.setItem(SAVED_SESSIONS_KEY, JSON.stringify(list));
  } catch {
    // ignore storage quota errors
  }
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSummaryDto | null>(null);
  const [myOrganizations, setMyOrganizations] = useState<OrganizationDto[]>([]);
  const [sports, setSports] = useState<SportDto[]>([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [savedSessions, setSavedSessions] = useState<SavedAccountSession[]>(() => loadSavedSessions());

  const upsertSavedSession = (entry: SavedAccountSession) => {
    setSavedSessions((prev) => {
      const filtered = prev.filter((s) => s.user.id !== entry.user.id);
      const next = [entry, ...filtered];
      persistSavedSessions(next);
      return next;
    });
  };

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
      const token = auth.accessToken || getAccessToken() || '';
      if (auth.accessToken) {
        setAccessToken(auth.accessToken);
      }
      setUser(auth.user);
      setMyOrganizations(auth.myOrganizations || []);
      if (token && auth.user) {
        upsertSavedSession({
          user: auth.user,
          accessToken: token,
          refreshToken: auth.refreshToken,
          myOrganizations: auth.myOrganizations || [],
        });
      }
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
    upsertSavedSession({
      user: auth.user,
      accessToken: auth.accessToken,
      refreshToken: auth.refreshToken,
      myOrganizations: auth.myOrganizations || [],
    });
    refreshUnreadCount();
  };

  const updateCurrentUserSummary = (updated: UserSummaryDto) => {
    // Add cache-busting query param if avatarUrl is present so all UI components immediately re-render the new photo
    const withFreshAvatar: UserSummaryDto = updated.avatarUrl
      ? {
          ...updated,
          avatarUrl: updated.avatarUrl.includes('?')
            ? `${updated.avatarUrl.split('?')[0]}?t=${Date.now()}`
            : `${updated.avatarUrl}?t=${Date.now()}`,
        }
      : updated;
    setUser(withFreshAvatar);
    const currentToken = getAccessToken();
    if (currentToken) {
      upsertSavedSession({
        user: withFreshAvatar,
        accessToken: currentToken,
        myOrganizations,
      });
    }
  };

  const switchAccount = async (targetUserId: string) => {
    const target = savedSessions.find((s) => s.user.id === targetUserId);
    if (!target) return;
    setAccessToken(target.accessToken);
    setUser(target.user);
    setMyOrganizations(target.myOrganizations || []);
    try {
      const verified = await apiFetch<AuthResponse>('/api/v1/auth/me', {}, false);
      const freshToken = verified.accessToken || target.accessToken;
      setAccessToken(freshToken);
      setUser(verified.user);
      setMyOrganizations(verified.myOrganizations || []);
      upsertSavedSession({
        user: verified.user,
        accessToken: freshToken,
        refreshToken: verified.refreshToken || target.refreshToken,
        myOrganizations: verified.myOrganizations || [],
      });
      await refreshUnreadCount();
    } catch {
      // Try refresh token if stored
      if (target.refreshToken) {
        try {
          const refreshed = await apiFetch<AuthResponse>(
            '/api/v1/auth/refresh',
            {
              method: 'POST',
              body: JSON.stringify({ refreshToken: target.refreshToken }),
            },
            false
          );
          setSessionFromAuthResponse(refreshed);
          return;
        } catch {
          // Session expired on backend — remove it
        }
      }
      removeSavedAccount(targetUserId);
    }
  };

  const removeSavedAccount = (targetUserId: string) => {
    setSavedSessions((prev) => {
      const next = prev.filter((s) => s.user.id !== targetUserId);
      persistSavedSessions(next);
      return next;
    });
  };

  const logout = async () => {
    const currentId = user?.id;
    try {
      await apiFetch('/api/v1/auth/logout', { method: 'POST', body: JSON.stringify({}) });
    } catch {
      // ignore
    }
    if (currentId) {
      const remaining = savedSessions.filter((s) => s.user.id !== currentId);
      setSavedSessions(remaining);
      persistSavedSessions(remaining);
      if (remaining.length > 0) {
        const nextAcc = remaining[0];
        setAccessToken(nextAcc.accessToken);
        setUser(nextAcc.user);
        setMyOrganizations(nextAcc.myOrganizations || []);
        await refreshUnreadCount();
        return;
      }
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
        savedSessions,
        setSessionFromAuthResponse,
        updateCurrentUserSummary,
        switchAccount,
        removeSavedAccount,
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
