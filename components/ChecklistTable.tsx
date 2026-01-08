
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
      {/* Mobile View: Compact Cards */}
      <div className="grid grid-cols-1 gap-4 lg:hidden">
        {MEMBERS.map((member) => {
          const isMe = member.id === activeMemberId;
          const isLocked = activeMemberId !== null && !isMe;
          const memberData = dailyProgress[member.id] || {};
          const completedCount = Object.values(memberData).filter(v => v).length;

          return (
            <div 
              key={member.id} 
              className={`rounded-2xl border transition-all ${
                isMe ? 'border-emerald-500 bg-white shadow-lg ring-2 ring-emerald-50' : 'border-slate-200 bg-slate-50/30'
              } ${isLocked ? 'opacity-80' : ''}`}
            >
              <div className={`px-4 py-3 flex justify-between items-center border-b ${isMe ? 'border-emerald-100' : 'border-slate-100'}`}>
                <div className="flex items-center gap-2">
                  <span className={`text-base font-black ${isMe ? 'text-emerald-900' : 'text-slate-700'}`}>{member.name}</span>
                  {isMe && <span className="bg-emerald-600 text-white text-[9px] px-1.5 py-0.5 rounded-md uppercase font-black">คุณ</span>}
                </div>
                <div className="text-[10px] font-bold text-slate-400 bg-white px-2 py-1 rounded-full border border-slate-100">
                  สำเร็จ {completedCount}/{TASKS.length}
                </div>
              </div>
              
              <div className="p-3 grid grid-cols-2 gap-2">
                {TASKS.map((task) => {
                  const isChecked = !!memberData[task.id];
                  return (
                    <button
                      key={task.id}
                      onClick={() => {
                        if (!isLocked) {
                          if (activeMemberId === null) onOpenSelector();
                          else onToggle(currentDate, member.id, task.id);
                        }
                      }}
                      disabled={isLocked}
                      className={`relative flex flex-col items-start p-3 rounded-xl border transition-all text-left h-16 ${
                        isChecked 
                          ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm' 
                          : `bg-white border-slate-200 text-slate-600`
                      } ${isLocked ? 'grayscale-[0.3]' : 'active:scale-95'}`}
                    >
                      <span className={`text-[8px] font-bold uppercase tracking-tight mb-0.5 ${isChecked ? 'text-emerald-100' : 'text-slate-400'}`}>
                        {task.category}
                      </span>
                      <span className="text-xs font-bold leading-tight line-clamp-2">{task.label}</span>
                      <div className={`absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center border ${
                        isChecked ? 'bg-white border-white text-emerald-600' : 'bg-slate-50 border-slate-100 text-transparent'
                      }`}>
                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop View: Table (Keep and refine) */}
      <div className="hidden lg:block overflow-x-auto shadow-xl rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="text-xs text-emerald-700 uppercase bg-emerald-50/80">
            <tr>
              <th className="px-6 py-4 font-bold border-r min-w-[160px] sticky left-0 z-40 bg-emerald-50 shadow-[2px_0_0_0_rgba(0,0,0,0.05)]">สมาชิก</th>
              {TASKS.map(task => (
                <th key={task.id} className="px-2 py-4 text-center font-bold min-w-[100px]">{task.label}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {MEMBERS.map((member) => {
              const isMe = member.id === activeMemberId;
              const isLocked = activeMemberId !== null && !isMe;
              return (
                <tr key={member.id} className={isMe ? 'bg-emerald-50/30' : 'hover:bg-slate-50/50 transition-colors'}>
                  <td className={`px-6 py-4 font-bold border-r sticky left-0 z-20 shadow-[2px_0_0_0_rgba(0,0,0,0.05)] ${isMe ? 'bg-emerald-100/50 text-emerald-900' : 'bg-white'}`}>
                    {member.name} {isMe && ' (คุณ)'}
                  </td>
                  {TASKS.map((task) => {
                    const isChecked = !!dailyProgress[member.id]?.[task.id];
                    return (
                      <td key={task.id} className="px-2 py-4 text-center">
                        <button
                          onClick={() => !isLocked && (activeMemberId ? onToggle(currentDate, member.id, task.id) : onOpenSelector())}
                          disabled={isLocked}
                          className={`w-10 h-10 mx-auto rounded-lg border flex items-center justify-center transition-all ${
                            isChecked ? 'bg-emerald-500 border-emerald-500 text-white shadow-md' : 'border-slate-200 bg-white'
                          } ${isLocked ? 'opacity-20 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}`}
                        >
                          {isChecked && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
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

      {activeMemberId === null && (
        <button 
          onClick={onOpenSelector}
          className="w-full p-4 bg-amber-50 rounded-2xl border-2 border-dashed border-amber-200 text-amber-900 font-bold animate-pulse text-center text-sm"
        >
          👇 เลือกชื่อของคุณเพื่อเริ่มบันทึกความดี 👇
        </button>
      )}
    </div>
  );
};

export default ChecklistTable;
