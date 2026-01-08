
import React, { useMemo } from 'react';

interface CelebrationModalProps {
  onClose: () => void;
}

const CELEBRATION_QUOTES = [
  { text: "มาชาอัลลอฮฺ! ความพยายามของท่านช่างงดงามยิ่งนัก", ref: "หัวใจที่เปี่ยมด้วยอีมาน" },
  { text: "อัลฮัมดูลิลลาฮฺ! ความสม่ำเสมอคือประตูสู่ความสำเร็จ", ref: "คำสอนจากบรรชนศอลิหฺ" },
  { text: "ความดีเพียงเล็กน้อยที่ทำสม่ำเสมอ เป็นที่รักยิ่งของอัลลอฮฺ", ref: "หะดีษของท่านนบี (ซ.ล.)" },
  { text: "ทุกก้าวของการขัดเกลาตนเอง คือชัยชนะที่แท้จริง", ref: "ทางนำแห่งอิสลาม" },
  { text: "ท่านทำได้ยอดเยี่ยมมาก! ขอให้อัลลอฮฺทรงบันทึกความดีนี้", ref: "ดุอาอ์แด่พี่น้องของฉัน" },
  { text: "ความสงบสุขของหัวใจ เริ่มต้นจากการรำลึกถึงพระองค์", ref: "อัลกุรอาน 13:28" },
  { text: "จงภูมิใจในวันนี้ และเริ่มใหม่ให้ดียิ่งขึ้นในวันพรุ่งนี้", ref: "พลังแห่งความศรัทธา" }
];

const CelebrationModal: React.FC<CelebrationModalProps> = ({ onClose }) => {
  // สุ่มเลือกคำคมเพียงหนึ่งเดียวทุกครั้งที่ Component ถูกเรียกใช้
  const quote = useMemo(() => 
    CELEBRATION_QUOTES[Math.floor(Math.random() * CELEBRATION_QUOTES.length)],
  []);

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-6 overflow-hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-emerald-950/90 backdrop-blur-xl animate-in fade-in duration-500"></div>
      
      {/* Content Container */}
      <div className="relative bg-white w-full max-w-sm rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] flex flex-col items-center text-center p-8 border-b-8 border-emerald-100 animate-in zoom-in duration-500">
        
        {/* Animated Thumb Sticker */}
        <div className="relative mb-8">
          {/* Glowing Aura */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-emerald-200 rounded-full blur-3xl opacity-30 animate-pulse"></div>
          
          {/* Sticker Base */}
          <div className="relative w-36 h-36 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-full flex items-center justify-center shadow-xl animate-bounce">
             {/* Thumb Icon */}
             <svg className="w-20 h-20 text-white drop-shadow-lg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
             </svg>
             {/* Sparkles */}
             <div className="absolute top-0 right-0 animate-ping">✨</div>
             <div className="absolute bottom-4 left-0 animate-pulse delay-150">⭐</div>
          </div>
          
          {/* Badge */}
          <div className="absolute -bottom-2 -right-2 bg-amber-400 text-white px-4 py-1.5 rounded-full shadow-lg border-4 border-white transform rotate-12">
            <span className="text-sm font-black tracking-tighter">10/10 ครบ!</span>
          </div>
        </div>

        {/* Text Section */}
        <h3 className="text-3xl font-black text-emerald-900 mb-1">อัลฮัมดูลิลลาฮฺ!</h3>
        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em] mb-6">ความดีงามสำเร็จลงแล้ว</p>
        
        <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 mb-8 relative">
          <div className="absolute -top-3 left-6 px-3 bg-white border border-slate-100 rounded-full text-[9px] font-black text-slate-400 uppercase tracking-widest">คำคมวันนี้</div>
          <p className="text-lg font-black text-slate-800 leading-tight mb-2 italic">
            "{quote.text}"
          </p>
          <p className="text-[10px] font-bold text-emerald-600">
            — {quote.ref}
          </p>
        </div>

        <button 
          onClick={onClose}
          className="w-full py-5 bg-emerald-600 text-white font-black rounded-3xl shadow-2xl shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-95 text-base uppercase tracking-[0.2em]"
        >
          ตกลง (อามีน)
        </button>
      </div>
      
      {/* Floating Decorations */}
      <div className="absolute top-20 left-10 w-12 h-12 bg-white/10 rounded-full animate-bounce delay-75"></div>
      <div className="absolute bottom-20 right-10 w-16 h-16 bg-white/10 rounded-full animate-bounce delay-300"></div>
    </div>
  );
};

export default CelebrationModal;
