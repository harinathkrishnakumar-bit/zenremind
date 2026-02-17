import Anthropic from '@anthropic-ai/sdk';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured on server' });
  }

  const { base64Data, mimeType } = req.body || {};
  if (!base64Data) {
    return res.status(400).json({ error: 'No image data provided' });
  }

  try {
    const client = new Anthropic({ apiKey });
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: (mimeType || 'image/jpeg') as any,
              data: base64Data,
            },
          },
          {
            type: 'text',
            text: `Extract all purchased items from this shopping receipt image.
For each item provide:
- name: product name (string)
- category: one of "Food", "Household", "Toys", "Personal Care", "Electronics", "Other"
- foodType: ONLY if category is "Food" — one of "Fresh" (fruits, vegetables, fresh meat, eggs, dairy), "Processed" (canned goods, cheese, bread, preserved meats, packaged foods), "Ultraprocessed" (chips, soft drinks, ready meals, candy, breakfast cereals, fast food, frozen meals)
- price: numeric price if visible, else null
- quantity: integer quantity, default 1
Return ONLY a valid JSON array of objects with no other text.`,
          },
        ],
      }],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '[]';
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    const items = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    res.json({ items });
  } catch (error: any) {
    console.error('Claude API error:', error);
    res.status(500).json({ error: error.message || 'Failed to process image' });
  }
}
