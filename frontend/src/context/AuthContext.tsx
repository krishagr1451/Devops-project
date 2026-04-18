"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { getMe } from "@/lib/api";

interface User {
  user_id: number;
  name: string;
  role: "admin" | "user";
  logged_in: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  refresh: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  refresh: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = () => {
    setLoading(true);
    getMe()
      .then((res) => setUser(res.data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refresh();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
