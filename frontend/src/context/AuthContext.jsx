import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Purge any stale persistent localStorage tokens so reopening the application always lands on /login
    try {
      localStorage.removeItem('gymhq_token');
      localStorage.removeItem('gymhq_user');
      localStorage.removeItem('gymhq_gym_name');
    } catch {
      // Ignored
    }

    const token = sessionStorage.getItem('gymhq_token');
    const storedUser = sessionStorage.getItem('gymhq_user');
    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        sessionStorage.removeItem('gymhq_token');
        sessionStorage.removeItem('gymhq_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    const data = await api.login({ username, password });
    sessionStorage.setItem('gymhq_token', data.access_token);
    sessionStorage.setItem('gymhq_user', JSON.stringify(data.user));
    if (data.user?.gym_name) {
      sessionStorage.setItem('gymhq_gym_name', data.user.gym_name);
    }
    setUser(data.user);
    return data;
  };

  const register = async (regPayload, passwordArg, emailArg) => {
    const payload = typeof regPayload === 'object' && regPayload !== null
      ? regPayload
      : { username: regPayload, password: passwordArg, email: emailArg || null };

    const data = await api.register(payload);
    sessionStorage.setItem('gymhq_token', data.access_token);
    sessionStorage.setItem('gymhq_user', JSON.stringify(data.user));
    if (data.user?.gym_name) {
      sessionStorage.setItem('gymhq_gym_name', data.user.gym_name);
    }
    setUser(data.user);
    return data;
  };

  const loginWithGoogle = async (googleData) => {
    const data = await api.googleAuth(googleData);
    sessionStorage.setItem('gymhq_token', data.access_token);
    sessionStorage.setItem('gymhq_user', JSON.stringify(data.user));
    if (data.user?.gym_name) {
      sessionStorage.setItem('gymhq_gym_name', data.user.gym_name);
    }
    setUser(data.user);
    return data;
  };

  const updateGym = async (profileData) => {
    const updatedUser = await api.updateGymProfile(profileData);
    sessionStorage.setItem('gymhq_user', JSON.stringify(updatedUser));
    if (profileData.gym_name) {
      sessionStorage.setItem('gymhq_gym_name', profileData.gym_name);
    }
    setUser(updatedUser);
    return updatedUser;
  };

  const logout = () => {
    sessionStorage.clear();
    try {
      localStorage.removeItem('gymhq_token');
      localStorage.removeItem('gymhq_user');
      localStorage.removeItem('gymhq_gym_name');
    } catch {
      // Ignored
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, loginWithGoogle, updateGym, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
