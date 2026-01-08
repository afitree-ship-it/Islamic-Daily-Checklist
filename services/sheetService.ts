
import { ProgressData } from '../types';

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxO5U99nteeyh2_-2mLmfJjfkqj7Rc2I62XbaaDbkpYgyJpzSeD3Fdo5N6NmKbCMsVW/exec'; 

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

export async function syncBatchToSheets(items: {date: string, memberId: string, taskId: string, status: boolean}[]): Promise<boolean> {
  if (!SCRIPT_URL || SCRIPT_URL.includes('XXXXX') || items.length === 0) return false;

  try {
    // ใช้ mode: 'no-cors' และ keepalive: true เพื่อความเร็วสูงสุดและรับประกันการส่งข้อมูล
    await fetch(SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors', 
      keepalive: true, // สำคัญ: ช่วยให้ Request ทำงานต่อแม้ปิด Browser ทันที
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(items),
    });
    return true;
  } catch (error) {
    console.error("Failed to batch sync to Google Sheets:", error);
    return false;
  }
}
