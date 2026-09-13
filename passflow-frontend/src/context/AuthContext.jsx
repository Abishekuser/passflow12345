import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/authApi';

const AuthContext = createContext(null);

function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Failed to parse JWT token', e);
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('passflow_token'));
  const [user, setUser] = useState(() => {
    const savedToken = localStorage.getItem('passflow_token');
    const savedUserMeta = localStorage.getItem('passflow_user_meta');
    let meta = {};
    if (savedUserMeta) {
      try {
        meta = JSON.parse(savedUserMeta);
      } catch (e) {
        console.error('Failed to parse user meta', e);
      }
    }
    if (savedToken) {
      const decoded = parseJwt(savedToken);
      if (decoded && decoded.exp * 1000 > Date.now()) {
        return {
          id: decoded.user_id,
          role: decoded.role,
          exp: decoded.exp,
          ...meta,
        };
      }
    }
    return null;
  });

  const [loading, setLoading] = useState(true);

  // Validate token on mount
  useEffect(() => {
    if (token) {
      const decoded = parseJwt(token);
      if (!decoded || decoded.exp * 1000 <= Date.now()) {
        logout();
      } else {
        const savedUserMeta = localStorage.getItem('passflow_user_meta');
        let meta = {};
        if (savedUserMeta) {
          try {
            meta = JSON.parse(savedUserMeta);
          } catch (e) {
            console.error(e);
          }
        }
        setUser({
          id: decoded.user_id,
          role: decoded.role,
          exp: decoded.exp,
          ...meta,
        });
      }
    } else {
      setUser(null);
    }
    setLoading(false);
  }, [token]);

  const login = useCallback(async (username, password) => {
    const response = await authApi.login({ username, password });
    const accessToken = response.access_token;

    if (!accessToken) {
      throw new Error('Access token missing in response');
    }

    const decoded = parseJwt(accessToken);
    if (!decoded) {
      throw new Error('Invalid token received');
    }

    const userObj = {
      id: decoded.user_id,
      role: decoded.role,
      exp: decoded.exp,
      username: username,
    };

    localStorage.setItem('passflow_token', accessToken);
    localStorage.setItem('passflow_user_meta', JSON.stringify({ username }));

    setToken(accessToken);
    setUser(userObj);

    return userObj;
  }, []);

  const signup = useCallback(async (formData) => {
    const response = await authApi.signup(formData);
    return response;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('passflow_token');
    localStorage.removeItem('passflow_user_meta');
    setToken(null);
    setUser(null);
  }, []);

  const updateUserMeta = useCallback((meta) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...meta };
      localStorage.setItem('passflow_user_meta', JSON.stringify({ username: updated.username, ...meta }));
      return updated;
    });
  }, []);

  const value = {
    token,
    user,
    role: user?.role || null,
    isAuthenticated: !!token && !!user,
    loading,
    login,
    signup,
    logout,
    updateUserMeta,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
