
import React from 'react';
import { MEMBERS } from '../constants';
import { Member } from '../types';

interface MemberSelectorProps {
  onSelect: (member: Member) => void;
  onLeaderAccess: () => void;
}

const MemberSelector: React.FC<MemberSelectorProps> = ({ onSelect, onLeaderAccess }) => {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/95 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-[0_32px_64px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in zoom-in duration-500 my-auto">
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-10 text-white text-center relative">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl shadow-inner border border-white/10">🕌</div>
          <h2 className="text-3xl font-black mb-2 tracking-tight">ยินดีต้อนรับสู่ DeenTracker</h2>
          <p className="text-emerald-100 font-medium">กรุณาเลือกชื่อของคุณเพื่อเริ่มบันทึกกิจกรรมวันนี้</p>
        </div>
        
        <div className="p-8 grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {MEMBERS.map((member) => (
            <button
              key={member.id}
              onClick={() => onSelect(member)}
              className="group p-5 rounded-3xl border-2 border-slate-100 hover:border-emerald-500 hover:bg-emerald-50 transition-all text-center flex flex-col items-center gap-3 shadow-sm hover:shadow-md"
            >
              <div className="w-14 h-14 rounded-full bg-slate-50 group-hover:bg-emerald-100 flex items-center justify-center text-slate-300 group-hover:text-emerald-600 transition-colors border border-slate-100">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="font-black text-slate-700 group-hover:text-emerald-700 tracking-tight">{member.name}</span>
            </button>
          ))}
        </div>
        
        <div className="p-10 bg-slate-50 flex flex-col items-center gap-6 border-t border-slate-100">
            <button 
              onClick={onLeaderAccess}
              className="w-full max-w-xs bg-slate-800 text-white font-black py-5 px-8 rounded-3xl shadow-2xl hover:bg-slate-900 transition-all active:scale-95 flex items-center justify-center gap-3 uppercase tracking-widest text-xs"
            >
              <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              โหมดหัวหน้ากลุ่ม (ADMIN)
            </button>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">DeenTracker Community System v1.0</p>
        </div>
      </div>
    </div>
  );
};

export default MemberSelector;
