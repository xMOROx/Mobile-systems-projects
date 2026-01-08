import { useState, useRef, useCallback } from 'react';

interface NotificationState {
  type: 'success' | 'error';
  message: string;
}

interface UseNotificationReturn {
  notification: NotificationState | null;
  showNotification: (type: 'success' | 'error', message: string) => void;
  clearNotification: () => void;
}

const NOTIFICATION_DURATION = 3500;

/**
 * Custom hook for managing toast notifications.
 */
export const useNotification = (): UseNotificationReturn => {
  const [notification, setNotification] = useState<NotificationState | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const clearNotification = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setNotification(null);
  }, []);

  const showNotification = useCallback((type: 'success' | 'error', message: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setNotification({ type, message });
    timeoutRef.current = setTimeout(() => {
      setNotification(null);
    }, NOTIFICATION_DURATION);
  }, []);

  return {
    notification,
    showNotification,
    clearNotification,
  };
};
