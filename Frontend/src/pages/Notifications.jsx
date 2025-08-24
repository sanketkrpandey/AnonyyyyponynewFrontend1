import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Bell, Check, Trash2, CheckCheck, Menu } from 'lucide-react';
import * as notifApi from '../services/notifications';
import { timeAgo } from '../utils/formatDate';
import AppSidebar from '../components/Sidebar';

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Load notifications on component mount
  useEffect(() => {
    loadNotifications();
    loadUnreadCount();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const { notifications } = await notifApi.getNotifications();
      setItems(notifications || []);
    } catch (error) {
      toast.error('Failed to fetch notifications');
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const { count } = await notifApi.getUnreadCount();
      setUnreadCount(count || 0);
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await notifApi.markAsRead(notificationId);
      // Update local state
      setItems(prevItems => 
        prevItems.map(item => 
          item._id === notificationId ? { ...item, read: true } : item
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      toast.success('Marked as read');
    } catch (error) {
      toast.error('Failed to mark as read');
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notifApi.markAllAsRead();
      // Update all items to read
      setItems(prevItems => 
        prevItems.map(item => ({ ...item, read: true }))
      );
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark all as read');
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await notifApi.deleteNotification(notificationId);
      // Remove from local state
      setItems(prevItems => prevItems.filter(item => item._id !== notificationId));
      // Update unread count if the deleted notification was unread
      const deletedNotification = items.find(item => item._id === notificationId);
      if (deletedNotification && !deletedNotification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      toast.success('Notification deleted');
    } catch (error) {
      toast.error('Failed to delete notification');
      console.error('Error deleting notification:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'like':
        return '❤️';
      case 'comment':
        return '💬';
      case 'follow':
        return '👤';
      case 'mention':
        return '@';
      default:
        return '🔔';
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <AppSidebar open={sidebarOpen} setOpen={setSidebarOpen} />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
            <div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            <span>Loading notifications...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Sidebar */}
      <AppSidebar open={sidebarOpen} setOpen={setSidebarOpen} />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <div className="md:hidden bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold text-gray-800 dark:text-white">Notifications</h1>
              {unreadCount > 0 && (
                <span className="px-2 py-1 text-xs bg-red-500 text-white rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            <Menu 
              className="w-6 h-6 text-gray-600 dark:text-gray-300 cursor-pointer" 
              onClick={() => setSidebarOpen(!sidebarOpen)} 
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-4 py-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                  Notifications
                </h1>
                {unreadCount > 0 && (
                  <span className="px-3 py-1 text-sm bg-red-500 text-white rounded-full">
                    {unreadCount} unread
                  </span>
                )}
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <CheckCheck size={16} />
                    Mark all read
                  </button>
                )}
                <button
                  onClick={loadNotifications}
                  className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  <Bell size={16} />
                  Refresh
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="space-y-3">
              {items.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    You're all caught up!
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    No notifications to show right now.
                  </p>
                </div>
              ) : (
                items.map((notification) => (
                  <div
                    key={notification._id}
                    className={`p-4 rounded-lg border transition-colors ${
                      notification.read
                        ? 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                        : 'border-blue-300 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Notification Icon */}
                      <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
                        <span className="text-sm">
                          {getNotificationIcon(notification.type)}
                        </span>
                      </div>

                      {/* Notification Content */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 dark:text-white">
                          {notification.message}
                        </p>
                        
                        {/* Additional context if available */}
                        {notification.context && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            {notification.context}
                          </p>
                        )}

                        <div className="flex items-center gap-3 mt-3 text-xs text-gray-500 dark:text-gray-400">
                          <span>{timeAgo(notification.createdAt)}</span>
                          
                          {/* Action Buttons */}
                          <div className="flex items-center gap-2">
                            {!notification.read && (
                              <button
                                onClick={() => markAsRead(notification._id)}
                                className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                <Check size={12} />
                                Mark read
                              </button>
                            )}
                            
                            <button
                              onClick={() => deleteNotification(notification._id)}
                              className="flex items-center gap-1 text-red-600 dark:text-red-400 hover:underline"
                            >
                              <Trash2 size={12} />
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Unread Indicator */}
                      {!notification.read && (
                        <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Load More Button (if pagination is implemented) */}
            {items.length > 0 && (
              <div className="text-center mt-8">
                <button className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  Load more notifications
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}