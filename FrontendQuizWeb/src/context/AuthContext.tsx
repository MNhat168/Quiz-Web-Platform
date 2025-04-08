
import React ,{ createContext, useContext, useState, useEffect } from "react";

interface AuthContextType {
    token: string | null;
    role: string | null;
    login: (newToken: string, newRole: string) => void;
    logout: () => void;
  }

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [role, setRole] = useState(localStorage.getItem("role"));

  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("token");
    }

    if (role) {
      localStorage.setItem("role", role);
    } else {
      localStorage.removeItem("role");
    }
  }, [token, role]);

  const login = (newToken, newRole) => {
    setToken(newToken);
    setRole(newRole);
  };

  const logout = () => {
    setToken(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ token, role, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
