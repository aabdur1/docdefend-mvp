import { cors, getAnthropicClient, stripMarkdownFences } from './_lib/helpers.js';
import {
  addendumPrompt,
  buildAddendumPrompt,
} from './_lib/suggestions.js';

export default async function handler(req, res) {
  if (cors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { note, gaps } = req.body;

    if (!note || !gaps?.length) {
      return res.status(400).json({ error: 'Note and gaps are required' });
    }

    const anthropic = getAnthropicClient(req);

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: buildAddendumPrompt(note, gaps),
        },
      ],
      system: addendumPrompt,
    });

    const responseText = stripMarkdownFences(message.content[0].text);

    try {
      const addendum = JSON.parse(responseText);
      res.json(addendum);
    } catch (parseError) {
      console.error('Failed to parse addendum:', responseText);
      res.status(500).json({ error: 'Failed to parse addendum', raw: responseText });
    }
  } catch (error) {
    console.error('Addendum generation error:', error);
    res.status(500).json({ error: 'Addendum generation failed', message: error.message });
  }
}
