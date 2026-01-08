
import React from 'react';
import { MEMBERS } from '../constants';
import { Member } from '../types';

interface MemberSelectorProps {
  onSelect: (member: Member) => void;
  onLeaderAccess: () => void;
  onClose?: () => void;
}

const MemberSelector: React.FC<MemberSelectorProps> = ({ onSelect, onLeaderAccess, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="bg-emerald-600 p-8 text-white text-center relative">
          {onClose && (
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-emerald-500 rounded-full transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          <h2 className="text-3xl font-black mb-2">ยินดีต้อนรับสู่ DeenTracker</h2>
          <p className="text-emerald-100">กรุณาเลือกชื่อของคุณเพื่อเข้าสู่ระบบ</p>
        </div>
        <div className="p-8 grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-[50vh] overflow-y-auto">
          {MEMBERS.map((member) => (
            <button
              key={member.id}
              onClick={() => onSelect(member)}
              className="group p-4 rounded-2xl border-2 border-slate-100 hover:border-emerald-500 hover:bg-emerald-50 transition-all text-center flex flex-col items-center gap-3"
            >
              <div className="w-12 h-12 rounded-full bg-slate-100 group-hover:bg-emerald-100 flex items-center justify-center text-slate-400 group-hover:text-emerald-600 transition-colors">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="font-bold text-slate-700 group-hover:text-emerald-700">{member.name}</span>
            </button>
          ))}
        </div>
        
        {/* Leader/Admin Special Access at the bottom */}
        <div className="p-8 bg-slate-50 flex flex-col items-center gap-4 border-t border-slate-100">
            <button 
              onClick={onLeaderAccess}
              className="w-full max-w-xs bg-slate-800 text-white font-bold py-4 px-8 rounded-2xl shadow-xl hover:bg-slate-900 transition-all active:scale-95 flex items-center justify-center gap-3"
            >
              <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              เข้าสู่โหมดหัวหน้า (ดูภาพรวม)
            </button>
            <button 
              onClick={onClose}
              className="text-slate-400 font-bold hover:text-slate-600 transition-colors text-sm"
            >
              ข้ามขั้นตอนเลือกชื่อ
            </button>
        </div>
      </div>
    </div>
  );
};

export default MemberSelector;
