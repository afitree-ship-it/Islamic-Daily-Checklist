
import { ProgressData } from '../types';

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxlD_uU8N2Z3AysSQwckvdB6-Y48eX-zFIatQWDpUPd6_OvyyA0EjHhGwIoUuTuJ9sw/exec'; 

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
    const response = await fetch(`${SCRIPT_URL}?t=${Date.now()}`);
    if (!response.ok) throw new Error('Network response was not ok');
    const rawData = await response.json();
    
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
    // ใช้ text/plain เพื่อเลี่ยงปัญหา CORS กับ Google Apps Script
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
