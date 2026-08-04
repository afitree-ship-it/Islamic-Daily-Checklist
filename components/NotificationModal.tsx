import React, { useState, useEffect } from 'react';
import { 
  getNotificationPermissionStatus, 
  requestNotificationPermission, 
  getNotificationSettings, 
  saveNotificationSettings, 
  sendTestNotification,
  isNotificationSupported,
  isIOS,
  isIOSStandalone,
  isIOSInAppBrowser,
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
    times: ['06:00', '15:35'],
    lastNotifiedMap: {}
  });
  const [newTimeInput, setNewTimeInput] = useState('15:35');
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const onIOS = isIOS();
  const onIOSApp = isIOSStandalone();
  const onIOSInApp = isIOSInAppBrowser();

  useEffect(() => {
    setPermission(getNotificationPermissionStatus());
    setSettings(getNotificationSettings());
  }, []);

  const handleEnablePermission = async () => {
    const granted = await requestNotificationPermission();
    setPermission(getNotificationPermissionStatus());
    if (granted) {
      saveNotificationSettings({ enabled: true });
      setSettings(prev => ({ ...prev, enabled: true }));
      setTestResult('✅ อนุญาตการแจ้งเตือนเรียบร้อยแล้ว!');
    } else {
      if (onIOS && !onIOSApp) {
        setTestResult('⚠️ ระบบ iOS ของ Apple กำหนดให้ต้อง "เพิ่มไปยังหน้าจอโฮม" ก่อนเปิดรับแจ้งเตือน หรือกดปุ่มบันทึกลงปฏิทิน iPhone ด้านล่าง');
      } else {
        setTestResult('⚠️ ไม่ได้รับการอนุญาตแจ้งเตือน กรุณาเปิดสิทธิ์ในการตั้งค่าเบราว์เซอร์/มือถือ');
      }
    }
  };

  const handleToggleEnabled = (e: React.ChangeEvent<HTMLInputElement>) => {
    const enabled = e.target.checked;
    saveNotificationSettings({ enabled });
    setSettings(prev => ({ ...prev, enabled }));
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
    const success = await sendTestNotification();
    setIsTesting(false);
    if (success) {
      setTestResult('🎉 ส่งการแจ้งเตือนทดสอบเรียบร้อยแล้ว! ตรวจสอบที่หน้าจอมือถือของคุณได้เลย');
    } else {
      if (onIOS && !onIOSApp) {
        setTestResult('⚠️ iOS Safari กำหนดให้ติดตั้งหน้าจอโฮมก่อน หรือใช้ปุ่ม "บันทึกลงปฏิทิน iPhone" เพื่อเตือนได้ 100%');
      } else {
        setTestResult('⚠️ ไม่สามารถส่งการแจ้งเตือนได้ กรุณาตรวจสอบว่าได้เปิดสิทธิ์แจ้งเตือนแล้วหรือยัง');
      }
    }
  };

  const handleDownloadCalendar = () => {
    downloadCalendarICS(settings.times);
    setTestResult('📅 ดาวน์โหลดไฟล์ปฏิทินสำเร็จ! กดเปิดไฟล์เพื่อ "บันทึกปฏิทิน" ลง iPhone/iPad ได้ทันที');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-100 flex flex-col gap-4.5 relative overflow-hidden max-h-[90vh] overflow-y-auto">
        
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
              <p className="text-xs text-slate-500 font-medium">เตือนเช็คลิสต์บนมือถือ (06:00 น. & 15:35 น.)</p>
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

        {/* Special Banner for iOS / iPhone users */}
        {onIOS && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-2xl p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-blue-900 flex items-center gap-1.5">
                <span> คำแนะนำพิเศษสำหรับ iPhone / iPad</span>
              </span>
              <span className="text-[10px] bg-blue-200/60 text-blue-800 px-2 py-0.5 rounded-full font-black">
                iOS Solution
              </span>
            </div>
            <p className="text-[11px] text-blue-800 leading-relaxed font-medium">
              ข้อจำกัดของ Apple iOS บนเบราว์เซอร์จะไม่ยอมให้แอปส่งการแจ้งเตือนตรงๆ จนกว่าจะทำ 1 ใน 2 วิธีนี้:
            </p>

            {/* iOS Solution 1: Add to Calendar */}
            <button
              onClick={handleDownloadCalendar}
              className="w-full py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-md transition-all active:scale-98 flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>📅 วิธีที่ 1: เพิ่มลงปฏิทิน iPhone (แนะนำ เตือนได้ 100%)</span>
            </button>

            {/* iOS Solution 2: Add to Home Screen Step-by-Step */}
            <div className="bg-white/80 backdrop-blur-sm p-3 rounded-xl border border-blue-100 text-[10px] text-slate-700 space-y-1">
              <div className="font-bold text-blue-900">📲 วิธีที่ 2: เพิ่มลงหน้าจอโฮม (PWA Web Push):</div>
              <ol className="list-decimal pl-4 space-y-0.5 leading-snug">
                {onIOSInApp && <li>กดเมนูมุมขวาบน เลือก <strong>"เปิดใน Safari"</strong> ก่อน</li>}
                <li>ใน Safari ให้กดปุ่ม <strong>"แชร์"</strong> (ไอคอนรูปสี่เหลี่ยมมีลูกศรชี้ขึ้น ⎘)</li>
                <li>เลื่อนลงแล้วเลือก <strong>"เพิ่มไปยังหน้าจอโฮม"</strong> (Add to Home Screen ➕)</li>
                <li>เปิดแอป DeenTracker จากหน้าจอโฮม แล้วมากดปุ่มเปิดสิทธิ์แจ้งเตือนที่นี่อีกครั้ง</li>
              </ol>
            </div>
          </div>
        )}

        {/* Permission Status Box */}
        {!isNotificationSupported() ? (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl p-4 text-xs font-medium">
            ⚠️ เบราว์เซอร์นี้ไม่รองรับ Web Notifications โดยตรง สามารถกดปุ่มเพิ่มลงปฏิทินมือถือด้านล่างเพื่อรับแจ้งเตือนได้แทน
          </div>
        ) : permission !== 'granted' ? (
          <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex items-start gap-2.5">
              <span className="text-lg">🔔</span>
              <div className="text-xs text-amber-900 leading-relaxed font-medium">
                กดเปิดสิทธิ์การแจ้งเตือน เพื่อให้แอปส่งการแจ้งเตือนเช็คลิสต์เวลา {settings.times.join(' น. และ ')} น. บนมือถือ
              </div>
            </div>
            <button
              onClick={handleEnablePermission}
              className="w-full py-2.5 px-4 bg-emerald-950 hover:bg-emerald-900 text-white text-xs font-black rounded-xl shadow-md transition-all active:scale-98 flex items-center justify-center gap-2"
            >
              <span>เปิดสิทธิ์การแจ้งเตือนบนมือถือ</span>
            </button>
          </div>
        ) : (
          <div className="bg-emerald-50 border border-emerald-200/80 text-emerald-900 rounded-2xl p-3.5 flex items-center justify-between text-xs font-bold">
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></span>
              เปิดรับการแจ้งเตือนเรียบร้อยแล้ว
            </span>
            <span className="text-[10px] bg-emerald-200/60 text-emerald-800 px-2 py-0.5 rounded-full font-black">
              พร้อมใช้งาน
            </span>
          </div>
        )}

        {/* Settings Form */}
        <div className="space-y-4 bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black text-slate-700 flex items-center gap-2">
              <span>เปิดระบบเตือนทำเช็คลิสต์</span>
            </label>
            <input 
              type="checkbox"
              checked={settings.enabled}
              onChange={handleToggleEnabled}
              disabled={permission !== 'granted'}
              className="w-5 h-5 accent-emerald-600 rounded cursor-pointer"
            />
          </div>

          <div className="pt-2 border-t border-slate-200/60 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-black text-slate-700">เวลาแจ้งเตือนในแต่ละวัน</div>
                <div className="text-[10px] text-slate-500 font-medium">กำหนดเวลาแจ้งเตือนรายวันบนมือถือ</div>
              </div>
            </div>

            {/* List of Notification Times */}
            <div className="flex flex-wrap gap-2 pt-1">
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
                    disabled={!settings.enabled || permission !== 'granted'}
                    className="ml-1 text-emerald-300 hover:text-red-300 disabled:opacity-40"
                    title="ลบเวลานี้"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            {/* Add New Time Section */}
            <div className="flex items-center gap-2 pt-2">
              <input 
                type="time" 
                value={newTimeInput}
                onChange={(e) => setNewTimeInput(e.target.value)}
                disabled={!settings.enabled || permission !== 'granted'}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
              />
              <button
                onClick={() => handleAddTime(newTimeInput)}
                disabled={!settings.enabled || permission !== 'granted' || !newTimeInput}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-black rounded-xl transition-all shadow-sm"
              >
                + เพิ่มเวลาเตือน
              </button>
            </div>
            
            {/* Quick Presets */}
            <div className="flex gap-2 text-[10px] text-slate-500 font-medium pt-1">
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
        {permission === 'granted' && (
          <button
            onClick={handleTestClick}
            disabled={isTesting}
            className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white text-xs font-black rounded-2xl shadow-md hover:shadow-lg transition-all active:scale-98 flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <span>{isTesting ? 'กำลังส่งการแจ้งเตือน...' : '📲 ทดสอบส่งการแจ้งเตือนไปยังมือถือตอนนี้'}</span>
          </button>
        )}

        {/* Test result message */}
        {testResult && (
          <div className="text-xs font-bold text-center p-2.5 bg-slate-100 rounded-xl text-slate-700 animate-fade-in leading-relaxed">
            {testResult}
          </div>
        )}

        {/* General Mobile Setup Guide Tip */}
        {!onIOS && (
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/60 space-y-1.5 text-[11px] text-slate-600">
            <div className="font-black text-slate-800 flex items-center gap-1.5">
              <span>💡 คำแนะนำสำหรับมือถือ Android:</span>
            </div>
            <p className="leading-relaxed">
              เมื่อกดอนุญาต การแจ้งเตือนจะส่งไปยังหน้าจอมือถือของคุณโดยตรงตามเวลาที่ตั้งไว้ ({settings.times.join(' น. และ ')} น.)
            </p>
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
