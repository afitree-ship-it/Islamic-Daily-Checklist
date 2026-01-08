
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ChecklistTable from './components/ChecklistTable';
import StatsPanel from './components/StatsPanel';
import MemberSelector from './components/MemberSelector';
import LeaderSummaryModal from './components/LeaderSummaryModal';
import { ProgressData, DailyReflection, Member, SyncStatus } from './types';
import { MEMBERS, TASKS } from './constants';
import { getDailyMotivation } from './services/geminiService';
import { syncProgressToSheets } from './services/sheetService';

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
  const [isRefreshingReflection, setIsRefreshingReflection] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [showLeaderSummary, setShowLeaderSummary] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');

  useEffect(() => {
    localStorage.setItem('deen_tracker_v1', JSON.stringify(progress));
  }, [progress]);

  useEffect(() => {
    if (activeMember) {
      localStorage.setItem('active_member', JSON.stringify(activeMember));
    } else {
      localStorage.removeItem('active_member');
    }
  }, [activeMember]);

  const handleToggle = useCallback(async (date: string, memberId: string, taskId: string) => {
    if (activeMember && activeMember.id !== memberId) return;

    const member = MEMBERS.find(m => m.id === memberId);
    const task = TASKS.find(t => t.id === taskId);
    
    setProgress(prev => {
      const dayData = prev[date] || {};
      const memberData = dayData[memberId] || {};
      const newValue = !memberData[taskId];
      
      if (member && task) {
        setSyncStatus('syncing');
        syncProgressToSheets(date, member.name, task.label, newValue).then(success => {
            setSyncStatus(success ? 'success' : 'error');
            setTimeout(() => setSyncStatus('idle'), 2000);
        });
      }

      return {
        ...prev,
        [date]: {
          ...dayData,
          [memberId]: {
            ...memberData,
            [taskId]: newValue
          }
        }
      };
    });
  }, [activeMember]);

  const progressSummaryText = useMemo(() => {
    const dayData = progress[currentDate] || {};
    let total = 0;
    MEMBERS.forEach(m => {
      const mData = dayData[m.id] || {};
      total += Object.values(mData).filter(v => v).length;
    });
    return `Today's score: ${total}/${MEMBERS.length * TASKS.length}. The group needs motivation to keep their prayers, especially Subuh in congregation.`;
  }, [progress, currentDate]);

  const fetchReflection = async () => {
    setIsRefreshingReflection(true);
    setApiError(null);
    try {
      const res = await getDailyMotivation(progressSummaryText);
      setReflection(res);
    } catch (e: any) {
      console.error(e);
      setApiError(e.message || "กำลังรอการเชื่อมต่อกับ AI...");
    } finally {
      setIsRefreshingReflection(false);
    }
  };

  useEffect(() => {
    fetchReflection();
  }, [currentDate]);

  const copyProgressToClipboard = () => {
    const dayData = progress[currentDate] || {};
    let text = `📊 รายงานความคืบหน้า DeenTracker (${currentDate})\n\n`;
    MEMBERS.forEach(m => {
      const mData = dayData[m.id] || {};
      const completed = Object.values(mData).filter(v => v).length;
      const emoji = completed === TASKS.length ? '🌟' : completed >= 5 ? '✅' : completed > 0 ? '🕒' : '⭕';
      text += `${emoji} ${m.name}: ${completed}/${TASKS.length}\n`;
    });
    text += `\nรักษาความดีกันต่อไป อินชาอัลลอฮฺ!\nCheck at: ${window.location.origin}`;
    navigator.clipboard.writeText(text);
    alert('คัดลอกรายงานเรียบร้อยแล้ว!');
  };

  return (
    <div className="min-h-screen bg-[#fcfdfe] pb-20 selection:bg-emerald-100">
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

      {/* Modern Header */}
      <header className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 text-white pt-12 pb-28 px-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <svg className="w-96 h-96" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12,2L4.5,20.29L5.21,21L12,18L18.79,21L19.5,20.29L12,2Z" />
          </svg>
        </div>
        
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row justify-between items-center gap-8 relative z-10">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-[2rem] bg-white/10 flex items-center justify-center backdrop-blur-xl border border-white/20 shadow-2xl rotate-3">
                <span className="text-4xl">🕌</span>
            </div>
            <div>
                <h1 className="text-5xl font-black tracking-tighter mb-1 bg-clip-text text-transparent bg-gradient-to-r from-white to-emerald-200">DeenTracker</h1>
                {activeMember ? (
                  <div className="flex items-center gap-2 text-emerald-100/80">
                    <span className="text-sm font-medium">ยินดีต้อนรับ:</span>
                    <span className="font-bold text-white bg-emerald-500/30 px-3 py-0.5 rounded-full text-sm border border-white/10">{activeMember.name}</span>
                    <button 
                      onClick={() => setShowMemberSelector(true)}
                      className="text-xs underline hover:text-white ml-2 transition-all opacity-70 hover:opacity-100"
                    >
                      (เปลี่ยนชื่อ)
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => setShowMemberSelector(true)}
                    className="mt-2 bg-emerald-400 text-emerald-950 px-6 py-2 rounded-full text-sm font-black transition-all flex items-center gap-2 shadow-xl hover:bg-white hover:scale-105 active:scale-95 animate-pulse"
                  >
                    ระบุตัวตนของคุณที่นี่
                  </button>
                )}
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black transition-all backdrop-blur-md border ${
              syncStatus === 'syncing' ? 'bg-amber-400/20 text-amber-300 border-amber-400/30' :
              syncStatus === 'success' ? 'bg-emerald-400/20 text-emerald-300 border-emerald-400/30' :
              syncStatus === 'error' ? 'bg-red-400/20 text-red-300 border-red-400/30' : 'bg-white/10 text-emerald-200 border-white/10'
            }`}>
              <div className={`w-2 h-2 rounded-full ${syncStatus === 'syncing' ? 'bg-amber-400 animate-ping' : syncStatus === 'success' ? 'bg-emerald-400' : 'bg-emerald-800'}`}></div>
              {syncStatus === 'syncing' ? 'กำลังบันทึก...' : 
               syncStatus === 'success' ? 'เชื่อมต่อแล้ว' : 
               syncStatus === 'error' ? 'มีข้อผิดพลาด' : 'ระบบคลาวด์'}
            </div>

            <div className="bg-white/10 p-1.5 rounded-2xl border border-white/10 flex items-center shadow-2xl backdrop-blur-xl">
              <input 
                type="date" 
                value={currentDate}
                onChange={(e) => setCurrentDate(e.target.value)}
                className="bg-transparent text-white font-black px-4 py-2 outline-none cursor-pointer text-center"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 -mt-16 relative z-10 space-y-10">
        
        {/* Inspiration Card */}
        <section className="bg-white/80 backdrop-blur-md p-8 md:p-10 rounded-[2.5rem] shadow-2xl shadow-emerald-900/5 border border-white flex flex-col md:flex-row gap-10 items-center transition-all hover:shadow-emerald-900/10">
            <div className="flex-shrink-0 w-24 h-24 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl flex items-center justify-center shadow-lg rotate-6">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            </div>
            <div className="flex-grow text-center md:text-left">
                {apiError ? (
                  <div className="space-y-3">
                    <p className="text-slate-400 font-medium italic">"{apiError}"</p>
                    <button onClick={fetchReflection} className="bg-emerald-100 text-emerald-700 px-4 py-1.5 rounded-full text-xs font-bold hover:bg-emerald-200 transition-colors">ลองโหลดใหม่</button>
                  </div>
                ) : reflection ? (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <blockquote className="text-2xl font-serif italic text-slate-800 mb-3 leading-tight tracking-tight">
                            "{reflection.quote}"
                        </blockquote>
                        <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
                            <span className="text-emerald-600 font-black text-lg tracking-widest uppercase">— {reflection.reference}</span>
                        </div>
                        <div className="bg-emerald-50/50 p-5 rounded-2xl border-l-8 border-emerald-500 italic text-slate-600 leading-relaxed shadow-inner">
                            {reflection.message}
                        </div>
                    </div>
                ) : (
                    <div className="animate-pulse space-y-3">
                        <div className="h-8 bg-slate-100 rounded-xl w-full"></div>
                        <div className="h-8 bg-slate-100 rounded-xl w-3/4"></div>
                        <div className="h-20 bg-slate-50 rounded-xl w-full mt-4"></div>
                    </div>
                )}
            </div>
            {!apiError && (
              <button 
                  onClick={fetchReflection}
                  disabled={isRefreshingReflection}
                  className="flex-shrink-0 p-4 bg-slate-50 hover:bg-emerald-50 rounded-full transition-all hover:rotate-180 duration-500 border border-slate-100"
                  title="เปลี่ยนแรงบันดาลใจ"
              >
                  <svg className={`w-6 h-6 text-emerald-500 ${isRefreshingReflection ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
              </button>
            )}
        </section>

        {/* Action Header */}
        <div className="flex flex-col lg:flex-row justify-between items-end gap-6">
            <div className="w-full lg:w-auto">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-black uppercase tracking-widest mb-3">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Daily Goal
                </div>
                <h2 className="text-4xl font-black text-slate-900 tracking-tighter">
                    เช็คลิสต์ความดีประจำวัน
                </h2>
                <p className="text-slate-500 mt-1 font-medium italic">
                  {activeMember 
                    ? `สวัสดีคุณ ${activeMember.name} จิตใจที่มุ่งมั่นคือจุดเริ่มต้นของความสำเร็จ` 
                    : 'กรุณาระบุตัวตนของคุณเพื่อเริ่มการบันทึก'}
                </p>
            </div>
            <div className="flex flex-wrap gap-4 w-full lg:w-auto">
                <button 
                    onClick={() => setShowLeaderSummary(true)}
                    className="flex-1 lg:flex-none bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 font-black py-4 px-8 rounded-3xl shadow-xl flex items-center justify-center gap-3 transition-all active:scale-95"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    รายงานกลุ่ม
                </button>
                <button 
                    onClick={copyProgressToClipboard}
                    className="flex-1 lg:flex-none bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 px-8 rounded-3xl shadow-xl shadow-emerald-200 flex items-center justify-center gap-3 transition-all active:scale-95"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4l-2 2m0 0l-2-2m2 2v-5" />
                    </svg>
                    แชร์รายงาน
                </button>
            </div>
        </div>

        {/* Dynamic Checklist Table */}
        <div className="transform transition-all">
          <ChecklistTable 
              currentDate={currentDate} 
              progress={progress} 
              activeMemberId={activeMember?.id || null}
              onToggle={handleToggle}
              onOpenSelector={() => setShowMemberSelector(true)}
          />
        </div>

        {/* Stats and Analytics */}
        <StatsPanel 
            currentDate={currentDate} 
            progress={progress} 
        />

      </main>

      <footer className="mt-24 text-center pb-12">
          <div className="inline-flex items-center gap-3 px-6 py-2 bg-slate-100 rounded-full text-slate-400 text-xs font-bold mb-4">
            <span>Powered by Vercel & Gemini AI</span>
            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
            <span>DeenTracker v1.2</span>
          </div>
          <p className="text-slate-400 font-medium">© 2024 DeenTracker - พัฒนาเพื่อสังคมมุสลิม</p>
          <p className="text-emerald-600/50 text-sm mt-1">"ความสม่ำเสมอ คือหัวใจของการขัดเกลาจิตใจ"</p>
      </footer>
    </div>
  );
};

export default App;
