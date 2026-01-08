
import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { MEMBERS, TASKS } from '../constants';
import { ProgressData } from '../types';
import MonthlySummaryModal from './MonthlySummaryModal';

interface StatsPanelProps {
  currentDate: string;
  progress: ProgressData;
}

const StatsPanel: React.FC<StatsPanelProps> = ({ currentDate, progress }) => {
  const [showMonthly, setShowMonthly] = useState(false);
  const dailyProgress = progress[currentDate] || {};

  const chartData = useMemo(() => {
    return MEMBERS.map(member => {
      const memberChecks = dailyProgress[member.id] || {};
      const completedCount = Object.values(memberChecks).filter(v => v).length;
      return {
        name: member.name,
        completed: completedCount,
        total: TASKS.length
      };
    });
  }, [dailyProgress]);

  const COLORS = ['#10b981', '#059669', '#047857', '#065f46', '#064e3b', '#34d399', '#6ee7b7', '#a7f3d0'];

  return (
    <div className="bg-white p-6 rounded-[2.5rem] shadow-lg border border-slate-100 min-w-0">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-black text-slate-800 flex items-center">
          <span className="w-1.5 h-6 bg-emerald-500 rounded-full mr-3"></span>
          สรุปรายวัน
        </h3>
        <button 
          onClick={() => setShowMonthly(true)}
          className="px-4 py-2 bg-emerald-50 text-emerald-700 text-[10px] font-black rounded-xl border border-emerald-100 hover:bg-emerald-100 transition-colors uppercase tracking-widest flex items-center gap-2"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
          สรุปรายเดือน
        </button>
      </div>
      
      <div className="h-64 w-full min-w-0 overflow-hidden">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} 
              interval={0}
            />
            <YAxis hide domain={[0, TASKS.length]} />
            <Tooltip 
              cursor={{ fill: '#f8fafc', radius: 8 }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-white p-3 shadow-2xl rounded-2xl border border-emerald-50 scale-110">
                      <p className="font-black text-slate-800 text-xs">{payload[0].payload.name}</p>
                      <p className="text-emerald-600 font-black text-sm">{`${payload[0].value} / ${TASKS.length}`}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="completed" radius={[8, 8, 8, 8]} barSize={32}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-emerald-900 text-white rounded-2xl shadow-lg shadow-emerald-100 flex flex-col justify-center">
            <p className="text-[8px] font-black uppercase tracking-widest opacity-60 mb-1">ภาพรวมกลุ่ม</p>
            <p className="text-2xl font-black">
                {Math.round((chartData.reduce((acc, curr) => acc + curr.completed, 0) / (MEMBERS.length * TASKS.length)) * 100)}%
            </p>
        </div>
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest mb-1">กิจกรรม</p>
            <p className="text-xl font-black text-slate-700">{TASKS.length}</p>
        </div>
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest mb-1">สมาชิก</p>
            <p className="text-xl font-black text-slate-700">{MEMBERS.length}</p>
        </div>
        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
            <p className="text-[8px] text-amber-600 font-black uppercase tracking-widest mb-1">สถานะ</p>
            <p className="text-xs font-black text-amber-700 leading-tight">ระบบทำงานปกติ Syncing...</p>
        </div>
      </div>

      {showMonthly && (
        <MonthlySummaryModal progress={progress} onClose={() => setShowMonthly(false)} />
      )}
    </div>
  );
};

export default StatsPanel;
