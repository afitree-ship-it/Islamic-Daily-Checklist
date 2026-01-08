
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

  // ใช้สำหรับจัดการ Optimistic Updates และลดความหน่วง
  const pendingUpdates = useRef<Record<string, { value: boolean, timestamp: number }>>({});

  const loadGlobalData = useCallback(async (isSilent = false) => {
    if (!isSilent) setSyncStatus('syncing');
    try {
      const remoteData = await fetchProgressFromSheets();
      if (remoteData) {
        setProgress(prev => {
          const newState = { ...remoteData };
          const now = Date.now();
          
          // นำค่าที่กำลังซิงค์ (ยังไม่ครบ 30 วิ) มาทับข้อมูลจากเซิร์ฟเวอร์เพื่อให้ UI ไม่กระโดด
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

  // ดึงข้อมูลครั้งแรกและตั้งค่า Polling ทุก 15 วินาที
  useEffect(() => {
    loadGlobalData();
    const interval = setInterval(() => loadGlobalData(true), 15000);
    return () => clearInterval(interval);
  }, [loadGlobalData]);

  const handleToggle = useCallback(async (date: string, memberId: string, taskId: string) => {
    if (!activeMember || activeMember.id !== memberId) return;
    
    const syncKey = `${date}|${memberId}|${taskId}`;
    let newValue = false;

    // 1. Update State ทันที (Optimistic)
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
    
    // 2. ส่งข้อมูลไป Google Sheets
    try {
      const success = await syncProgressToSheets(date, memberId, taskId, newValue);
      if (success) {
        setSyncStatus('success');
      } else {
        setSyncStatus('error');
      }
    } catch (error) {
      setSyncStatus('error');
    } finally {
      setTimeout(() => setSyncStatus('idle'), 2000);
    }
  }, [activeMember]);

  useEffect(() => {
    const fetchReflection = async () => {
      setReflection(null);
      const res = await getDailyMotivation(`วันที่: ${currentDate}, ความคืบหน้าปัจจุบัน: ${JSON.stringify(progress[currentDate] || {})}`);
      setReflection(res);
    };
    fetchReflection();
  }, [currentDate, activeMember]); // อัปเดตเมื่อเปลี่ยนวันที่หรือคนเข้าใช้งาน

  const handleMemberSelect = (m: Member) => {
    setActiveMember(m);
    setShowMemberSelector(false);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-24 font-['Anuphan'] selection:bg-emerald-200">
      {isInitialLoading && (
        <div className="fixed inset-0 z-[1000] bg-emerald-950 flex flex-col items-center justify-center text-white">
          <div className="w-12 h-12 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mb-6"></div>
          <p className="font-black text-sm tracking-[0.3em] uppercase opacity-50">DeenTracker Loading</p>
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

      {/* Header */}
      <header className="bg-emerald-950 text-white px-4 py-4 shadow-2xl sticky top-0 z-[50] border-b border-white/5 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-800/40 rounded-xl flex items-center justify-center border border-white/10 shadow-inner">🕌</div>
            <div>
              <h1 className="text-xl font-black tracking-tighter leading-none">DEENTRACKER</h1>
              <div className="flex items-center gap-2 mt-1">
                <div className={`w-1.5 h-1.5 rounded-full ${syncStatus === 'syncing' ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`}></div>
                <p className="text-[8px] font-bold uppercase tracking-widest text-emerald-400">
                  {syncStatus === 'syncing' ? 'กำลังซิงค์...' : 
                   syncStatus === 'success' ? 'บันทึกสำเร็จ' : 
                   syncStatus === 'error' ? 'การเชื่อมต่อผิดพลาด' : 'ระบบออนไลน์'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <input 
              type="date" 
              value={currentDate}
              onChange={(e) => setCurrentDate(e.target.value)}
              className="bg-emerald-900/50 text-white text-[10px] font-black py-2 px-3 rounded-xl border border-white/10 outline-none focus:ring-2 ring-emerald-500 w-32"
            />
            {activeMember && (
              <button 
                onClick={() => setShowMemberSelector(true)}
                className="bg-emerald-500 hover:bg-emerald-400 text-white p-2 rounded-xl shadow-lg transition-all active:scale-95"
                title="เปลี่ยนผู้ใช้งาน"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 pt-6 space-y-6">
        {/* Reflection Card */}
        <section className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-50 rounded-full -mr-20 -mt-20 blur-3xl opacity-50 group-hover:opacity-100 transition-opacity"></div>
          {reflection ? (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-700 relative z-10">
              <div className="flex justify-between items-start gap-4 mb-3">
                <p className="text-xl md:text-2xl font-black text-slate-800 leading-tight">"{reflection.quote}"</p>
                {activeMember && (
                   <div className="flex flex-col items-end flex-shrink-0 bg-slate-50 px-3 py-2 rounded-2xl border border-slate-100">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">กำลังใช้งานโดย</span>
                      <span className="text-emerald-900 font-black text-sm">{activeMember.name}</span>
                   </div>
                )}
              </div>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-emerald-600 font-black text-[10px] uppercase tracking-[0.2em]">{reflection.reference}</span>
                <div className="h-[1px] flex-grow bg-slate-100 rounded-full"></div>
              </div>
              <p className="text-slate-500 text-xs font-medium leading-relaxed italic opacity-80">{reflection.message}</p>
            </div>
          ) : (
            <div className="animate-pulse flex flex-col gap-3">
              <div className="h-6 bg-slate-100 rounded-full w-3/4"></div>
              <div className="h-2 bg-slate-50 rounded-full w-1/4"></div>
              <div className="h-10 bg-slate-50 rounded-2xl w-full"></div>
            </div>
          )}
        </section>

        {/* Tables and Stats */}
        <div className="grid grid-cols-1 gap-6">
          <ChecklistTable 
            currentDate={currentDate} 
            progress={progress} 
            activeMemberId={activeMember?.id || null}
            onToggle={handleToggle}
            onOpenSelector={() => setShowMemberSelector(true)}
          />

          <StatsPanel currentDate={currentDate} progress={progress} />
        </div>
      </main>

      {/* Sync Status Toast (Mobile Only) */}
      {syncStatus !== 'idle' && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] sm:hidden">
          <div className={`px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest animate-in fade-in slide-in-from-bottom-4 ${
            syncStatus === 'syncing' ? 'bg-amber-500 text-white' : 
            syncStatus === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
          }`}>
            {syncStatus === 'syncing' && <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
            {syncStatus === 'syncing' ? 'บันทึกข้อมูล...' : 
             syncStatus === 'success' ? 'ซิงค์เรียบร้อย' : 'ผิดพลาด! ลองใหม่'}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
