
import React from 'react';
import { MEMBERS, TASKS } from '../constants';
import { ProgressData } from '../types';

interface LeaderSummaryModalProps {
  currentDate: string;
  progress: ProgressData;
  onClose: () => void;
}

const LeaderSummaryModal: React.FC<LeaderSummaryModalProps> = ({ currentDate, progress, onClose }) => {
  const dailyProgress = progress[currentDate] || {};

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/90 backdrop-blur-md p-4">
      <div className="bg-white w-full max-w-5xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300">
        <div className="bg-slate-800 p-6 text-white flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black">แผงสรุปผลสำหรับหัวหน้ากลุ่ม</h2>
            <p className="text-slate-400 text-sm">ข้อมูลประจำวันที่: {currentDate}</p>
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
                    <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                      percentage === 100 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {percentage}%
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {TASKS.map(task => (
                      <div key={task.id} className="flex items-center gap-2 text-xs">
                        {mData[task.id] ? (
                          <svg className="w-3.5 h-3.5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <div className="w-3.5 h-3.5 rounded-full border border-slate-300"></div>
                        )}
                        <span className={mData[task.id] ? 'text-slate-700' : 'text-slate-400'}>{task.label}</span>
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
              className="px-8 py-3 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 transition-all"
            >
              ตกลง
            </button>
        </div>
      </div>
    </div>
  );
};

export default LeaderSummaryModal;
