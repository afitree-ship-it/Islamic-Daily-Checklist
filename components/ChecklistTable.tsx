
import React, { useMemo, useState } from 'react';
import { MEMBERS, TASKS } from '../constants';
import { ProgressData, SyncQueueItem, Task } from '../types';

interface ChecklistTableProps {
  currentDate: string;
  onDateChange: (date: string) => void;
  progress: ProgressData;
  activeMemberId: string | null;
  onToggle: (date: string, memberId: string, taskId: string) => void;
  onOpenSelector: () => void;
  syncQueue: SyncQueueItem[];
}

const TaskButton = React.memo(({ 
  task, 
  isChecked, 
  isPending, 
  isMe, 
  onToggle, 
  date, 
  memberId,
  isInteractionDisabled
}: { 
  task: Task, 
  isChecked: boolean, 
  isPending: boolean, 
  isMe: boolean, 
  onToggle: any, 
  date: string, 
  memberId: string,
  isInteractionDisabled: boolean
}) => {
  // สร้าง Local Feedback เมื่อกด เพื่อความรู้สึกลื่นไหล
  const [justClicked, setJustClicked] = useState(false);

  const handleClick = () => {
    if (!isMe || isInteractionDisabled) return;
    
    setJustClicked(true);
    setTimeout(() => setJustClicked(false), 300);
    onToggle(date, memberId, task.id);
  };

  return (
    <button
      onClick={handleClick}
      disabled={isInteractionDisabled}
      className={`group relative flex flex-col items-center justify-center gap-2 p-3 rounded-2xl transition-all duration-75 ${
        isChecked 
          ? 'bg-emerald-600 text-white shadow-md'
          : 'bg-white border border-slate-100 text-slate-600 shadow-sm'
      } ${isInteractionDisabled ? 'opacity-20 grayscale cursor-not-allowed' : 'active:scale-95 active:brightness-90'} ${justClicked ? 'scale-90 ring-2 ring-emerald-300' : ''}`}
    >
      {(isPending || justClicked) && (
        <div className="absolute top-1.5 right-1.5">
          <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse border border-white"></div>
        </div>
      )}
      
      <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
        isChecked ? 'bg-white/20' : 'bg-slate-50 border border-slate-100'
      }`}>
        {isChecked ? (
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" />
          </svg>
        ) : (
           <div className="w-1.5 h-1.5 rounded-full bg-slate-200"></div>
        )}
      </div>
      
      <div className="text-center pointer-events-none">
        <p className={`text-[11px] font-black leading-none mb-0.5 ${isChecked ? 'text-white' : 'text-slate-800'}`}>{task.label}</p>
        <p className={`text-[8px] uppercase font-bold tracking-widest ${isChecked ? 'text-emerald-100' : 'text-slate-400'}`}>{task.category}</p>
      </div>
    </button>
  );
});

const ChecklistTable: React.FC<ChecklistTableProps> = ({ 
  currentDate, 
  onDateChange,
  progress, 
  activeMemberId, 
  onToggle, 
  onOpenSelector,
  syncQueue
}) => {
  const dailyProgress = progress[currentDate] || {};

  const sortedMembers = useMemo(() => {
    if (!activeMemberId) return MEMBERS;
    const activeIndex = MEMBERS.findIndex(m => m.id === activeMemberId);
    if (activeIndex === -1) return MEMBERS;
    
    const others = [...MEMBERS];
    const active = others.splice(activeIndex, 1)[0];
    return [active, ...others];
  }, [activeMemberId]);

  const getSyncState = (memberId: string, taskId: string) => {
    return syncQueue.some(q => q.date === currentDate && q.memberId === memberId && q.taskId === taskId);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start px-2">
        <h3 className="text-xl font-black text-slate-800 flex items-center mt-2">
          <span className="w-1.5 h-6 bg-emerald-500 rounded-full mr-3"></span>
          เช็คลิสต์
        </h3>
        
        <div className="flex flex-col items-end gap-2">
          <div className="relative group">
            <span className="absolute -top-2 right-3 bg-white px-2 text-[8px] font-black text-emerald-600 uppercase tracking-widest z-10 border border-emerald-100 rounded-full">
              วันที่
            </span>
            <input 
              type="date" 
              value={currentDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="bg-white text-slate-800 text-sm font-black py-3 px-4 rounded-2xl border-2 border-emerald-100 focus:border-emerald-500 transition-all outline-none shadow-sm cursor-pointer w-44"
            />
          </div>

          <button 
            onClick={onOpenSelector}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white text-[10px] font-black rounded-xl border border-orange-400 hover:bg-orange-600 transition-all shadow-lg active:scale-95 uppercase tracking-widest"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            เปลี่ยนคน
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:hidden">
        {sortedMembers.map((member) => {
          const isMe = member.id === activeMemberId;
          const memberData = dailyProgress[member.id] || {};
          const completedCount = Object.values(memberData).filter(v => v).length;

          return (
            <div 
              key={member.id} 
              className={`rounded-[2rem] border overflow-hidden transition-all duration-300 shadow-sm bg-white ${
                isMe ? 'border-emerald-200 ring-4 ring-emerald-500/5' : 'border-slate-100'
              }`}
            >
              <div className={`px-5 py-3 flex justify-between items-center ${isMe ? 'bg-emerald-50/50' : 'bg-slate-50/30'}`}>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-black uppercase tracking-tight ${isMe ? 'text-emerald-900' : 'text-slate-600'}`}>
                    {member.name}
                  </span>
                  {isMe && <span className="bg-emerald-600 text-white text-[8px] px-2 py-0.5 rounded-full font-black uppercase">Me</span>}
                </div>
                <div className={`text-[10px] font-black px-3 py-1 rounded-xl ${isMe ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-500'}`}>
                  {completedCount}/{TASKS.length}
                </div>
              </div>
              
              <div className="p-3 grid grid-cols-2 gap-2">
                {TASKS.map((task) => (
                  <TaskButton
                    key={task.id}
                    task={task}
                    isChecked={!!memberData[task.id]}
                    isPending={getSyncState(member.id, task.id)}
                    isMe={isMe}
                    onToggle={onToggle}
                    date={currentDate}
                    memberId={member.id}
                    isInteractionDisabled={!isMe && activeMemberId !== null}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="hidden lg:block overflow-hidden shadow-xl rounded-[3rem] border border-emerald-100 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="bg-[#062e1e] text-white">
                <th className="px-8 py-6 font-black uppercase tracking-widest text-[10px] sticky left-0 z-40 bg-[#062e1e]">รายชื่อ</th>
                {TASKS.map(task => (
                  <th key={task.id} className="px-2 py-6 text-center min-w-[100px]">
                    <div className="text-[9px] text-emerald-400 font-black uppercase tracking-widest mb-1">{task.category}</div>
                    <div className="text-sm font-black">{task.label}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-50">
              {sortedMembers.map((member) => {
                const isMe = member.id === activeMemberId;
                const isInteractionDisabled = !isMe && activeMemberId !== null;
                const memberData = dailyProgress[member.id] || {};

                return (
                  <tr key={member.id} className={`${isMe ? 'bg-emerald-50/30' : 'hover:bg-slate-50/50'}`}>
                    <td className={`px-8 py-5 sticky left-0 z-20 shadow-sm ${isMe ? 'bg-emerald-50' : 'bg-white'}`}>
                      <div className="flex flex-col">
                        <span className="font-black text-lg text-slate-800">{member.name}</span>
                        {isMe && <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">คุณกำลังใช้งาน</span>}
                      </div>
                    </td>
                    {TASKS.map((task) => {
                      const isChecked = !!memberData[task.id];
                      const pending = getSyncState(member.id, task.id);
                      return (
                        <td key={task.id} className="p-2 text-center relative">
                          <TaskButton
                            task={task}
                            isChecked={isChecked}
                            isPending={pending}
                            isMe={isMe}
                            onToggle={onToggle}
                            date={currentDate}
                            memberId={member.id}
                            isInteractionDisabled={isInteractionDisabled}
                          />
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
    </div>
  );
};

export default ChecklistTable;
