
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

// Returns null if no API key, throws on API error, returns [] if image has no items
export const parseReceiptImage = async (base64Data: string, mimeType: string): Promise<Partial<GroceryItem>[] | null> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return null;

  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: [{
      role: 'user',
      parts: [
        { inlineData: { mimeType, data: base64Data } },
        { text: `Extract all purchased items from this shopping receipt image.
For each item provide:
- name: product name (string)
- category: one of "Food", "Household", "Toys", "Personal Care", "Electronics", "Other"
- foodType: ONLY if category is "Food" — one of "Fresh" (fruits, vegetables, fresh meat, eggs, dairy), "Processed" (canned goods, cheese, bread, preserved meats, packaged foods with few additives), "Ultraprocessed" (chips, soft drinks, ready meals, candy, breakfast cereals, fast food, frozen meals)
- price: numeric price if visible, else null
- quantity: integer quantity, default 1
Return a JSON array of objects.` }
      ]
    }],
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            category: { type: Type.STRING },
            foodType: { type: Type.STRING },
            price: { type: Type.NUMBER },
            quantity: { type: Type.INTEGER },
          },
          required: ['name', 'category']
        }
      }
    }
  });

  const text = response.text;
  if (!text) return [];
  return JSON.parse(text);
};
