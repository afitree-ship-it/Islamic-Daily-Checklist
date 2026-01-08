
import React, { useMemo } from 'react';
import { MEMBERS, TASKS } from '../constants';
import { ProgressData, MonthlyMemberStats } from '../types';

interface MonthlySummaryModalProps {
  progress: ProgressData;
  onClose: () => void;
}

const MonthlySummaryModal: React.FC<MonthlySummaryModalProps> = ({ progress, onClose }) => {
  const currentMonth = new Date().toISOString().slice(0, 7); 

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

  const handleExport = () => {
    const monthName = new Date().toLocaleDateString('th-TH', { month: 'long', year: 'numeric' });
    let content = `สรุปผลความคืบหน้า DeenTracker - ${monthName}\n`;
    content += `==========================================\n\n`;
    
    monthlyStats.forEach((stat, idx) => {
      content += `${idx + 1}. ${stat.memberName}\n`;
      content += `   ความสำเร็จ: ${stat.percentage}%\n`;
      content += `   กิจกรรมที่ทำ: ${stat.totalCompleted} จาก ${stat.totalPossible} ครั้ง\n`;
      content += `------------------------------------------\n`;
    });

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `DeenTracker_Summary_${currentMonth}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-emerald-950/95 backdrop-blur-xl p-4">
      <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300">
        <div className="bg-emerald-900 p-6 text-white flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black tracking-tight">สรุปรายเดือน</h2>
            <p className="text-emerald-400 text-[10px] font-bold uppercase tracking-widest mt-1">
              {new Date().toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}
            </p>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh] space-y-3">
          {monthlyStats.map((stat, idx) => (
            <div key={stat.memberId} className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center gap-4 group hover:bg-white hover:border-emerald-200 transition-all">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-black text-xs group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                {idx + 1}
              </div>
              <div className="flex-grow">
                <div className="flex justify-between items-end mb-1">
                  <span className="font-black text-slate-800">{stat.memberName}</span>
                  <span className="text-[10px] font-black text-emerald-600">{stat.percentage}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${stat.percentage}%` }}></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 flex flex-col gap-3">
          <button 
            onClick={handleExport}
            className="w-full py-4 bg-white text-emerald-700 border-2 border-emerald-100 font-black rounded-2xl shadow-sm hover:bg-emerald-50 transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            ดาวน์โหลดสรุป (.txt)
          </button>
          <button 
            onClick={onClose}
            className="w-full py-4 bg-emerald-800 text-white font-black rounded-2xl shadow-lg hover:bg-emerald-700 transition-all active:scale-95"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};

export default MonthlySummaryModal;
