import { cors } from './lib/helpers.js';

export default function handler(req, res) {
  if (cors(req, res)) return;
  res.json({ status: 'ok' });
}
