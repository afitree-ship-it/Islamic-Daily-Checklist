
import { GoogleGenAI, Type } from "@google/genai";
import { DailyReflection } from "../types";

export async function getDailyMotivation(progressSummary: string): Promise<DailyReflection> {
  // Always create a new instance right before making an API call to ensure 
  // it uses the most up-to-date API key.
  // Use the API key string directly from the environment variable.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
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
    throw new Error("ไม่สามารถโหลดข้อมูลจาก AI ได้ในขณะนี้");
  }
}
