// src/context/UserContext.tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';

// Define User interface matching your MongoDB schema
interface User {
  _id?: string;
  clerkId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
  // Onboarding fields
  onboardingCompleted: boolean;
  jobTitle?: string;
  company?: string;
  githubName?: string;
  Experience?: string;
  purpose?: string;
  createdAt?: Date;
  lastUpdated?: Date;
}

interface UserContextType {
  user: User | null;
  setUserData: (userData: User) => void;
  clearUser: () => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
}

// Create context with undefined initial value
const UserContext = createContext<UserContextType | undefined>(undefined);

// Props for the provider component
interface UserProviderProps {
  children: ReactNode;
}

// Provider component
export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Set user data
  const setUserData = (userData: User): void => {
    setUser(userData);
  };

  // Clear user data
  const clearUser = (): void => {
    setUser(null);
  };

  // Value object to be provided to consumers
  const value: UserContextType = {
    user,
    setUserData,
    clearUser,
    loading,
    setLoading,
    error,
    setError
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

// Custom hook to use the context
export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};