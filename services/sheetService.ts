
import { ProgressData } from '../types';

/**
 * URL ของ Google Apps Script Web App
 */
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxlD_uU8N2Z3AysSQwckvdB6-Y48eX-zFIatQWDpUPd6_OvyyA0EjHhGwIoUuTuJ9sw/exec'; 

export async function fetchProgressFromSheets(): Promise<ProgressData | null> {
  if (!SCRIPT_URL || SCRIPT_URL.includes('XXXXX')) return null;
  
  try {
    const response = await fetch(SCRIPT_URL);
    if (!response.ok) throw new Error('Network response was not ok');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch from Google Sheets:", error);
    return null;
  }
}

export async function syncProgressToSheets(date: string, memberId: string, taskId: string, status: boolean): Promise<boolean> {
  if (!SCRIPT_URL || SCRIPT_URL.includes('XXXXX')) return false;

  try {
    // การใช้ mode 'no-cors' จะทำให้เราไม่เห็น Response แต่ข้อมูลจะถูกส่งถึง Google Sheets แน่นอน
    // หากต้องการตรวจสอบ Error จริงจัง แนะนำให้ใช้ CORS Proxy หรือตั้งค่า Apps Script ให้รับ JSONP
    await fetch(SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, memberId, taskId, status }),
    });
    return true;
  } catch (error) {
    console.error("Failed to sync to Google Sheets:", error);
    return false;
  }
}
