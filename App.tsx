
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

  const pendingUpdates = useRef<Record<string, { value: boolean, timestamp: number }>>({});

  const loadGlobalData = useCallback(async (isSilent = false) => {
    if (!isSilent) setSyncStatus('syncing');
    try {
      const remoteData = await fetchProgressFromSheets();
      
      // ป้องกันการเขียนทับด้วยค่าว่างหากเซิร์ฟเวอร์ส่งข้อมูลผิดพลาด
      if (remoteData && Object.keys(remoteData).length > 0) {
        setProgress(prev => {
          // Merge Logic: ผสานข้อมูลเก่าในเครื่องกับข้อมูลใหม่จากเซิร์ฟเวอร์
          const newState = { ...prev, ...remoteData };
          
          // ตรวจสอบข้อมูลล่าสุดในแต่ละวันที่อาจมีการอัปเดตเหลื่อมล้ำกัน
          Object.keys(remoteData).forEach(date => {
            newState[date] = { ...prev[date], ...remoteData[date] };
          });

          const now = Date.now();
          // รักษาค่าที่ผู้ใช้กำลังติ๊กอยู่ (Optimistic Updates) ไม่ให้โดนค่าเก่าจากเซิร์ฟเวอร์ดึงกลับ
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
    loadGlobalData();
    // เพิ่มระยะเวลา Polling เป็น 30 วินาทีเพื่อลดภาระเซิร์ฟเวอร์และป้องกัน Race Condition
    const interval = setInterval(() => loadGlobalData(true), 30000);
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

      <header className="bg-emerald-950 text-white px-4 py-4 shadow-2xl sticky top-0 z-[50] border-b border-white/5 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-800/40 rounded-xl flex items-center justify-center border border-white/10 shadow-inner">🕌</div>
            <div>
              <h1 className="text-xl font-black tracking-tighter leading-none">DEENTRACKER</h1>
              <div className="flex items-center gap-2 mt-1">
                <div className={`w-1.5 h-1.5 rounded-full ${syncStatus === 'syncing' ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`}></div>
                <p className="text-[8px] font-bold uppercase tracking-widest text-emerald-400">
                  {syncStatus === 'syncing' ? 'กำลังส่งข้อมูล...' : 
                   syncStatus === 'success' ? 'บันทึกเรียบร้อย' : 
                   syncStatus === 'error' ? 'การเชื่อมต่อขัดข้อง' : 'ระบบออนไลน์'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => loadGlobalData()}
              className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-colors border border-white/5"
              title="รีเฟรชข้อมูล"
            >
              <svg className={`w-4 h-4 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            </button>
            <input 
              type="date" 
              value={currentDate}
              onChange={(e) => setCurrentDate(e.target.value)}
              className="bg-emerald-900/50 text-white text-[10px] font-black py-2 px-3 rounded-xl border border-white/10 outline-none focus:ring-2 ring-emerald-500 w-32"
            />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 pt-6 space-y-6">
        <section className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-50 rounded-full -mr-20 -mt-20 blur-3xl opacity-50"></div>
          {reflection ? (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-700 relative z-10">
              <div className="flex justify-between items-start gap-4 mb-3">
                <p className="text-xl md:text-2xl font-black text-slate-800 leading-tight">"{reflection.quote}"</p>
                {activeMember && (
                   <div className="flex flex-col items-end flex-shrink-0 bg-emerald-50/50 px-3 py-2 rounded-2xl border border-emerald-100">
                      <span className="text-[8px] font-black text-emerald-600/60 uppercase tracking-tighter">เข้าใช้โดย</span>
                      <span className="text-emerald-900 font-black text-sm">{activeMember.name}</span>
                   </div>
                )}
              </div>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-emerald-600 font-black text-[10px] uppercase tracking-[0.2em]">{reflection.reference}</span>
                <div className="h-[1px] flex-grow bg-emerald-100/30 rounded-full"></div>
              </div>
              <p className="text-slate-500 text-xs font-medium leading-relaxed italic">{reflection.message}</p>
            </div>
          ) : (
            <div className="animate-pulse flex flex-col gap-3">
              <div className="h-6 bg-slate-100 rounded-full w-3/4"></div>
              <div className="h-10 bg-slate-50 rounded-2xl w-full"></div>
            </div>
          )}
        </section>

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

      {syncStatus !== 'idle' && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] sm:hidden">
          <div className={`px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest animate-in fade-in slide-in-from-bottom-4 ${
            syncStatus === 'syncing' ? 'bg-amber-500 text-white' : 
            syncStatus === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
          }`}>
            {syncStatus === 'syncing' ? 'กำลังบันทึก...' : 'ซิงค์เรียบร้อย'}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
