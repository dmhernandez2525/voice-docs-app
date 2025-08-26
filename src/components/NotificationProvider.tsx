import React, { useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { NotificationContext, type Notification } from '../contexts/NotificationContext';



interface NotificationProviderProps {
  children: React.ReactNode;
}

const NotificationItem: React.FC<{
  notification: Notification;
  onRemove: (id: string) => void;
}> = ({ notification, onRemove }) => {
  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'info':
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getBadgeVariant = () => {
    switch (notification.type) {
      case 'success':
        return 'default';
      case 'error':
        return 'destructive';
      case 'warning':
        return 'secondary';
      case 'info':
      default:
        return 'outline';
    }
  };

  return (
    <Card className="mb-3 shadow-lg border-l-4 border-l-current">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            {getIcon()}
          </div>
          <div className="flex-1 min-w-0">
            {notification.title && (
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium text-sm text-gray-900 dark:text-white">
                  {notification.title}
                </h4>
                <Badge variant={getBadgeVariant()} className="text-xs">
                  {notification.type}
                </Badge>
              </div>
            )}
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {notification.message}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {notification.timestamp?.toLocaleTimeString() || new Date().toLocaleTimeString()}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(notification.id)}
            className="flex-shrink-0 h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (notification: Omit<Notification, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newNotification: Notification = { 
      ...notification, 
      id, 
      timestamp: new Date() 
    };
    setNotifications(prev => [...prev, newNotification]);

    // Auto-remove after duration
    const duration = notification.duration || 5000;
    setTimeout(() => {
      removeNotification(id);
    }, duration);

    return id;
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const success = (message: string, options?: { title?: string; duration?: number }) => {
    return addNotification({
      type: 'success',
      title: options?.title || 'Success',
      message,
      duration: options?.duration,
    });
  };

  const error = (message: string, options?: { title?: string; duration?: number }) => {
    return addNotification({
      type: 'error',
      title: options?.title || 'Error',
      message,
      duration: options?.duration,
    });
  };

  const info = (message: string, options?: { title?: string; duration?: number }) => {
    return addNotification({
      type: 'info',
      title: options?.title || 'Info',
      message,
      duration: options?.duration,
    });
  };

  const warning = (message: string, options?: { title?: string; duration?: number }) => {
    return addNotification({
      type: 'warning',
      title: options?.title || 'Warning',
      message,
      duration: options?.duration,
    });
  };

  return (
    <NotificationContext.Provider value={{ success, error, info, warning, removeNotification }}>
      {children}
      
      {/* Notification Container */}
      {notifications.length > 0 && (
        <div className="fixed top-4 right-4 z-50 w-96 max-w-sm">
          {notifications.map((notification: Notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onRemove={removeNotification}
            />
          ))}
        </div>
      )}
    </NotificationContext.Provider>
  );
};
