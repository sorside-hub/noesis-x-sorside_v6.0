import { ReminderItem, NotificationPermissionStatus } from '../../types/reminder';
import { FileNode } from '../../types/vault';
import { scanVaultForReminders } from './reminderParser';

const NOTIFIED_STORAGE_KEY = 'noesis_notified_reminders';
const DISMISSED_STORAGE_KEY = 'noesis_dismissed_reminders';

class ReminderService {
  private notifiedIds: Set<string> = new Set();
  private dismissedIds: Set<string> = new Set();
  private intervalId: number | null = null;
  private onNavigateToNoteCallback: ((noteId: string) => void) | null = null;

  constructor() {
    this.loadState();
  }

  private loadState() {
    try {
      const notifiedRaw = localStorage.getItem(NOTIFIED_STORAGE_KEY);
      if (notifiedRaw) {
        this.notifiedIds = new Set(JSON.parse(notifiedRaw));
      }
      const dismissedRaw = localStorage.getItem(DISMISSED_STORAGE_KEY);
      if (dismissedRaw) {
        this.dismissedIds = new Set(JSON.parse(dismissedRaw));
      }
    } catch (e) {
      console.error('Failed to load reminder states:', e);
    }
  }

  private saveState() {
    try {
      localStorage.setItem(NOTIFIED_STORAGE_KEY, JSON.stringify(Array.from(this.notifiedIds)));
      localStorage.setItem(DISMISSED_STORAGE_KEY, JSON.stringify(Array.from(this.dismissedIds)));
    } catch (e) {
      console.error('Failed to save reminder states:', e);
    }
  }

  public setNavigateCallback(cb: (noteId: string) => void) {
    this.onNavigateToNoteCallback = cb;
  }

  public getPermissionStatus(): NotificationPermissionStatus {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }
    return Notification.permission as NotificationPermissionStatus;
  }

  public async requestPermission(): Promise<NotificationPermissionStatus> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }
    try {
      const permission = await Notification.requestPermission();
      return permission as NotificationPermissionStatus;
    } catch (e) {
      console.error('Error requesting notification permission:', e);
      return 'denied';
    }
  }

  public markAsDismissed(reminderId: string) {
    this.dismissedIds.add(reminderId);
    this.saveState();
  }

  public isDismissed(reminderId: string): boolean {
    return this.dismissedIds.has(reminderId);
  }

  /**
   * Fires a native notification (via ServiceWorker registration or Notification API fallback)
   */
  public async triggerNotification(reminder: ReminderItem) {
    // Prevent re-triggering if already notified or dismissed or completed
    if (this.notifiedIds.has(reminder.id) || this.dismissedIds.has(reminder.id) || reminder.isCompleted) {
      return;
    }

    this.notifiedIds.add(reminder.id);
    this.saveState();

    const notificationTitle = reminder.customTitle 
      ? reminder.customTitle 
      : (reminder.isChecklist ? `Tugas: ${reminder.noteTitle}` : `Pengingat: ${reminder.noteTitle}`);

    const options: NotificationOptions = {
      body: reminder.text,
      icon: '/pwa-maskable-192x192.png',
      badge: '/favicon.ico',
      tag: reminder.id,
      requireInteraction: true,
      data: {
        noteId: reminder.noteId,
        reminderId: reminder.id,
        url: `/?noteId=${reminder.noteId}`,
      },
    };

    // Try service worker registration first for standard PWA notification
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        if (registration && registration.showNotification) {
          await registration.showNotification(notificationTitle, options);
          return;
        }
      } catch (err) {
        console.warn('Service worker showNotification fallback to window.Notification:', err);
      }
    }

    // Fallback standard Notification
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        const notification = new Notification(notificationTitle, options);
        notification.onclick = () => {
          window.focus();
          notification.close();
          if (this.onNavigateToNoteCallback) {
            this.onNavigateToNoteCallback(reminder.noteId);
          }
        };
      } catch (err) {
        console.error('Failed to trigger window Notification:', err);
      }
    }
  }

  /**
   * Runs check across all vault notes and triggers notifications for any due reminders
   */
  public checkDueReminders(nodes: Record<string, FileNode>) {
    if (this.getPermissionStatus() !== 'granted') return;

    const now = Date.now();
    const reminders = scanVaultForReminders(nodes);

    reminders.forEach((reminder) => {
      // If reminder due time has arrived (or overdue within 24 hours) and not completed
      if (reminder.dueTimestamp <= now && !reminder.isCompleted) {
        this.triggerNotification(reminder);
      }
    });
  }

  /**
   * Starts periodic polling scheduler (every 30 seconds)
   */
  public startScheduler(getNodes: () => Record<string, FileNode>) {
    this.stopScheduler();

    // Initial check
    this.checkDueReminders(getNodes());

    // Run every 30 seconds
    this.intervalId = window.setInterval(() => {
      this.checkDueReminders(getNodes());
    }, 30000);
  }

  public stopScheduler() {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

export const reminderService = new ReminderService();
