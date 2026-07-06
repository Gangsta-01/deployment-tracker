import React, { createContext, useContext, useState, useCallback } from 'react';
import axios from 'axios';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = sessionStorage.getItem('dp_user');
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/api/auth/login', { email, password });
      const userData = { ...data.user, token: data.token };
      sessionStorage.setItem('dp_user', JSON.stringify(userData));
      axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
      setUser(userData);
      return true;
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password.');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem('dp_user');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  }, []);

  // Restore token on reload
  React.useEffect(() => {
    if (user?.token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${user.token}`;
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout, setError }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
