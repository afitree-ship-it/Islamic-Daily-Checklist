
import { Task, Member } from './types';

// ใช้ไอคอนบุคคลแบบมินิมอลเหมือนกันทุกคนตามคำขอ
const MINIMAL_AVATAR = '👤';

export const INITIAL_MEMBERS: Member[] = [
  { id: 'อฟิตรี', name: 'อฟิตรี', avatar: MINIMAL_AVATAR },
  { id: 'อนันต์', name: 'อนันต์', avatar: MINIMAL_AVATAR },
  { id: 'กูรีดวน', name: 'กูรีดวน', avatar: MINIMAL_AVATAR },
  { id: 'นูรดิน', name: 'นูรดิน', avatar: MINIMAL_AVATAR },
  { id: 'อะฟิฟ', name: 'อะฟิฟ', avatar: MINIMAL_AVATAR },
  { id: 'ซอลาฮุดดีน', name: 'ซอลาฮุดดีน', avatar: MINIMAL_AVATAR },
  { id: 'อัฟฟาน', name: 'อัฟฟาน', avatar: MINIMAL_AVATAR },
];

export const getStoredMembers = (): Member[] => {
  if (typeof window === 'undefined') return INITIAL_MEMBERS;
  try {
    const saved = localStorage.getItem('deen_tracker_members');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to parse deen_tracker_members:', e);
  }
  return INITIAL_MEMBERS;
};

export const saveStoredMembers = (members: Member[]): void => {
  try {
    localStorage.setItem('deen_tracker_members', JSON.stringify(members));
  } catch (e) {
    console.warn('Failed to save deen_tracker_members:', e);
  }
};

export const getDeletedMembers = (): string[] => {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem('deen_tracker_deleted_members');
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    console.warn('Failed to parse deen_tracker_deleted_members:', e);
    return [];
  }
};

export const saveDeletedMembers = (memberIds: string[]): void => {
  try {
    localStorage.setItem('deen_tracker_deleted_members', JSON.stringify(memberIds));
  } catch (e) {
    console.warn('Failed to save deen_tracker_deleted_members:', e);
  }
};

export const MEMBERS: Member[] = INITIAL_MEMBERS;

export const TASKS: Task[] = [
  { id: 't1', label: 'ซุบฮิ ญะมาอะฮฺ', category: 'prayer' },
  { id: 't2', label: 'ซุฮฺรี ญะมาอะฮฺ', category: 'prayer' },
  { id: 't3', label: 'อัสรี ญะมาอะฮฺ', category: 'prayer' },
  { id: 't4', label: 'มัฆริบ ญะมาอะฮฺ', category: 'prayer' },
  { id: 't5', label: 'อีชา ญะมาอะฮฺ', category: 'prayer' },
  { id: 't6', label: 'อัลกุรอาน', category: 'devotion' },
  { id: 't7', label: 'อัซการเช้า', category: 'devotion' },
  { id: 't11', label: 'อัซการเย็น', category: 'devotion' },
  { id: 't8', label: 'อ่านหนังสือ 15นาที.', category: 'action' },
  { id: 't12', label: 'อ่านบทความ 15 นาที', category: 'action' },
  { id: 't9', label: 'อิสติฆฟัร 100 ครั้ง', category: 'devotion' },
  { id: 't10', label: 'บริจาค', category: 'action' },
];

export const getTaskPoints = (taskId: string): number => {
  const prayerIds = ['t1', 't2', 't3', 't4', 't5'];
  return prayerIds.includes(taskId) ? 27 : 10;
};

