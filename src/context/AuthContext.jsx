import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { b2cApi, getAuthToken, setAuthToken } from '../services/b2cApi';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [token, setTokenState] = useState(getAuthToken());
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    try {
      const data = await b2cApi.getProfile();
      if (data && data.success) {
        setUser(data.user);
        setSubscription(data.subscription);
      }
    } catch (err) {
      if (err.status === 401) {
        setAuthToken(null);
        setTokenState(null);
        setUser(null);
        setSubscription(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [token, fetchProfile]);

  const login = async (email, password) => {
    const data = await b2cApi.login({ email, password });
    if (data.token) {
      setAuthToken(data.token);
      setTokenState(data.token);
      setUser(data.user);
      await fetchProfile();
    }
    return data;
  };

  const register = async (userData) => {
    const data = await b2cApi.register(userData);
    if (data.token) {
      setAuthToken(data.token);
      setTokenState(data.token);
      setUser(data.user);
      await fetchProfile();
    }
    return data;
  };

  const logout = () => {
    setAuthToken(null);
    setTokenState(null);
    setUser(null);
    setSubscription(null);
  };

  const updateToken = (newToken) => {
    if (newToken) {
      setAuthToken(newToken);
      setTokenState(newToken);
      fetchProfile();
    }
  };

  const value = {
    user,
    subscription,
    token,
    loading,
    isAuthenticated: Boolean(user && token),
    planTier: subscription?.planTier || 'FREE',
    isPaid: subscription?.planTier === 'BASIC' || subscription?.planTier === 'PREMIUM',
    isPremium: subscription?.planTier === 'PREMIUM',
    login,
    register,
    logout,
    updateToken,
    refreshProfile: fetchProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
