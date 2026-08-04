
import React, { useState, useEffect, useCallback, useRef } from 'react';
import ChecklistTable from './components/ChecklistTable';
import StatsPanel from './components/StatsPanel';
import MemberSelector from './components/MemberSelector';
import LeaderSummaryModal from './components/LeaderSummaryModal';
import CelebrationModal from './components/CelebrationModal';
import { NotificationModal } from './components/NotificationModal';
import { ProgressData, DailyReflection, Member, SyncQueueItem } from './types';
import { getDailyMotivation } from './services/geminiService';
import { fetchProgressFromSheets, syncBatchToSheets } from './services/sheetService';
import { TASKS } from './constants';
import { checkAndTriggerScheduledNotification } from './utils/notification';

const App: React.FC = () => {
  const [currentDate, setCurrentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [activeMember, setActiveMember] = useState<Member | null>(null);
  const [showMemberSelector, setShowMemberSelector] = useState(true);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [hasCelebratedToday, setHasCelebratedToday] = useState<Record<string, boolean>>({});

  // ตรวจสอบการแจ้งเตือนตามเวลารายวัน (เช่น 06:00 น.) ทุกๆ 30 วินาที
  useEffect(() => {
    checkAndTriggerScheduledNotification(activeMember?.name);
    const interval = setInterval(() => {
      checkAndTriggerScheduledNotification(activeMember?.name);
    }, 30000);
    return () => clearInterval(interval);
  }, [activeMember?.name]);

  // ใช้ Ref เป็น Master Data ที่เข้าถึงได้ทันที (ป้องกัน State เก่ามาทับ)
  const progressRef = useRef<ProgressData>({});
  
  // โหลดข้อมูลเริ่มต้นอย่างปลอดภัย
  if (Object.keys(progressRef.current).length === 0) {
    try {
      const saved = localStorage.getItem('deen_tracker_v1');
      if (saved) {
        progressRef.current = JSON.parse(saved);
      }
    } catch (e) {
      console.warn("Failed to parse deen_tracker_v1 from localStorage:", e);
    }
  }

  const [progress, setProgressState] = useState<ProgressData>(progressRef.current);
  
  const [syncQueue, setSyncQueue] = useState<SyncQueueItem[]>(() => {
    try {
      const savedQueue = localStorage.getItem('deen_sync_queue');
      return savedQueue ? JSON.parse(savedQueue) : [];
    } catch (e) {
      console.warn("Failed to parse deen_sync_queue from localStorage:", e);
      return [];
    }
  });

  // ป้องกัน Race Condition ระหว่าง Local และ Remote
  const localInteractions = useRef<Record<string, number>>({});
  const isProcessingQueue = useRef(false);
  const debounceTimerRef = useRef<number | null>(null);
  const [lastUpdatedText, setLastUpdatedText] = useState<string>('พร้อมใช้งาน');

  const [reflection, setReflection] = useState<DailyReflection | null>(null);
  const [showLeaderSummary, setShowLeaderSummary] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error' | 'offline'>('idle');
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // บันทึก Queue ลง localStorage สม่ำเสมอ
  useEffect(() => {
    localStorage.setItem('deen_sync_queue', JSON.stringify(syncQueue));
  }, [syncQueue]);

  // ฟังก์ชันผสานข้อมูลจาก Server โดยเคารพข้อมูลที่เพิ่งกดล่าสุด (Grace Period)
  const mergeProgress = useCallback((remote: ProgressData) => {
    const now = Date.now();
    const GRACE_PERIOD = 20000; // 20 วินาที เพื่อความชัวร์ว่า Google Sheets ทันอัปเดต

    let hasChanged = false;
    const nextLocal = { ...progressRef.current };

    Object.keys(remote).forEach(date => {
      if (!nextLocal[date]) nextLocal[date] = {};
      Object.keys(remote[date]).forEach(mId => {
        if (!nextLocal[date][mId]) nextLocal[date][mId] = {};
        Object.keys(remote[date][mId]).forEach(tId => {
          const interactionKey = `${date}|${mId}|${tId}`;
          const lastTouch = localInteractions.current[interactionKey] || 0;
          
          // ถ้าเพิ่งกดไปไม่เกิน 20 วินาที ห้ามเอาค่าจาก Server มาทับเด็ดขาด
          if (now - lastTouch > GRACE_PERIOD) {
            if (nextLocal[date][mId][tId] !== remote[date][mId][tId]) {
              nextLocal[date] = { ...nextLocal[date], [mId]: { ...nextLocal[date][mId], [tId]: remote[date][mId][tId] } };
              hasChanged = true;
            }
          }
        });
      });
    });

    if (hasChanged) {
      progressRef.current = nextLocal;
      localStorage.setItem('deen_tracker_v1', JSON.stringify(nextLocal));
      setProgressState({ ...nextLocal });
    }
    
    setLastUpdatedText(`อัปเดตล่าสุด: ${new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}`);
  }, []);

  const loadGlobalData = useCallback(async (isSilent = false) => {
    if (!isSilent) setSyncStatus('syncing');
    try {
      const remoteData = await fetchProgressFromSheets();
      if (remoteData) {
        mergeProgress(remoteData);
        if (!isSilent) setSyncStatus('success');
      }
    } catch (err) {
      if (!isSilent) setSyncStatus('error');
    } finally {
      setIsInitialLoading(false);
      if (!isSilent) setTimeout(() => setSyncStatus('idle'), 1000);
    }
  }, [mergeProgress]);

  const processQueue = useCallback(async () => {
    if (syncQueue.length === 0 || !navigator.onLine || isProcessingQueue.current) return;

    isProcessingQueue.current = true;
    setSyncStatus('syncing');
    
    // Snapshot the entire queue to process and clear, solving the lingering flash & rollback bugs
    const queueSnapshot = [...syncQueue];
    const snapshotIds = new Set(queueSnapshot.map(i => i.id));
    
    // ดึงเฉพาะรายการล่าสุดต่อ 1 Task เพื่อลดจำนวนการเขียน
    const latestItemsMap = new Map<string, SyncQueueItem>();
    queueSnapshot.forEach(item => {
      const key = `${item.date}|${item.memberId}|${item.taskId}`;
      if (!latestItemsMap.has(key) || item.timestamp > latestItemsMap.get(key)!.timestamp) {
        latestItemsMap.set(key, item);
      }
    });

    const itemsToSync = Array.from(latestItemsMap.values());
    
    try {
      const success = await syncBatchToSheets(itemsToSync.map(i => ({
        date: i.date,
        memberId: i.memberId,
        taskId: i.taskId,
        status: i.status
      })));

      if (success) {
        // Clear all snapshot items from queue upon success to prevent old duplicates from rolling back changes
        setSyncQueue(prev => prev.filter(q => !snapshotIds.has(q.id)));
        setSyncStatus('success');
        // ทิ้งช่วงสั้นลงเพียง 1.5 วินาที แล้วดึงข้อมูลกลับแบบเงียบเบื้องหลัง
        setTimeout(() => loadGlobalData(true), 1500);
      } else {
        setSyncStatus('error');
      }
    } catch (e) {
      setSyncStatus('error');
    } finally {
      isProcessingQueue.current = false;
      setTimeout(() => setSyncStatus('idle'), 1000);
    }
  }, [syncQueue, loadGlobalData]);

  // Debounce การซิงค์เพื่อรวบรวมการกดรัวๆ (ลดเหลือ 300ms เพื่อความรวดเร็วเสมือนบันทึกทันที)
  useEffect(() => {
    if (syncQueue.length > 0 && !isProcessingQueue.current) {
      if (debounceTimerRef.current) window.clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = window.setTimeout(() => {
        processQueue();
      }, 300); 
    }
    return () => {
      if (debounceTimerRef.current) window.clearTimeout(debounceTimerRef.current);
    };
  }, [syncQueue.length, processQueue]);

  useEffect(() => {
    loadGlobalData();
    const interval = setInterval(() => {
      if (syncQueue.length === 0 && !isProcessingQueue.current) loadGlobalData(true);
    }, 60000); 
    return () => clearInterval(interval);
  }, [loadGlobalData, syncQueue.length]);

  const handleToggle = useCallback((date: string, memberId: string, taskId: string) => {
    // ป้องกันการกดถ้าไม่ได้เลือกชื่อตนเอง
    if (!activeMember || activeMember.id !== memberId) return;

    const interactionKey = `${date}|${memberId}|${taskId}`;
    localInteractions.current[interactionKey] = Date.now();

    // ทำงานแบบ Optimistic (เปลี่ยนทันทีใน UI)
    setProgressState(prev => {
      const currentValue = !!(prev[date]?.[memberId]?.[taskId]);
      const newValue = !currentValue;

      // อัปเดต RefMaster เพื่อให้ Sync logic ใช้ค่าใหม่ล่าสุดเสมอ
      const nextProgress = {
        ...prev,
        [date]: {
          ...(prev[date] || {}),
          [memberId]: {
            ...(prev[date]?.[memberId] || {}),
            [taskId]: newValue
          }
        }
      };
      progressRef.current = nextProgress;
      localStorage.setItem('deen_tracker_v1', JSON.stringify(nextProgress));

      // เพิ่มเข้าคิวส่งข้อมูล
      const newItem: SyncQueueItem = {
        id: `${Date.now()}-${Math.random()}`,
        date,
        memberId,
        taskId,
        status: newValue,
        timestamp: Date.now()
      };
      setSyncQueue(q => [...q, newItem]);

      // ตรวจสอบความสำเร็จ 10/10
      if (newValue === true) {
        const memberData = nextProgress[date][memberId];
        const completedCount = Object.keys(memberData).filter(tId => memberData[tId]).length;
        if (completedCount === TASKS.length) {
          const userCelebrationKey = `${date}-${memberId}`;
          if (!hasCelebratedToday[userCelebrationKey]) {
            setTimeout(() => setShowCelebration(true), 600);
            setHasCelebratedToday(h => ({ ...h, [userCelebrationKey]: true }));
          }
        }
      }

      return nextProgress;
    });
  }, [activeMember, hasCelebratedToday]);

  useEffect(() => {
    let isMounted = true;
    const fetchReflection = async () => {
      const res = await getDailyMotivation(currentDate, activeMember?.id || 'default');
      if (isMounted) setReflection(res);
    };
    fetchReflection();
    return () => { isMounted = false; };
  }, [currentDate, activeMember?.id]);

  const handleMemberSelect = (m: Member) => {
    setActiveMember(m);
    setShowMemberSelector(false);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-24 font-['Anuphan'] selection:bg-emerald-200 no-select">
      {isInitialLoading && (
        <div className="fixed inset-0 z-[1000] bg-emerald-950 flex flex-col items-center justify-center text-white">
          <div className="w-12 h-12 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mb-6"></div>
          <p className="font-black text-sm tracking-[0.3em] uppercase opacity-50">DeenTracker Loading...</p>
        </div>
      )}

      {showMemberSelector && (
        <MemberSelector 
          onSelect={handleMemberSelect} 
          onLeaderAccess={() => { setShowMemberSelector(false); setShowLeaderSummary(true); }}
        />
      )}
      
      {showLeaderSummary && (
        <LeaderSummaryModal currentDate={currentDate} progress={progress} onClose={() => setShowLeaderSummary(false)} />
      )}

      {showCelebration && (
        <CelebrationModal onClose={() => setShowCelebration(false)} />
      )}

      {showNotificationModal && (
        <NotificationModal 
          onClose={() => setShowNotificationModal(false)} 
          activeMemberName={activeMember?.name}
        />
      )}

      <header className="bg-emerald-950/90 text-white px-4 py-2.5 shadow-md sticky top-0 z-[50] border-b border-white/5 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="w-8.5 h-8.5 bg-white/10 rounded-xl flex items-center justify-center border border-white/10 shadow-inner backdrop-blur-sm relative">
               <svg className="w-5 h-5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" strokeDasharray="3 2" className="opacity-30" />
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" strokeWidth="3" className="text-white" />
              </svg>
              {syncStatus === 'syncing' && (
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-amber-400 rounded-full border border-emerald-950 animate-pulse"></div>
              )}
            </div>
            <div className="flex flex-col items-start min-w-0">
              <h1 className="text-base font-black tracking-tight leading-none">DEENTRACKER</h1>
              <p className="text-[5px] text-white/30 font-bold whitespace-nowrap leading-none mt-1 uppercase w-full" style={{ textAlignLast: 'justify' }}>
                Create & Design By: Afitree Yamaenoh
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 md:gap-2">
            <span className="text-[9px] font-black uppercase tracking-wider text-emerald-400/80 bg-white/5 border border-white/5 rounded-lg px-2 py-1 hidden md:inline-block">
              {syncStatus === 'syncing' ? 'กำลังบันทึก...' : lastUpdatedText}
            </span>
            <button 
              onClick={() => setShowMemberSelector(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-black rounded-lg transition-all active:scale-95 shadow-sm hover:shadow-md border border-amber-400/20 group"
              title="คลิกเพื่อสลับผู้ใช้"
            >
              <svg className="w-3.5 h-3.5 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="max-w-[70px] sm:max-w-[120px] truncate">
                {activeMember ? activeMember.name : 'สลับผู้ใช้'}
              </span>
              <div className="flex items-center pl-1 ml-0.5 border-l border-white/20 opacity-80 group-hover:opacity-100 transition-opacity">
                <svg className="w-3 h-3 text-amber-100 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>
            <button 
              onClick={() => setShowNotificationModal(true)}
              className="p-2 bg-white/5 hover:bg-white/10 text-emerald-300 hover:text-emerald-200 rounded-lg transition-colors border border-white/5 active:scale-95 flex items-center justify-center relative"
              title="ตั้งค่าแจ้งเตือน 06:00 น."
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full animate-ping"></span>
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full"></span>
            </button>
            <button 
              onClick={() => loadGlobalData()}
              className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors border border-white/5 active:scale-95 flex items-center justify-center"
              title="รีเฟรชข้อมูล"
            >
              <svg className={`w-4 h-4 ${syncStatus === 'syncing' ? 'animate-spin opacity-50' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357-2H15" /></svg>
            </button>
          </div>
        </div>
        <div className={`absolute bottom-0 left-0 h-[1.5px] bg-emerald-400 transition-all duration-1000 ${syncStatus === 'syncing' ? 'w-full opacity-100' : 'w-0 opacity-0'}`}></div>
      </header>

      <main className="max-w-6xl mx-auto px-4 pt-6 space-y-6">
        <section className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 relative overflow-hidden">
          {reflection ? (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-700 relative z-10">
              <div className="flex justify-between items-start gap-4 mb-3">
                <p className="text-xl md:text-2xl font-black text-slate-800 leading-tight">"{reflection.quote}"</p>
                {activeMember && (
                   <div className="flex flex-col items-end flex-shrink-0 bg-emerald-50 px-3 py-2 rounded-2xl border border-emerald-100">
                      <span className="text-[8px] font-black text-emerald-600/60 uppercase tracking-tighter">เข้าใช้โดย</span>
                      <span className="text-emerald-900 font-black text-sm">{activeMember.name}</span>
                   </div>
                )}
              </div>
              <p className="text-emerald-600 font-black text-[10px] uppercase tracking-[0.2em] mb-2">{reflection.reference}</p>
              <p className="text-slate-500 text-xs font-medium italic">{reflection.message}</p>
            </div>
          ) : (
            <div className="animate-pulse flex flex-col gap-3 py-4">
              <div className="h-6 bg-slate-100 rounded-full w-3/4"></div>
              <div className="h-4 bg-slate-50 rounded-full w-1/2 mt-4"></div>
            </div>
          )}
        </section>

        <ChecklistTable 
          currentDate={currentDate} 
          onDateChange={setCurrentDate}
          progress={progress} 
          activeMemberId={activeMember?.id || null}
          onToggle={handleToggle}
          onOpenSelector={() => setShowMemberSelector(true)}
          syncQueue={syncQueue}
        />
        
        <StatsPanel currentDate={currentDate} progress={progress} />
      </main>

      {syncStatus === 'error' && (
        <div className="fixed bottom-6 right-6 z-[100] animate-in slide-in-from-right duration-300">
          <div className="bg-red-600 text-white px-4 py-2 rounded-xl shadow-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            การซิงค์ผิดพลาด จะลองใหม่เร็วๆ นี้
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
