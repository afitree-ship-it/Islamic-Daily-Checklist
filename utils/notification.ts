export interface NotificationSettings {
  enabled: boolean;
  times: string[]; // Array of HH:mm strings, e.g. ["06:00", "15:35"]
  lastNotifiedMap: Record<string, string>; // { "06:00": "YYYY-MM-DD", "15:35": "YYYY-MM-DD" }
}

const STORAGE_KEY = 'deen_tracker_notification_settings';

export function isIOS(): boolean {
  if (typeof window === 'undefined') return false;
  const userAgent = window.navigator.userAgent || '';
  return /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
}

export function isIOSStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    (window.navigator as any).standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches
  );
}

export function isIOSInAppBrowser(): boolean {
  if (!isIOS()) return false;
  const userAgent = window.navigator.userAgent || '';
  // Line, Facebook, Messenger, Instagram, Twitter in-app browsers
  return /Line|FBAN|FBAV|Instagram|Twitter|MicroMessenger/i.test(userAgent);
}

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
    times: ['06:00', '15:35'],
    lastNotifiedMap: {}
  };

  if (typeof window === 'undefined') return defaultSettings;

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      let times = parsed.times;
      if (!times && parsed.time) {
        times = [parsed.time];
        if (!times.includes('15:35')) {
          times.push('15:35');
        }
      }
      return {
        enabled: parsed.enabled ?? defaultSettings.enabled,
        times: Array.isArray(times) && times.length > 0 ? times : defaultSettings.times,
        lastNotifiedMap: parsed.lastNotifiedMap || {}
      };
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
    tag: `deen-tracker-reminder-${Date.now()}`,
    renotify: true,
  };

  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration && registration.active) {
        await registration.showNotification(title, options);
        return true;
      }
    }

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
    'ระบบแจ้งเตือนพร้อมใช้งาน! คุณจะได้รับการแจ้งเตือนเวลา 06:00 น. และ 15:35 น. เพื่อบันทึกเช็คลิสต์ความดีประจำวัน ✨'
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

  const todayStr = now.toISOString().split('T')[0];

  for (const scheduledTime of settings.times) {
    if (currentTime === scheduledTime) {
      const lastDate = settings.lastNotifiedMap[scheduledTime];
      if (lastDate !== todayStr) {
        const nameGreeting = memberName ? `คุณ${memberName}` : 'สมาชิกทุกท่าน';
        let title = `🕌 แจ้งเตือนเช็คลิสต์ประจำวัน (${scheduledTime} น.)`;
        let body = `สวัสดีครับ${nameGreeting}! ได้เวลาบันทึกเช็คลิสต์ความดีประจำวันกับ DeenTracker แล้ว ขอให้อยู่ในความโปรดปรานของอัลลอฮฺ ✨`;

        if (scheduledTime === '06:00') {
          title = '🌅 แจ้งเตือนเช็คลิสต์ยามเช้า (06:00 น.)';
          body = `อรุณสวัสดิ์${nameGreeting}! เริ่มต้นวันใหม่ด้วยการทำความดีและบันทึกเช็คลิสต์ประจำวันกันครับ ✨`;
        } else if (scheduledTime === '15:35') {
          title = '🕌 แจ้งเตือนเช็คลิสต์รอบบ่าย (15:35 น.)';
          body = `สวัสดีตอนบ่าย${nameGreeting}! อย่าลืมมาอัปเดตเช็คลิสต์ความดีประจำวันช่วงบ่ายกันนะครับ ✨`;
        }

        sendNotification(title, body);

        const updatedMap = { ...settings.lastNotifiedMap, [scheduledTime]: todayStr };
        saveNotificationSettings({ lastNotifiedMap: updatedMap });
      }
    }
  }
}

/**
 * Generate standard .ics Calendar File for iOS Apple Calendar & Reminders
 * Ensures daily alerts ring directly on iOS devices without Web Push restrictions
 */
export function downloadCalendarICS(times: string[]): void {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  let eventsStr = '';

  times.forEach((time, index) => {
    const [h, m] = time.split(':');
    const startDT = `${year}${month}${day}T${h}${m}00`;
    // 15-minute duration
    const endMinutes = (parseInt(m, 10) + 15) % 60;
    const endHours = parseInt(h, 10) + Math.floor((parseInt(m, 10) + 15) / 60);
    const endDT = `${year}${month}${day}T${String(endHours).padStart(2, '0')}${String(endMinutes).padStart(2, '0')}00`;

    const summary = time === '06:00' 
      ? '🌅 เช็คลิสต์ความดี DeenTracker ยามเช้า' 
      : `🕌 เช็คลิสต์ความดี DeenTracker (${time} น.)`;

    eventsStr += `
BEGIN:VEVENT
UID:deentracker-reminder-${time}-${index}@deentracker.app
DTSTAMP:${startDT}Z
DTSTART;TZID=Asia/Bangkok:${startDT}
DTEND;TZID=Asia/Bangkok:${endDT}
RRULE:FREQ=DAILY
SUMMARY:${summary}
DESCRIPTION:ได้เวลาอัปเดตเช็คลิสต์ความดีประจำวันใน DeenTracker แล้วครับ ✨
BEGIN:VALARM
TRIGGER:-PT0M
ACTION:DISPLAY
DESCRIPTION:เตือนเช็คลิสต์ความดี DeenTracker
END:VALARM
END:VEVENT`;
  });

  const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//DeenTracker//Notification Reminders//TH
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:DeenTracker Reminders${eventsStr}
END:VCALENDAR`.trim();

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'DeenTracker-Reminders.ics');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
