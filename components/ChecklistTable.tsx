
import React from 'react';
import { MEMBERS, TASKS } from '../constants';
import { ProgressData } from '../types';

interface ChecklistTableProps {
  currentDate: string;
  progress: ProgressData;
  activeMemberId: string | null;
  onToggle: (date: string, memberId: string, taskId: string) => void;
  onOpenSelector: () => void;
}

const ChecklistTable: React.FC<ChecklistTableProps> = ({ currentDate, progress, activeMemberId, onToggle, onOpenSelector }) => {
  const dailyProgress = progress[currentDate] || {};

  return (
    <div className="space-y-6">
      {/* Mobile View: Modern Card List */}
      <div className="grid grid-cols-1 gap-4 lg:hidden">
        {MEMBERS.map((member) => {
          const isMe = member.id === activeMemberId;
          const memberData = dailyProgress[member.id] || {};
          const completedCount = Object.values(memberData).filter(v => v).length;

          return (
            <div 
              key={member.id} 
              className={`rounded-[2rem] border overflow-hidden transition-all duration-500 shadow-sm ${
                isMe 
                  ? 'border-emerald-200 bg-white ring-4 ring-emerald-500/10' 
                  : 'border-slate-100 bg-white/60'
              }`}
            >
              {/* Card Header */}
              <div className={`px-5 py-3 flex justify-between items-center ${isMe ? 'bg-emerald-50/50 border-b border-emerald-100' : 'bg-slate-50/30'}`}>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isMe ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></div>
                  <span className={`text-sm font-black uppercase tracking-tight ${isMe ? 'text-emerald-900' : 'text-slate-600'}`}>{member.name}</span>
                  {isMe && <span className="bg-amber-100 text-amber-700 text-[9px] px-2 py-0.5 rounded-full font-black ml-1">USER</span>}
                </div>
                <div className={`text-[10px] font-black px-3 py-1 rounded-xl shadow-sm ${isMe ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                  {completedCount}/{TASKS.length}
                </div>
              </div>
              
              {/* Task Grid - Modern Square Style */}
              <div className="p-3 grid grid-cols-2 gap-2">
                {TASKS.map((task) => {
                  const isChecked = !!memberData[task.id];
                  const isInteractionDisabled = !isMe && activeMemberId !== null;

                  return (
                    <button
                      key={task.id}
                      onClick={() => {
                        if (activeMemberId === null) onOpenSelector();
                        else if (isMe) onToggle(currentDate, member.id, task.id);
                      }}
                      disabled={isInteractionDisabled}
                      className={`group relative flex flex-col items-center justify-center gap-2 p-3 rounded-2xl transition-all duration-300 ${
                        isChecked 
                          ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-200'
                          : 'bg-white border border-slate-100 text-slate-600 hover:border-emerald-200'
                      } ${isInteractionDisabled ? 'opacity-40 grayscale' : 'active:scale-90 hover:scale-[0.98]'}`}
                    >
                      {/* Checkbox Icon - Modern Rounded Circle */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                        isChecked 
                          ? 'bg-white/20' 
                          : 'bg-slate-50 border border-slate-200 group-hover:bg-emerald-50 group-hover:border-emerald-200'
                      }`}>
                        {isChecked ? (
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.5" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                           <div className="w-1.5 h-1.5 rounded-full bg-slate-300 group-hover:bg-emerald-400"></div>
                        )}
                      </div>
                      
                      <div className="text-center">
                        <p className={`text-[11px] font-black leading-none mb-0.5 ${isChecked ? 'text-white' : 'text-slate-800'}`}>{task.label}</p>
                        <p className={`text-[8px] uppercase font-bold tracking-widest ${isChecked ? 'text-emerald-100' : 'text-slate-400'}`}>{task.category}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop View: Modern High-End Table */}
      <div className="hidden lg:block overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.05)] rounded-[3rem] border border-emerald-100 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="bg-[#062e1e] text-white">
                <th className="px-8 py-6 font-black border-b border-emerald-800 sticky left-0 z-40 bg-[#062e1e] uppercase tracking-widest text-[10px]">รายชื่อสมาชิก</th>
                {TASKS.map(task => (
                  <th key={task.id} className="px-2 py-6 text-center border-b border-emerald-800 min-w-[100px]">
                    <div className="text-[9px] text-emerald-400 font-black uppercase tracking-widest mb-1">{task.category}</div>
                    <div className="text-sm font-black">{task.label}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-50">
              {MEMBERS.map((member) => {
                const isMe = member.id === activeMemberId;
                const isInteractionDisabled = !isMe && activeMemberId !== null;
                const memberData = dailyProgress[member.id] || {};

                return (
                  <tr key={member.id} className={`transition-all ${isMe ? 'bg-emerald-50/30' : 'hover:bg-slate-50/50'}`}>
                    <td className={`px-8 py-5 sticky left-0 z-20 shadow-[10px_0_15px_-5px_rgba(0,0,0,0.02)] ${
                      isMe ? 'bg-emerald-50 text-emerald-900' : 'bg-white text-slate-700'
                    }`}>
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${isMe ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-200'}`}></div>
                          <div className="flex flex-col">
                            <span className="font-black text-lg tracking-tight">{isMe && '📍 '}{member.name}</span>
                            {isMe && <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Active Identity</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    {TASKS.map((task) => {
                      const isChecked = !!memberData[task.id];
                      return (
                        <td key={task.id} className={`p-2 text-center`}>
                          <button
                            onClick={() => {
                              if (activeMemberId === null) onOpenSelector();
                              else if (isMe) onToggle(currentDate, member.id, task.id);
                            }}
                            disabled={isInteractionDisabled}
                            className={`w-full aspect-square max-h-16 rounded-2xl border-2 flex flex-col items-center justify-center transition-all duration-300 ${
                              isChecked 
                                ? 'bg-gradient-to-br from-emerald-500 to-teal-600 border-transparent text-white shadow-lg shadow-emerald-200 scale-95' 
                                : 'border-slate-100 bg-white hover:border-emerald-200'
                            } ${isInteractionDisabled ? 'opacity-10 grayscale cursor-not-allowed' : 'hover:scale-[0.97] active:scale-90'}`}
                          >
                            {isChecked ? (
                              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <div className="w-2 h-2 rounded-full bg-slate-200"></div>
                            )}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {activeMemberId === null && (
        <div className="p-8 bg-amber-500 text-white rounded-[2.5rem] flex flex-col items-center gap-4 shadow-2xl shadow-amber-200 animate-bounce-subtle mt-10">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-3xl">👤</div>
          <div className="text-center">
            <p className="font-black text-xl mb-1">กรุณาระบุตัวตนก่อนใช้งาน!</p>
            <p className="text-amber-100 text-sm font-medium">เลือกชื่อของคุณเพื่อเริ่มบันทึกความดีในวันนี้</p>
          </div>
          <button 
            onClick={onOpenSelector}
            className="px-10 py-4 bg-white text-amber-600 font-black rounded-2xl shadow-xl hover:bg-amber-50 transition-all active:scale-95"
          >
            เลือกชื่อของฉัน
          </button>
        </div>
      )}
    </div>
  );
};

export default ChecklistTable;
