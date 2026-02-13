import express from 'express';
import cors from 'cors';
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
import multer from 'multer';
import { systemPrompt, buildUserPrompt } from './prompt.js';
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

app.use(cors());
app.use(express.json());

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
      return res.status(400).json({ error: 'No file uploaded' });
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
    console.error('File upload error:', error);
    res.status(500).json({
      error: 'Failed to process file',
      message: error.message,
    });
  }
});

// Analysis endpoint
app.post('/api/analyze', async (req, res) => {
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

    let responseText = message.content[0].text;

    // Strip markdown code fences if present
    responseText = responseText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

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
});

// Batch analysis endpoint - analyze multiple notes sequentially
app.post('/api/analyze-batch', async (req, res) => {
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

        let responseText = message.content[0].text;
        responseText = responseText
          .replace(/^```json\s*/i, '')
          .replace(/^```\s*/i, '')
          .replace(/\s*```$/i, '')
          .trim();

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
});

// Code suggestion endpoint - analyzes note and suggests CPT/ICD-10 codes
app.post('/api/suggest-codes', async (req, res) => {
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

    let responseText = message.content[0].text;
    responseText = responseText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

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
});

// Addendum generation endpoint
app.post('/api/generate-addendum', async (req, res) => {
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

    let responseText = message.content[0].text;
    responseText = responseText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

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

app.listen(PORT, () => {
  console.log(`DocDefend API server running on port ${PORT}`);
});
