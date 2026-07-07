import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from '../api/axios';
import { consumePointsFloatOrigin, dispatchPointsFloat } from '../utils/pointsAnimation';
import { setDeviceId } from '../utils/deviceId';
import { logout as apiLogout } from '../services/authService';

const AuthContext = createContext();

function isValidToken(value) {
  return typeof value === 'string' && value.length > 0 && value !== 'undefined';
}

function readStoredAuth() {
  try {
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');
    if (savedUser && isValidToken(savedToken)) {
      return { user: JSON.parse(savedUser), token: savedToken };
    }
  } catch {
    localStorage.clear();
  }
  return { user: null, token: null };
}

export const AuthProvider = ({ children }) => {
  const stored = readStoredAuth();
  const [user, setUser] = useState(stored.user);
  const [token, setToken] = useState(stored.token);

  useEffect(() => {
    let mounted = true;
    if (!stored.user || !stored.token) return undefined;

    api.get('/auth/verify/status')
      .then(({ data }) => {
        if (!mounted) return;
        setUser((prev) => {
          if (!prev) return prev;
          const next = {
            ...prev,
            emailVerified: data.emailVerified,
            phoneVerified: data.phoneVerified,
            isVerified: data.isVerified,
            points: data.points ?? prev.points,
          };
          localStorage.setItem('user', JSON.stringify(next));
          return next;
        });
      })
      .catch(() => {
        /* keep cached user */
      });

    return () => {
      mounted = false;
    };
  }, []);

  const login = useCallback((userData, tokenData, session = {}) => {
    if (!userData || !isValidToken(tokenData)) return;

    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', tokenData);
    if (session.refreshToken) {
      localStorage.setItem('refreshToken', session.refreshToken);
    }
    if (session.deviceId) {
      setDeviceId(session.deviceId);
    }

    setUser(userData);
    setToken(tokenData);
  }, []);

  const updateUser = useCallback((patch, options = {}) => {
    setUser((prev) => {
      if (!prev) return prev;
      const changed = Object.keys(patch).some((key) => prev[key] !== patch[key]);
      if (!changed) return prev;
      const next = { ...prev, ...patch };
      localStorage.setItem('user', JSON.stringify(next));

      const shouldAnimate = options.animatePoints !== false && !options.silent;
      if (
        shouldAnimate
        && patch.points != null
        && prev.points != null
        && patch.points !== prev.points
      ) {
        const delta = patch.points - prev.points;
        const origin = options.origin ?? consumePointsFloatOrigin();
        queueMicrotask(() => dispatchPointsFloat({ delta, origin }));
      }

      return next;
    });
  }, []);

  const logout = useCallback(async () => {
    await apiLogout();
    setUser(null);
    setToken(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      login,
      logout,
      updateUser,
      isAuth: isValidToken(token) || isValidToken(localStorage.getItem('token')),
      role: user?.role,
    }),
    [user, token, login, logout, updateUser]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
