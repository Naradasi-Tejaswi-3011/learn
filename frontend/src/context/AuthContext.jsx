import React, { createContext, useContext, useReducer, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const AuthContext = createContext();

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Configure axios defaults
axios.defaults.baseURL = API_BASE_URL;
axios.defaults.timeout = 10000;
axios.defaults.headers.common['Content-Type'] = 'application/json';

// Simple auth reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_USER':
      return { ...state, user: action.payload, loading: false };
    case 'SET_TOKEN':
      return { ...state, token: action.payload };
    case 'LOGOUT':
      return { ...state, user: null, token: null, loading: false };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    default:
      return state;
  }
};

const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  loading: false,
  error: null
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Load user on app start
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('token');

      if (token) {
        try {
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          dispatch({ type: 'SET_TOKEN', payload: token });
          
          const response = await axios.get('/auth/me');
          dispatch({ type: 'SET_USER', payload: response.data.user });
        } catch (error) {
          localStorage.removeItem('token');
          delete axios.defaults.headers.common['Authorization'];
          dispatch({ type: 'LOGOUT' });
        }
      }
    };

    loadUser();
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];

      const response = await axios.post('/auth/login', { email, password });
      const { token, user } = response.data;

      if (!token || !user) {
        throw new Error('Invalid response from server');
      }

      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      dispatch({ type: 'SET_TOKEN', payload: token });
      dispatch({ type: 'SET_USER', payload: user });

      toast.success(`Welcome back, ${user.name}!`);
      return { success: true, user };
    } catch (error) {
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
      dispatch({ type: 'LOGOUT' });

      let message = 'Login failed. Please try again.';
      
      if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
        message = 'Cannot connect to server. Please ensure the backend is running.';
      } else if (error.response?.status === 401) {
        message = 'Invalid email or password.';
      } else if (error.response?.data?.message) {
        message = error.response.data.message;
      }

      dispatch({ type: 'SET_ERROR', payload: message });
      toast.error(message);
      return { success: false, message };
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      const response = await axios.post('/auth/register', userData);
      const { token, user } = response.data;

      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      dispatch({ type: 'SET_TOKEN', payload: token });
      dispatch({ type: 'SET_USER', payload: user });

      toast.success(`Welcome, ${user.name}!`);
      return { success: true, user };
    } catch (error) {
      let message = 'Registration failed. Please try again.';
      
      if (error.response?.data?.message) {
        message = error.response.data.message;
      }

      dispatch({ type: 'SET_ERROR', payload: message });
      toast.error(message);
      return { success: false, message };
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    dispatch({ type: 'LOGOUT' });
    toast.success('Logged out successfully');
  };

  // Update user function
  const updateUser = (userData) => {
    dispatch({ type: 'SET_USER', payload: userData });
  };

  const value = {
    user: state.user,
    token: state.token,
    loading: state.loading,
    error: state.error,
    login,
    register,
    logout,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    return {
      user: null,
      token: null,
      loading: false,
      error: null,
      login: async () => ({ success: false, message: 'Auth not initialized' }),
      register: async () => ({ success: false, message: 'Auth not initialized' }),
      logout: () => {},
      updateUser: () => {}
    };
  }
  return context;
};
