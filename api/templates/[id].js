import { cors } from '../_lib/helpers.js';
import { templateLibrary } from '../_lib/suggestions.js';

export default function handler(req, res) {
  if (cors(req, res)) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  const template = templateLibrary.find(t => t.id === id);

  if (!template) {
    return res.status(404).json({ error: 'Template not found' });
  }

  res.json(template);
}
