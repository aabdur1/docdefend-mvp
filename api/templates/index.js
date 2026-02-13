import { cors } from '../lib/helpers.js';
import { templateLibrary } from '../lib/suggestions.js';

export default function handler(req, res) {
  if (cors(req, res)) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Return templates without the full template text for listing
  const templateList = templateLibrary.map(({ id, name, category, cptCode, description }) => ({
    id,
    name,
    category,
    cptCode,
    description,
  }));
  res.json(templateList);
}
