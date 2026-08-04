export interface NotificationSettings {
  enabled: boolean;
  time: string; // HH:mm e.g. "06:00"
  lastNotifiedDate: string; // YYYY-MM-DD
}

const STORAGE_KEY = 'deen_tracker_notification_settings';

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermissionStatus(): NotificationPermission | 'unsupported' {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNotificationSupported()) return false;
  
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      // Register service worker if available
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').catch(() => {
          // Fallback handled silently
        });
      }
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
}

export function getNotificationSettings(): NotificationSettings {
  const defaultSettings: NotificationSettings = {
    enabled: true,
    time: '06:00',
    lastNotifiedDate: ''
  };

  if (typeof window === 'undefined') return defaultSettings;

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return { ...defaultSettings, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.warn('Failed to load notification settings', e);
  }

  return defaultSettings;
}

export function saveNotificationSettings(settings: Partial<NotificationSettings>): NotificationSettings {
  const current = getNotificationSettings();
  const updated = { ...current, ...settings };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to save notification settings', e);
  }
  return updated;
}

export async function sendNotification(title: string, body: string): Promise<boolean> {
  if (!isNotificationSupported()) return false;
  if (Notification.permission !== 'granted') return false;

  const options: NotificationOptions = {
    body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'deen-tracker-reminder',
    renotify: true,
  };

  try {
    // Try Service Worker notification first for mobile compatibility
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration && registration.active) {
        await registration.showNotification(title, options);
        return true;
      }
    }

    // Standard Notification fallback
    new Notification(title, options);
    return true;
  } catch (e) {
    console.error('Notification trigger error:', e);
    return false;
  }
}

export async function sendTestNotification(): Promise<boolean> {
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) return false;

  return sendNotification(
    '🌅 ทดสอบแจ้งเตือน DeenTracker',
    'ระบบแจ้งเตือนพร้อมใช้งาน! คุณจะได้รับการแจ้งเตือนทุกเช้า เวลา 06:00 น. เพื่อบันทึกเช็คลิสต์ความดีประจำวัน ✨'
  );
}

export function checkAndTriggerScheduledNotification(memberName?: string): void {
  const settings = getNotificationSettings();
  if (!settings.enabled) return;
  if (!isNotificationSupported() || Notification.permission !== 'granted') return;

  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const currentTime = `${hours}:${minutes}`;

  // Check if current time matches target time (e.g., "06:00")
  if (currentTime === settings.time) {
    const todayStr = now.toISOString().split('T')[0];
    if (settings.lastNotifiedDate !== todayStr) {
      const nameGreeting = memberName ? `คุณ${memberName}` : 'สมาชิกทุกท่าน';
      sendNotification(
        '🌅 แจ้งเตือนเช็คลิสต์ประจำวัน',
        `อรุณสวัสดิ์${nameGreeting}! ได้เวลาบันทึกเช็คลิสต์ความดีประจำวันกับ DeenTracker แล้ว ขอให้อยู่ในความโปรดปรานของอัลลอฮฺ ✨`
      );
      saveNotificationSettings({ lastNotifiedDate: todayStr });
    }
  }
}
