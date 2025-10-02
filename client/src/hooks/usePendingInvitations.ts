import { apiClient } from '@/lib/api-client';
import { useEffect, useState } from 'react';

export function usePendingInvitationsCount() {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCount();

    // Poll every 30 seconds
    const interval = setInterval(fetchCount, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchCount = async () => {
    try {
      const response = await apiClient.get('/projects/invitations/received?status=PENDING');
      if (response.data.success) {
        setCount(response.data.data.length);
      }
    } catch (error) {
      console.error('Failed to fetch pending invitations count:', error);
    } finally {
      setLoading(false);
    }
  };

  return { count, loading, refetch: fetchCount };
}
