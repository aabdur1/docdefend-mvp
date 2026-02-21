import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
import multer from 'multer';
import { systemPrompt, buildSystemPrompt, buildUserPrompt } from './prompt.js';
import { PAYERS } from './payerRules.js';
import { parseDocument } from './parsers.js';
import {
  codeSuggestionPrompt,
  addendumPrompt,
  templateLibrary,
  buildCodeSuggestionPrompt,
  buildAddendumPrompt,
} from './suggestions.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const ANTHROPIC_TIMEOUT = 25000; // 25s — fits within Render's 30s request timeout

/**
 * Validate that a value is an array of non-empty strings.
 */
function isStringArray(val) {
  return Array.isArray(val) && val.length > 0 && val.every(item => typeof item === 'string' && item.trim().length > 0);
}

/**
 * Return a safe error message for the client — never expose raw SDK internals.
 */
function safeErrorMessage(error) {
  const msg = error?.message || '';
  if (msg.includes('No API key provided')) return msg; // Our own message, safe to forward
  if (msg.includes('Invalid API key') || msg.includes('authentication')) return 'Invalid API key. Please check your Anthropic API key.';
  if (msg.includes('rate limit') || msg.includes('429')) return 'Rate limit exceeded. Please wait a moment and try again.';
  if (msg.includes('timeout') || msg.includes('Timeout') || error?.name === 'AbortError') return 'Request timed out. The AI service may be busy — please try again.';
  if (msg.includes('Unexpected response format')) return msg;
  if (msg.includes('Failed to parse AI response')) return msg;
  if (msg.includes('Missing required fields')) return msg;
  return 'An unexpected error occurred. Please try again.';
}

/**
 * Safely extract text from a Claude API response, strip markdown fences, and parse as JSON.
 * Throws a descriptive error if the response is malformed.
 */
function parseClaudeJSON(message) {
  if (!message?.content?.length || !message.content[0]?.text) {
    throw new Error('Unexpected response format from AI model');
  }

  let text = message.content[0].text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  try {
    return JSON.parse(text);
  } catch {
    throw new Error('Failed to parse AI response as JSON');
  }
}

// Configure multer for file uploads (store in memory)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/xml',
      'text/xml',
      'text/plain',
      'application/octet-stream', // For .ccd/.ccda files
    ];
    const allowedExtensions = ['.pdf', '.xml', '.ccd', '.ccda', '.txt'];

    const ext = file.originalname.toLowerCase().slice(file.originalname.lastIndexOf('.'));
    if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed: PDF, XML, CCD, CCDA, TXT'));
    }
  },
});

const corsOrigin = process.env.CORS_ORIGIN || (process.env.NODE_ENV === 'production' ? 'https://docdefend.vercel.app' : '*');
if (process.env.NODE_ENV === 'production' && !process.env.CORS_ORIGIN) {
  console.warn('WARNING: CORS_ORIGIN not set — defaulting to https://docdefend.vercel.app');
}
app.use(cors({ origin: corsOrigin }));
app.use(express.json({ limit: '1mb' }));

// Rate limiting — stricter for Claude-calling endpoints
const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 AI requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please wait a minute before trying again.' },
});

const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60, // 60 general requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please slow down.' },
});

app.use('/api/analyze', aiLimiter);
app.use('/api/analyze-batch', aiLimiter);
app.use('/api/suggest-codes', aiLimiter);
app.use('/api/generate-addendum', aiLimiter);
app.use('/api/', generalLimiter);

function getAnthropicClient(req) {
  const apiKey = req.headers['x-api-key'] || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('No API key provided. Please enter your Anthropic API key in the app.');
  }
  return new Anthropic({ apiKey });
}

// File upload endpoint
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded', message: 'No file uploaded' });
    }

    const { buffer, originalname, mimetype } = req.file;

    console.log(`Processing file: ${originalname} (${mimetype})`);

    const result = await parseDocument(buffer, originalname, mimetype);

    res.json({
      success: true,
      filename: originalname,
      fileType: result.type,
      content: result.content,
      contentLength: result.content.length,
    });
  } catch (error) {
    console.error('File upload error:', error.message);
    res.status(500).json({
      error: 'Failed to process file',
      message: 'Could not parse the uploaded file. Please check the file format and try again.',
    });
  }
});

// Analysis endpoint
app.post('/api/analyze', async (req, res) => {
  try {
    const { note, cptCodes, icd10Codes, payerId } = req.body;

    if (!note || typeof note !== 'string' || !note.trim()) {
      return res.status(400).json({ error: 'A clinical note is required.' });
    }
    if (!isStringArray(cptCodes)) {
      return res.status(400).json({ error: 'At least one valid CPT code is required.' });
    }
    if (!isStringArray(icd10Codes)) {
      return res.status(400).json({ error: 'At least one valid ICD-10 code is required.' });
    }

    const payerSystemPrompt = buildSystemPrompt(payerId);
    const userPrompt = buildUserPrompt(note, cptCodes, icd10Codes, payerId);
    const anthropic = getAnthropicClient(req);

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      timeout: ANTHROPIC_TIMEOUT,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      system: payerSystemPrompt,
    });

    const analysis = parseClaudeJSON(message);
    // Attach payer info to response
    if (payerId && payerId !== 'medicare' && PAYERS[payerId]) {
      analysis.payerId = payerId;
      analysis.payerName = PAYERS[payerId].name;
    }
    res.json(analysis);
  } catch (error) {
    console.error('Analysis error:', error.message);
    res.status(500).json({
      error: 'Analysis failed',
      message: safeErrorMessage(error),
    });
  }
});

// Batch analysis endpoint - analyze multiple notes sequentially
app.post('/api/analyze-batch', async (req, res) => {
  try {
    const { notes, payerId } = req.body;

    if (!notes?.length) {
      return res.status(400).json({ error: 'Notes array is required', message: 'Notes array is required' });
    }

    if (notes.length > 20) {
      return res.status(400).json({ error: 'Maximum 20 notes per batch', message: 'Maximum 20 notes per batch' });
    }

    const anthropic = getAnthropicClient(req);
    const batchSystemPrompt = buildSystemPrompt(payerId);

    // Process notes concurrently (max 3 at a time) to avoid Render timeout
    const CONCURRENCY = 3;
    const results = new Array(notes.length);

    const analyzeOne = async (item, index) => {
      const { id, title, note, cptCodes, icd10Codes } = item;

      if (!note || typeof note !== 'string' || !note.trim() || !isStringArray(cptCodes) || !isStringArray(icd10Codes)) {
        return { id: id || `note-${index}`, title: title || `Note ${index + 1}`, error: 'Missing or invalid fields: note, cptCodes, and icd10Codes are required.', status: 'error' };
      }

      try {
        const userPrompt = buildUserPrompt(note, cptCodes, icd10Codes, payerId);
        const message = await anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4096,
          timeout: ANTHROPIC_TIMEOUT,
          messages: [{ role: 'user', content: userPrompt }],
          system: batchSystemPrompt,
        });

        const analysis = parseClaudeJSON(message);
        return { id: id || `note-${index}`, title: title || `Note ${index + 1}`, analysis, status: 'complete' };
      } catch (err) {
        console.error(`Batch analysis error for note ${id || index}:`, err.message);
        return { id: id || `note-${index}`, title: title || `Note ${index + 1}`, error: safeErrorMessage(err), status: 'error' };
      }
    };

    // Run in batches of CONCURRENCY
    for (let i = 0; i < notes.length; i += CONCURRENCY) {
      const chunk = notes.slice(i, i + CONCURRENCY);
      const chunkResults = await Promise.all(chunk.map((item, idx) => analyzeOne(item, i + idx)));
      chunkResults.forEach((result, idx) => { results[i + idx] = result; });
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
    console.error('Batch analysis error:', error.message);
    res.status(500).json({ error: 'Batch analysis failed', message: safeErrorMessage(error) });
  }
});

// Code suggestion endpoint - analyzes note and suggests CPT/ICD-10 codes
app.post('/api/suggest-codes', async (req, res) => {
  try {
    const { note } = req.body;

    if (!note || typeof note !== 'string' || !note.trim()) {
      return res.status(400).json({ error: 'A clinical note is required.' });
    }

    const anthropic = getAnthropicClient(req);

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      timeout: ANTHROPIC_TIMEOUT,
      messages: [
        {
          role: 'user',
          content: buildCodeSuggestionPrompt(note),
        },
      ],
      system: codeSuggestionPrompt,
    });

    const suggestions = parseClaudeJSON(message);
    res.json(suggestions);
  } catch (error) {
    console.error('Code suggestion error:', error.message);
    res.status(500).json({ error: 'Code suggestion failed', message: safeErrorMessage(error) });
  }
});

// Addendum generation endpoint
app.post('/api/generate-addendum', async (req, res) => {
  try {
    const { note, gaps } = req.body;

    if (!note || typeof note !== 'string' || !note.trim()) {
      return res.status(400).json({ error: 'A clinical note is required.' });
    }
    if (!isStringArray(gaps)) {
      return res.status(400).json({ error: 'At least one documentation gap is required.' });
    }

    const anthropic = getAnthropicClient(req);

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      timeout: ANTHROPIC_TIMEOUT,
      messages: [
        {
          role: 'user',
          content: buildAddendumPrompt(note, gaps),
        },
      ],
      system: addendumPrompt,
    });

    const addendum = parseClaudeJSON(message);
    res.json(addendum);
  } catch (error) {
    console.error('Addendum generation error:', error.message);
    res.status(500).json({ error: 'Addendum generation failed', message: safeErrorMessage(error) });
  }
});

// Template library endpoint
app.get('/api/templates', (req, res) => {
  // Return templates without the full template text for listing
  const templateList = templateLibrary.map(({ id, name, category, cptCode, description }) => ({
    id,
    name,
    category,
    cptCode,
    description,
  }));
  res.json(templateList);
});

// Get single template by ID
app.get('/api/templates/:id', (req, res) => {
  const template = templateLibrary.find(t => t.id === req.params.id);
  if (!template) {
    return res.status(404).json({ error: 'Template not found' });
  }
  res.json(template);
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Error handling for multer
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
    }
    return res.status(400).json({ error: error.message });
  }
  if (error) {
    return res.status(400).json({ error: error.message });
  }
  next();
});

const server = app.listen(PORT, () => {
  console.log(`DocDefend API server running on port ${PORT}`);
});

// Graceful shutdown — let in-flight requests finish before exiting
function gracefulShutdown(signal) {
  console.log(`\n${signal} received. Closing HTTP server gracefully...`);
  server.close(() => {
    console.log('All in-flight requests completed. Exiting.');
    process.exit(0);
  });

  // Force exit after 10s if connections aren't drained
  setTimeout(() => {
    console.warn('Forcing shutdown — connections did not drain in time.');
    process.exit(1);
  }, 10_000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
