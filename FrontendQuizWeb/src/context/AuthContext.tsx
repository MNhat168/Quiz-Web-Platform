
import React ,{ createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
interface AuthContextType {
    token: string | null;
    role: string | null;
    name : string | null;
    login: (newToken: string, newRole: string, newName: string) => void;
    logout: () => void;
  }

export const AuthContext = createContext<AuthContextType | null>(null);
export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [role, setRole] = useState(localStorage.getItem("role"));
  const [name, setName] = useState(localStorage.getItem("username"));
  const navigate = useNavigate();

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

    if (name) {
      localStorage.setItem("username", name) ;
    } else {
      localStorage.removeItem("username");
    }
  }, [token, role, name]);

  const login = (newToken, newRole, newName) => {
    setToken(newToken);
    setRole(newRole);
    setName(newName);
  };

  const logout = () => {
    setToken(null);
    setRole(null);
    setName(null);
    localStorage.clear();
    navigate("/login");
  };

  return (
    <AuthContext.Provider value={{ token, role, name, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
