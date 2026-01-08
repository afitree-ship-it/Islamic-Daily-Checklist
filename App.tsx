
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
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // ใช้ Ref เพื่อเก็บรายการที่กำลังอยู่ระหว่างการส่ง (Pending)
  // เพื่อไม่ให้ Background Fetch มาเขียนทับระหว่างรอ Response
  const pendingSyncs = useRef<Set<string>>(new Set());

  const loadGlobalData = useCallback(async (isAutoRefresh = false) => {
    try {
      const remoteData = await fetchProgressFromSheets();
      if (remoteData) {
        setProgress(prev => {
          const newData = { ...remoteData };
          
          // ถ้ามีการดึงข้อมูลใหม่มา ให้เอาข้อมูลในเครื่องที่ "ยังซิงค์ไม่เสร็จ" ไปแปะทับ
          // เพื่อป้องกัน UI กระโดดกลับไปค่าเก่าระหว่างรอเน็ต
          pendingSyncs.current.forEach(key => {
            const [date, mId, tId, valStr] = key.split('|');
            const val = valStr === 'true';
            if (date === currentDate) {
              if (!newData[date]) newData[date] = {};
              if (!newData[date][mId]) newData[date][mId] = {};
              newData[date][mId][tId] = val;
            }
          });

          localStorage.setItem('deen_tracker_v1', JSON.stringify(newData));
          return newData;
        });
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setIsInitialLoading(false);
    }
  }, [currentDate]);

  // ตั้งค่าการดึงข้อมูลอัตโนมัติ (ทุก 15 วินาทีเพื่อให้ดู Real-time มากขึ้น)
  useEffect(() => {
    loadGlobalData();
    const interval = setInterval(() => loadGlobalData(true), 15000);
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
    
    // 1. คำนวณค่าใหม่
    setProgress(prev => {
      targetValue = !(prev[date]?.[memberId]?.[taskId]);
      return prev;
    });

    // 2. เก็บสถานะ Pending ไว้
    const syncKey = `${date}|${memberId}|${taskId}|${targetValue}`;
    pendingSyncs.current.add(syncKey);

    // 3. อัปเดต UI ทันที
    setProgress(prev => {
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
      return updated;
    });

    setSyncStatus('syncing');
    try {
      const success = await syncProgressToSheets(date, memberId, taskId, targetValue);
      setSyncStatus(success ? 'success' : 'error');
    } catch (error) {
      setSyncStatus('error');
    } finally {
      // 4. เอาออกจาก Pending เมื่อส่งเสร็จ
      pendingSyncs.current.delete(syncKey);
      setTimeout(() => setSyncStatus('idle'), 2000);
    }
  }, [activeMember]);

  // คำนวณสรุปเพื่อส่งให้ AI ครั้งเดียวตอนเปลี่ยนวัน
  const summaryForAI = useMemo(() => {
    const dayData = progress[currentDate] || {};
    let total = 0;
    MEMBERS.forEach(m => {
      const mData = dayData[m.id] || {};
      total += Object.values(mData).filter(v => v).length;
    });
    return `Progress summary: ${total} tasks completed for date ${currentDate}`;
  }, [currentDate]); // ไม่เอา progress ใส่ใน dependency เพื่อไม่ให้เปลี่ยนตามการติ๊ก

  // ดึงคำคมเฉพาะตอน "เปลี่ยนวันที่" หรือ "เปิดหน้าเว็บครั้งแรก" เท่านั้น
  useEffect(() => {
    const fetchReflection = async () => {
      setReflection(null); // แสดง Loading ชั่วคราว
      try {
        const res = await getDailyMotivation(summaryForAI);
        setReflection(res);
      } catch (e) {
        console.error(e);
      }
    };
    fetchReflection();
  }, [currentDate]); // เปลี่ยนเฉพาะเมื่อเปลี่ยนวันที่

  return (
    <div className="min-h-screen bg-[#fcfdfe] pb-20 selection:bg-emerald-100 font-['Anuphan']">
      {isInitialLoading && (
        <div className="fixed inset-0 z-[100] bg-emerald-900 flex flex-col items-center justify-center text-white">
          <div className="w-16 h-16 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="font-bold animate-pulse text-emerald-100">กำลังซิงค์ข้อมูลล่าสุดจากกลุ่ม...</p>
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
                    <button onClick={() => setShowMemberSelector(true)} className="text-xs underline hover:text-white transition-colors ml-2">เปลี่ยนคน</button>
                  </div>
                )}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end mr-2 text-right">
              <span className={`text-[10px] font-bold uppercase tracking-widest ${
                syncStatus === 'syncing' ? 'text-amber-400 animate-pulse' : 
                syncStatus === 'success' ? 'text-emerald-400' : 
                syncStatus === 'error' ? 'text-red-400' : 'text-emerald-100/40'
              }`}>
                {syncStatus === 'syncing' ? 'กำลังส่งข้อมูล...' : 
                 syncStatus === 'success' ? 'บันทึกสำเร็จ' : 
                 syncStatus === 'error' ? 'เน็ตมีปัญหา' : 'เชื่อมต่อส่วนกลาง'}
              </span>
            </div>
            
            <button 
              onClick={() => loadGlobalData()}
              className="p-3 bg-white/10 hover:bg-white/20 rounded-xl border border-white/10 transition-all group active:scale-95"
              title="รีเฟรชข้อมูล"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <section className="bg-white p-6 md:p-8 rounded-3xl shadow-xl border border-slate-100 min-h-[140px] flex items-center overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/></svg>
            </div>
            <div className="w-full relative z-10">
                {reflection ? (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-700">
                        <blockquote className="text-xl font-bold text-slate-800 mb-2 leading-relaxed">"{reflection.quote}"</blockquote>
                        <div className="flex items-center gap-3">
                          <p className="text-emerald-600 font-bold text-sm tracking-wide">— {reflection.reference}</p>
                          <div className="h-[1px] flex-grow bg-slate-100"></div>
                        </div>
                        <p className="mt-3 text-slate-600 text-sm leading-relaxed font-medium">{reflection.message}</p>
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
