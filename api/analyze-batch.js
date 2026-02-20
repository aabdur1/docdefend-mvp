import { cors, getAnthropicClient, stripMarkdownFences } from './_lib/helpers.js';
import { systemPrompt, buildUserPrompt } from './_lib/prompt.js';

export default async function handler(req, res) {
  if (cors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { notes } = req.body;

    if (!notes?.length) {
      return res.status(400).json({ error: 'Notes array is required' });
    }

    if (notes.length > 20) {
      return res.status(400).json({ error: 'Maximum 20 notes per batch' });
    }

    const results = [];

    for (let i = 0; i < notes.length; i++) {
      const { id, title, note, cptCodes, icd10Codes } = notes[i];

      if (!note || !cptCodes?.length || !icd10Codes?.length) {
        results.push({
          id,
          title,
          error: 'Missing required fields: note, cptCodes, and icd10Codes',
          status: 'error',
        });
        continue;
      }

      try {
        const userPrompt = buildUserPrompt(note, cptCodes, icd10Codes);
        const anthropic = getAnthropicClient(req);

        const message = await anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4096,
          messages: [{ role: 'user', content: userPrompt }],
          system: systemPrompt,
        });

        const responseText = stripMarkdownFences(message.content[0].text);
        const analysis = JSON.parse(responseText);
        results.push({ id, title, analysis, status: 'complete' });
      } catch (err) {
        console.error(`Batch analysis error for note ${id}:`, err.message);
        results.push({
          id,
          title,
          error: err.message,
          status: 'error',
        });
      }
    }

    // Build batch summary
    const completed = results.filter(r => r.status === 'complete');
    const summary = {
      total: notes.length,
      completed: completed.length,
      errors: results.filter(r => r.status === 'error').length,
      highCount: completed.filter(r => r.analysis?.overallScore === 'HIGH').length,
      mediumCount: completed.filter(r => r.analysis?.overallScore === 'MEDIUM').length,
      lowCount: completed.filter(r => r.analysis?.overallScore === 'LOW').length,
    };

    res.json({ results, summary });
  } catch (error) {
    console.error('Batch analysis error:', error);
    res.status(500).json({ error: 'Batch analysis failed', message: error.message });
  }
}
