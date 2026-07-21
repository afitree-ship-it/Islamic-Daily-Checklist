
import React, { useMemo, useState } from 'react';
import { MEMBERS, TASKS, getTaskPoints } from '../constants';
import { ProgressData, SyncQueueItem, Task } from '../types';
import { playCheckSound } from '../utils/audio';

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
  const [floatingPoints, setFloatingPoints] = useState<{ id: string; text: string; isPositive: boolean }[]>([]);

  const handleClick = () => {
    if (!isMe || isInteractionDisabled) return;
    
    setJustClicked(true);
    setTimeout(() => setJustClicked(false), 300);

    const points = getTaskPoints(task.id);
    const isNewChecked = !isChecked;
    
    // Play the beautiful custom synthesized sound!
    playCheckSound(isNewChecked);

    const effectId = `${Date.now()}-${Math.random()}`;
    const newEffect = {
      id: effectId,
      text: isNewChecked ? `+${points}` : `-${points}`,
      isPositive: isNewChecked
    };

    setFloatingPoints(prev => [...prev, newEffect]);
    setTimeout(() => {
      setFloatingPoints(prev => prev.filter(item => item.id !== effectId));
    }, 850);

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
      {/* เอฟเฟคตัวเลขคะแนนลอยตัวขึ้นสะสม */}
      {floatingPoints.map(effect => (
        <span
          key={effect.id}
          className={`absolute z-30 font-extrabold text-base sm:text-lg tracking-tighter no-select pointer-events-none animate-float-score ${
            effect.isPositive 
              ? 'text-amber-300 drop-shadow-[0_2px_8px_rgba(245,158,11,0.8)]' 
              : 'text-rose-500 drop-shadow-[0_2px_8px_rgba(244,63,94,0.8)]'
          }`}
          style={{ top: '20%' }}
        >
          {effect.text}
        </span>
      ))}

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
        <p className={`text-[8px] uppercase font-bold tracking-widest ${isChecked ? 'text-emerald-100' : 'text-slate-400'}`}>
          {task.category} • +{getTaskPoints(task.id)} แต้ม
        </p>
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

  const recentDates = useMemo(() => {
    const dates = [];
    const today = new Date();
    
    // Generate the last 5 days (Today, Yesterday, -2, -3, -4)
    for (let i = 4; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const yyyymmdd = d.toISOString().split('T')[0];
      
      let label = d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
      if (i === 0) label = 'วันนี้';
      else if (i === 1) label = 'เมื่อวาน';
      
      dates.push({
        dateStr: yyyymmdd,
        label
      });
    }

    // If selected currentDate is not in the list, dynamically append/prepend it
    const hasCurrent = dates.some(d => d.dateStr === currentDate);
    if (!hasCurrent) {
      const d = new Date(currentDate);
      if (!isNaN(d.getTime())) {
        const label = d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
        dates.unshift({
          dateStr: currentDate,
          label: `${label} 📅`
        });
      }
    }
    
    return dates;
  }, [currentDate]);

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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-2">
        <h3 className="text-xl font-black text-slate-800 flex items-center">
          <span className="w-1.5 h-6 bg-emerald-500 rounded-full mr-3"></span>
          เช็คลิสต์
        </h3>
        
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {/* Recent Date Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {recentDates.map((item) => {
              const isActive = item.dateStr === currentDate;
              return (
                <button
                  key={item.dateStr}
                  onClick={() => onDateChange(item.dateStr)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all duration-75 ${
                    isActive 
                      ? 'bg-emerald-950 text-white shadow-sm ring-1 ring-emerald-900/10 scale-102' 
                      : 'bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-700 border border-slate-200 shadow-sm'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
            
            {/* Custom Compact Calendar Icon Button */}
            <div className="relative flex items-center">
              <button className="p-1.5 rounded-xl bg-white text-slate-500 hover:bg-slate-50 border border-slate-200 flex items-center justify-center relative shadow-sm hover:border-emerald-300 transition-all" title="เลือกวันที่อื่นๆ">
                <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <input 
                  type="date" 
                  value={currentDate}
                  onChange={(e) => {
                    if (e.target.value) {
                      onDateChange(e.target.value);
                    }
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
              </button>
            </div>
          </div>

          <div className="h-4 w-px bg-slate-200 hidden sm:block"></div>

          <button 
            onClick={onOpenSelector}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-black rounded-xl border border-slate-200 hover:border-slate-300 transition-all shadow-sm active:scale-95 uppercase tracking-wider"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            สลับผู้ใช้
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:hidden">
        {sortedMembers.map((member) => {
          const isMe = member.id === activeMemberId;
          const memberData = dailyProgress[member.id] || {};
          const completedCount = Object.values(memberData).filter(v => v).length;
          const score = Object.keys(memberData).reduce((sum, tId) => memberData[tId] ? sum + getTaskPoints(tId) : sum, 0);

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
                <div className={`text-[10px] font-black px-3 py-1 rounded-xl flex items-center gap-1.5 ${isMe ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-500'}`}>
                  <span>{completedCount}/{TASKS.length}</span>
                  <span className="opacity-30">|</span>
                  <span className={isMe ? 'text-amber-300 font-bold' : 'text-emerald-600 font-bold'}>{score} แต้ม</span>
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
                const completedCount = Object.values(memberData).filter(v => v).length;
                const score = Object.keys(memberData).reduce((sum, tId) => memberData[tId] ? sum + getTaskPoints(tId) : sum, 0);

                return (
                  <tr key={member.id} className={`${isMe ? 'bg-emerald-50/30' : 'hover:bg-slate-50/50'}`}>
                    <td className={`px-8 py-5 sticky left-0 z-20 shadow-sm ${isMe ? 'bg-emerald-50' : 'bg-white'}`}>
                      <div className="flex flex-col">
                        <span className="font-black text-lg text-slate-800 leading-tight">{member.name}</span>
                        <span className="text-[10px] font-bold text-emerald-600 mt-0.5 leading-none">{score} แต้ม / {completedCount} กิจกรรม</span>
                        {isMe && <span className="text-[8px] font-black text-amber-600 uppercase tracking-widest mt-1">คุณกำลังใช้งาน</span>}
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
