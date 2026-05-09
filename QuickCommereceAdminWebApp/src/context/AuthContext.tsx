import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import { setAccessToken, getAccessToken } from "../lib/api-client";

// Types
interface User {
  adminId: string;
  name: string;
  email: string;
  role: string;
  assignedWarehouse: string | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

interface AuthResponse {
  adminId: string;
  name: string;
  email: string;
  role: string;
  assignedWarehouse: string | null;
  token: string;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth Provider Component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Logout function
  const logout = useCallback((): void => {
    setUser(null);
    setToken(null);
    setAccessToken(null);
    localStorage.removeItem("authUser");

    // Also clear the refresh token cookie via the backend
    fetch(`${import.meta.env.VITE_SERVER_PORT_ADMIN}/logout`, {
      method: "POST",
      credentials: "include",
    }).catch(() => {
      // Ignore errors — we've already cleared local state
    });
  }, []);

  // Check if user is authenticated on app start
  useEffect(() => {
    const storedToken = getAccessToken();
    const storedUser = localStorage.getItem("authUser");

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);
      } catch (error) {
        // If parsing fails, clear invalid data
        setAccessToken(null);
        localStorage.removeItem("authUser");
      }
    }
    setIsLoading(false);
  }, []);

  // Listen for forced logouts from the api-client (when refresh token fails)
  useEffect(() => {
    const handleForceLogout = () => {
      setUser(null);
      setToken(null);
    };

    window.addEventListener("auth:logout", handleForceLogout);
    return () => window.removeEventListener("auth:logout", handleForceLogout);
  }, []);

  // Login function
  const login = async (email: string, password: string): Promise<void> => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SERVER_PORT_ADMIN}/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include", // receive the refresh token cookie
          body: JSON.stringify({ email, password }),
        }
      );

      if (!response.ok) {
        throw new Error("Login failed");
      }

      const data: AuthResponse = await response.json();

      // Extract user data without token
      const userData: User = {
        adminId: data.adminId,
        name: data.name,
        email: data.email,
        role: data.role,
        assignedWarehouse: data.assignedWarehouse,
      };

      // Store in state
      setToken(data.token);
      setUser(userData);

      // Store in localStorage via the api-client (keeps in-memory + localStorage in sync)
      setAccessToken(data.token);
      localStorage.setItem("authUser", JSON.stringify(userData));
    } catch (error) {
      throw new Error("Login failed. Please check your credentials.");
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
