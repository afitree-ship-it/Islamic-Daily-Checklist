
import React from 'react';
import { MEMBERS } from '../constants';
import { Member } from '../types';

interface MemberSelectorProps {
  onSelect: (member: Member) => void;
  onLeaderAccess: () => void;
}

const MemberSelector: React.FC<MemberSelectorProps> = ({ onSelect, onLeaderAccess }) => {
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-[#062e1e]/95 backdrop-blur-sm p-2 sm:p-4">
      <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-[0_30px_60px_-12px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in zoom-in duration-300 border border-emerald-100/20 flex flex-col">
        
        {/* Compact Header */}
        <div className="bg-gradient-to-br from-emerald-800 to-emerald-950 p-4 text-white text-center flex-shrink-0">
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center mx-auto mb-2 border border-white/10 shadow-inner">
            <svg className="w-6 h-6 text-emerald-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <div className="flex flex-col items-center mx-auto w-fit">
            <h2 className="text-base font-black tracking-tight leading-tight">DEENTRACKER</h2>
            <p className="text-[5px] text-white/30 font-bold whitespace-nowrap leading-none mt-1 uppercase w-full" style={{ textAlignLast: 'justify' }}>
              Create & Design By: Afitree Yamaenoh
            </p>
          </div>
          <p className="text-emerald-300 text-[8px] font-bold uppercase tracking-[0.2em] mt-2">ยินดีต้อนรับ กรุณาเลือกชื่อของคุณ</p>
        </div>
        
        {/* Member Grid - 4 Columns, Compact Padding */}
        <div className="p-3 grid grid-cols-4 gap-2 bg-slate-50/50 flex-grow overflow-y-auto max-h-[60vh] sm:max-h-none">
          {MEMBERS.map((member) => (
            <button
              key={member.id}
              onClick={() => onSelect(member)}
              className="group bg-white p-2 py-3 rounded-xl border border-slate-100 hover:border-emerald-500 hover:bg-emerald-50 transition-all text-center flex flex-col items-center gap-1 active:scale-90 shadow-sm"
            >
              <div className="w-9 h-9 rounded-full bg-slate-50 group-hover:bg-emerald-100 flex items-center justify-center text-slate-300 group-hover:text-emerald-600 transition-colors">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <span className="font-black text-slate-600 group-hover:text-emerald-800 tracking-tighter text-[9px] sm:text-[10px] truncate w-full px-0.5">
                {member.name}
              </span>
            </button>
          ))}
        </div>
        
        {/* Footer with Leader Access and Credits */}
        <div className="px-4 py-3 bg-white border-t border-slate-100 flex-shrink-0 text-center">
          <button 
            onClick={onLeaderAccess}
            className="w-full flex items-center justify-center gap-2 py-1 text-[9px] font-black text-slate-400 hover:text-amber-600 transition-colors uppercase tracking-[0.15em] mb-1"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Leader Access
          </button>
          <p className="text-[5px] font-bold text-slate-300/40 uppercase tracking-widest italic leading-none mt-1">
            Create & Design By: Afitree Yamaenoh
          </p>
        </div>
      </div>
    </div>
  );
};

export default MemberSelector;
