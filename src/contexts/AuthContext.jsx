import React, { createContext, useContext, useState } from "react";

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const normalizeUser = (userData) => {
    if (!userData) return null;
    return {
      id: userData._id || userData.id,
      _id: userData._id || userData.id,
      name: userData.name,
      email: userData.email,
      role: userData.role
    };
  };

  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? normalizeUser(JSON.parse(storedUser)) : null;
  });

  const signup = async (name, email, password, role) => {
    try {
      const res = await fetch("https://backend-by-meetly.onrender.com/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ name, email, password, role })
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message);

      const normalized = normalizeUser(data.user);
      setUser(normalized);
      localStorage.setItem("user", JSON.stringify(normalized));

      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const login = async (email, password) => {
    try {
      const res = await fetch("https://backend-by-meetly.onrender.com/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message);

      const normalized = normalizeUser(data.user);
      setUser(normalized);
      localStorage.setItem("user", JSON.stringify(normalized));

      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };
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
