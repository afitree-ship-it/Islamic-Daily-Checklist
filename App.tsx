
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import ChecklistTable from './components/ChecklistTable';
import StatsPanel from './components/StatsPanel';
import MemberSelector from './components/MemberSelector';
import LeaderSummaryModal from './components/LeaderSummaryModal';
import { ProgressData, DailyReflection, Member, SyncStatus } from './types';
import { MEMBERS, TASKS } from './constants';
import { getDailyMotivation } from './services/geminiService';
import { syncProgressToSheets, fetchProgressFromSheets } from './services/sheetService';

const App: React.FC = () => {
  const [currentDate, setCurrentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [activeMember, setActiveMember] = useState<Member | null>(() => {
    const saved = localStorage.getItem('active_member');
    return saved ? JSON.parse(saved) : null;
  });
  const [showMemberSelector, setShowMemberSelector] = useState(!activeMember);
  
  const [progress, setProgress] = useState<ProgressData>(() => {
    const saved = localStorage.getItem('deen_tracker_v1');
    return saved ? JSON.parse(saved) : {};
  });
  
  const [reflection, setReflection] = useState<DailyReflection | null>(null);
  const [showLeaderSummary, setShowLeaderSummary] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // ตัวแปรเก็บสถานะการกด เพื่อป้องกันการถูกข้อมูลเก่าทับขณะรอเน็ต
  const pendingMap = useRef<Map<string, boolean>>(new Map());

  const loadGlobalData = useCallback(async () => {
    try {
      const remoteData = await fetchProgressFromSheets();
      if (remoteData) {
        setProgress(prev => {
          const merged = { ...remoteData };
          
          // ตรวจสอบข้อมูลที่กำลัง Sync ค้างอยู่
          pendingMap.current.forEach((val, key) => {
            const [date, mId, tId] = key.split('|');
            if (date === currentDate) {
              if (!merged[date]) merged[date] = {};
              if (!merged[date][mId]) merged[date][mId] = {};
              merged[date][mId][tId] = val;
            }
          });

          localStorage.setItem('deen_tracker_v1', JSON.stringify(merged));
          return merged;
        });
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setIsInitialLoading(false);
    }
  }, [currentDate]);

  // ดึงข้อมูลอัตโนมัติทุก 10 วินาทีเพื่อความเรียลไทม์
  useEffect(() => {
    loadGlobalData();
    const interval = setInterval(loadGlobalData, 10000);
    return () => clearInterval(interval);
  }, [loadGlobalData]);

  const handleToggle = useCallback(async (date: string, memberId: string, taskId: string) => {
    if (!activeMember || activeMember.id !== memberId) return;

    let targetValue = false;
    setProgress(prev => {
      targetValue = !(prev[date]?.[memberId]?.[taskId]);
      return prev;
    });

    const syncKey = `${date}|${memberId}|${taskId}`;
    pendingMap.current.set(syncKey, targetValue);

    // อัปเดตหน้าจอทันที
    setProgress(prev => {
      const updated = { ...prev };
      if (!updated[date]) updated[date] = {};
      if (!updated[date][memberId]) updated[date][memberId] = {};
      updated[date][memberId][taskId] = targetValue;
      return updated;
    });

    setSyncStatus('syncing');
    try {
      const success = await syncProgressToSheets(date, memberId, taskId, targetValue);
      setSyncStatus(success ? 'success' : 'error');
    } catch (error) {
      setSyncStatus('error');
    } finally {
      // หลังจาก 5 วินาทีค่อยลบออกจาก Pending เพื่อให้แน่ใจว่าค่าจาก Server อัปเดตทัน
      setTimeout(() => {
        pendingMap.current.delete(syncKey);
      }, 5000);
      setTimeout(() => setSyncStatus('idle'), 2000);
    }
  }, [activeMember]);

  // ดึงคำคมเฉพาะตอนเปิดหน้าเว็บหรือเปลี่ยนวัน
  useEffect(() => {
    const fetchReflection = async () => {
      setReflection(null);
      const res = await getDailyMotivation(`Date: ${currentDate}`);
      setReflection(res);
    };
    fetchReflection();
  }, [currentDate]);

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-24 font-['Anuphan']">
      {isInitialLoading && (
        <div className="fixed inset-0 z-[100] bg-emerald-900 flex flex-col items-center justify-center text-white">
          <div className="w-12 h-12 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="font-bold">กำลังซิงค์ข้อมูลล่าสุดจากเพื่อนในกลุ่ม...</p>
        </div>
      )}

      {showMemberSelector && (
        <MemberSelector 
          onSelect={(m) => { setActiveMember(m); setShowMemberSelector(false); }} 
          onLeaderAccess={() => { setShowMemberSelector(false); setShowLeaderSummary(true); }}
          onClose={() => setShowMemberSelector(false)}
        />
      )}
      
      {showLeaderSummary && (
        <LeaderSummaryModal currentDate={currentDate} progress={progress} onClose={() => setShowLeaderSummary(false)} />
      )}

      {/* ปรับขนาด Header ให้กะทัดรัดขึ้น (pt-8 pb-16 แทน pt-12 pb-24) */}
      <header className="bg-emerald-900 text-white px-6 pt-8 pb-16 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-800 rounded-full -mr-20 -mt-20 blur-3xl opacity-50"></div>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-700 flex items-center justify-center text-xl shadow-inner">🕌</div>
            <div>
              <h1 className="text-2xl font-black tracking-tight leading-none mb-1">DeenTracker</h1>
              <p className="text-[10px] text-emerald-300 uppercase tracking-widest font-bold">บันทึกความดีประจำวัน</p>
            </div>
          </div>
          
          <div className="flex flex-wrap justify-center items-center gap-2">
            {activeMember && (
              <button 
                onClick={() => setShowMemberSelector(true)}
                className="bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border border-white/10"
              >
                {activeMember.name}
              </button>
            )}
            <div className="bg-white/10 px-3 py-1 rounded-lg border border-white/10">
              <input 
                type="date" 
                value={currentDate}
                onChange={(e) => setCurrentDate(e.target.value)}
                className="bg-transparent text-white text-sm font-bold outline-none cursor-pointer"
              />
            </div>
            <div className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase flex items-center gap-1.5 ${
              syncStatus === 'syncing' ? 'bg-amber-400 text-amber-950 animate-pulse' : 
              syncStatus === 'success' ? 'bg-emerald-400 text-emerald-950' : 'bg-white/5 text-white/40'
            }`}>
              {syncStatus === 'syncing' ? 'Saving...' : syncStatus === 'success' ? 'Saved' : 'Online'}
            </div>
          </div>
        </div>
      </header>

      {/* ปรับระยะขยับขึ้น (-mt-10) ให้เนื้อหาไม่ไปทับส่วน Title มากเกินไป */}
      <main className="max-w-6xl mx-auto px-4 -mt-10 space-y-6 relative z-20">
        <section className="bg-white p-5 md:p-8 rounded-[2rem] shadow-xl border border-slate-100 min-h-[100px] flex items-center">
          <div className="w-full">
            {reflection ? (
              <div className="animate-in fade-in duration-700">
                <p className="text-lg md:text-2xl font-black text-slate-800 mb-2 leading-tight">"{reflection.quote}"</p>
                <div className="flex items-center gap-3">
                  <span className="text-emerald-600 font-bold text-xs md:text-sm tracking-widest">{reflection.reference}</span>
                  <div className="h-[2px] flex-grow bg-slate-50"></div>
                </div>
                <p className="mt-2 text-slate-500 text-xs md:text-sm font-medium leading-relaxed">{reflection.message}</p>
              </div>
            ) : (
              <div className="animate-pulse flex flex-col gap-3">
                <div className="h-6 bg-slate-100 rounded-full w-3/4"></div>
                <div className="h-3 bg-slate-100 rounded-full w-1/2"></div>
              </div>
            )}
          </div>
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
