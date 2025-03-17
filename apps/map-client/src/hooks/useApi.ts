import { useState, useEffect, useCallback } from 'react';
import apiService from '../services/api';

export const useApiHealth = () => {
  const [isAvailable, setIsAvailable] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        setChecking(true);
        const healthy = await apiService.checkHealth();
        setIsAvailable(healthy);
      } catch (error) {
        setIsAvailable(false);
      } finally {
        setChecking(false);
      }
    };

    checkHealth();
  }, []);

  const recheckHealth = useCallback(async () => {
    try {
      setChecking(true);
      const healthy = await apiService.checkHealth();
      setIsAvailable(healthy);
      return healthy;
    } catch (error) {
      setIsAvailable(false);
      return false;
    } finally {
      setChecking(false);
    }
  }, []);

  return {
    isAvailable,
    checking,
    recheckHealth
  };
};
