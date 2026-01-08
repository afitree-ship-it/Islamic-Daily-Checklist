
import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  const [apiError, setApiError] = useState<string | null>(null);
  const [showLeaderSummary, setShowLeaderSummary] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // โหลดข้อมูลทั้งหมดจาก Google Sheets เมื่อเปิดแอป
  const loadGlobalData = useCallback(async () => {
    try {
      const globalData = await fetchProgressFromSheets();
      if (globalData) {
        setProgress(globalData);
        localStorage.setItem('deen_tracker_v1', JSON.stringify(globalData));
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setIsInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGlobalData();
    // ตั้งเวลาดึงข้อมูลใหม่ทุกๆ 30 วินาที เพื่อดูความคืบหน้าของเพื่อน
    const interval = setInterval(loadGlobalData, 30000);
    return () => clearInterval(interval);
  }, [loadGlobalData]);

  useEffect(() => {
    if (activeMember) {
      localStorage.setItem('active_member', JSON.stringify(activeMember));
    }
  }, [activeMember]);

  const handleToggle = useCallback(async (date: string, memberId: string, taskId: string) => {
    if (!activeMember || activeMember.id !== memberId) return;

    let targetValue = false;
    
    // 1. อัปเดต UI ทันที (Optimistic UI)
    setProgress(prev => {
      const currentStatus = !!(prev[date]?.[memberId]?.[taskId]);
      targetValue = !currentStatus;
      
      const updated = {
        ...prev,
        [date]: {
          ...(prev[date] || {}),
          [memberId]: {
            ...(prev[date]?.[memberId] || {}),
            [taskId]: targetValue
          }
        }
      };
      localStorage.setItem('deen_tracker_v1', JSON.stringify(updated));
      return updated;
    });

    // 2. ส่งข้อมูลไปบันทึกที่ Google Sheets
    setSyncStatus('syncing');
    try {
      const success = await syncProgressToSheets(date, memberId, taskId, targetValue);
      setSyncStatus(success ? 'success' : 'error');
    } catch (error) {
      setSyncStatus('error');
    } finally {
      // คืนสถานะกลับเป็น idle หลังผ่านไป 2 วินาที
      setTimeout(() => setSyncStatus('idle'), 2000);
    }
  }, [activeMember]);

  const progressSummaryText = useMemo(() => {
    const dayData = progress[currentDate] || {};
    let total = 0;
    MEMBERS.forEach(m => {
      const mData = dayData[m.id] || {};
      total += Object.values(mData).filter(v => v).length;
    });
    return `Score: ${total}/${MEMBERS.length * TASKS.length}. Most tasks: ${TASKS.find(t => t.id === 't1')?.label}`;
  }, [progress, currentDate]);

  useEffect(() => {
    const fetchReflection = async () => {
      setApiError(null);
      try {
        const res = await getDailyMotivation(progressSummaryText);
        setReflection(res);
        if (res.message.includes("ตั้งค่า API Key")) {
          setApiError(res.message);
        }
      } catch (e) {
        setApiError("AI ยังไม่พร้อมทำงาน กรุณาเช็ค API Key");
      }
    };
    fetchReflection();
  }, [currentDate, progressSummaryText]);

  return (
    <div className="min-h-screen bg-[#fcfdfe] pb-20 selection:bg-emerald-100">
      {isInitialLoading && (
        <div className="fixed inset-0 z-[100] bg-emerald-900 flex flex-col items-center justify-center text-white">
          <div className="w-16 h-16 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="font-bold animate-pulse text-emerald-100">กำลังเชื่อมต่อฐานข้อมูลกลุ่ม...</p>
        </div>
      )}

      {showMemberSelector && (
        <MemberSelector 
          onSelect={(m) => {
            setActiveMember(m);
            setShowMemberSelector(false);
          }} 
          onLeaderAccess={() => {
            setShowMemberSelector(false);
            setShowLeaderSummary(true);
          }}
          onClose={() => setShowMemberSelector(false)}
        />
      )}
      
      {showLeaderSummary && (
        <LeaderSummaryModal 
          currentDate={currentDate} 
          progress={progress} 
          onClose={() => setShowLeaderSummary(false)} 
        />
      )}

      <header className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 text-white pt-12 pb-28 px-6 relative overflow-hidden">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row justify-between items-center gap-8 relative z-10">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-xl border border-white/20 shadow-2xl text-3xl">🕌</div>
            <div>
                <h1 className="text-4xl font-black tracking-tighter mb-1">DeenTracker</h1>
                {activeMember && (
                  <div className="flex items-center gap-2 text-emerald-100/80">
                    <span className="text-sm">ผู้ใช้งาน: <b>{activeMember.name}</b></span>
                    <button onClick={() => setShowMemberSelector(true)} className="text-xs underline hover:text-white transition-colors">เปลี่ยนชื่อ</button>
                  </div>
                )}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end mr-2 text-right">
              <span className={`text-[10px] font-bold uppercase tracking-widest ${
                syncStatus === 'syncing' ? 'text-amber-400' : 
                syncStatus === 'success' ? 'text-emerald-400' : 
                syncStatus === 'error' ? 'text-red-400' : 'text-emerald-100/40'
              }`}>
                {syncStatus === 'syncing' ? 'กำลังบันทึก...' : 
                 syncStatus === 'success' ? 'บันทึกสำเร็จ ✓' : 
                 syncStatus === 'error' ? 'ซิงค์ล้มเหลว' : 'ระบบออนไลน์'}
              </span>
            </div>
            
            <button 
              onClick={loadGlobalData}
              className="p-3 bg-white/10 hover:bg-white/20 rounded-xl border border-white/10 transition-all group active:scale-95"
              title="ดึงข้อมูลล่าสุด"
            >
              <svg className={`w-5 h-5 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>

            <div className="bg-white/10 p-1 rounded-xl border border-white/10 flex items-center shadow-xl">
              <input 
                type="date" 
                value={currentDate}
                onChange={(e) => setCurrentDate(e.target.value)}
                className="bg-transparent text-white font-bold px-4 py-2 outline-none cursor-pointer"
              />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 -mt-16 relative z-10 space-y-8">
        <section className="bg-white p-6 md:p-8 rounded-3xl shadow-xl border border-slate-100 min-h-[140px] flex items-center">
            <div className="w-full">
                {apiError ? (
                  <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 text-amber-800 flex items-center gap-3">
                    <span className="text-2xl">⚙️</span>
                    <div>
                      <p className="font-bold text-sm">การแนะนำโดย AI</p>
                      <p className="text-xs opacity-80">{apiError}</p>
                    </div>
                  </div>
                ) : reflection ? (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-700">
                        <blockquote className="text-xl font-serif italic text-slate-800 mb-2">"{reflection.quote}"</blockquote>
                        <div className="flex items-center gap-3">
                          <p className="text-emerald-600 font-bold text-sm">— {reflection.reference}</p>
                          <div className="h-[1px] flex-grow bg-slate-100"></div>
                        </div>
                        <p className="mt-3 text-slate-600 text-sm leading-relaxed">{reflection.message}</p>
                    </div>
                ) : (
                    <div className="animate-pulse space-y-3">
                        <div className="h-6 bg-slate-100 rounded w-3/4"></div>
                        <div className="h-4 bg-slate-100 rounded w-1/2"></div>
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
