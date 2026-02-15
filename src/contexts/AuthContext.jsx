import React, { createContext, useContext, useState } from "react";

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const login = (email, _password, role) => {
    setUser({
      id: Math.random().toString(36).substr(2, 9),
      name: email.split("@")[0],
      email,
      role,
    });
  };

  const signup = (name, email, _password, role) => {
    setUser({ id: Math.random().toString(36).substr(2, 9), name, email, role });
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
