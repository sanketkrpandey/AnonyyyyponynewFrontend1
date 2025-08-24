import React, { createContext, useContext, useEffect, useState } from 'react';
import * as authApi from '../services/auth';
import { getToken, setToken, clearToken } from '../utils/storage';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = getToken();
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await authApi.getMe();
        setUser(response.user);
      } catch (error) {
        console.error('Auth initialization failed:', error);
        clearToken();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const loginWithOtp = async (email, otp) => {
    const response = await authApi.verifyLoginOtp({ email, otp });
    setToken(response.token);
    setUser(response.user);
    return response.user;
  };

  const registerWithOtp = async (email, otp) => {
    const response = await authApi.verifyRegistrationOtp({ email, otp });
    setToken(response.token);
    setUser(response.user);
    return response.user;
  };

  const logout = () => {
    clearToken();
    setUser(null);
  };

  const value = {
    user,
    setUser,
    loading,
    loginWithOtp,
    registerWithOtp,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
