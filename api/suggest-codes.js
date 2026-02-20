import { cors, getAnthropicClient, stripMarkdownFences } from './_lib/helpers.js';
import {
  codeSuggestionPrompt,
  buildCodeSuggestionPrompt,
} from './_lib/suggestions.js';

export default async function handler(req, res) {
  if (cors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { note } = req.body;

    if (!note) {
      return res.status(400).json({ error: 'Note is required' });
    }

    const anthropic = getAnthropicClient(req);

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: buildCodeSuggestionPrompt(note),
        },
      ],
      system: codeSuggestionPrompt,
    });

    const responseText = stripMarkdownFences(message.content[0].text);

    try {
      const suggestions = JSON.parse(responseText);
      res.json(suggestions);
    } catch (parseError) {
      console.error('Failed to parse code suggestions:', responseText);
      res.status(500).json({ error: 'Failed to parse suggestions', raw: responseText });
    }
  } catch (error) {
    console.error('Code suggestion error:', error);
    res.status(500).json({ error: 'Code suggestion failed', message: error.message });
  }
}
