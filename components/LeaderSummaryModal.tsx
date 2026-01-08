
import React, { useMemo } from 'react';
import { MEMBERS, TASKS } from '../constants';
import { ProgressData, MonthlyMemberStats } from '../types';

interface LeaderSummaryModalProps {
  currentDate: string;
  progress: ProgressData;
  onClose: () => void;
}

const LeaderSummaryModal: React.FC<LeaderSummaryModalProps> = ({ currentDate, progress, onClose }) => {
  const dailyProgress = progress[currentDate] || {};
  const currentMonth = currentDate.slice(0, 7); // ใช้เดือนจากวันที่ที่เลือกอยู่

  // คำนวณสถิติรายเดือนสำหรับการ Export
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
    const dateObj = new Date(currentDate);
    const monthLong = dateObj.toLocaleDateString('th-TH', { month: 'long' });
    const yearThai = dateObj.toLocaleDateString('th-TH', { year: 'numeric' });
    const fullDateText = `${monthLong} ${yearThai}`;
    
    let content = `📊 สรุปรายงานความคืบหน้า DeenTracker (Leader Access)\n`;
    content += `📅 ประจำเดือน: ${fullDateText}\n`;
    content += `📈 ภาพรวมกลุ่ม: ${groupAverage}%\n`;
    content += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    content += `รายชื่อสมาชิกและสถิติความสำเร็จรายเดือน:\n\n`;
    
    monthlyStats.forEach((stat, idx) => {
      const medal = idx === 0 ? '🥇 ' : idx === 1 ? '🥈 ' : idx === 2 ? '🥉 ' : '🔹 ';
      content += `${medal}${idx + 1}. ${stat.memberName}\n`;
      content += `   • เดือน/ปี: ${fullDateText}\n`;
      content += `   • ระดับความสำเร็จ: ${stat.percentage}%\n`;
      content += `   • บันทึกกิจกรรม: ${stat.totalCompleted} ครั้ง (จากทั้งหมด ${stat.totalPossible} รายการ)\n`;
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
    link.download = `DeenTracker_Leader_Summary_${currentMonth}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/90 backdrop-blur-md p-4">
      <div className="bg-white w-full max-w-5xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300">
        <div className="bg-slate-800 p-6 text-white flex justify-between items-center">
          <div>
            <h2 className="text-xl md:text-2xl font-black">แผงสรุปผลสำหรับหัวหน้ากลุ่ม</h2>
            <p className="text-slate-400 text-xs md:text-sm">ข้อมูลประจำวันที่: {currentDate}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-xl transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* ส่วนปุ่มดาวน์โหลดสรุปตรงกลางด้านบน */}
        <div className="p-4 bg-emerald-50 border-b border-emerald-100 flex justify-center">
          <button 
            onClick={handleExport}
            className="group flex items-center gap-3 px-8 py-3 bg-emerald-600 text-white rounded-2xl font-black text-sm shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-95"
          >
            <svg className="w-5 h-5 animate-bounce group-hover:animate-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            ดาวน์โหลดสรุปรายเดือน (.txt)
          </button>
        </div>

        <div className="flex-grow overflow-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {MEMBERS.map(member => {
              const mData = dailyProgress[member.id] || {};
              const completedTasks = Object.values(mData).filter(v => v).length;
              const percentage = Math.round((completedTasks / TASKS.length) * 100);
              
              return (
                <div key={member.id} className="border border-slate-100 rounded-2xl p-4 bg-slate-50 hover:border-emerald-200 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-bold text-slate-800">{member.name}</h4>
                    <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${
                      percentage === 100 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {percentage}%
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {TASKS.map(task => (
                      <div key={task.id} className="flex items-center gap-2 text-[10px] md:text-xs">
                        {mData[task.id] ? (
                          <svg className="w-3 h-3 md:w-3.5 md:h-3.5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <div className="w-3 h-3 md:w-3.5 md:h-3.5 rounded-full border border-slate-300"></div>
                        )}
                        <span className={mData[task.id] ? 'text-slate-700 font-medium' : 'text-slate-400'}>{task.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end">
            <button 
              onClick={onClose}
              className="px-8 py-3 bg-slate-800 text-white font-black rounded-xl hover:bg-slate-700 transition-all active:scale-95"
            >
              ตกลง
            </button>
        </div>
      </div>
    </div>
  );
};

export default LeaderSummaryModal;
