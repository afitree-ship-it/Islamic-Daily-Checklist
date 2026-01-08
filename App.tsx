
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
  
  // เก็บสถานะว่าผู้ใช้ปัจจุบันได้เห็นการฉลองของวันนี้ไปแล้วหรือยัง เพื่อไม่ให้เด้งซ้ำซ้อน
  const [hasCelebratedToday, setHasCelebratedToday] = useState<Record<string, boolean>>({});

  const [progress, setProgress] = useState<ProgressData>(() => {
    const saved = localStorage.getItem('deen_tracker_v1');
    return saved ? JSON.parse(saved) : {};
  });
  
  const [syncQueue, setSyncQueue] = useState<SyncQueueItem[]>(() => {
    const savedQueue = localStorage.getItem('deen_sync_queue');
    return savedQueue ? JSON.parse(savedQueue) : [];
  });

  const localInteractions = useRef<Record<string, number>>({});
  const isProcessingQueue = useRef(false);
  const queueTimeoutRef = useRef<number | null>(null);
  const [lastUpdatedText, setLastUpdatedText] = useState<string>('รอดึงข้อมูล...');

  const [reflection, setReflection] = useState<DailyReflection | null>(null);
  const [showLeaderSummary, setShowLeaderSummary] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error' | 'offline'>('idle');
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  useEffect(() => {
    localStorage.setItem('deen_tracker_v1', JSON.stringify(progress));
  }, [progress]);

  useEffect(() => {
    localStorage.setItem('deen_sync_queue', JSON.stringify(syncQueue));
  }, [syncQueue]);

  const mergeProgress = useCallback((remote: ProgressData) => {
    const now = Date.now();
    const GRACE_PERIOD = 5000; 

    setProgress(prev => {
      const next = { ...prev };
      Object.keys(remote).forEach(date => {
        if (!next[date]) next[date] = {};
        Object.keys(remote[date]).forEach(mId => {
          if (!next[date][mId]) next[date][mId] = {};
          Object.keys(remote[date][mId]).forEach(tId => {
            const interactionKey = `${date}|${mId}|${tId}`;
            const hasInQueue = syncQueue.some(q => `${q.date}|${q.memberId}|${q.taskId}` === interactionKey);
            const lastTouch = localInteractions.current[interactionKey] || 0;
            
            if (!hasInQueue && (now - lastTouch > GRACE_PERIOD)) {
              next[date][mId][tId] = remote[date][mId][tId];
            }
          });
        });
      });
      return { ...next };
    });
    setLastUpdatedText(`ซิงค์ล่าสุด: ${new Date().toLocaleTimeString('th-TH')}`);
  }, [syncQueue]);

  const loadGlobalData = useCallback(async (isSilent = false) => {
    if (!isSilent) setSyncStatus('syncing');
    try {
      const remoteData = await fetchProgressFromSheets();
      if (remoteData) {
        mergeProgress(remoteData);
        if (!isSilent) setSyncStatus('success');
      } else {
        if (!isSilent) setSyncStatus('error');
      }
    } catch (err) {
      console.error("Load Global Data Error:", err);
      if (!isSilent) setSyncStatus('error');
    } finally {
      setIsInitialLoading(false);
      if (!isSilent) setTimeout(() => setSyncStatus('idle'), 2000);
    }
  }, [mergeProgress]);

  const processQueue = useCallback(async () => {
    if (syncQueue.length === 0 || !navigator.onLine || isProcessingQueue.current) return;

    isProcessingQueue.current = true;
    setSyncStatus('syncing');
    
    const uniqueTasks = new Map<string, SyncQueueItem>();
    syncQueue.forEach(item => {
      const key = `${item.date}|${item.memberId}|${item.taskId}`;
      if (!uniqueTasks.has(key) || item.timestamp > uniqueTasks.get(key)!.timestamp) {
        uniqueTasks.set(key, item);
      }
    });

    const itemsToSync = Array.from(uniqueTasks.values());
    
    try {
      const success = await syncBatchToSheets(itemsToSync.map(i => ({
        date: i.date,
        memberId: i.memberId,
        taskId: i.taskId,
        status: i.status
      })));

      if (success) {
        const processedTimestamp = Math.max(...itemsToSync.map(i => i.timestamp));
        setSyncQueue(prev => prev.filter(q => q.timestamp > processedTimestamp));
        setSyncStatus('success');
        setTimeout(() => loadGlobalData(true), 300);
      } else {
        setSyncStatus('error');
      }
    } catch (e) {
      console.error("Batch sync failed:", e);
      setSyncStatus('error');
    } finally {
      isProcessingQueue.current = false;
      setTimeout(() => setSyncStatus('idle'), 2000);
    }
  }, [syncQueue, loadGlobalData]);

  useEffect(() => {
    const interval = setInterval(processQueue, 5000);
    return () => clearInterval(interval);
  }, [processQueue]);

  useEffect(() => {
    loadGlobalData();
    const interval = setInterval(() => {
      if (syncQueue.length === 0) loadGlobalData(true);
    }, 25000); 
    return () => clearInterval(interval);
  }, [loadGlobalData, syncQueue.length]);

  const handleToggle = useCallback((date: string, memberId: string, taskId: string) => {
    if (!activeMember || activeMember.id !== memberId) return;

    const interactionKey = `${date}|${memberId}|${taskId}`;
    const currentValue = !!progress[date]?.[memberId]?.[taskId];
    const newValue = !currentValue;
    
    localInteractions.current[interactionKey] = Date.now();

    // เช็คจำนวนที่สำเร็จหลังจากเลือก (Optimistic Update)
    const currentMemberData = progress[date]?.[memberId] || {};
    const willBeCompletedCount = Object.keys(currentMemberData).filter(tId => tId !== taskId && currentMemberData[tId]).length + (newValue ? 1 : 0);

    // ฉลองเมื่อครบ 10/10 และเป็นครั้งแรกของวันนั้นๆ สำหรับสมาชิกคนนั้น
    const userCelebrationKey = `${date}-${memberId}`;
    if (willBeCompletedCount === TASKS.length && !currentValue && !hasCelebratedToday[userCelebrationKey]) {
      setShowCelebration(true);
      setHasCelebratedToday(prev => ({ ...prev, [userCelebrationKey]: true }));
    }

    setProgress(prev => ({
      ...prev,
      [date]: {
        ...(prev[date] || {}),
        [memberId]: {
          ...(prev[date]?.[memberId] || {}),
          [taskId]: newValue
        }
      }
    }));

    const newItem: SyncQueueItem = {
      id: `${Date.now()}-${interactionKey}`,
      date,
      memberId,
      taskId,
      status: newValue,
      timestamp: Date.now()
    };
    
    setSyncQueue(prev => [...prev, newItem]);

    if (queueTimeoutRef.current) clearTimeout(queueTimeoutRef.current);
    queueTimeoutRef.current = window.setTimeout(() => {
      processQueue();
    }, 200);
  }, [activeMember, progress, processQueue, hasCelebratedToday]);

  useEffect(() => {
    const fetchReflection = async () => {
      const res = await getDailyMotivation(`วันที่: ${currentDate}, สรุปกลุ่ม: ${JSON.stringify(progress[currentDate] || {})}`);
      setReflection(res);
    };
    fetchReflection();
  }, [currentDate]);

  const handleMemberSelect = (m: Member) => {
    setActiveMember(m);
    setShowMemberSelector(false);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-24 font-['Anuphan'] selection:bg-emerald-200">
      {isInitialLoading && (
        <div className="fixed inset-0 z-[1000] bg-emerald-950 flex flex-col items-center justify-center text-white">
          <div className="w-12 h-12 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mb-6"></div>
          <p className="font-black text-sm tracking-[0.3em] uppercase opacity-50">DeenTracker Syncing...</p>
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
            <div className="w-10 h-10 bg-emerald-800/40 rounded-xl flex items-center justify-center border border-white/10">🕌</div>
            <div className="flex flex-col items-start min-w-0">
              <h1 className="text-xl font-black tracking-tighter leading-none">DEENTRACKER</h1>
              <p className="text-[5px] text-white/20 font-bold whitespace-nowrap leading-none mt-1 uppercase w-full" style={{ textAlignLast: 'justify' }}>
                Create & Design By: Afitree Yamaenoh
              </p>
              <div className="flex items-center gap-2 mt-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${syncQueue.length > 0 ? 'bg-amber-400 animate-pulse' : (syncStatus === 'error' ? 'bg-red-500' : 'bg-emerald-400')}`}></div>
                <p className="text-[8px] font-bold uppercase tracking-widest text-emerald-400/80">
                  {syncQueue.length > 0 ? `กำลังส่งข้อมูล ${syncQueue.length} รายการ...` : lastUpdatedText}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => loadGlobalData()}
              title="Refresh Data"
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
                      <span className="text-[8px] font-black text-emerald-600/60 uppercase tracking-tighter">เข้าใช้โดย</span>
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
          <div className="bg-emerald-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 text-xs font-black uppercase tracking-widest shadow-emerald-200/50 border border-emerald-400/50">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            กำลังบันทึก {syncQueue.length} รายการ...
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
