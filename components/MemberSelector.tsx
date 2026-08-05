
import React, { useEffect } from 'react';
import { MEMBERS } from '../constants';
import { Member } from '../types';

interface MemberSelectorProps {
  onSelect: (member: Member) => void;
  onLeaderAccess: () => void;
  members?: Member[];
}

const MemberSelector: React.FC<MemberSelectorProps> = ({ onSelect, onLeaderAccess, members }) => {
  const memberList = members || MEMBERS;
  // ล็อคการเลื่อนของ Body และป้องกันการสั่น/เด้งของพื้นหลัง (Overscroll/Elastic bounce on Mobile)
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    const originalOverscroll = document.body.style.overscrollBehavior;
    
    document.body.style.overflow = 'hidden';
    document.body.style.overscrollBehavior = 'none';

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.overscrollBehavior = originalOverscroll;
    };
  }, []);

  return (
    <div 
      className="fixed inset-0 z-[999] flex items-center justify-center bg-[#062e1e]/95 backdrop-blur-md p-3 sm:p-6 overflow-hidden select-none touch-none overscroll-none"
      onTouchMove={(e) => {
        // ป้องกันการลากพื้นหลังเมื่อแตะที่ฉากหลังสีเข้ม
        if (e.target === e.currentTarget) {
          e.preventDefault();
        }
      }}
    >
      <div className="bg-white w-full max-w-sm sm:max-w-xl rounded-[2.2rem] sm:rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.6)] overflow-hidden animate-in fade-in zoom-in duration-300 border border-emerald-100/20 flex flex-col h-[85vh] max-h-[620px] sm:max-h-[680px] overscroll-none">
        
        {/* Modern Header with Outline Logo */}
        <div 
          className="bg-gradient-to-br from-emerald-800 to-emerald-950 p-4 sm:p-5 text-white text-center flex-shrink-0 relative overflow-hidden touch-none"
          onTouchMove={(e) => e.preventDefault()}
        >
          {/* Decorative Pattern Background */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <svg width="100%" height="100%"><pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1" fill="white"/></pattern><rect width="100%" height="100%" fill="url(#grid)" /></svg>
          </div>

          <div className="relative z-10">
            {/* Logo Container with Breathing Animation & Ambient Aura */}
            <div className="relative w-16 h-16 sm:w-18 sm:h-18 mx-auto mb-2 flex items-center justify-center">
              {/* Outer Breathing Aura (Soft Glow Effect) */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-emerald-400/40 via-teal-300/30 to-amber-300/20 blur-xl animate-aura-pulse pointer-events-none" />
              
              {/* Counter-rotating Geometric Rings */}
              <div className="absolute inset-[-3px] rounded-full border border-emerald-400/30 border-dashed animate-rotate-slow pointer-events-none" />
              <div className="absolute inset-[-8px] rounded-full border border-amber-300/25 border-dotted animate-rotate-slow-reverse pointer-events-none" />

              {/* Core Breathing Logo Badge */}
              <div className="relative w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-emerald-700/90 via-emerald-900 to-emerald-950 rounded-2xl flex items-center justify-center border-2 border-emerald-300/40 shadow-[0_8px_20px_-4px_rgba(16,185,129,0.5)] backdrop-blur-md animate-logo-breath overflow-hidden">
                
                {/* Subtle Inner Ambient Glow */}
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/10 via-transparent to-white/10 pointer-events-none" />

                {/* Main Logo SVG Icon - Stylish Crescent Shield with Modern Bold Checkmark */}
                <svg className="w-8 h-8 sm:w-9 sm:h-9 drop-shadow-[0_4px_12px_rgba(52,211,153,0.8)]" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="checkGrad" x1="6" y1="16" x2="26" y2="16" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#ffffff" />
                      <stop offset="60%" stopColor="#6ee7b7" />
                      <stop offset="100%" stopColor="#fde047" />
                    </linearGradient>
                    <linearGradient id="crescentGrad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#34d399" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#059669" stopOpacity="0.2" />
                    </linearGradient>
                  </defs>

                  {/* Decorative Background Crescent Motif */}
                  <path 
                    d="M17 3.5C11.2 3.5 6.5 8.2 6.5 14C6.5 19.8 11.2 24.5 17 24.5C19.5 24.5 21.8 23.6 23.6 22.1C20.8 23.3 17.5 23 15 21C11.8 18.4 11.2 13.7 13.8 10.5C15.1 8.9 17 8 19 8C20 8 21 8.2 22 8.7C20.6 5.5 19 3.5 17 3.5Z" 
                    fill="url(#crescentGrad)"
                    className="opacity-70"
                  />

                  {/* Star Accent on Top Right */}
                  <path 
                    d="M23.5 4.5L24.3 6.2L26 7L24.3 7.8L23.5 9.5L22.7 7.8L21 7L22.7 6.2L23.5 4.5Z" 
                    fill="#fde047" 
                    className="animate-pulse"
                  />

                  {/* Outer Glowing Circle Guide */}
                  <circle cx="16" cy="16" r="13.5" stroke="#34d399" strokeWidth="1.2" strokeDasharray="3 3" opacity="0.4" />

                  {/* Main Stylish Bold Ribbon Checkmark */}
                  <path 
                    d="M8.5 16.5L13.2 21.2C13.6 21.6 14.3 21.6 14.7 21.2L24.5 10.5" 
                    stroke="url(#checkGrad)" 
                    strokeWidth="3.6" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                  />

                  {/* Highlight Glow Accent Line on Checkmark */}
                  <path 
                    d="M9.5 16.5L13.2 20.2L23.5 10" 
                    stroke="#ffffff" 
                    strokeWidth="1.2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    opacity="0.9"
                  />
                </svg>

                {/* Subtle Corner Sparkle */}
                <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-amber-300 rounded-full animate-ping opacity-75" />
                <div className="absolute bottom-1.5 left-1.5 w-1 h-1 bg-emerald-300 rounded-full animate-pulse" />
              </div>
            </div>
            
            <div className="flex flex-col items-center mx-auto w-fit">
              <h2 className="text-xl sm:text-2xl font-black tracking-tighter leading-tight uppercase bg-gradient-to-r from-white via-emerald-100 to-emerald-300 bg-clip-text text-transparent drop-shadow-sm">
                DEENTRACKER
              </h2>
            </div>
            <p className="text-emerald-300/90 text-[9px] sm:text-[10px] font-black uppercase tracking-widest mt-1.5 flex items-center gap-1.5 justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              เลือกสมาชิกเพื่อเริ่มต้น
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            </p>
          </div>
        </div>
        
        {/* Member Grid - Scrollable Member List Area */}
        <div className="p-4 sm:p-6 grid grid-cols-3 sm:grid-cols-4 gap-2.5 sm:gap-3.5 bg-slate-50/50 flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y scrollbar-hide">
          {memberList.map((member) => (
            <button
              key={member.id}
              onClick={() => onSelect(member)}
              className="group bg-white p-2 py-3 sm:py-4 rounded-[1.25rem] sm:rounded-[1.5rem] border border-slate-100 hover:border-emerald-500 hover:bg-white hover:shadow-xl hover:shadow-emerald-900/10 transition-all duration-300 text-center flex flex-col items-center gap-1.5 sm:gap-2.5 active:scale-95 shadow-sm"
            >
              <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-emerald-50/80 border border-emerald-100 flex items-center justify-center text-emerald-600 transition-all duration-300 group-hover:bg-emerald-500 group-hover:text-white group-hover:border-emerald-400 group-hover:shadow-lg group-hover:shadow-emerald-200">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
        <div 
          className="p-4 sm:p-5 bg-white border-t border-slate-100 flex-shrink-0 text-center touch-none"
          onTouchMove={(e) => e.preventDefault()}
        >
          <button 
            onClick={onLeaderAccess}
            className="w-full flex items-center justify-center gap-2.5 py-3 sm:py-4 px-5 bg-emerald-50/50 text-emerald-900 text-sm sm:text-base font-black rounded-2xl transition-all border-2 border-emerald-100 hover:bg-emerald-100/50 hover:border-emerald-300 active:scale-[0.98] active:bg-emerald-200/50 shadow-sm mb-2.5 group uppercase tracking-tighter"
          >
            <div className="w-7 h-7 bg-emerald-500/10 rounded-xl flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
              <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            แผงควบคุมหัวหน้า
          </button>
          
          <div className="flex flex-col gap-1">
            <p className="text-[9px] text-slate-300 uppercase font-bold tracking-tight">DeenTracker v2.0 • Digital Management Suite</p>
            <p className="text-[6px] sm:text-[7px] font-bold text-slate-300 uppercase tracking-widest italic leading-none">
              Create & Design By: Afitree Yamaenoh
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemberSelector;
