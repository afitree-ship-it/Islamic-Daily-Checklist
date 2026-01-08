
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
    <div className="overflow-x-auto shadow-xl rounded-2xl border border-slate-200 bg-white">
      <table className="w-full text-sm text-left border-collapse">
        <thead className="text-xs text-emerald-700 uppercase bg-emerald-50 sticky top-0 z-30">
          <tr>
            <th className="px-6 py-4 font-bold border-r min-w-[160px] bg-emerald-50 sticky left-0 z-40 shadow-[2px_0_0_0_rgba(0,0,0,0.05)]">
              ชื่อสมาชิก
            </th>
            {TASKS.map(task => (
              <th key={task.id} className="px-2 py-4 text-center font-bold min-w-[100px]">
                {task.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {MEMBERS.map((member) => {
            const isMe = member.id === activeMemberId;
            const isLocked = activeMemberId !== null && !isMe;
            
            return (
              <tr 
                key={member.id} 
                className={`transition-all duration-200 ${isMe ? 'bg-emerald-50/70' : isLocked ? 'opacity-60 bg-slate-50/30' : 'hover:bg-slate-50'}`}
              >
                <td className={`px-6 py-4 font-medium border-r sticky left-0 z-20 shadow-[2px_0_0_0_rgba(0,0,0,0.05)] transition-colors ${
                  isMe ? 'bg-emerald-100 text-emerald-900 font-black' : 'bg-white text-slate-900'
                }`}>
                  <div className="flex items-center gap-2">
                    <span className="truncate">{member.name}</span>
                    {isMe && (
                      <span className="flex-shrink-0 bg-emerald-600 text-white text-[10px] px-1.5 py-0.5 rounded-md uppercase font-bold shadow-sm">คุณ</span>
                    )}
                    {isLocked && (
                      <svg className="w-3 h-3 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </td>
                {TASKS.map((task) => {
                  const isChecked = !!dailyProgress[member.id]?.[task.id];
                  return (
                    <td key={task.id} className="px-2 py-4 text-center">
                      <button
                        onClick={() => {
                          if (!isLocked) {
                            if (activeMemberId === null) {
                                onOpenSelector();
                            } else {
                                onToggle(currentDate, member.id, task.id);
                            }
                          }
                        }}
                        disabled={isLocked}
                        className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center transition-all ${
                          isChecked 
                            ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-100 scale-105' 
                            : 'border-slate-200 text-transparent hover:border-emerald-300 hover:bg-emerald-50/30'
                        } ${isLocked ? 'cursor-not-allowed grayscale-[0.5]' : 'active:scale-95 cursor-pointer'}`}
                        aria-label={`${member.name} - ${task.label}`}
                        title={isLocked ? `เฉพาะคุณ ${member.name} เท่านั้นที่บันทึกส่วนนี้ได้` : ''}
                      >
                        {isChecked ? (
                          <svg className="w-6 h-6 animate-in zoom-in duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <div className={`w-2 h-2 rounded-full ${isMe ? 'bg-emerald-200' : 'bg-slate-200'}`}></div>
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
      {activeMemberId === null && (
        <button 
            onClick={onOpenSelector}
            className="w-full p-6 bg-amber-50 hover:bg-amber-100 text-amber-900 text-center transition-all group flex flex-col items-center gap-2 border-t border-amber-200"
        >
          <div className="flex items-center gap-3 font-black text-lg">
            <span className="animate-bounce">👉</span>
            กรุณาคลิกที่นี่เพื่อเลือกชื่อของคุณก่อน
            <span className="animate-bounce">👈</span>
          </div>
          <p className="text-amber-700 text-sm font-medium opacity-80 group-hover:opacity-100">คุณต้องระบุตัวตนก่อนจึงจะสามารถเริ่มบันทึกกิจกรรมความดีได้</p>
        </button>
      )}
    </div>
  );
};

export default ChecklistTable;
