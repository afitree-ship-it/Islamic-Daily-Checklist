
import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { MEMBERS, TASKS } from '../constants';
import { ProgressData } from '../types';

interface LeaderSummaryModalProps {
  currentDate: string;
  progress: ProgressData;
  onClose: () => void;
}

const LeaderSummaryModal: React.FC<LeaderSummaryModalProps> = ({ currentDate, progress, onClose }) => {
  const [viewDate, setViewDate] = useState(currentDate);
  const dailyProgress = progress[viewDate] || {};

  // คำนวณข้อมูลสำหรับกราฟจากวันที่เลือก
  const chartData = useMemo(() => {
    return MEMBERS.map(member => {
      const mData = dailyProgress[member.id] || {};
      const completedCount = Object.values(mData).filter(v => v).length;
      return {
        name: member.name,
        completed: completedCount,
        total: TASKS.length
      };
    });
  }, [dailyProgress]);

  const COLORS = ['#10b981', '#059669', '#047857', '#065f46', '#064e3b', '#34d399', '#6ee7b7', '#a7f3d0'];

  // ฟังก์ชันส่งออกรายงานรายเดือนแบบละเอียด
  const handleMonthlyExport = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); 
    const currentMonthStr = now.toISOString().slice(0, 7); 
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const totalDaysInMonth = lastDay.getDate();

    const monthLong = now.toLocaleDateString('th-TH', { month: 'long' });
    const yearThai = now.toLocaleDateString('th-TH', { year: 'numeric' });
    
    let content = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    content += `🏆 รายงานสรุปการปฏิบัติศาสนกิจรายเดือนแบบละเอียด (DeenTracker)\n`;
    content += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    content += `📅 ประจำเดือน: ${monthLong} ${yearThai}\n`;
    content += `📅 ช่วงเวลา: ${firstDay.toLocaleDateString('th-TH')} ถึง ${lastDay.toLocaleDateString('th-TH')}\n`;
    content += `📊 จำนวนเกณฑ์การวัดผล: ${TASKS.length} รายการต่อวัน\n`;
    content += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    MEMBERS.forEach((member, index) => {
      let memberMonthCompleted = 0;
      let memberMonthPossible = 0;
      let memberDailyLog = "";

      for (let d = 1; d <= totalDaysInMonth; d++) {
        const dateObj = new Date(year, month, d);
        const dateKey = dateObj.toISOString().split('T')[0];
        const dayLabel = String(d).padStart(2, '0');
        const monthLabel = String(month + 1).padStart(2, '0');
        
        const dayData = progress[dateKey]?.[member.id] || {};
        const dayCompletedCount = Object.values(dayData).filter(v => v).length;
        const dayPercentage = Math.round((dayCompletedCount / TASKS.length) * 100);
        
        memberMonthCompleted += dayCompletedCount;
        memberMonthPossible += TASKS.length;

        memberDailyLog += `📅 วันที่ ${dayLabel}/${monthLabel} | ความสำเร็จ: ${dayPercentage}%\n`;
        
        if (Object.keys(dayData).length === 0) {
          memberDailyLog += `   [ ไม่มีการบันทึกข้อมูลในวันนี้ ]\n`;
        } else {
          TASKS.forEach(task => {
            const isChecked = !!dayData[task.id];
            const statusIcon = isChecked ? "[✓]" : "[ ]";
            memberDailyLog += `   ${statusIcon} ${task.label}\n`;
          });
        }
        memberDailyLog += `------------------------------------------------------------\n`;
      }

      const totalPercentage = memberMonthPossible > 0 
        ? Math.round((memberMonthCompleted / memberMonthPossible) * 100) 
        : 0;

      content += `👤 สมาชิก: ${member.name}\n`;
      content += `📈 สรุปภาพรวมเดือนนี้: ${totalPercentage}%\n`;
      content += `📝 สถิติการบันทึก: ทำได้รวม ${memberMonthCompleted} จากทั้งหมด ${memberMonthPossible} รายการ\n`;
      content += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      content += memberDailyLog;
      content += `\n\n`;
    });

    content += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    content += `รายงานฉบับนี้ถูกสร้างโดยระบบอัตโนมัติ DeenTracker\n`;
    content += `พิมพ์เมื่อวันที่: ${new Date().toLocaleDateString('th-TH')} เวลา ${new Date().toLocaleTimeString('th-TH')}\n`;
    content += `ขอให้อัลลอฮฺทรงตอบรับการงานที่ดีของพวกเราทุกคน อามีน\n`;
    content += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `DeenTracker_Detailed_Report_${currentMonthStr}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center bg-slate-900/90 backdrop-blur-md p-2 pt-14 md:p-4 md:pt-20">
      <div className="bg-white w-full max-w-7xl max-h-[92vh] rounded-[2rem] shadow-2xl overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-10 duration-500 border border-white/20">
        
        {/* Header Section */}
        <div className="bg-[#062e1e] px-4 py-2.5 md:px-6 md:py-3 text-white flex justify-between items-center flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-4.5 bg-emerald-400 rounded-full"></div>
            <h2 className="text-sm md:text-base font-black tracking-tight uppercase">แผงควบคุมหัวหน้า</h2>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-lg transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Action Bar */}
        <div className="px-4 py-3 md:px-6 md:py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ตรวจสอบวันที่:</span>
              <input 
                type="date" 
                value={viewDate}
                onChange={(e) => setViewDate(e.target.value)}
                className="pl-3 pr-2 py-1.5 bg-white border border-slate-200 rounded-xl font-black text-slate-800 text-xs outline-none focus:border-emerald-500 transition-all cursor-pointer shadow-sm"
              />
            </div>
          </div>

          <button 
            onClick={handleMonthlyExport}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl font-black text-[11px] shadow-lg shadow-emerald-200 hover:bg-emerald-700 active:scale-95 transition-all border-b-2 border-emerald-800 uppercase tracking-wider"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            สรุปเดือนล่าสุด
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-grow overflow-auto p-4 md:p-6 bg-white scrollbar-hide">
          
          {/* Daily Stats Graph - New Compact Section */}
          <div className="mb-8 bg-slate-50/50 rounded-[2rem] border border-slate-100 p-4 md:p-6">
            <div className="flex items-center justify-between mb-4 px-1">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-4 bg-emerald-500 rounded-full"></div>
                <h3 className="font-black text-slate-800 text-[10px] uppercase tracking-widest">กราฟสรุปรายวัน ({viewDate})</h3>
              </div>
            </div>
            
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 45 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 9, fontWeight: 800, fill: '#64748b' }} 
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#cbd5e1' }} domain={[0, TASKS.length]} />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc', radius: 8 }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white p-2.5 shadow-xl rounded-xl border border-emerald-50">
                            <p className="font-black text-slate-800 text-[10px]">{payload[0].payload.name}</p>
                            <p className="text-emerald-600 font-black text-xs">{`${payload[0].value} / ${TASKS.length}`}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="completed" radius={[6, 6, 6, 6]} barSize={24}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-5 px-1">
             <div className="w-1.5 h-5 bg-emerald-500 rounded-full"></div>
             <h3 className="font-black text-slate-800 text-xs uppercase tracking-widest">สถานะการบันทึกสมาชิกรายบุคคล</h3>
          </div>

          {/* Member Progress Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
            {MEMBERS.map(member => {
              const mData = dailyProgress[member.id] || {};
              const completedCount = Object.values(mData).filter(v => v).length;
              const percentage = Math.round((completedCount / TASKS.length) * 100);
              
              return (
                <div key={member.id} className="border-2 border-slate-100 rounded-[1.5rem] p-4 bg-white shadow-sm hover:border-emerald-200 hover:shadow-md transition-all duration-300 group">
                  <div className="flex justify-between items-start mb-3">
                    <div className="min-w-0 pr-1">
                      <h4 className="font-black text-slate-900 text-sm truncate leading-none group-hover:text-emerald-700 transition-colors">{member.name}</h4>
                      <p className="text-[10px] font-bold text-slate-400 mt-1.5 uppercase tracking-tighter">
                        ทำได้ {completedCount}/{TASKS.length} ข้อ
                      </p>
                    </div>
                    <div className={`flex flex-col items-center justify-center min-w-[38px] h-[38px] rounded-xl font-black shadow-inner border ${
                      percentage === 100 ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-50 text-slate-600 border-slate-100'
                    }`}>
                      <span className="text-[11px] leading-none">{percentage}</span>
                      <span className="text-[7px] mt-0.5 opacity-60 font-bold">%</span>
                    </div>
                  </div>
                  
                  <div className="w-full h-1.5 bg-slate-100 rounded-full mb-4 overflow-hidden">
                    <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${percentage}%` }}></div>
                  </div>

                  {/* Task List */}
                  <div className="space-y-1.5 pt-3 border-t border-slate-50">
                    {TASKS.map(task => {
                      const isChecked = !!mData[task.id];
                      return (
                        <div key={task.id} className="flex items-center justify-between gap-1">
                          <span className={`text-xs font-bold truncate max-w-[85%] ${isChecked ? 'text-slate-800' : 'text-slate-400 opacity-60'}`}>
                            {task.label}
                          </span>
                          {isChecked ? (
                            <div className="w-4 h-4 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 flex-shrink-0">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="5" d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          ) : (
                            <div className="w-4 h-4 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 border border-slate-100 flex-shrink-0">
                              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center flex-shrink-0">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">แผงควบคุมหลักสำหรับหัวหน้า</span>
            <button 
              onClick={onClose}
              className="px-6 py-2 bg-slate-900 text-white font-black rounded-xl hover:bg-slate-800 transition-all active:scale-95 text-[10px] uppercase tracking-widest shadow-md"
            >
              ปิดหน้าต่างนี้
            </button>
        </div>
      </div>
    </div>
  );
};

export default LeaderSummaryModal;
