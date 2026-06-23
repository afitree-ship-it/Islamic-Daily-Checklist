
import { Task, Member } from './types';

// ใช้ไอคอนบุคคลแบบมินิมอลเหมือนกันทุกคนตามคำขอ
const MINIMAL_AVATAR = '👤';

export const MEMBERS: Member[] = [
  { id: 'อฟิตรี', name: 'อฟิตรี', avatar: MINIMAL_AVATAR },
  { id: 'อนันต์', name: 'อนันต์', avatar: MINIMAL_AVATAR },
  { id: 'กูรีดวน', name: 'กูรีดวน', avatar: MINIMAL_AVATAR },
  { id: 'นูรดิน', name: 'นูรดิน', avatar: MINIMAL_AVATAR },
  { id: 'อะฟิฟ', name: 'อะฟิฟ', avatar: MINIMAL_AVATAR },
  { id: 'ซอลาฮุดดีน', name: 'ซอลาฮุดดีน', avatar: MINIMAL_AVATAR },
];

export const TASKS: Task[] = [
  { id: 't1', label: 'ซุบฮิ ญะมาอะฮฺ', category: 'prayer' },
  { id: 't2', label: 'ซุฮฺรี ญะมาอะฮฺ', category: 'prayer' },
  { id: 't3', label: 'อัสรี ญะมาอะฮฺ', category: 'prayer' },
  { id: 't4', label: 'มัฆริบ ญะมาอะฮฺ', category: 'prayer' },
  { id: 't5', label: 'อีชา ญะมาอะฮฺ', category: 'prayer' },
  { id: 't6', label: 'อัลกุรอาน', category: 'devotion' },
  { id: 't7', label: 'อัซการ เช้า-เย็น', category: 'devotion' },
  { id: 't8', label: 'อ่านหนังสือ 15นาที.', category: 'action' },
  { id: 't9', label: 'อิสติฆฟัร 100 ครั้ง', category: 'devotion' },
  { id: 't10', label: 'บริจาค', category: 'action' },
];
