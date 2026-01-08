
import { ProgressData } from '../types';

/**
 * Note: To use this, you need a Google Apps Script Web App URL.
 * Example Apps Script code to handle this POST:
 * 
 * function doPost(e) {
 *   var data = JSON.parse(e.postData.contents);
 *   var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Log") || SpreadsheetApp.getActiveSpreadsheet().insertSheet("Log");
 *   sheet.appendRow([new Date(), data.date, data.member, data.task, data.status]);
 *   return ContentService.createTextOutput("Success");
 * }
 */

const SCRIPT_URL = ''; // User can set their Web App URL here

export async function syncProgressToSheets(date: string, memberName: string, taskLabel: string, status: boolean): Promise<boolean> {
  if (!SCRIPT_URL) {
    console.warn("Google Sheets SCRIPT_URL not set. Skipping sync.");
    return false;
  }

  try {
    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors', // Apps Script usually requires no-cors if not handling OPTIONS
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        date,
        member: memberName,
        task: taskLabel,
        status: status ? 'Completed' : 'Incomplete'
      }),
    });
    return true;
  } catch (error) {
    console.error("Failed to sync to Google Sheets:", error);
    return false;
  }
}
