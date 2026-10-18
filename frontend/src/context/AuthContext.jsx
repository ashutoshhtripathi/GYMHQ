import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('gymhq_token');
    const storedUser = localStorage.getItem('gymhq_user');
    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('gymhq_token');
        localStorage.removeItem('gymhq_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    const data = await api.login({ username, password });
    localStorage.setItem('gymhq_token', data.access_token);
    localStorage.setItem('gymhq_user', JSON.stringify(data.user));
    if (data.user?.gym_name) {
      localStorage.setItem('gymhq_gym_name', data.user.gym_name);
    }
    setUser(data.user);
    return data;
  };

  const register = async (regPayload, passwordArg, emailArg) => {
    const payload = typeof regPayload === 'object' && regPayload !== null
      ? regPayload
      : { username: regPayload, password: passwordArg, email: emailArg || null };

    const data = await api.register(payload);
    localStorage.setItem('gymhq_token', data.access_token);
    localStorage.setItem('gymhq_user', JSON.stringify(data.user));
    if (data.user?.gym_name) {
      localStorage.setItem('gymhq_gym_name', data.user.gym_name);
    }
    setUser(data.user);
    return data;
  };

  const loginWithGoogle = async (googleData) => {
    const data = await api.googleAuth(googleData);
    localStorage.setItem('gymhq_token', data.access_token);
    localStorage.setItem('gymhq_user', JSON.stringify(data.user));
    if (data.user?.gym_name) {
      localStorage.setItem('gymhq_gym_name', data.user.gym_name);
    }
    setUser(data.user);
    return data;
  };

  const updateGym = async (profileData) => {
    const updatedUser = await api.updateGymProfile(profileData);
    localStorage.setItem('gymhq_user', JSON.stringify(updatedUser));
    if (profileData.gym_name) {
      localStorage.setItem('gymhq_gym_name', profileData.gym_name);
    }
    setUser(updatedUser);
    return updatedUser;
  };

  const logout = () => {
    localStorage.removeItem('gymhq_token');
    localStorage.removeItem('gymhq_user');
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
