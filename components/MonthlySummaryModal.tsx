
import React, { useMemo } from 'react';
import { MEMBERS, TASKS } from '../constants';
import { ProgressData, MonthlyMemberStats } from '../types';

interface MonthlySummaryModalProps {
  progress: ProgressData;
  onClose: () => void;
}

const MonthlySummaryModal: React.FC<MonthlySummaryModalProps> = ({ progress, onClose }) => {
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

  const monthlyStats = useMemo(() => {
    const stats: MonthlyMemberStats[] = MEMBERS.map(member => {
      let totalCompleted = 0;
      let totalPossible = 0;

      // กรองเฉพาะวันที่อยู่ในเดือนปัจจุบัน
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

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-emerald-950/90 backdrop-blur-xl p-4">
      <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300">
        <div className="bg-emerald-900 p-6 text-white flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black tracking-tight">สรุปความคืบหน้ารายเดือน</h2>
            <p className="text-emerald-400 text-[10px] font-bold uppercase tracking-widest mt-1">
              เดือนประจำชุดข้อมูล: {new Date().toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}
            </p>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[70vh]">
          <div className="space-y-4">
            {monthlyStats.map((stat, idx) => (
              <div key={stat.memberId} className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-black text-xs">
                  {idx + 1}
                </div>
                <div className="flex-grow">
                  <div className="flex justify-between items-end mb-1">
                    <span className="font-black text-slate-800">{stat.memberName}</span>
                    <span className="text-[10px] font-black text-emerald-600">{stat.percentage}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 transition-all duration-1000" 
                      style={{ width: `${stat.percentage}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between mt-1 text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                    <span>สำเร็จ {stat.totalCompleted} กิจกรรม</span>
                    <span>จากทั้งหมด {stat.totalPossible} ครั้ง</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100">
          <button 
            onClick={onClose}
            className="w-full py-4 bg-emerald-800 text-white font-black rounded-2xl shadow-lg hover:bg-emerald-700 transition-all active:scale-95"
          >
            ปิดหน้าต่างสรุป
          </button>
        </div>
      </div>
    </div>
  );
};

export default MonthlySummaryModal;
