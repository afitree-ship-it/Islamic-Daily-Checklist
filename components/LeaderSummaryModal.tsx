import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { MEMBERS, TASKS, getTaskPoints } from '../constants';
import { ProgressData, Member } from '../types';

interface LeaderSummaryModalProps {
  currentDate: string;
  progress: ProgressData;
  onClose: () => void;
  members?: Member[];
  onAddMember?: (name: string) => boolean;
  onDeleteMember?: (id: string) => boolean;
}

const LeaderSummaryModal: React.FC<LeaderSummaryModalProps> = ({ 
  currentDate, 
  progress, 
  onClose,
  members,
  onAddMember,
  onDeleteMember
}) => {
  const [viewDate, setViewDate] = useState(currentDate);
  const [activeTab, setActiveTab] = useState<'stats' | 'manage'>('stats');
  const [newMemberInput, setNewMemberInput] = useState('');
  const [addFeedback, setAddFeedback] = useState<{ text: string; isError: boolean } | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const memberList = members || MEMBERS;
  const dailyProgress = progress[viewDate] || {};

  const maxScore = useMemo(() => {
    return TASKS.reduce((sum, t) => sum + getTaskPoints(t.id), 0);
  }, []);

  // คำนวณข้อมูลสำหรับกราฟจากวันที่เลือก
  const chartData = useMemo(() => {
    return memberList.map(member => {
      const mData = dailyProgress[member.id] || {};
      const completedCount = Object.values(mData).filter(v => v).length;
      const score = Object.keys(mData).reduce((sum, tId) => mData[tId] ? sum + getTaskPoints(tId) : sum, 0);
      return {
        name: member.name,
        completed: completedCount,
        score,
        total: TASKS.length
      };
    });
  }, [dailyProgress, memberList]);

  const COLORS = ['#10b981', '#059669', '#047857', '#065f46', '#064e3b', '#34d399', '#6ee7b7', '#a7f3d0'];

  const handleAddSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const name = newMemberInput.trim();
    if (!name) {
      setAddFeedback({ text: 'กรุณากรอกชื่อสมาชิก', isError: true });
      return;
    }
    if (onAddMember) {
      const success = onAddMember(name);
      if (success) {
        setNewMemberInput('');
        setAddFeedback({ text: `เพิ่มสมาชิก "${name}" เรียบร้อยแล้ว!`, isError: false });
        setTimeout(() => setAddFeedback(null), 3000);
      }
    }
  };

  const handleMonthlyExport = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); 
    const currentMonthStr = now.toISOString().slice(0, 7); 
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const totalDaysInMonth = lastDay.getDate();

    const monthLong = now.toLocaleDateString('th-TH', { month: 'long' });
    const yearThai = now.toLocaleDateString('th-TH', { year: 'numeric' });
    
    let content = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    content += `🏆 รายงานสรุปการปฏิบัติศาสนกิจรายเดือนแบบละเอียด (DeenTracker)\n`;
    content += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    content += `📅 ประจำเดือน: ${monthLong} ${yearThai}\n`;
    content += `📅 ช่วงเวลา: ${firstDay.toLocaleDateString('th-TH')} ถึง ${lastDay.toLocaleDateString('th-TH')}\n`;
    content += `📊 น้ำหนักคะแนนรวม: ${maxScore} คะแนนต่อวัน (ละหมาดญะมาอะฮฺข้อละ 27 คะแนน, ข้ออื่นข้อละ 10 คะแนน)\n`;
    content += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    memberList.forEach((member) => {
      let memberMonthCompleted = 0;
      let memberMonthCompletedScore = 0;
      let memberMonthPossible = 0;
      let memberMonthPossibleScore = 0;
      let memberDailyLog = "";

      for (let d = 1; d <= totalDaysInMonth; d++) {
        const dateObj = new Date(year, month, d);
        const dateKey = dateObj.toISOString().split('T')[0];
        const dayLabel = String(d).padStart(2, '0');
        const monthLabel = String(month + 1).padStart(2, '0');
        
        const dayData = progress[dateKey]?.[member.id] || {};
        const dayCompletedCount = Object.values(dayData).filter(v => v).length;
        const dayScore = Object.keys(dayData).reduce((sum, tId) => dayData[tId] ? sum + getTaskPoints(tId) : sum, 0);
        const dayPercentage = Math.round((dayScore / maxScore) * 100);
        
        memberMonthCompleted += dayCompletedCount;
        memberMonthCompletedScore += dayScore;
        memberMonthPossible += TASKS.length;
        memberMonthPossibleScore += maxScore;

        memberDailyLog += `📅 วันที่ ${dayLabel}/${monthLabel} | คะแนนความสำเร็จ: ${dayScore}/${maxScore} แต้ม (${dayPercentage}%)\n`;
        
        if (Object.keys(dayData).length === 0) {
          memberDailyLog += `   [ ไม่มีการบันทึกข้อมูลในวันนี้ ]\n`;
        } else {
          TASKS.forEach(task => {
            const isChecked = !!dayData[task.id];
            const statusIcon = isChecked ? "[✓]" : "[ ]";
            memberDailyLog += `   ${statusIcon} ${task.label} (+${getTaskPoints(task.id)} แต้ม)\n`;
          });
        }
        memberDailyLog += `------------------------------------------------------------\n`;
      }

      const totalPercentage = memberMonthPossibleScore > 0 
        ? Math.round((memberMonthCompletedScore / memberMonthPossibleScore) * 100) 
        : 0;

      content += `👤 สมาชิก: ${member.name}\n`;
      content += `📈 สรุปภาพรวมคะแนนเดือนนี้: ${totalPercentage}%\n`;
      content += `📝 สถิติการบันทึก: ได้รับ ${memberMonthCompletedScore} จากคะแนนรวมทั้งหมด ${memberMonthPossibleScore} แต้ม (ทำเสร็จ ${memberMonthCompleted}/${memberMonthPossible} รายการ)\n`;
      content += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      content += memberDailyLog;
      content += `\n\n`;
    });

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `DeenTracker_Detailed_Report_${currentMonthStr}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/90 backdrop-blur-md p-2 md:p-4">
      <div className="bg-white w-full max-w-7xl max-h-[92vh] rounded-[2rem] shadow-2xl overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-10 duration-500 border border-white/20">
        
        {/* Header Section */}
        <div className="bg-[#062e1e] px-4 py-3 md:px-6 text-white flex justify-between items-center flex-shrink-0 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 bg-emerald-400 rounded-full"></div>
            <div>
              <h2 className="text-sm md:text-base font-black tracking-tighter uppercase leading-none">แผงควบคุมหัวหน้า</h2>
              <p className="text-[10px] text-emerald-300/80 font-bold leading-none mt-1">จัดการสมาชิกและสรุปรายงานภาพรวม</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Header Tabs */}
            <div className="flex items-center bg-white/10 p-1 rounded-xl border border-white/10">
              <button
                onClick={() => setActiveTab('stats')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 ${
                  activeTab === 'stats' 
                    ? 'bg-emerald-500 text-white shadow-sm' 
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                <span className="hidden sm:inline">ภาพรวม & กราฟ</span>
                <span className="sm:hidden">กราฟ</span>
              </button>
              <button
                onClick={() => setActiveTab('manage')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 ${
                  activeTab === 'manage' 
                    ? 'bg-emerald-500 text-white shadow-sm' 
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4.354a4 4 0 100 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                <span className="hidden sm:inline">จัดการสมาชิก</span>
                <span className="sm:hidden">สมาชิก</span>
                <span className="ml-0.5 px-1.5 py-0.2 bg-emerald-400 text-emerald-950 rounded-full text-[9px] font-black">{memberList.length}</span>
              </button>
            </div>

            <button 
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-xl transition-all border border-white/10 shadow-sm ml-1"
              title="ปิดหน้าต่าง (กลับไปหน้าเลือกสมาชิก)"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Action Bar (shown when in stats tab) */}
        {activeTab === 'stats' && (
          <div className="px-4 py-3 md:px-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3 flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight">เลือกวันที่:</span>
              <input 
                type="date" 
                value={viewDate}
                onChange={(e) => setViewDate(e.target.value)}
                className="px-3 py-1.5 bg-white border-2 border-slate-200 rounded-xl font-black text-slate-800 text-xs outline-none focus:border-emerald-500 transition-all cursor-pointer shadow-sm"
              />
            </div>

            <button 
              onClick={handleMonthlyExport}
              className="flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 bg-emerald-600 text-white rounded-xl font-black text-[11px] shadow-lg shadow-emerald-200 hover:bg-emerald-700 active:scale-95 transition-all border-b-4 border-emerald-800 uppercase tracking-tight"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              สรุปเดือนล่าสุด
            </button>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-grow overflow-auto p-4 md:p-6 bg-white scrollbar-hide space-y-6">
          
          {activeTab === 'manage' ? (
            /* Member Management Tab Content */
            <div className="space-y-6 max-w-4xl mx-auto py-2">
              {/* Form: Add New Member */}
              <div className="bg-slate-50/80 border-2 border-emerald-100 rounded-[2rem] p-5 sm:p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-5 bg-emerald-500 rounded-full"></div>
                  <h3 className="text-base font-black text-slate-800">เพิ่มสมาชิกใหม่</h3>
                </div>
                <p className="text-xs text-slate-500 mb-4 font-medium">
                  เพียงพิมพ์ชื่อสมาชิกคนใหม่ ระบบจะสร้างรายชื่อเพื่อให้ใช้งานและบันทึกกิจกรรมได้ทันที
                </p>

                <form onSubmit={handleAddSubmit} className="flex flex-col sm:flex-row gap-3">
                  <input 
                    type="text" 
                    value={newMemberInput}
                    onChange={(e) => setNewMemberInput(e.target.value)}
                    placeholder="พิมพ์ชื่อสมาชิกใหม่ที่นี่..."
                    className="flex-grow px-4 py-3 bg-white border-2 border-slate-200 focus:border-emerald-500 rounded-2xl text-sm font-bold text-slate-800 outline-none transition-all shadow-sm"
                  />
                  <button
                    type="submit"
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs uppercase tracking-wider rounded-2xl transition-all shadow-md shadow-emerald-200 border-b-4 border-emerald-800 flex items-center justify-center gap-2 whitespace-nowrap"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    เพิ่มสมาชิก
                  </button>
                </form>

                {addFeedback && (
                  <div className={`mt-3 p-3 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in duration-300 ${
                    addFeedback.isError ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  }`}>
                    <span>{addFeedback.isError ? '⚠️' : '✅'}</span>
                    <span>{addFeedback.text}</span>
                  </div>
                )}
              </div>

              {/* List: Current Members */}
              <div className="bg-white border-2 border-slate-100 rounded-[2rem] p-5 sm:p-6 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-5 bg-slate-700 rounded-full"></div>
                    <h3 className="text-base font-black text-slate-800">รายชื่อสมาชิกปัจจุบัน ({memberList.length} คน)</h3>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {memberList.map((member, idx) => (
                    <div 
                      key={member.id} 
                      className="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-emerald-50/50 border border-slate-200 hover:border-emerald-200 rounded-2xl transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 font-bold text-base shadow-sm">
                          👤
                        </div>
                        <div>
                          <span className="font-black text-slate-800 text-sm block leading-none">{member.name}</span>
                          <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase leading-none mt-1 block">สมาชิกลำดับที่ {idx + 1}</span>
                        </div>
                      </div>

                      {confirmDeleteId === member.id ? (
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-red-500 hidden sm:inline-block">ยืนยันการลบ?</span>
                          <button
                            onClick={() => {
                              if (onDeleteMember) {
                                const success = onDeleteMember(member.id);
                                if (!success) {
                                  setAddFeedback({ text: 'ไม่สามารถลบสมาชิกคนสุดท้ายได้', isError: true });
                                  setTimeout(() => setAddFeedback(null), 3000);
                                }
                              }
                              setConfirmDeleteId(null);
                            }}
                            className="px-3.5 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-black rounded-xl transition-all flex items-center gap-1.5 active:scale-95 shadow-sm"
                          >
                            ลบยืนยัน
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-black rounded-xl transition-all flex items-center gap-1.5 active:scale-95"
                          >
                            ยกเลิก
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(member.id)}
                          className="px-3.5 py-2 bg-red-50 hover:bg-red-500 text-red-600 hover:text-white border border-red-200 hover:border-red-500 text-xs font-black rounded-xl transition-all flex items-center gap-1.5 active:scale-95"
                          title={`ลบ ${member.name}`}
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          ลบชื่อ
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Stats Tab Content */
            <>
              {/* Daily Stats Graph Section */}
              <div className="bg-slate-50/50 rounded-[2rem] border-2 border-slate-100 p-4 md:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1.5 h-4 bg-emerald-500 rounded-full"></div>
                  <h3 className="font-black text-slate-800 text-[10px] uppercase tracking-tighter">กราฟสรุปรายวัน ({viewDate})</h3>
                </div>
                
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 45 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 9, fontWeight: 900, fill: '#475569' }} 
                        interval={0}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} domain={[0, maxScore]} />
                      <Tooltip 
                        cursor={{ fill: '#f1f5f9', radius: 8 }}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-white p-2 shadow-xl rounded-xl border-2 border-emerald-100">
                                <p className="font-black text-slate-800 text-[10px] tracking-tighter leading-none mb-1">{payload[0].payload.name}</p>
                                <p className="text-emerald-600 font-black text-xs leading-none">{`${payload[0].payload.score} / ${maxScore} คะแนน`}</p>
                                <p className="text-slate-400 text-[8px] font-bold mt-1 leading-none">ทำได้ {payload[0].payload.completed}/{payload[0].payload.total} กิจกรรม</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="score" radius={[6, 6, 6, 6]} barSize={28}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="flex items-center gap-2 px-1">
                <div className="w-1.5 h-5 bg-emerald-500 rounded-full"></div>
                <h3 className="font-black text-slate-800 text-xs uppercase tracking-tighter">สถานะการบันทึกสมาชิกรายวัน</h3>
              </div>

              {/* Member Progress Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {memberList.map(member => {
                  const mData = dailyProgress[member.id] || {};
                  const completedCount = Object.values(mData).filter(v => v).length;
                  const score = Object.keys(mData).reduce((sum, tId) => mData[tId] ? sum + getTaskPoints(tId) : sum, 0);
                  const percentage = Math.round((score / maxScore) * 100);
                  
                  return (
                    <div key={member.id} className="border-2 border-slate-100 rounded-[1.5rem] p-4 bg-white shadow-sm hover:border-emerald-200 transition-all group">
                      <div className="flex justify-between items-start mb-2">
                        <div className="min-w-0 pr-1">
                          <h4 className="font-black text-slate-900 text-sm truncate leading-none tracking-tighter">{member.name}</h4>
                          <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tighter leading-none">
                            {score}/{maxScore} แต้ม ({completedCount} กิจกรรม)
                          </p>
                        </div>
                        <div className={`flex flex-col items-center justify-center min-w-[36px] h-[36px] rounded-xl font-black border-2 ${
                          percentage === 100 ? 'bg-emerald-600 text-white border-emerald-700' : 'bg-slate-50 text-slate-600 border-slate-100'
                        }`}>
                          <span className="text-[11px] leading-none tracking-tighter">{percentage}</span>
                          <span className="text-[7px] leading-none opacity-60">%</span>
                        </div>
                      </div>
                      
                      <div className="w-full h-1.5 bg-slate-100 rounded-full mb-3 overflow-hidden">
                        <div className="h-full bg-emerald-500 transition-all duration-1000 shadow-[0_0_8px_rgba(16,185,129,0.5)]" style={{ width: `${percentage}%` }}></div>
                      </div>

                      {/* Task List - Compact */}
                      <div className="space-y-1 pt-2 border-t border-slate-50">
                        {TASKS.map(task => {
                          const isChecked = !!mData[task.id];
                          return (
                            <div key={task.id} className="flex items-center justify-between gap-1 leading-none">
                              <span className={`text-[11px] font-bold truncate max-w-[85%] tracking-tighter ${isChecked ? 'text-slate-800' : 'text-slate-300'}`}>
                                {task.label} (+{getTaskPoints(task.id)})
                              </span>
                              {isChecked ? (
                                <div className="w-3.5 h-3.5 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 flex-shrink-0">
                                  <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="5" d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                              ) : (
                                <div className="w-3.5 h-3.5 border border-slate-100 rounded-full flex-shrink-0"></div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center flex-shrink-0">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">DeenTracker Management</span>
            <button 
              onClick={onClose}
              className="px-6 sm:px-8 py-2.5 sm:py-3 bg-slate-900 text-white font-black rounded-xl hover:bg-black transition-all active:scale-95 text-[10px] uppercase tracking-widest shadow-xl border-b-4 border-slate-700 flex items-center gap-2"
            >
              <span>ปิดหน้าต่าง</span>
            </button>
        </div>
      </div>
    </div>
  );
};

export default LeaderSummaryModal;