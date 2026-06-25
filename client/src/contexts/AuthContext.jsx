import { createContext, useReducer, useEffect, useCallback } from 'react';
import api from '../api/axios';

export const AuthContext = createContext(null);

const initialState = {
  user: JSON.parse(localStorage.getItem('bookit_user') || 'null'),
  token: localStorage.getItem('bookit_token') || null,
  loading: true,
};

function authReducer(state, action) {
  switch (action.type) {
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        loading: false,
      };
    case 'AUTH_LOADED':
      return {
        ...state,
        user: action.payload,
        loading: false,
      };
    case 'AUTH_LOGOUT':
      return {
        user: null,
        token: null,
        loading: false,
      };
    case 'AUTH_ERROR':
      return {
        user: null,
        token: null,
        loading: false,
      };
    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Verify token on mount
  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem('bookit_token');
      if (!token) {
        dispatch({ type: 'AUTH_ERROR' });
        return;
      }

      try {
        const res = await api.get('/auth/me');
        dispatch({ type: 'AUTH_LOADED', payload: res.data.user });
      } catch {
        localStorage.removeItem('bookit_token');
        localStorage.removeItem('bookit_user');
        dispatch({ type: 'AUTH_ERROR' });
      }
    };

    verifyToken();
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { user, token } = res.data;

    localStorage.setItem('bookit_token', token);
    localStorage.setItem('bookit_user', JSON.stringify(user));
    dispatch({ type: 'AUTH_SUCCESS', payload: { user, token } });

    return user;
  }, []);

  const signup = useCallback(async (name, email, password, role) => {
    const res = await api.post('/auth/signup', { name, email, password, role });
    const { user, token } = res.data;

    localStorage.setItem('bookit_token', token);
    localStorage.setItem('bookit_user', JSON.stringify(user));
    dispatch({ type: 'AUTH_SUCCESS', payload: { user, token } });

    return user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('bookit_token');
    localStorage.removeItem('bookit_user');
    dispatch({ type: 'AUTH_LOGOUT' });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user: state.user,
        token: state.token,
        loading: state.loading,
        isAuthenticated: !!state.user,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
