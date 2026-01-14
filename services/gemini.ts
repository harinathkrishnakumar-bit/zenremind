
import { GoogleGenAI, Type } from "@google/genai";
import { SmartReminderResponse, Priority } from "../types";

// Always use process.env.API_KEY directly when initializing the GoogleGenAI client
const apiKey = import.meta.env.VITE_API_KEY;

if (!apiKey) {
  throw new Error("Gemini API key is missing");
}

const ai = new GoogleGenAI({ apiKey });


export const parseSmartReminder = async (input: string): Promise<Partial<SmartReminderResponse>> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Parse this reminder or task: "${input}". 
      Today's date is ${new Date().toISOString()}.
      If a price or cost is mentioned, extract it as a number.
      Return valid JSON matching the schema.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            dueDate: { type: Type.STRING, description: "ISO 8601 date string" },
            priority: { type: Type.STRING, enum: Object.values(Priority) },
            category: { type: Type.STRING },
            cost: { type: Type.NUMBER, description: "The monetary value associated with the task, if any." }
          },
          required: ["title", "priority", "category"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Error:", error);
    return {
      title: input,
      priority: Priority.MEDIUM,
      category: "General"
    };
  }
};
