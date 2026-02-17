import { useState, useEffect, useCallback } from 'react';
import { loginOrRegister, getWallet, User } from '../services/api';

const USER_KEY = 'hongbao_user';

export function useUser() {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem(USER_KEY);
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(false);

  // 登录/注册（需要密码）
  const login = useCallback(async (nickname: string, password: string) => {
    setLoading(true);
    try {
      const u = await loginOrRegister(nickname, password);
      setUser(u);
      localStorage.setItem(USER_KEY, JSON.stringify(u));
      return u;
    } finally {
      setLoading(false);
    }
  }, []);

  // 刷新余额
  const refreshBalance = useCallback(async () => {
    if (!user) return;
    try {
      const { balance } = await getWallet(user.id);
      const updated = { ...user, balance };
      setUser(updated);
      localStorage.setItem(USER_KEY, JSON.stringify(updated));
    } catch (e) {
      // ignore
    }
  }, [user]);

  // 登出
  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(USER_KEY);
  }, []);

  // 启动时刷新余额
  useEffect(() => {
    if (user) {
      refreshBalance();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { user, loading, login, logout, refreshBalance, setUser };
}
