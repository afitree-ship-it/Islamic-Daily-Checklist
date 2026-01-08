
import React, { useState, useEffect, useCallback, useRef } from 'react';
import ChecklistTable from './components/ChecklistTable';
import StatsPanel from './components/StatsPanel';
import MemberSelector from './components/MemberSelector';
import LeaderSummaryModal from './components/LeaderSummaryModal';
import CelebrationModal from './components/CelebrationModal';
import { ProgressData, DailyReflection, Member, SyncQueueItem } from './types';
import { getDailyMotivation } from './services/geminiService';
import { fetchProgressFromSheets, syncBatchToSheets } from './services/sheetService';
import { TASKS } from './constants';

const App: React.FC = () => {
  const [currentDate, setCurrentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [activeMember, setActiveMember] = useState<Member | null>(null);
  const [showMemberSelector, setShowMemberSelector] = useState(true);
  const [showCelebration, setShowCelebration] = useState(false);
  const [hasCelebratedToday, setHasCelebratedToday] = useState<Record<string, boolean>>({});

  // ใช้ Ref เป็น Master Data ที่เข้าถึงได้ทันที (ป้องกัน State เก่ามาทับ)
  // แก้ไขการกำหนดค่าเริ่มต้นของ useRef ให้ถูกต้องเพื่อป้องกันข้อผิดพลาด Expected 1 arguments, but got 2.
  const progressRef = useRef<ProgressData>(
    JSON.parse(localStorage.getItem('deen_tracker_v1') || '{}')
  );

  const [progress, setProgressState] = useState<ProgressData>(progressRef.current);
  
  const [syncQueue, setSyncQueue] = useState<SyncQueueItem[]>(() => {
    const savedQueue = localStorage.getItem('deen_sync_queue');
    return savedQueue ? JSON.parse(savedQueue) : [];
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
    
    // ดึงเฉพาะรายการล่าสุดต่อ 1 Task เพื่อลดจำนวนการเขียน
    const latestItemsMap = new Map<string, SyncQueueItem>();
    syncQueue.forEach(item => {
      const key = `${item.date}|${item.memberId}|${item.taskId}`;
      if (!latestItemsMap.has(key) || item.timestamp > latestItemsMap.get(key)!.timestamp) {
        latestItemsMap.set(key, item);
      }
    });

    const itemsToSync = Array.from(latestItemsMap.values());
    const queueIdsToRemove = itemsToSync.map(i => i.id);
    
    try {
      const success = await syncBatchToSheets(itemsToSync.map(i => ({
        date: i.date,
        memberId: i.memberId,
        taskId: i.taskId,
        status: i.status
      })));

      if (success) {
        setSyncQueue(prev => prev.filter(q => !queueIdsToRemove.includes(q.id)));
        setSyncStatus('success');
        // ทิ้งช่วง 3 วินาทีให้ Server บันทึกเสร็จแล้วค่อยดึงกลับมาใหม่
        setTimeout(() => loadGlobalData(true), 3000);
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

  // Debounce การซิงค์เพื่อรวบรวมการกดรัวๆ
  useEffect(() => {
    if (syncQueue.length > 0 && !isProcessingQueue.current) {
      if (debounceTimerRef.current) window.clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = window.setTimeout(() => {
        processQueue();
      }, 2000); 
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
      const res = await getDailyMotivation(`วันที่: ${currentDate}`);
      if (isMounted) setReflection(res);
    };
    fetchReflection();
    return () => { isMounted = false; };
  }, [currentDate]);

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

      <header className="bg-emerald-950 text-white px-4 py-4 shadow-2xl sticky top-0 z-[50] border-b border-white/5 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/10 shadow-inner backdrop-blur-sm relative">
               <svg className="w-6 h-6 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" strokeDasharray="3 2" className="opacity-30" />
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" strokeWidth="3" className="text-white" />
              </svg>
              {syncStatus === 'syncing' && (
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-amber-400 rounded-full border-2 border-emerald-950 animate-pulse"></div>
              )}
            </div>
            <div className="flex flex-col items-start min-w-0">
              <h1 className="text-xl font-black tracking-tighter leading-none">DEENTRACKER</h1>
              <p className="text-[5px] text-white/20 font-bold whitespace-nowrap leading-none mt-1 uppercase w-full" style={{ textAlignLast: 'justify' }}>
                Create & Design By: Afitree Yamaenoh
              </p>
              <div className="flex items-center gap-1.5 mt-1.5">
                <p className="text-[8px] font-bold uppercase tracking-widest text-emerald-400/60">
                  {syncStatus === 'syncing' ? 'กำลังบันทึก...' : lastUpdatedText}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => loadGlobalData()}
              className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-colors border border-white/5 active:scale-95"
            >
              <svg className={`w-5 h-5 ${syncStatus === 'syncing' ? 'animate-spin opacity-50' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357-2H15" /></svg>
            </button>
          </div>
        </div>
        <div className={`absolute bottom-0 left-0 h-[2px] bg-emerald-400 transition-all duration-1000 ${syncStatus === 'syncing' ? 'w-full opacity-100' : 'w-0 opacity-0'}`}></div>
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
