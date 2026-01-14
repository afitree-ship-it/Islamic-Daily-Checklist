
import React from 'react';
import { MEMBERS } from '../constants';
import { Member } from '../types';

interface MemberSelectorProps {
  onSelect: (member: Member) => void;
  onLeaderAccess: () => void;
}

const MemberSelector: React.FC<MemberSelectorProps> = ({ onSelect, onLeaderAccess }) => {
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-[#062e1e]/95 backdrop-blur-md p-4 sm:p-6">
      <div className="bg-white w-full max-w-sm sm:max-w-xl sm:-mt-12 rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.6)] overflow-hidden animate-in fade-in zoom-in duration-300 border border-emerald-100/20 flex flex-col max-h-[90vh]">
        
        {/* Modern Header with Outline Logo */}
        <div className="bg-gradient-to-br from-emerald-800 to-emerald-950 p-6 sm:p-8 text-white text-center flex-shrink-0 relative overflow-hidden">
          {/* Decorative Pattern Background */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <svg width="100%" height="100%"><pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1" fill="white"/></pattern><rect width="100%" height="100%" fill="url(#grid)" /></svg>
          </div>

          <div className="relative z-10">
            {/* Logo Icon with Outline Style */}
            <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-white/20 shadow-lg backdrop-blur-sm">
              <svg className="w-8 h-8 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" strokeDasharray="4 2" className="opacity-40" />
                <path d="M12 2a10 10 0 1 1-10 10A10 10 0 0 1 12 2" className="animate-[spin_10s_linear_infinite]" />
                <polyline points="16 9 11 14 8 11" strokeWidth="2.5" className="text-white" />
              </svg>
            </div>
            
            <div className="flex flex-col items-center mx-auto w-fit">
              <h2 className="text-xl sm:text-2xl font-black tracking-tighter leading-tight uppercase">DEENTRACKER</h2>
              <p className="text-[6px] sm:text-[7px] text-white/30 font-bold whitespace-nowrap leading-none mt-1 uppercase w-full" style={{ textAlignLast: 'justify' }}>
                Create & Design By: Afitree Yamaenoh
              </p>
            </div>
            <p className="text-emerald-300 text-[9px] sm:text-[10px] font-black uppercase tracking-widest mt-3">เลือกสมาชิกเพื่อเริ่มต้น</p>
          </div>
        </div>
        
        {/* Member Grid - Optimized for Desktop/Mobile */}
        <div className="p-5 sm:p-8 grid grid-cols-4 gap-3 sm:gap-4 bg-slate-50/50 flex-grow overflow-y-auto scrollbar-hide">
          {MEMBERS.map((member) => (
            <button
              key={member.id}
              onClick={() => onSelect(member)}
              className="group bg-white p-2 py-3.5 sm:py-5 rounded-[1.5rem] border border-slate-100 hover:border-emerald-500 hover:bg-white hover:shadow-xl hover:shadow-emerald-900/10 transition-all duration-300 text-center flex flex-col items-center gap-2 sm:gap-3 active:scale-90 shadow-sm"
            >
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-emerald-50/80 border border-emerald-100 flex items-center justify-center text-emerald-600 transition-all duration-300 group-hover:bg-emerald-500 group-hover:text-white group-hover:border-emerald-400 group-hover:shadow-lg group-hover:shadow-emerald-200">
                <svg className="w-6 h-6 sm:w-7 sm:h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <span className="font-black text-slate-700 group-hover:text-emerald-900 tracking-tighter text-[10px] sm:text-[12px] truncate w-full px-0.5 leading-none">
                {member.name}
              </span>
            </button>
          ))}
        </div>
        
        {/* Footer with Minimalist Leader Access Button */}
        <div className="px-6 py-6 sm:px-8 bg-white border-t border-slate-100 flex-shrink-0 text-center">
          <button 
            onClick={onLeaderAccess}
            className="w-full flex items-center justify-center gap-3 py-4 sm:py-5 px-6 bg-emerald-50/50 text-emerald-900 text-base sm:text-lg font-black rounded-2xl transition-all border-2 border-emerald-100 hover:bg-emerald-100/50 hover:border-emerald-300 active:scale-[0.98] active:bg-emerald-200/50 shadow-sm mb-6 group uppercase tracking-tighter"
          >
            <div className="w-8 h-8 bg-emerald-500/10 rounded-xl flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            แผงควบคุมหัวหน้า
          </button>
          
          <div className="flex flex-col gap-1">
            <p className="text-[6px] sm:text-[7px] font-bold text-slate-300 uppercase tracking-widest italic leading-none">
              Create & Design By: Afitree Yamaenoh
            </p>
            <p className="text-[5px] sm:text-[6px] text-slate-200 uppercase font-bold tracking-tighter">DeenTracker v2.0 • Digital Management Suite</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemberSelector;
