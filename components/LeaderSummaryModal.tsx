
import React, { useMemo, useState } from 'react';
import { MEMBERS, TASKS } from '../constants';
import { ProgressData, MonthlyMemberStats } from '../types';

interface LeaderSummaryModalProps {
  currentDate: string;
  progress: ProgressData;
  onClose: () => void;
}

const LeaderSummaryModal: React.FC<LeaderSummaryModalProps> = ({ currentDate, progress, onClose }) => {
  const [viewDate, setViewDate] = useState(currentDate);
  
  const dailyProgress = progress[viewDate] || {};
  const currentMonth = viewDate.slice(0, 7);

  const monthlyStats = useMemo(() => {
    const stats: MonthlyMemberStats[] = MEMBERS.map(member => {
      let totalCompleted = 0;
      let totalPossible = 0;
      const monthDates = Object.keys(progress).filter(date => date.startsWith(currentMonth));
      
      monthDates.forEach(date => {
        const dayData = progress[date]?.[member.id] || {};
        TASKS.forEach(task => {
          totalPossible++;
          if (dayData[task.id]) {
            totalCompleted++;
          }
        });
      });

      return {
        memberId: member.id,
        memberName: member.name,
        totalCompleted,
        totalPossible,
        percentage: totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0
      };
    });

    return stats.sort((a, b) => b.percentage - a.percentage);
  }, [progress, currentMonth]);

  const groupAverage = useMemo(() => {
    if (monthlyStats.length === 0) return 0;
    const total = monthlyStats.reduce((acc, curr) => acc + curr.percentage, 0);
    return Math.round(total / monthlyStats.length);
  }, [monthlyStats]);

  const handleExport = () => {
    const dateObj = new Date(viewDate);
    const monthLong = dateObj.toLocaleDateString('th-TH', { month: 'long' });
    const yearThai = dateObj.toLocaleDateString('th-TH', { year: 'numeric' });
    const fullDateText = `${monthLong} ${yearThai}`;
    
    let content = `📊 สรุปรายงานความคืบหน้า DeenTracker (Leader Access)\n`;
    content += `📅 ข้อมูลประจำเดือน: ${fullDateText}\n`;
    content += `📅 ข้อมูลรายวัน ณ วันที่: ${viewDate}\n`;
    content += `📈 ภาพรวมกลุ่ม (รายเดือน): ${groupAverage}%\n`;
    content += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    content += `รายชื่อสมาชิกและสถิติความสำเร็จรายเดือน:\n\n`;
    
    monthlyStats.forEach((stat, idx) => {
      const medal = idx === 0 ? '🥇 ' : idx === 1 ? '🥈 ' : idx === 2 ? '🥉 ' : '🔹 ';
      content += `${medal}${idx + 1}. ${stat.memberName}\n`;
      content += `   • เดือน/ปี: ${fullDateText}\n`;
      content += `   • ระดับความสำเร็จ: ${stat.percentage}%\n`;
      content += `   • บันทึกกิจกรรมรวม: ${stat.totalCompleted} ครั้ง (จากทั้งหมด ${stat.totalPossible} รายการ)\n`;
      content += `   • สถานะ: ${stat.percentage >= 80 ? 'ดีเยี่ยม (Excellent)' : stat.percentage >= 50 ? 'ดี (Good)' : 'กำลังพัฒนา (Keep going)'}\n`;
      content += `────────────────────────────────────────────\n`;
    });

    content += `\nพิมพ์เมื่อวันที่: ${new Date().toLocaleDateString('th-TH')} เวลา ${new Date().toLocaleTimeString('th-TH')}\n`;
    content += `รายงานฉบับนี้จัดทำขึ้นเพื่อการติดตามผลภายในกลุ่ม\n`;
    content += `ขอให้อัลลอฮฺตอบแทนความดีของทุกคน อามีน`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `DeenTracker_Leader_Summary_${viewDate}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/90 backdrop-blur-md p-4">
      <div className="bg-white w-full max-w-6xl max-h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300 border border-white/20">
        
        {/* Header Section - Compacted padding */}
        <div className="bg-[#062e1e] p-4 md:p-6 text-white flex justify-between items-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-5 pointer-events-none">
            <svg width="100%" height="100%"><pattern id="grid-leader" width="30" height="30" patternUnits="userSpaceOnUse"><path d="M 30 0 L 0 0 0 30" fill="none" stroke="white" strokeWidth="0.5"/></pattern><rect width="100%" height="100%" fill="url(#grid-leader)" /></svg>
          </div>
          <div className="relative z-10">
            <h2 className="text-xl md:text-2xl font-black tracking-tight flex items-center gap-3">
              <span className="w-1.5 h-6 bg-emerald-400 rounded-full"></span>
              แผงควบคุมหัวหน้ากลุ่ม
            </h2>
            <p className="text-emerald-400/60 text-[8px] md:text-[10px] uppercase tracking-[0.3em] font-black mt-0.5">Leader Interface</p>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-xl transition-all active:scale-90 border border-white/10 backdrop-blur-md"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Compact Action Bar */}
        <div className="p-4 md:px-8 bg-slate-50 border-b border-slate-200">
          <div className="flex flex-col md:flex-row items-end md:items-center justify-between gap-4 md:gap-6">
            
            {/* Left side: Date Selection - Compacted */}
            <div className="flex flex-col w-full md:w-auto">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1.5 px-1">เลือกวันที่ตรวจสอบ</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-emerald-600 z-10">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z" /></svg>
                </div>
                <input 
                  type="date" 
                  value={viewDate}
                  onChange={(e) => setViewDate(e.target.value)}
                  className="w-full md:w-56 pl-10 pr-4 py-2.5 bg-white border-2 border-slate-200 rounded-2xl font-black text-slate-800 outline-none focus:border-emerald-500 transition-all shadow-sm text-xs cursor-pointer"
                />
              </div>
            </div>

            {/* Right side: Summary Actions - Compacted Button */}
            <div className="flex flex-col w-full md:w-auto">
               <label className="hidden md:block text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1.5 px-1 text-right">ส่งออกรายงาน</label>
               <button 
                onClick={handleExport}
                className="group flex items-center justify-center gap-2.5 w-full md:w-auto px-6 py-3 bg-emerald-600 text-white rounded-2xl font-black text-[11px] shadow-lg shadow-emerald-900/10 hover:bg-emerald-700 hover:-translate-y-0.5 transition-all active:scale-95"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                ดาวน์โหลดสรุป {new Date(viewDate).toLocaleDateString('th-TH', { month: 'short', year: 'numeric' })}
              </button>
            </div>

          </div>
        </div>

        {/* Members Status List */}
        <div className="flex-grow overflow-auto p-4 md:p-8 bg-white scrollbar-hide">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-3">
              <div className="h-6 w-1 bg-emerald-500 rounded-full"></div>
              <h3 className="font-black text-slate-800 text-lg tracking-tight">สถานะรายวัน</h3>
            </div>
            <div className="bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 text-[9px] font-black text-slate-500 uppercase tracking-widest w-fit">
                DATA: {viewDate}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {MEMBERS.map(member => {
              const mData = dailyProgress[member.id] || {};
              const completedTasks = Object.values(mData).filter(v => v).length;
              const percentage = Math.round((completedTasks / TASKS.length) * 100);
              
              return (
                <div key={member.id} className="group border-2 border-slate-50 rounded-[1.5rem] p-5 bg-slate-50/30 hover:border-emerald-200 hover:bg-white transition-all duration-300 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-black text-slate-800 text-base leading-none mb-1 group-hover:text-emerald-900 transition-colors">{member.name}</h4>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{member.id === 'leader' ? 'Admin' : 'Member'}</p>
                    </div>
                    <span className={`text-[9px] px-2.5 py-1 rounded-full font-black ${
                      percentage === 100 ? 'bg-emerald-600 text-white' : percentage >= 50 ? 'bg-emerald-100 text-emerald-700' : 'bg-white text-slate-400 border border-slate-200'
                    }`}>
                      {percentage}%
                    </span>
                  </div>
                  
                  <div className="w-full h-1 bg-slate-100 rounded-full mb-5 overflow-hidden">
                    <div className="h-full bg-emerald-500 transition-all duration-700" style={{ width: `${percentage}%` }}></div>
                  </div>

                  <div className="space-y-2">
                    {TASKS.map(task => (
                      <div key={task.id} className="flex items-center gap-2 text-[10px]">
                        {mData[task.id] ? (
                          <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        ) : (
                          <div className="w-4 h-4 rounded-full border-2 border-slate-200 flex-shrink-0 bg-white"></div>
                        )}
                        <span className={mData[task.id] ? 'text-slate-800 font-bold' : 'text-slate-400 font-medium'}>{task.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer - Compacted */}
        <div className="p-4 md:px-8 bg-slate-50 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex flex-col items-center md:items-start">
                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">DeenTracker Management</div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-[7px] font-bold text-slate-500 uppercase">Live Sync</span>
                  </div>
                </div>
            </div>
            <button 
              onClick={onClose}
              className="w-full md:w-auto px-10 py-3 bg-slate-900 text-white font-black rounded-xl hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-200 text-xs uppercase tracking-[0.15em]"
            >
              เสร็จสิ้น
            </button>
        </div>
      </div>
    </div>
  );
};

export default LeaderSummaryModal;
