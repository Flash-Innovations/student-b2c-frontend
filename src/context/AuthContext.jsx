import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { b2cApi, getAuthToken, setAuthToken } from '../services/b2cApi';
import { practicePreloadService } from '../services/practicePreloadService';

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

  const setSession = async (authToken, authUser) => {
    if (authToken) {
      setAuthToken(authToken);
      setTokenState(authToken);
      if (authUser) setUser(authUser);
      await fetchProfile();
    }
  };

  // Compute whether student is technical or non-technical (e.g. BBA, MBA)
  const isTechnical = React.useMemo(() => {
    if (!user) return true;
    const degree = String(user.degree || user.course || user.branch || '').toUpperCase();
    const role = String(user.targetRole || user.targetRoles?.[0] || '').toUpperCase();

    // Check non-technical degrees (BBA, MBA, Commerce, Management, Arts)
    if (
      degree.includes('BBA') ||
      degree.includes('MBA') ||
      degree.includes('BUSINESS') ||
      degree.includes('MANAGEMENT') ||
      degree.includes('COMMERCE')
    ) {
      return false;
    }

    // Check target roles if degree is "Other" or non-specific
    if (degree.includes('OTHER')) {
      const businessKeywords = ['MANAGEMENT', 'BUSINESS', 'MARKETING', 'HR', 'FINANCIAL', 'SALES', 'CONSULTING'];
      if (businessKeywords.some((kw) => role.includes(kw))) {
        return false;
      }
    }

    return true;
  }, [user]);

  // Preload 10 questions per core subject upon login for instant 0ms launch
  useEffect(() => {
    if (user && token) {
      practicePreloadService.preloadAllCoreTopics(isTechnical);
    }
  }, [user, token, isTechnical]);

  const value = {
    user,
    subscription,
    token,
    loading,
    isAuthenticated: Boolean(user && token),
    planTier: subscription?.planTier || 'FREE',
    isPaid: subscription?.planTier === 'BASIC' || subscription?.planTier === 'PREMIUM',
    isPremium: subscription?.planTier === 'PREMIUM',
    isTechnical,
    login,
    register,
    logout,
    updateToken,
    setSession,
    refreshProfile: fetchProfile,
    refreshSubscription: fetchProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
