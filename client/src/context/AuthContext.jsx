import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('afterframe_token') || null);
  const [isLoading, setIsLoading] = useState(true);
  const [authModalState, setAuthModalState] = useState({ isOpen: false, mode: 'login' }); // 'login' | 'signup'

  const openAuthModal = (mode = 'login') => {
    setAuthModalState({ isOpen: true, mode });
  };

  const closeAuthModal = () => {
    setAuthModalState({ isOpen: false, mode: 'login' });
  };

  const authFetch = useCallback(async (url, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return fetch(url, { ...options, headers });
  }, [token]);

  // Restore session
  useEffect(() => {
    const restoreSession = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          // Token expired or invalid
          setToken(null);
          localStorage.removeItem('afterframe_token');
        }
      } catch (err) {
        console.warn('Session verification network error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, [token]);

  const login = async (email, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || data.message || 'Login failed');
    }

    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('afterframe_token', data.token);
    closeAuthModal();

    // Trigger sync for guest watchlist if any exists
    syncGuestItems(data.token);
    return data.user;
  };

  const register = async (name, email, password, preferences = {}) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, preferences })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || data.message || 'Signup failed');
    }

    // Do NOT automatically log in or issue authenticated session
    // Explicit sign in required
    return data;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('afterframe_token');
  };

  const syncGuestItems = async (activeToken) => {
    try {
      const raw = localStorage.getItem('afterframe_guest_watchlist');
      if (!raw) return;
      const guestItems = JSON.parse(raw);
      if (Array.isArray(guestItems) && guestItems.length > 0) {
        await fetch('/api/watchlist/sync-guest', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${activeToken}`
          },
          body: JSON.stringify({ items: guestItems })
        });
        localStorage.removeItem('afterframe_guest_watchlist');
      }
    } catch (err) {
      console.warn('Failed to sync guest items upon login:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(user && token),
        isGuest: !Boolean(user && token),
        isLoading,
        login,
        register,
        logout,
        authFetch,
        authModalState,
        openAuthModal,
        closeAuthModal
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
