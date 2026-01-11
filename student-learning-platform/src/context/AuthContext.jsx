import { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true); // Start with true while checking session

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      const token = localStorage.getItem('auth_token');

      if (token) {
        try {
          // Verify token is still valid by fetching current user
          const response = await api.auth.getCurrentUser();
          // Backend returns: {success, data: {user}}
          const userData = response.data?.user || response.user;
          setUser(userData);
          setIsAuthenticated(true);
        } catch (error) {
          // Token is invalid, clear it
          console.error('Session verification failed:', error.message);
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user');
          setUser(null);
          setIsAuthenticated(false);
        }
      }

      setLoading(false);
    };

    checkSession();
  }, []);

  const login = async (email, password) => {
    setLoading(true);

    try {
      // Call real API
      const response = await api.auth.login(email, password);

      // Extract data from response (backend returns: {success, message, data: {user, token}})
      const { token, user: userData } = response.data || response;

      // Store token and user data
      localStorage.setItem('auth_token', token);
      localStorage.setItem('user', JSON.stringify(userData));

      setUser(userData);
      setIsAuthenticated(true);
      setLoading(false);

      return response;
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signup = async (name, email, password) => {
    setLoading(true);

    try {
      // Call real API
      const response = await api.auth.signup(name, email, password);

      // Extract data from response (backend returns: {success, message, data: {user, token}})
      const { token, user: userData } = response.data || response;

      // Store token and user data
      localStorage.setItem('auth_token', token);
      localStorage.setItem('user', JSON.stringify(userData));

      setUser(userData);
      setIsAuthenticated(true);
      setLoading(false);

      return response;
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Call logout endpoint (optional, mainly for consistency)
      await api.auth.logout();
    } catch (error) {
      console.error('Logout error:', error.message);
    } finally {
      // Always clear local state
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    signup,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
