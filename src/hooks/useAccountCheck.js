import { useState, useEffect, useCallback } from 'react';
import { paymentMethodAPI } from '../api/paymentMethod';
import logger from '../utils/logger';

export const useAccountCheck = () => {
  const [hasAccount, setHasAccount] = useState(null); // null = loading
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  const checkAccount = useCallback(async () => {
    setLoading(true);
    try {
      const response = await paymentMethodAPI.getMyPaymentMethods();
      const data = response.data?.data || [];
      setAccounts(data);
      setHasAccount(data.length > 0);
      return data.length > 0;
    } catch (error) {
      logger.error('Failed to check account:', error);
      setHasAccount(false);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAccount();
  }, [checkAccount]);

  return {
    hasAccount,
    accounts,
    loading,
    refetch: checkAccount,
  };
};

export default useAccountCheck;
