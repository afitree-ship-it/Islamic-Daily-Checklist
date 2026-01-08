
import { GoogleGenAI, Type } from "@google/genai";
import { DailyReflection } from "../types";

const FALLBACK_REFLECTION: DailyReflection = {
  quote: "แท้จริงหลังความยากลำบาก จะมีความง่ายดาย",
  reference: "อัลกุรอาน 94:5",
  message: "ขอให้ทุกคนรักษาความดีต่อไป อัลลอฮฺทรงเห็นในความพยายาม"
};

export async function getDailyMotivation(progressSummary: string): Promise<DailyReflection> {
  const apiKey = process.env.API_KEY || "";
  
  if (!apiKey || apiKey.includes("กรุณาวาง")) {
    return FALLBACK_REFLECTION;
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
    if (!text) return FALLBACK_REFLECTION;
    return JSON.parse(text.trim());
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return FALLBACK_REFLECTION;
  }
}
