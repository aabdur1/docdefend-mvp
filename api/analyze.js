import { cors, getAnthropicClient, stripMarkdownFences } from './lib/helpers.js';
import { systemPrompt, buildUserPrompt } from './lib/prompt.js';

export default async function handler(req, res) {
  if (cors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { note, cptCodes, icd10Codes } = req.body;

    if (!note || !cptCodes?.length || !icd10Codes?.length) {
      return res.status(400).json({
        error: 'Missing required fields: note, cptCodes, and icd10Codes are required',
      });
    }

    const userPrompt = buildUserPrompt(note, cptCodes, icd10Codes);
    const anthropic = getAnthropicClient(req);

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      system: systemPrompt,
    });

    const responseText = stripMarkdownFences(message.content[0].text);

    try {
      const analysis = JSON.parse(responseText);
      res.json(analysis);
    } catch (parseError) {
      console.error('Failed to parse Claude response:', responseText);
      res.status(500).json({
        error: 'Failed to parse analysis response',
        raw: responseText,
      });
    }
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({
      error: 'Analysis failed',
      message: error.message,
    });
  }
}
