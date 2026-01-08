
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { MEMBERS, TASKS } from '../constants';
import { ProgressData } from '../types';

interface StatsPanelProps {
  currentDate: string;
  progress: ProgressData;
}

const StatsPanel: React.FC<StatsPanelProps> = ({ currentDate, progress }) => {
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
    <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100 min-w-0">
      <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
        <span className="w-2 h-8 bg-emerald-500 rounded mr-3"></span>
        สรุปความคืบหน้ารายคน (วันนี้)
      </h3>
      
      {/* Container with min-w-0 and explicit height to help Recharts calculation */}
      <div className="h-72 w-full min-w-0 overflow-hidden">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12 }} 
              interval={0}
            />
            <YAxis hide domain={[0, TASKS.length]} />
            <Tooltip 
              cursor={{ fill: '#f1f5f9' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-white p-3 shadow-xl rounded-lg border border-slate-200">
                      <p className="font-bold text-slate-800">{payload[0].payload.name}</p>
                      <p className="text-emerald-600 font-medium">{`สำเร็จ ${payload[0].value} / ${TASKS.length}`}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="completed" radius={[4, 4, 0, 0]} isAnimationActive={false}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-emerald-50 rounded-xl">
            <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider">ภาพรวมกลุ่ม</p>
            <p className="text-2xl font-black text-emerald-700">
                {Math.round((chartData.reduce((acc, curr) => acc + curr.completed, 0) / (MEMBERS.length * TASKS.length)) * 100)}%
            </p>
        </div>
        <div className="p-4 bg-slate-50 rounded-xl">
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">จำนวนกิจกรรม</p>
            <p className="text-2xl font-black text-slate-700">{TASKS.length}</p>
        </div>
        <div className="p-4 bg-slate-50 rounded-xl">
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">สมาชิกทั้งหมด</p>
            <p className="text-2xl font-black text-slate-700">{MEMBERS.length}</p>
        </div>
        <div className="p-4 bg-indigo-50 rounded-xl">
            <p className="text-xs text-indigo-600 font-bold uppercase tracking-wider">เป้าหมายรวม</p>
            <p className="text-2xl font-black text-indigo-700">{MEMBERS.length * TASKS.length}</p>
        </div>
      </div>
    </div>
  );
};

export default StatsPanel;
