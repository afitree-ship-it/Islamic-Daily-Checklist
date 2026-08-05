import React, { useState, useEffect } from 'react';
import { 
  getNotificationPermissionStatus, 
  requestNotificationPermission, 
  getNotificationSettings, 
  saveNotificationSettings, 
  sendTestNotification,
  playNotificationSound,
  isNotificationSupported,
  isIOS,
  isAndroid,
  isIOSStandalone,
  isInAppBrowser,
  downloadCalendarICS,
  NotificationSettings 
} from '../utils/notification';

interface NotificationModalProps {
  onClose: () => void;
  activeMemberName?: string;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({ onClose, activeMemberName }) => {
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [settings, setSettings] = useState<NotificationSettings>({
    enabled: true,
    soundEnabled: true,
    times: ['06:00'],
    lastNotifiedMap: {}
  });
  const [newTimeInput, setNewTimeInput] = useState('15:35');
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const onIOS = isIOS();
  const onAndroid = isAndroid();
  const onIOSApp = isIOSStandalone();
  const inAppBrowser = isInAppBrowser();

  useEffect(() => {
    setPermission(getNotificationPermissionStatus());
    setSettings(getNotificationSettings());
  }, []);

  const handleEnablePermission = async () => {
    setTestResult(null);
    const granted = await requestNotificationPermission();
    const currentPermission = getNotificationPermissionStatus();
    setPermission(currentPermission);

    if (granted) {
      saveNotificationSettings({ enabled: true });
      setSettings(prev => ({ ...prev, enabled: true }));
      setTestResult('🎉 อนุญาตการแจ้งเตือนสำเร็จแล้ว!');
    } else {
      if (currentPermission === 'denied') {
        if (onAndroid) {
          setTestResult('⚠️ สิทธิ์การแจ้งเตือนถูกบล็อกใน Chrome (Android): กดรูป 🔒 (แม่กุญแจ) ข้าง URL ด้านบนสุด -> กด "ตั้งค่าเว็บไซต์" -> เลือก "การแจ้งเตือน" -> เปลี่ยนเป็น "อนุญาต"');
        } else if (onIOS) {
          setTestResult('⚠️ บน iOS Safari จำเป็นต้อง "เพิ่มไปยังหน้าจอโฮม" ก่อน หรือใช้ไฟล์ปฏิทินด้านล่างเพื่อเตือนได้ 100%');
        } else {
          setTestResult('⚠️ สิทธิ์ถูกปฏิเสธในเบราว์เซอร์ กรุณาเปลี่ยนการตั้งค่าการแจ้งเตือนของเบราว์เซอร์เป็นอนุญาต');
        }
      } else {
        setTestResult('⚠️ ไม่สามารถเปิดสิทธิ์ได้ กรุณาเปิดผ่าน Chrome/Safari โดยตรง');
      }
    }
  };

  const handleToggleEnabled = (e: React.ChangeEvent<HTMLInputElement>) => {
    const enabled = e.target.checked;
    saveNotificationSettings({ enabled });
    setSettings(prev => ({ ...prev, enabled }));

    if (enabled && permission !== 'granted') {
      handleEnablePermission();
    }
  };

  const handleToggleSound = (e: React.ChangeEvent<HTMLInputElement>) => {
    const soundEnabled = e.target.checked;
    saveNotificationSettings({ soundEnabled });
    setSettings(prev => ({ ...prev, soundEnabled }));
    if (soundEnabled) {
      playNotificationSound();
    }
  };

  const handleAddTime = (timeToAdd: string) => {
    if (!timeToAdd) return;
    if (settings.times.includes(timeToAdd)) return;
    const updatedTimes = [...settings.times, timeToAdd].sort();
    saveNotificationSettings({ times: updatedTimes });
    setSettings(prev => ({ ...prev, times: updatedTimes }));
  };

  const handleRemoveTime = (timeToRemove: string) => {
    if (settings.times.length <= 1) {
      alert('จำเป็นต้องมีเวลาแจ้งเตือนอย่างน้อย 1 เวลา');
      return;
    }
    const updatedTimes = settings.times.filter(t => t !== timeToRemove);
    saveNotificationSettings({ times: updatedTimes });
    setSettings(prev => ({ ...prev, times: updatedTimes }));
  };

  const handleTestClick = async () => {
    setIsTesting(true);
    setTestResult(null);
    playNotificationSound();
    
    const success = await sendTestNotification();
    setIsTesting(false);
    if (success) {
      setTestResult('🎉 ส่งการแจ้งเตือนทดสอบ + เสียงเตือนเรียบร้อยแล้ว!');
    } else {
      setTestResult('🔔 ทดสอบเล่นเสียงเตือนเรียบร้อยแล้ว (หากต้องการข้อความแจ้งเตือนเด้งบนหน้าจอ กรุณากดปุ่มเปิดสิทธิ์แจ้งเตือน)');
    }
  };

  const handleDownloadCalendar = () => {
    downloadCalendarICS(settings.times);
    setTestResult('📅 ดาวน์โหลดไฟล์ปฏิทินเรียบร้อย! กดเปิดไฟล์ .ics เพื่อบันทึกลง iPhone Calendar / Reminders ได้ทันที');
  };

  const handleCopyLinkForBrowser = () => {
    try {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    } catch {
      alert(`ลิงก์เว็บสำหรับคัดลอก: ${window.location.href}`);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-100 flex flex-col gap-4 relative overflow-hidden max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-sm shrink-0">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800 leading-tight">ตั้งค่าการแจ้งเตือนประจำวัน</h2>
              <p className="text-xs text-slate-500 font-medium">เตือนเช็คลิสต์บนมือถือ ({settings.times.join(' น. / ')} น.)</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Warning Banner for In-App Browsers (LINE / Facebook / Messenger / IG) */}
        {inAppBrowser && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center gap-2 text-rose-900 font-black text-xs">
              <span>⚠️ เปิดผ่านแอป LINE / Facebook / Messenger</span>
            </div>
            <p className="text-[11px] text-rose-800 leading-relaxed font-medium">
              เบราว์เซอร์ภายในแอป LINE/FB จะบล็อกระบบแจ้งเตือนของมือถือเอาไว้ แนะนำให้คัดลอกลิงก์ไปเปิดใน <strong>Google Chrome</strong> หรือ <strong>Safari</strong> แทนครับ
            </p>
            <button
              onClick={handleCopyLinkForBrowser}
              className="w-full py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl shadow transition-all active:scale-98 flex items-center justify-center gap-1.5"
            >
              <span>{copiedLink ? '✓ คัดลอกลิงก์แล้ว! นำไปวางใน Chrome/Safari' : '📋 คัดลอกลิงก์เพื่อเปิดใน Chrome / Safari'}</span>
            </button>
          </div>
        )}

        {/* SPECIAL SECTION FOR iOS / iPhone */}
        {onIOS && (
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200/80 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-indigo-900 flex items-center gap-1.5">
                <span> ทางเลือกการแจ้งเตือนสำหรับ iPhone / iPad</span>
              </span>
              <span className="text-[10px] bg-indigo-200/80 text-indigo-900 px-2 py-0.5 rounded-full font-black">
                iOS Solutions
              </span>
            </div>

            <p className="text-[11px] text-indigo-800 font-medium leading-relaxed">
              บน iPhone/iPad มี 3 วิธีหลักในการรับแจ้งเตือนตามที่คุณสะดวก:
            </p>

            {/* iOS Option 1: Calendar / Reminders (Easiest) */}
            <div className="bg-white/90 p-3 rounded-xl border border-indigo-100 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-indigo-950">วิธีที่ 1: บันทึกลงปฏิทิน/เตือนความจำ iPhone</span>
                <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">เตือนตรงเวลา 100%</span>
              </div>
              <p className="text-[10px] text-slate-600 leading-normal">
                กดดาวน์โหลดไฟล์ปฏิทิน แล้วกด "บันทึกปฏิทิน" เครื่อง iPhone จะส่งเสียงเตือนตามเวลา {settings.times.join(' น. และ ')} น. ทุกวันโดยอัตโนมัติ
              </p>
              <button
                onClick={handleDownloadCalendar}
                className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow transition-all active:scale-98 flex items-center justify-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>📅 บันทึกลงปฏิทิน iPhone / iPad</span>
              </button>
            </div>

            {/* iOS Option 2: Add to Home Screen PWA */}
            <div className="bg-white/90 p-3 rounded-xl border border-indigo-100 space-y-1">
              <div className="text-xs font-black text-indigo-950">วิธีที่ 2: เพิ่มลงหน้าจอโฮม (PWA Web Push)</div>
              <p className="text-[10px] text-slate-600 leading-relaxed">
                1. ใน Safari กดปุ่ม <strong>"แชร์" ⎘</strong> (ไอคอนสี่เหลี่ยมลูกศรชี้ขึ้น)<br />
                2. เลือก <strong>"เพิ่มไปยังหน้าจอโฮม" ➕ (Add to Home Screen)</strong><br />
                3. เปิดแอป DeenTracker จากไอคอนหน้าจอโฮม แล้วมากดอนุญาตแจ้งเตือน Web Push ได้ทันที!
              </p>
            </div>

            {/* iOS Option 3: Sound Alarm */}
            <div className="bg-white/90 p-3 rounded-xl border border-indigo-100 space-y-1">
              <div className="text-xs font-black text-indigo-950">วิธีที่ 3: เสียงเตือนเมื่อเปิดหน้าเว็บทิ้งไว้</div>
              <p className="text-[10px] text-slate-600 leading-relaxed">
                เมื่อเปิดหน้าเว็บ DeenTracker ทิ้งไว้ ระบบจะส่งเสียงชานท์เตือนสติสั้นๆ เมื่อถึงเวลาเตือน
              </p>
            </div>
          </div>
        )}

        {/* Android Troubleshooting Guidance if permission denied */}
        {onAndroid && permission === 'denied' && (
          <div className="bg-amber-50 border border-amber-200/90 rounded-2xl p-3.5 space-y-2">
            <div className="text-xs font-black text-amber-900 flex items-center gap-1.5">
              <span>🔧 วิธีแก้สิทธิ์แจ้งเตือนโดนบล็อกใน Android Chrome:</span>
            </div>
            <ol className="text-[11px] text-amber-800 list-decimal pl-4 space-y-1 font-medium leading-relaxed">
              <li>สังเกตแถบ URL ด้านบนสุด กดที่ไอคอน <strong>🔒 (แม่กุญแจ)</strong> ด้านซ้ายสุด</li>
              <li>กดเลือกเมนู <strong>"ตั้งค่าเว็บไซต์" (Site settings)</strong></li>
              <li>ตรงหัวข้อ <strong>"การแจ้งเตือน" (Notifications)</strong> เปลี่ยนจาก 'บล็อก' เป็น <strong>'อนุญาต' (Allow)</strong></li>
              <li>กลับมาหน้านี้แล้วรีเฟรช 1 ครั้งเพื่อใช้งานได้ทันที</li>
            </ol>
          </div>
        )}

        {/* MAIN TOGGLES AND SETTINGS */}
        <div className="space-y-3.5 bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
          
          {/* Master Enable Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-black text-slate-800">ระบบเตือนทำเช็คลิสต์</div>
              <div className="text-[10px] text-slate-500 font-medium">เปิด/ปิด การแจ้งเตือนเช็คลิสต์ประจำวัน</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox"
                checked={settings.enabled}
                onChange={handleToggleEnabled}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* Sound Alarm Toggle */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
            <div>
              <div className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <span>🔔 เสียงเตือน (Sound Alarm)</span>
              </div>
              <div className="text-[10px] text-slate-500 font-medium">ส่งเสียงเตือนเมื่อถึงเวลาทำเช็คลิสต์</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox"
                checked={settings.soundEnabled}
                onChange={handleToggleSound}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* Notification Permission Button */}
          {isNotificationSupported() && permission !== 'granted' && (
            <div className="pt-2 border-t border-slate-200/60">
              <button
                onClick={handleEnablePermission}
                className="w-full py-2.5 px-4 bg-emerald-950 hover:bg-emerald-900 text-white text-xs font-black rounded-xl shadow-md transition-all active:scale-98 flex items-center justify-center gap-2"
              >
                <span>🔔 คลิกเพื่อเปิดสิทธิ์การแจ้งเตือนบนมือถือ</span>
              </button>
            </div>
          )}

          {/* Scheduled Times Management */}
          <div className="pt-2 border-t border-slate-200/60 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="text-xs font-black text-slate-800">เวลาแจ้งเตือนในแต่ละวัน</div>
            </div>

            {/* List of Notification Times */}
            <div className="flex flex-wrap gap-2">
              {settings.times.map((t) => (
                <div 
                  key={t}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950 text-white rounded-xl text-xs font-black shadow-sm"
                >
                  <span>⏰ {t} น.</span>
                  {t === '06:00' && <span className="text-[9px] text-emerald-300 font-normal">(เช้า)</span>}
                  {t === '15:35' && <span className="text-[9px] text-emerald-300 font-normal">(บ่าย)</span>}
                  <button
                    onClick={() => handleRemoveTime(t)}
                    className="ml-1 text-emerald-300 hover:text-red-300"
                    title="ลบเวลานี้"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            {/* Add New Time Input */}
            <div className="flex items-center gap-2 pt-1">
              <input 
                type="time" 
                value={newTimeInput}
                onChange={(e) => setNewTimeInput(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                onClick={() => handleAddTime(newTimeInput)}
                disabled={!newTimeInput}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-black rounded-xl transition-all shadow-sm"
              >
                + เพิ่มเวลาเตือน
              </button>
            </div>
            
            {/* Quick Presets */}
            <div className="flex gap-2 text-[10px] text-slate-500 font-medium">
              <span>ทางลัด:</span>
              {!settings.times.includes('06:00') && (
                <button 
                  onClick={() => handleAddTime('06:00')} 
                  className="text-emerald-700 underline font-bold"
                >
                  + 06:00 (เช้า)
                </button>
              )}
              {!settings.times.includes('15:35') && (
                <button 
                  onClick={() => handleAddTime('15:35')} 
                  className="text-emerald-700 underline font-bold"
                >
                  + 15:35 (บ่าย)
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Test Notification Button */}
        <button
          onClick={handleTestClick}
          disabled={isTesting}
          className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white text-xs font-black rounded-2xl shadow-md hover:shadow-lg transition-all active:scale-98 flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <span>{isTesting ? 'กำลังทดสอบระบบ...' : '📲 ทดสอบระบบแจ้งเตือน + เสียงเตือนตอนนี้'}</span>
        </button>

        {/* Test result message */}
        {testResult && (
          <div className="text-xs font-bold text-center p-3 bg-slate-100 rounded-xl text-slate-800 animate-fade-in leading-relaxed border border-slate-200">
            {testResult}
          </div>
        )}

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl transition-colors"
        >
          ปิดหน้าต่าง
        </button>

      </div>
    </div>
  );
};
