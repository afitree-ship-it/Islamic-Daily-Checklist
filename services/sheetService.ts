import { ProgressData } from '../types';

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzYO5qZxK92ZO932Be0_frDQG-v7Zyp0Kxuu54QrwdV42EEdo_IHy9dOM8U5EuMJMoG/exec'; 

const formatDateKey = (dateInput: any): string => {
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return String(dateInput);
    return d.toISOString().split('T')[0];
  } catch {
    return String(dateInput);
  }
};

export async function fetchProgressFromSheets(): Promise<{ progress: ProgressData, activeMembers?: string[] } | null> {
  if (!SCRIPT_URL || SCRIPT_URL.includes('XXXXX')) return null;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000); // 4 วินาที Timeout เพื่อไม่ให้รอคอยนาน
  try {
    const response = await fetch(`${SCRIPT_URL}?t=${Date.now()}`, {
      method: 'GET',
      cache: 'no-store',
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    
    if (!response.ok) throw new Error('Network response was not ok');
    const rawData = await response.json();
    
    if (!rawData || typeof rawData !== 'object') return null;

    let progressObj = rawData;
    let activeMembers: string[] | undefined = undefined;
    
    // Check if new format with explicit progress and members array
    if (rawData.progress && typeof rawData.progress === 'object') {
      progressObj = rawData.progress;
      if (Array.isArray(rawData.members)) {
        activeMembers = rawData.members.map(String);
      }
    }

    const sanitizedData: ProgressData = {};
    Object.keys(progressObj).forEach(dateKey => {
      const cleanDate = formatDateKey(dateKey);
      sanitizedData[cleanDate] = progressObj[dateKey];
    });
    
    return { progress: sanitizedData, activeMembers };
  } catch (error) {
    clearTimeout(timeoutId);
    console.warn("Failed to fetch from Google Sheets (or timed out):", error);
    return null;
  }
}

export async function syncBatchToSheets(items: {date: string, memberId: string, taskId: string, status: boolean}[]): Promise<boolean> {
  if (!SCRIPT_URL || SCRIPT_URL.includes('XXXXX') || items.length === 0) return false;

  try {
    await fetch(SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors', 
      keepalive: true,
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(items),
    });
    return true;
  } catch (error) {
    console.warn("Failed to batch sync to Google Sheets:", error);
    return false;
  }
}
