
export interface Task {
  id: string;
  label: string;
  category: 'prayer' | 'action' | 'devotion';
}

export interface Member {
  id: string;
  name: string;
  avatar?: string;
}

export type ProgressData = Record<string, Record<string, Record<string, boolean>>>;

export interface DailyReflection {
  quote: string;
  reference: string;
  message: string;
}

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error' | 'offline';

export interface SyncQueueItem {
  id: string;
  date: string;
  memberId: string;
  taskId: string;
  status: boolean;
  timestamp: number;
}

export interface MonthlyMemberStats {
  memberId: string;
  memberName: string;
  totalCompleted: number;
  totalPossible: number;
  percentage: number;
}
