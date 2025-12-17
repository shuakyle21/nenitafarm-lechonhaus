import { useState, useEffect, useCallback } from 'react';
import { Staff } from '@/types';
import { staffService } from '@/services/staffService';

export function useStaff(isAuthenticated: boolean) {
  const [staffList, setStaffList] = useState<Staff[]>([]);

  const fetchStaff = useCallback(async () => {
    try {
      const data = await staffService.getStaff();
      setStaffList(data);
    } catch (error) {
      console.error('Error fetching staff:', error);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      fetchStaff();
    }
  }, [isAuthenticated, fetchStaff]);

  return { staffList, refreshStaff: fetchStaff };
}
