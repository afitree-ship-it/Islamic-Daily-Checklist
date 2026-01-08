
import React, { useState, useEffect, useCallback, useRef } from 'react';
import ChecklistTable from './components/ChecklistTable';
import StatsPanel from './components/StatsPanel';
import MemberSelector from './components/MemberSelector';
import LeaderSummaryModal from './components/LeaderSummaryModal';
import { ProgressData, DailyReflection, Member } from './types';
import { getDailyMotivation } from './services/geminiService';
import { syncProgressToSheets, fetchProgressFromSheets } from './services/sheetService';

const App: React.FC = () => {
  const [currentDate, setCurrentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  // บังคับให้เลือกชื่อใหม่ทุกครั้งที่เข้าเว็บ (เริ่มที่ null เสมอ)
  const [activeMember, setActiveMember] = useState<Member | null>(null);
  const [showMemberSelector, setShowMemberSelector] = useState(true);
  
  const [progress, setProgress] = useState<ProgressData>(() => {
    const saved = localStorage.getItem('deen_tracker_v1');
    return saved ? JSON.parse(saved) : {};
  });
  
  const [reflection, setReflection] = useState<DailyReflection | null>(null);
  const [showLeaderSummary, setShowLeaderSummary] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const pendingUpdates = useRef<Record<string, { value: boolean, timestamp: number }>>({});

  const loadGlobalData = useCallback(async (isSilent = false) => {
    if (!isSilent) setSyncStatus('syncing');
    try {
      const remoteData = await fetchProgressFromSheets();
      if (remoteData) {
        setProgress(prev => {
          const newState = { ...remoteData };
          const now = Date.now();
          Object.entries(pendingUpdates.current).forEach(([key, update]) => {
            if (now - update.timestamp < 30000) {
              const [date, mId, tId] = key.split('|');
              if (!newState[date]) newState[date] = {};
              if (!newState[date][mId]) newState[date][mId] = {};
              newState[date][mId][tId] = update.value;
            } else {
              delete pendingUpdates.current[key];
            }
          });
          localStorage.setItem('deen_tracker_v1', JSON.stringify(newState));
          return newState;
        });
        if (!isSilent) setSyncStatus('success');
      }
    } catch (err) {
      console.error("Sync error:", err);
      if (!isSilent) setSyncStatus('error');
    } finally {
      setIsInitialLoading(false);
      setTimeout(() => setSyncStatus('idle'), 2000);
    }
  }, []);

  useEffect(() => {
    loadGlobalData(true);
    const interval = setInterval(() => loadGlobalData(true), 10000);
    return () => clearInterval(interval);
  }, [loadGlobalData]);

  const handleToggle = useCallback(async (date: string, memberId: string, taskId: string) => {
    if (!activeMember || activeMember.id !== memberId) return;
    const syncKey = `${date}|${memberId}|${taskId}`;
    let newValue = false;
    setProgress(prev => {
      const currentValue = !!prev[date]?.[memberId]?.[taskId];
      newValue = !currentValue;
      pendingUpdates.current[syncKey] = { value: newValue, timestamp: Date.now() };
      const updated = { ...prev };
      if (!updated[date]) updated[date] = {};
      if (!updated[date][memberId]) updated[date][memberId] = {};
      updated[date][memberId][taskId] = newValue;
      localStorage.setItem('deen_tracker_v1', JSON.stringify(updated));
      return updated;
    });
    setSyncStatus('syncing');
    try {
      const success = await syncProgressToSheets(date, memberId, taskId, newValue);
      if (success) setSyncStatus('success');
      else setSyncStatus('error');
    } catch (error) {
      setSyncStatus('error');
    } finally {
      setTimeout(() => setSyncStatus('idle'), 2000);
    }
  }, [activeMember]);

  useEffect(() => {
    const fetchReflection = async () => {
      setReflection(null);
      const res = await getDailyMotivation(`Context: ${currentDate}`);
      setReflection(res);
    };
    fetchReflection();
  }, [currentDate]);

  const handleMemberSelect = (m: Member) => {
    setActiveMember(m);
    setShowMemberSelector(false);
  };

  return (
    <div className="min-h-screen bg-[#f1f5f1] pb-20 font-['Anuphan'] selection:bg-emerald-200">
      {isInitialLoading && (
        <div className="fixed inset-0 z-[300] bg-emerald-950 flex flex-col items-center justify-center text-white">
          <div className="w-14 h-14 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mb-6"></div>
          <p className="font-bold text-lg tracking-widest uppercase">DeenTracker</p>
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

      <header className="bg-[#062e1e] text-white px-4 py-4 shadow-xl sticky top-0 z-[50] border-b border-emerald-800">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-800/50 rounded-xl flex items-center justify-center border border-emerald-700">🕌</div>
            <div className="flex flex-col">
              <h1 className="text-xl sm:text-2xl font-black tracking-tighter leading-none">DEENTRACKER</h1>
              <p className="text-[8px] sm:text-[9px] text-emerald-400 font-bold uppercase tracking-widest mt-0.5">
                {syncStatus === 'syncing' ? 'กำลังบันทึก...' : 
                 syncStatus === 'success' ? 'บันทึกแล้ว' : 
                 syncStatus === 'error' ? 'ข้อผิดพลาด' : 'Community Sync'}
              </p>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-1.5 sm:flex-row sm:items-center sm:gap-2">
            <input 
              type="date" 
              value={currentDate}
              onChange={(e) => setCurrentDate(e.target.value)}
              className="bg-emerald-900 text-white text-[10px] sm:text-[11px] font-bold py-1 px-2 rounded-lg border border-emerald-700 outline-none focus:ring-2 ring-emerald-500 w-28 sm:w-auto"
            />
            {activeMember && (
              <button 
                onClick={() => setShowMemberSelector(true)}
                className="bg-amber-500 hover:bg-amber-600 text-white text-[9px] sm:text-[10px] font-black px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg shadow-[0_4px_12px_rgba(245,158,11,0.3)] transition-all active:scale-95 flex items-center gap-1"
              >
                <span>👤</span>
                <span>เปลี่ยนคน</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 pt-6 space-y-6">
        <section className="bg-white/80 backdrop-blur-md p-6 rounded-[2.5rem] shadow-sm border border-emerald-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full -mr-10 -mt-10 blur-3xl opacity-60"></div>
          {reflection ? (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-700 relative z-10">
              <div className="flex justify-between items-start gap-4 mb-2">
                <p className="text-lg md:text-2xl font-black text-slate-800 leading-tight">"{reflection.quote}"</p>
                {activeMember && (
                   <div className="flex flex-col items-end flex-shrink-0">
                      <span className="text-[9px] font-black text-emerald-600/60 uppercase tracking-tighter">เข้าใช้โดย</span>
                      <span className="text-emerald-900 font-black text-base">{activeMember.name}</span>
                   </div>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-emerald-600 font-black text-[11px] uppercase tracking-[0.2em]">{reflection.reference}</span>
                <div className="h-[2px] flex-grow bg-emerald-50/50 rounded-full"></div>
              </div>
              <p className="mt-2 text-slate-500 text-xs font-medium leading-relaxed italic">{reflection.message}</p>
            </div>
          ) : (
            <div className="animate-pulse space-y-2">
              <div className="h-6 bg-emerald-50 rounded-full w-3/4"></div>
              <div className="h-3 bg-emerald-50 rounded-full w-1/2"></div>
            </div>
          )}
        </section>

        <ChecklistTable 
          currentDate={currentDate} 
          progress={progress} 
          activeMemberId={activeMember?.id || null}
          onToggle={handleToggle}
          onOpenSelector={() => setShowMemberSelector(true)}
        />

        <StatsPanel currentDate={currentDate} progress={progress} />
      </main>
    </div>
  );
};

export default App;
