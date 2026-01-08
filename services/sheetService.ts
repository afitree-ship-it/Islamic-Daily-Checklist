
import { ProgressData } from '../types';

// อัปเดตเป็นลิงก์ใหม่ที่คุณได้รับจากการ Deploy
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbytdKyLpZkavKGJX_g7oGhqjR4IxcUgjfG5rUuStVhmgIg7vwpv6ojVbfl4m0CGPkpF/exec'; 

const formatDateKey = (dateInput: any): string => {
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return String(dateInput);
    return d.toISOString().split('T')[0];
  } catch {
    return String(dateInput);
  }
};

export async function fetchProgressFromSheets(): Promise<ProgressData | null> {
  if (!SCRIPT_URL || SCRIPT_URL.includes('XXXXX')) return null;
  
  try {
    const response = await fetch(`${SCRIPT_URL}?t=${Date.now()}`, {
      method: 'GET',
      cache: 'no-store'
    });
    
    if (!response.ok) throw new Error('Network response was not ok');
    const rawData = await response.json();
    
    if (!rawData || typeof rawData !== 'object') return null;

    const sanitizedData: ProgressData = {};
    Object.keys(rawData).forEach(dateKey => {
      const cleanDate = formatDateKey(dateKey);
      sanitizedData[cleanDate] = rawData[dateKey];
    });
    
    return sanitizedData;
  } catch (error) {
    console.error("Failed to fetch from Google Sheets:", error);
    return null;
  }
}

export async function syncProgressToSheets(date: string, memberId: string, taskId: string, status: boolean): Promise<boolean> {
  if (!SCRIPT_URL || SCRIPT_URL.includes('XXXXX')) return false;

  try {
    await fetch(SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors', 
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ date, memberId, taskId, status }),
    });
    return true;
  } catch (error) {
    console.error("Failed to sync to Google Sheets:", error);
    return false;
  }
}
