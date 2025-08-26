import { createContext } from 'react';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  timestamp?: Date;
}

export interface NotificationContextType {
  success: (message: string, options?: { title?: string; duration?: number }) => string;
  error: (message: string, options?: { title?: string; duration?: number }) => string;
  info: (message: string, options?: { title?: string; duration?: number }) => string;
  warning: (message: string, options?: { title?: string; duration?: number }) => string;
  removeNotification: (id: string) => void;
}

export const NotificationContext = createContext<NotificationContextType | null>(null);
