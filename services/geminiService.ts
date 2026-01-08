
import { GoogleGenAI, Type } from "@google/genai";
import { DailyReflection } from "../types";

const FALLBACK_REFLECTION: DailyReflection = {
  quote: "แท้จริงหลังความยากลำบาก จะมีความง่ายดาย",
  reference: "อัลกุรอาน 94:5",
  message: "ขอให้ทุกคนรักษาความดีต่อไป อัลลอฮฺทรงเห็นในความพยายาม"
};

export async function getDailyMotivation(progressSummary: string): Promise<DailyReflection> {
  // สร้าง Controller สำหรับทำ Timeout หาก API ตอบช้าเกิน 8 วินาที
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `สรุปความคืบหน้ากลุ่ม: "${progressSummary}". ช่วยหาคำคมอิสลาม (อัลกุรอานหรือหะดีษ) เป็นภาษาไทย พร้อมแหล่งที่มา และข้อความให้กำลังใจสั้นๆ`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            quote: { type: Type.STRING },
            reference: { type: Type.STRING },
            message: { type: Type.STRING },
          },
          required: ["quote", "reference", "message"],
        },
      },
    });

    clearTimeout(timeoutId);
    const text = response.text;
    
    if (!text) return FALLBACK_REFLECTION;
    
    return JSON.parse(text.trim());
  } catch (error: any) {
    clearTimeout(timeoutId);
    console.warn("Gemini Service Notice: Using fallback reflection due to error or timeout.");
    return FALLBACK_REFLECTION;
  }
}
