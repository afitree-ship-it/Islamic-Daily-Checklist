
export interface Task {
  id: string;
  label: string;
  category: 'prayer' | 'action' | 'devotion';
}

export interface Member {
  id: string;
  name: string;
}

export type ProgressData = Record<string, Record<string, Record<string, boolean>>>;

export interface DailyReflection {
  quote: string;
  reference: string;
  message: string;
}

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

export interface AppState {
  currentMemberId: string | null;
  currentDate: string;
}
