
import { GoogleGenAI, Type } from "@google/genai";
import { DailyReflection } from "../types";

export async function getDailyMotivation(progressSummary: string): Promise<DailyReflection> {
  // ตรวจสอบว่ามี API Key หรือไม่ ถ้าไม่มีให้ใช้ dummy เพื่อไม่ให้แอป crash
  const apiKey = process.env.API_KEY || "";
  
  if (!apiKey) {
    console.warn("API_KEY is not defined. AI features will be disabled.");
    return {
      quote: "การมีความอดทนคือส่วนหนึ่งของความศรัทธา",
      reference: "คำสอนอิสลาม",
      message: "กรุณาตั้งค่า API Key เพื่อรับข้อความแนะนำจาก AI"
    };
  }

  const ai = new GoogleGenAI({ apiKey });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Based on the following group progress summary: "${progressSummary}", provide an inspiring Islamic quote (Hadith or Quran) in Thai, its reference, and a short message of encouragement for the group.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            quote: { type: Type.STRING, description: 'An inspiring Islamic quote in Thai.' },
            reference: { type: Type.STRING, description: 'The source of the quote.' },
            message: { type: Type.STRING, description: 'A brief encouraging message in Thai.' },
          },
          required: ["quote", "reference", "message"],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text.trim());
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    // Fallback เมื่อ AI มีปัญหา
    return {
      quote: "แท้จริงหลังความยากลำบาก จะมีความง่ายดาย",
      reference: "อัลกุรอาน 94:5",
      message: "ขอให้ทุกคนรักษาความดีต่อไป อัลลอฮฺทรงเห็นในความพยายาม"
    };
  }
}
