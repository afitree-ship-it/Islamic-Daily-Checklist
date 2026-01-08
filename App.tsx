
import React, { useState, useEffect, useCallback, useRef } from 'react';
import ChecklistTable from './components/ChecklistTable';
import StatsPanel from './components/StatsPanel';
import MemberSelector from './components/MemberSelector';
import LeaderSummaryModal from './components/LeaderSummaryModal';
import { ProgressData, DailyReflection, Member, SyncQueueItem } from './types';
import { getDailyMotivation } from './services/geminiService';
import { syncProgressToSheets, fetchProgressFromSheets } from './services/sheetService';

const App: React.FC = () => {
  const [currentDate, setCurrentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [activeMember, setActiveMember] = useState<Member | null>(null);
  const [showMemberSelector, setShowMemberSelector] = useState(true);
  
  // สถานะข้อมูลในหน้าจอ (รวมผลลัพธ์จากเซิร์ฟเวอร์และที่กดสดๆ)
  const [progress, setProgress] = useState<ProgressData>(() => {
    const saved = localStorage.getItem('deen_tracker_v1');
    return saved ? JSON.parse(saved) : {};
  });
  
  // คิวงานที่รอส่ง (สำหรับ Offline Support)
  const [syncQueue, setSyncQueue] = useState<SyncQueueItem[]>(() => {
    const savedQueue = localStorage.getItem('deen_sync_queue');
    return savedQueue ? JSON.parse(savedQueue) : [];
  });

  // ตัวแปรเก็บเวลาล่าสุดที่มีการกด เพื่อใช้ป้องกันข้อมูลเก่าจากเซิร์ฟเวอร์มาทับ (Grace Period)
  const localInteractions = useRef<Record<string, number>>({});

  const [reflection, setReflection] = useState<DailyReflection | null>(null);
  const [showLeaderSummary, setShowLeaderSummary] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error' | 'offline'>('idle');
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // บันทึกสถานะลง LocalStorage สม่ำเสมอ
  useEffect(() => {
    localStorage.setItem('deen_tracker_v1', JSON.stringify(progress));
  }, [progress]);

  useEffect(() => {
    localStorage.setItem('deen_sync_queue', JSON.stringify(syncQueue));
  }, [syncQueue]);

  // ฟังก์ชันผสานข้อมูล (Smart Merge) ที่เน้นความเชื่อถือได้
  const mergeProgress = useCallback((remote: ProgressData) => {
    const now = Date.now();
    const GRACE_PERIOD = 45000; // 45 วินาที (รอให้เซิร์ฟเวอร์ Google รับข้อมูลและอัปเดตสถานะให้เรียบร้อย)

    setProgress(prev => {
      const next = { ...prev };

      // 1. นำข้อมูลจาก Remote มาใส่
      Object.keys(remote).forEach(date => {
        if (!next[date]) next[date] = {};
        Object.keys(remote[date]).forEach(mId => {
          if (!next[date][mId]) next[date][mId] = {};
          
          Object.keys(remote[date][mId]).forEach(tId => {
            const interactionKey = `${date}|${mId}|${tId}`;
            const lastTouch = localInteractions.current[interactionKey] || 0;

            // กฎเหล็ก: ถ้าในเครื่องพึ่งมีการกด (ไม่เกิน 45 วิ) "ห้าม" เอาค่าจากเซิร์ฟเวอร์มาทับเด็ดขาด
            if (now - lastTouch > GRACE_PERIOD) {
              next[date][mId][tId] = remote[date][mId][tId];
            }
          });
        });
      });

      return next;
    });
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
      setTimeout(() => setSyncStatus(prev => prev === 'syncing' ? 'idle' : prev), 2000);
    }
  }, [mergeProgress]);

  // ระบบระบายคิว (Process Queue) - พยายามระบายทั้งหมดให้เร็วที่สุด
  const processQueue = useCallback(async () => {
    if (syncQueue.length === 0 || !navigator.onLine) return;

    const queueToProcess = [...syncQueue];
    setSyncStatus('syncing');

    for (const item of queueToProcess) {
      try {
        const success = await syncProgressToSheets(item.date, item.memberId, item.taskId, item.status);
        if (success) {
          setSyncQueue(prev => prev.filter(q => q.id !== item.id));
        }
      } catch (error) {
        setSyncStatus('offline');
        break; // หยุดถ้ามีปัญหาเน็ต
      }
    }
    setSyncStatus('success');
  }, [syncQueue]);

  // พยายามซิงค์คิวทุกๆ 3 วินาที (ถ้ามีค้าง)
  useEffect(() => {
    const interval = setInterval(() => {
      if (syncQueue.length > 0) processQueue();
    }, 3000);
    return () => clearInterval(interval);
  }, [syncQueue, processQueue]);

  // ดึงข้อมูลใหม่จากเพื่อนๆ ทุก 15 วินาที
  useEffect(() => {
    loadGlobalData();
    const interval = setInterval(() => loadGlobalData(true), 15000);
    return () => clearInterval(interval);
  }, [loadGlobalData]);

  // กดติ้ก (Update UI ทันที และจดจำเวลาที่กด)
  const handleToggle = useCallback((date: string, memberId: string, taskId: string) => {
    if (!activeMember || activeMember.id !== memberId) return;

    const interactionKey = `${date}|${memberId}|${taskId}`;
    const currentValue = !!progress[date]?.[memberId]?.[taskId];
    const newValue = !currentValue;
    
    // บันทึกเวลาที่กดลงใน Ref ทันที
    localInteractions.current[interactionKey] = Date.now();

    // 1. Update UI ทันที
    setProgress(prev => {
      const next = { ...prev };
      if (!next[date]) next[date] = {};
      if (!next[date][memberId]) next[date][memberId] = {};
      next[date][memberId][taskId] = newValue;
      return next;
    });

    // 2. เพิ่มลงคิวเพื่อส่งไปเซิร์ฟเวอร์
    const newItem: SyncQueueItem = {
      id: `${Date.now()}-${interactionKey}`,
      date,
      memberId,
      taskId,
      status: newValue,
      timestamp: Date.now()
    };
    
    setSyncQueue(prev => {
      // ป้องกันคิวซ้ำซ้อนสำหรับจุดเดียวกัน (เอาอันล่าสุดเท่านั้น)
      const filtered = prev.filter(q => `${q.date}|${q.memberId}|${q.taskId}` !== interactionKey);
      return [...filtered, newItem];
    });

    // เริ่มส่งทันทีไม่ต้องรอ Interval
    setSyncStatus('syncing');
  }, [activeMember, progress]);

  useEffect(() => {
    const fetchReflection = async () => {
      const res = await getDailyMotivation(`วันที่: ${currentDate}, สรุปกลุ่ม: ${JSON.stringify(progress[currentDate] || {})}`);
      setReflection(res);
    };
    fetchReflection();
  }, [currentDate, activeMember]);

  const handleMemberSelect = (m: Member) => {
    setActiveMember(m);
    setShowMemberSelector(false);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-24 font-['Anuphan'] selection:bg-emerald-200">
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

      <header className="bg-emerald-950 text-white px-4 py-4 shadow-2xl sticky top-0 z-[50] border-b border-white/5 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-800/40 rounded-xl flex items-center justify-center border border-white/10">🕌</div>
            <div>
              <h1 className="text-xl font-black tracking-tighter leading-none">DEENTRACKER</h1>
              <div className="flex items-center gap-2 mt-1">
                <div className={`w-1.5 h-1.5 rounded-full ${syncQueue.length > 0 ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`}></div>
                <p className="text-[8px] font-bold uppercase tracking-widest text-emerald-400">
                  {syncQueue.length > 0 ? `รอนำส่ง ${syncQueue.length} รายการ...` : 'เชื่อมต่อเซิร์ฟเวอร์แล้ว'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => loadGlobalData()}
              className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-colors border border-white/5"
            >
              <svg className={`w-4 h-4 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            </button>
            <input 
              type="date" 
              value={currentDate}
              onChange={(e) => setCurrentDate(e.target.value)}
              className="bg-emerald-900/50 text-white text-[10px] font-black py-2 px-3 rounded-xl border border-white/10 outline-none w-32"
            />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 pt-6 space-y-6">
        <section className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 relative overflow-hidden">
          {reflection ? (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-700 relative z-10">
              <div className="flex justify-between items-start gap-4 mb-3">
                <p className="text-xl md:text-2xl font-black text-slate-800 leading-tight">"{reflection.quote}"</p>
                {activeMember && (
                   <div className="flex flex-col items-end flex-shrink-0 bg-emerald-50 px-3 py-2 rounded-2xl border border-emerald-100">
                      <span className="text-[8px] font-black text-emerald-600/60 uppercase tracking-tighter">กำลังบันทึกโดย</span>
                      <span className="text-emerald-900 font-black text-sm">{activeMember.name}</span>
                   </div>
                )}
              </div>
              <p className="text-emerald-600 font-black text-[10px] uppercase tracking-[0.2em] mb-2">{reflection.reference}</p>
              <p className="text-slate-500 text-xs font-medium italic">{reflection.message}</p>
            </div>
          ) : (
            <div className="animate-pulse flex flex-col gap-3">
              <div className="h-6 bg-slate-100 rounded-full w-3/4"></div>
              <div className="h-10 bg-slate-50 rounded-2xl w-full"></div>
            </div>
          )}
        </section>

        <ChecklistTable 
          currentDate={currentDate} 
          progress={progress} 
          activeMemberId={activeMember?.id || null}
          onToggle={handleToggle}
          onOpenSelector={() => setShowMemberSelector(true)}
          syncQueue={syncQueue}
        />
        
        <StatsPanel currentDate={currentDate} progress={progress} />
      </main>

      {syncQueue.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100]">
          <div className="bg-amber-500 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 text-xs font-black uppercase tracking-widest">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            กำลังบันทึก {syncQueue.length} รายการลงคลาวด์...
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
