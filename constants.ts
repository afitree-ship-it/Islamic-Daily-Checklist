
import { Task, Member } from './types';

// ใช้ไอคอนบุคคลแบบมินิมอลเหมือนกันทุกคนตามคำขอ
const MINIMAL_AVATAR = '👤';

export const MEMBERS: Member[] = [
  { id: 'อฟิตรี', name: 'อฟิตรี', avatar: MINIMAL_AVATAR },
  { id: 'อนันต์', name: 'อนันต์', avatar: MINIMAL_AVATAR },
  { id: 'กูรีดวน', name: 'กูรีดวน', avatar: MINIMAL_AVATAR },
  { id: 'นูรดิน', name: 'นูรดิน', avatar: MINIMAL_AVATAR },
  { id: 'อะฟิฟ', name: 'อะฟิฟ', avatar: MINIMAL_AVATAR },
  { id: 'อิสมาแอ', name: 'อิสมาแอ', avatar: MINIMAL_AVATAR },
  { id: 'อับดุลฮากีม', name: 'อับดุลฮากีม', avatar: MINIMAL_AVATAR },
  { id: 'ซอลาฮุดดีน', name: 'ซอลาฮุดดีน', avatar: MINIMAL_AVATAR },
];

export const TASKS: Task[] = [
  // Fixed: Assigning valid literal types from Task interface to resolve type mismatch errors
  { id: 't1', label: 'ซุบฮิ ญะมาอะฮฺ', category: '' },
  { id: 't2', label: 'ซุฮฺรี ญะมาอะฮฺ', category: '' },
  { id: 't3', label: 'อัสรี ญะมาอะฮฺ', category: '' },
  { id: 't4', label: 'มัฆริบ ญะมาอะฮฺ', category: '' },
  { id: 't5', label: 'อีชา ญะมาอะฮฺ', category: '' },
  { id: 't6', label: 'อัลกุรอาน', category: '' },
  { id: 't7', label: 'อัซการ เช้า-เย็น', category: '' },
  { id: 't8', label: 'อ่านหนังสือ 15นาที.', category: '' },
  { id: 't9', label: 'อิสติฆฟัร 100 ครั้ง', category: '' },
  { id: 't10', label: 'บริจาค', category: '' },
];
