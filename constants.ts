
import { Task, Member } from './types';

// ใช้ไอคอนบุคคลแบบมินิมอลเหมือนกันทุกคนตามคำขอ
const MINIMAL_AVATAR = '👤';

export const MEMBERS: Member[] = [
  { id: 'm1', name: 'อฟิตรี', avatar: MINIMAL_AVATAR },
  { id: 'm2', name: 'อนันต์', avatar: MINIMAL_AVATAR },
  { id: 'm3', name: 'กูรีดวน', avatar: MINIMAL_AVATAR },
  { id: 'm4', name: 'นูรดิน', avatar: MINIMAL_AVATAR },
  { id: 'm5', name: 'อะฟิฟ', avatar: MINIMAL_AVATAR },
  { id: 'm6', name: 'อิสมาอีล', avatar: MINIMAL_AVATAR },
  { id: 'm7', name: 'อับดุลฮากีม', avatar: MINIMAL_AVATAR },
  { id: 'm8', name: 'ซอลาฮุดดีน', avatar: MINIMAL_AVATAR },
];

export const TASKS: Task[] = [
  { id: 't1', label: 'ซุบฮิ', category: 'prayer' },
  { id: 't2', label: 'ซุฮฺรี', category: 'prayer' },
  { id: 't3', label: 'อัสรี', category: 'prayer' },
  { id: 't4', label: 'มัฆริบ', category: 'prayer' },
  { id: 't5', label: 'อีชา', category: 'prayer' },
  { id: 't6', label: 'อัลกุรอาน', category: 'devotion' },
  { id: 't7', label: 'อัซการ เช้า-เย็น', category: 'devotion' },
  { id: 't8', label: 'ละมาดสุนัต/ตะฮัจญุด', category: 'prayer' },
  { id: 't9', label: 'อิสติฆฟัร 100 ครั้ง', category: 'devotion' },
  { id: 't10', label: 'ความดีอื่นๆ/บริจาค', category: 'action' },
];
