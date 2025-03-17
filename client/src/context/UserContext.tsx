import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";

// Define User interface
interface User {
  _id?: string;
  clerkId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
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

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const { user: clerkUser, isSignedIn } = useUser(); // Get Clerk user
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Sync Clerk's user data to our context
  useEffect(() => {
    if (isSignedIn && clerkUser) {
      setUser({
        clerkId: clerkUser.id,
        email: clerkUser.primaryEmailAddress?.emailAddress || "",
        firstName: clerkUser.firstName || "",
        lastName: clerkUser.lastName || "",
        imageUrl: clerkUser.imageUrl,
        onboardingCompleted: false, // Default to false (or fetch from DB)
      });
    } else {
      setUser(null);
    }
  }, [clerkUser, isSignedIn]);

  const setUserData = (userData: User): void => {
    setUser(userData);
  };

  const clearUser = (): void => {
    setUser(null);
  };

  const value: UserContextType = {
    user,
    setUserData,
    clearUser,
    loading,
    setLoading,
    error,
    setError,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUserContext = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUserContext must be used within a UserProvider");
  }
  return context;
};
