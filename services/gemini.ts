
import { GoogleGenAI, Type } from "@google/genai";
import { SmartReminderResponse, Priority, GroceryItem } from "../types";

// Static type definition for the process global used by Vite define
declare var process: {
  env: {
    API_KEY: string;
  };
};

export const parseSmartReminder = async (input: string): Promise<Partial<SmartReminderResponse>> => {
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    console.warn("No Gemini API key — AI Smart Fill disabled.");
    return { title: input, priority: Priority.MEDIUM, category: "Personal" };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
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

// Returns null if server has no API key, throws on error, returns [] if no items found
export const parseReceiptImage = async (base64Data: string, mimeType: string): Promise<Partial<GroceryItem>[] | null> => {
  const response = await fetch('/api/scan-receipt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ base64Data, mimeType }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
    if (err.error?.includes('ANTHROPIC_API_KEY not configured')) return null;
    throw new Error(err.error || `Server error ${response.status}`);
  }

  const { items } = await response.json();
  return items || [];
};
