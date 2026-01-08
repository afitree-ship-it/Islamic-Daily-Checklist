
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
    return `Today's group score is ${total} out of ${MEMBERS.length * TASKS.length}.`;
  }, [progress, currentDate]);

  const fetchReflection = async () => {
    setIsRefreshingReflection(true);
    setApiError(null);
    try {
      const res = await getDailyMotivation(progressSummaryText);
      setReflection(res);
    } catch (e: any) {
      console.error(e);
      setApiError(e.message || "เกิดข้อผิดพลาดในการเรียก AI");
    } finally {
      setIsRefreshingReflection(false);
    }
  };

  useEffect(() => {
    fetchReflection();
  }, [currentDate]);

  const copyProgressToClipboard = () => {
    const dayData = progress[currentDate] || {};
    let text = `📊 รายงานความคืบหน้า (${currentDate})\n\n`;
    MEMBERS.forEach(m => {
      const mData = dayData[m.id] || {};
      const completed = Object.values(mData).filter(v => v).length;
      const emoji = completed === TASKS.length ? '✅' : completed > 0 ? '🕒' : '⭕';
      text += `${emoji} ${m.name}: ${completed}/${TASKS.length}\n`;
    });
    text += `\nรักษาความดีกันต่อไป อินชาอัลลอฮฺ!`;
    navigator.clipboard.writeText(text);
    alert('คัดลอกรายงานไปยังคลิปบอร์ดแล้ว!');
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
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

      {/* Header */}
      <header className="bg-emerald-800 text-white pt-10 pb-24 px-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <svg className="w-64 h-64" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12,2L4.5,20.29L5.21,21L12,18L18.79,21L19.5,20.29L12,2Z" />
          </svg>
        </div>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md">
                <span className="text-3xl">🕌</span>
            </div>
            <div>
                <h1 className="text-4xl font-black tracking-tight mb-1">DeenTracker</h1>
                {activeMember ? (
                  <div className="flex items-center gap-2 text-emerald-200">
                    <span className="text-sm">คุณล็อกอินเป็น: </span>
                    <span className="font-bold text-white bg-emerald-700 px-2 py-0.5 rounded text-sm">{activeMember.name}</span>
                    <button 
                      onClick={() => setShowMemberSelector(true)}
                      className="text-xs underline hover:text-white ml-2 transition-colors"
                    >
                      (เปลี่ยนบัญชี)
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => setShowMemberSelector(true)}
                    className="mt-1 bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/20 text-white px-4 py-1.5 rounded-full text-sm font-bold transition-all flex items-center gap-2 shadow-lg active:scale-95 animate-bounce"
                  >
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    คลิกเพื่อระบุตัวตนของคุณ
                  </button>
                )}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
              syncStatus === 'syncing' ? 'bg-amber-100 text-amber-700' :
              syncStatus === 'success' ? 'bg-emerald-100 text-emerald-700' :
              syncStatus === 'error' ? 'bg-red-100 text-red-700' : 'bg-emerald-900/40 text-emerald-300'
            }`}>
              <svg className={`w-4 h-4 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v8" />
              </svg>
              {syncStatus === 'syncing' ? 'บันทึก...' : 
               syncStatus === 'success' ? 'ออนไลน์' : 
               syncStatus === 'error' ? 'ผิดพลาด' : 'Cloud Sync'}
            </div>

            <div className="bg-emerald-700/50 p-2 rounded-xl border border-emerald-600/50 flex items-center shadow-lg backdrop-blur-sm">
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

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 -mt-16 relative z-10 space-y-8">
        
        {/* Reflection Card */}
        <section className="bg-white p-6 md:p-8 rounded-3xl shadow-xl border border-emerald-100 flex flex-col md:flex-row gap-8 items-center min-h-[160px]">
            <div className="flex-shrink-0 w-20 h-20 bg-emerald-100 rounded-2xl flex items-center justify-center">
                <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            </div>
            <div className="flex-grow text-center md:text-left w-full">
                {apiError ? (
                  <div className="space-y-2">
                    <p className="text-slate-500 font-medium italic">"{apiError}"</p>
                    <button onClick={fetchReflection} className="text-emerald-600 text-sm font-bold hover:underline">ลองใหม่อีกครั้ง</button>
                  </div>
                ) : reflection ? (
                    <>
                        <blockquote className="text-xl font-serif italic text-slate-800 mb-2 leading-relaxed">
                            "{reflection.quote}"
                        </blockquote>
                        <div className="flex flex-col md:flex-row md:items-center gap-2 mb-3">
                            <span className="text-emerald-600 font-black">— {reflection.reference}</span>
                        </div>
                        <p className="text-slate-600 text-sm leading-relaxed bg-slate-50 p-4 rounded-xl border-l-4 border-emerald-500 italic">
                            {reflection.message}
                        </p>
                    </>
                ) : (
                    <div className="animate-pulse space-y-2">
                        <div className="h-4 bg-slate-200 rounded w-3/4 mx-auto md:mx-0"></div>
                        <div className="h-4 bg-slate-200 rounded w-1/2 mx-auto md:mx-0"></div>
                    </div>
                )}
            </div>
            {!apiError && (
              <button 
                  onClick={fetchReflection}
                  disabled={isRefreshingReflection}
                  className="flex-shrink-0 p-3 hover:bg-slate-100 rounded-2xl transition-all"
                  title="ขอแรงบันดาลใจใหม่"
              >
                  <svg className={`w-6 h-6 text-slate-400 ${isRefreshingReflection ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
              </button>
            )}
        </section>

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
                <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                    <span className="p-2 bg-emerald-500 rounded-lg text-white text-xs uppercase">Goal</span>
                    เช็คลิสต์ประจำวัน
                </h2>
                <p className="text-slate-500 text-sm italic">
                  {activeMember 
                    ? `สวัสดีคุณ ${activeMember.name}, คุณสามารถบันทึกกิจกรรมในแถวของคุณได้เท่านั้น` 
                    : 'ระบุตัวตนของคุณเพื่อเริ่มการบันทึกกิจกรรม'}
                </p>
            </div>
            <div className="flex flex-wrap gap-3 w-full sm:w-auto">
                <button 
                    onClick={() => setShowLeaderSummary(true)}
                    className="flex-1 sm:flex-none bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 px-6 rounded-2xl shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                    สรุปกลุ่ม
                </button>
                <button 
                    onClick={copyProgressToClipboard}
                    className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-2xl shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                    คัดลอกรายงาน
                </button>
            </div>
        </div>

        {/* Main Table */}
        <ChecklistTable 
            currentDate={currentDate} 
            progress={progress} 
            activeMemberId={activeMember?.id || null}
            onToggle={handleToggle}
            onOpenSelector={() => setShowMemberSelector(true)}
        />

        {/* Stats Section */}
        <StatsPanel 
            currentDate={currentDate} 
            progress={progress} 
        />

      </main>

      <footer className="mt-20 text-center text-slate-400 text-sm pb-10">
          <p>© 2024 DeenTracker - สร้างเพื่อสังคม</p>
          <p className="mt-1">"จดบันทึกความดี เพื่อโลกนี้และโลกหน้า"</p>
      </footer>
    </div>
  );
};

export default App;
