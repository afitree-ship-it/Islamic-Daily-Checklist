
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

  // ข้อมูลสำหรับกราฟสรุปรายวัน
  const dailyChartData = useMemo(() => {
    return MEMBERS.map(member => {
      const memberChecks = dailyProgress[member.id] || {};
      const completedCount = Object.values(memberChecks).filter(v => v).length;
      return {
        name: member.name,
        completed: completedCount,
        total: TASKS.length
      };
    });
  }, [dailyProgress, viewDate]);

  const dailyAverage = useMemo(() => {
    if (dailyChartData.length === 0) return 0;
    const total = dailyChartData.reduce((acc, curr) => acc + curr.completed, 0);
    const totalPossible = MEMBERS.length * TASKS.length;
    return totalPossible > 0 ? Math.round((total / totalPossible) * 100) : 0;
  }, [dailyChartData]);

  const COLORS = ['#10b981', '#059669', '#047857', '#065f46', '#064e3b', '#34d399', '#6ee7b7', '#a7f3d0'];

  const handleExport = () => {
    let content = `📊 สรุปรายงานความคืบหน้า DeenTracker (Leader Access)\n`;
    content += `📅 ข้อมูลรายวัน ณ วันที่: ${viewDate}\n`;
    content += `📈 ภาพรวมกลุ่มวันนี้: ${dailyAverage}%\n`;
    content += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    MEMBERS.forEach((member) => {
      const mData = dailyProgress[member.id] || {};
      const completedCount = Object.values(mData).filter(v => v).length;
      content += `👤 ${member.name}: ${completedCount}/${TASKS.length} รายการ (${Math.round((completedCount/TASKS.length)*100)}%)\n`;
      TASKS.forEach(t => {
        content += `   [${mData[t.id] ? '✓' : ' '}] ${t.label}\n`;
      });
      content += `────────────────────────────────────────────\n`;
    });

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `DeenTracker_Leader_Daily_${viewDate}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center bg-slate-900/90 backdrop-blur-md p-2 pt-14 md:p-4 md:pt-20">
      <div className="bg-white w-full max-w-7xl max-h-[92vh] rounded-[2rem] shadow-2xl overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-10 duration-500 border border-white/20">
        
        {/* Header Section - Super Tight */}
        <div className="bg-[#062e1e] px-4 py-2.5 md:px-6 md:py-3 text-white flex justify-between items-center flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 bg-emerald-400 rounded-full"></div>
            <h2 className="text-sm md:text-base font-black tracking-tight uppercase">Leader Dashboard</h2>
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
        
        {/* Action Bar - Tightened */}
        <div className="px-4 py-2 md:px-6 md:py-2 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">วันที่:</span>
              <input 
                type="date" 
                value={viewDate}
                onChange={(e) => setViewDate(e.target.value)}
                className="pl-2 pr-1 py-1 bg-white border border-slate-200 rounded-lg font-black text-slate-800 text-[10px] outline-none focus:border-emerald-500 transition-all cursor-pointer shadow-sm"
              />
            </div>
            <div className="flex items-center gap-1 px-2.5 py-1 bg-emerald-100/50 rounded-full border border-emerald-100">
               <span className="text-[9px] font-black text-emerald-900">{dailyAverage}%</span>
            </div>
          </div>

          <button 
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 text-white rounded-lg font-black text-[9px] shadow-sm hover:bg-emerald-700 active:scale-95 transition-all"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            <span className="xs:inline">ส่งออก</span>
          </button>
        </div>

        {/* Content Area - Optimized Space */}
        <div className="flex-grow overflow-auto p-3 md:p-5 bg-white scrollbar-hide">
          
          {/* Daily Chart Section - Tightened Bottom Space */}
          <div className="mb-4 bg-slate-50/50 p-3 md:p-5 rounded-[1.5rem] border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between mb-2 px-1">
              <h3 className="font-black text-slate-800 text-[9px] md:text-[11px] uppercase tracking-widest">ความคืบหน้าภาพรวม (เลื่อนได้)</h3>
              <div className="hidden xs:flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Stat</span>
              </div>
            </div>
            
            <div className="w-full overflow-x-auto scrollbar-hide">
              <div className="h-48 min-w-[500px] md:min-w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={dailyChartData} 
                    margin={{ top: 5, right: 10, left: -30, bottom: 40 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 9, fontWeight: 900, fill: '#1e293b' }} 
                      interval={0} 
                      angle={-45}
                      textAnchor="end"
                      height={40}
                    />
                    <YAxis hide domain={[0, TASKS.length]} />
                    <Tooltip 
                      cursor={{ fill: '#ffffff', opacity: 0.5 }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-[#062e1e] p-2 shadow-xl rounded-xl text-white border border-white/10">
                              <p className="font-black text-[9px] mb-0.5 text-emerald-400">{payload[0].payload.name}</p>
                              <p className="font-black text-xs">{`${payload[0].value}/${TASKS.length}`}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="completed" radius={[3, 3, 3, 3]} barSize={20}>
                      {dailyChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Member Progress Cards Grid with Compact Frames and Distinct Checklist */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
            {MEMBERS.map(member => {
              const mData = dailyProgress[member.id] || {};
              const completedCount = Object.values(mData).filter(v => v).length;
              const percentage = Math.round((completedCount / TASKS.length) * 100);
              
              return (
                <div key={member.id} className="border-2 border-slate-100 rounded-[1.25rem] p-3.5 bg-white shadow-sm hover:border-emerald-200 transition-all duration-300 group">
                  <div className="flex justify-between items-start mb-2">
                    <div className="min-w-0 pr-1">
                      <h4 className="font-black text-slate-900 text-[13px] truncate leading-none group-hover:text-emerald-700 transition-colors">{member.name}</h4>
                      <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">
                        ทำ {completedCount}/{TASKS.length} ข้อ
                      </p>
                    </div>
                    <div className={`flex flex-col items-center justify-center min-w-[34px] h-[34px] rounded-lg font-black shadow-inner border ${
                      percentage === 100 ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-50 text-slate-600 border-slate-100'
                    }`}>
                      <span className="text-[10px] leading-none">{percentage}</span>
                      <span className="text-[6px] mt-0.5 opacity-60 font-bold">%</span>
                    </div>
                  </div>
                  
                  <div className="w-full h-1 bg-slate-100 rounded-full mb-3 overflow-hidden">
                    <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${percentage}%` }}></div>
                  </div>

                  {/* Task List - Distinct Checked vs Unchecked */}
                  <div className="space-y-1 pt-2 border-t border-slate-50">
                    {TASKS.map(task => {
                      const isChecked = !!mData[task.id];
                      return (
                        <div key={task.id} className="flex items-center justify-between gap-1">
                          <span className={`text-[11px] font-bold truncate max-w-[85%] ${isChecked ? 'text-slate-800' : 'text-slate-400 opacity-60'}`}>
                            {task.label}
                          </span>
                          {isChecked ? (
                            <div className="w-3.5 h-3.5 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 flex-shrink-0">
                              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="5" d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          ) : (
                            <div className="w-3.5 h-3.5 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 border border-slate-100 flex-shrink-0">
                              <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

        {/* Footer - Tightened */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-between items-center flex-shrink-0">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Admin Control</span>
            <button 
              onClick={onClose}
              className="px-5 py-1.5 bg-slate-900 text-white font-black rounded-lg hover:bg-slate-800 transition-all active:scale-95 text-[9px] uppercase tracking-widest shadow-md"
            >
              ปิด
            </button>
        </div>
      </div>
    </div>
  );
};

export default LeaderSummaryModal;
