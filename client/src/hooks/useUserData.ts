// src/hooks/useUserData.ts
import { useEffect } from 'react';
import { useUser } from '@/context/userContext';
import { useAuth } from '@clerk/clerk-react';

export const useUserData = () => {
  const { user, setUserData, loading, setLoading, error, setError } = useUser();
  const { userId } = useAuth();

  const fetchUserData = async (): Promise<void> => {
    if (!userId) return;
    console.log(userId)
    try {
      setLoading(true);
      setError(null);
      const url="http://localhost:5000/api/users/"+userId;
      const response = await fetch(url);
      console.log(response)
      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }
      
      const userData = await response.json();
      setUserData(userData);
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Fetch user data when userId changes
  useEffect(() => {
    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  return {
    user,
    loading,
    error,
    refetch: fetchUserData
  };
};