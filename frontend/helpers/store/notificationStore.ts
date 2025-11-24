import toast from "react-hot-toast";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface NotificationItem {
  id: string;
  appointmentId: string;
  citizenName: string;
  serviceName: string;
  appointmentDate: string; // ISO datetime
  status: "pending_approval" | "approved" | "rejected" | "postponed";
  createdAt: string;
  isRead: boolean;
}

interface NotificationState {
  notifications: NotificationItem[];
  unreadCount: number;
  hasSoundPlayed: boolean;

  // Actions
  addNotification: (notification: NotificationItem) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  playNotificationSound: () => void;
  resetSoundFlag: () => void;
}

// Create audio element once
let audio: HTMLAudioElement | null = null;
if (typeof window !== "undefined") {
  // Use a simple system beep or add a short MP3 to /public/notifications/
  audio = new Audio("/notifications/notification.mp3"); // 1-2 second soft chime
  audio.volume = 0.5;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,
      hasSoundPlayed: false,

      addNotification: (notification) => {
        set((state) => {
          // Prevent duplicates
          if (state.notifications.some((n) => n.id === notification.id)) {
            return state;
          }

          const newNotifications = [notification, ...state.notifications];
          const unreadCount = state.unreadCount + 1;

          // Auto-play sound if not already played (browser requires user interaction first)
          if (
            !state.hasSoundPlayed &&
            notification.status === "pending_approval"
          ) {
            get().playNotificationSound();
          }

          return {
            notifications: newNotifications,
            unreadCount,
          };
        });

        // Show toast for immediate feedback
        // toast(`New appointment from ${notification.citizenName}`, {
        //   description: `${notification.serviceName} - ${new Date(notification.appointmentDate).toLocaleString()}`,
        //   action: {
        //     label: 'View',
        //     onClick: () => {
        //       window.location.href = '/host/notifications';
        //     },
        //   },
        // });
      },

      markAsRead: (notificationId) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === notificationId ? { ...n, isRead: true } : n
          ),
          unreadCount: Math.max(0, state.unreadCount - 1),
        }));
      },

      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({
            ...n,
            isRead: true,
          })),
          unreadCount: 0,
        }));
      },

      removeNotification: (id) => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
          unreadCount: Math.max(
            0,
            state.unreadCount -
              (state.notifications.find((n) => n.id === id)?.isRead ? 0 : 1)
          ),
        }));
      },

      playNotificationSound: () => {
        if (audio && typeof window !== "undefined") {
          audio.play().catch(() => {
            // Autoplay blocked - user needs to interact first
            console.log("Sound blocked until user interaction");
          });
          set({ hasSoundPlayed: true });
        }
      },

      resetSoundFlag: () => set({ hasSoundPlayed: false }),
    }),
    {
      name: "notification-storage",
      // Persist only what's needed
      partialize: (state) => ({
        notifications: state.notifications,
        unreadCount: state.unreadCount,
      }),
    }
  )
);
