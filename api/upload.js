import { cors } from './lib/helpers.js';
import { parseDocument } from './lib/parsers.js';
import Busboy from 'busboy';

// Disable Vercel's default body parsing so we can handle multipart ourselves
export const config = {
  api: {
    bodyParser: false,
  },
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_EXTENSIONS = ['.pdf', '.xml', '.ccd', '.ccda', '.txt'];

function parseMultipart(req) {
  return new Promise((resolve, reject) => {
    const busboy = Busboy({
      headers: req.headers,
      limits: { fileSize: MAX_FILE_SIZE, files: 1 },
    });

    let fileData = null;

    busboy.on('file', (fieldname, stream, info) => {
      const { filename, mimeType } = info;
      const ext = filename.toLowerCase().slice(filename.lastIndexOf('.'));

      const allowedTypes = [
        'application/pdf',
        'application/xml',
        'text/xml',
        'text/plain',
        'application/octet-stream',
      ];

      if (!allowedTypes.includes(mimeType) && !ALLOWED_EXTENSIONS.includes(ext)) {
        stream.resume(); // drain the stream
        reject(new Error('Invalid file type. Allowed: PDF, XML, CCD, CCDA, TXT'));
        return;
      }

      const chunks = [];
      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('end', () => {
        fileData = {
          buffer: Buffer.concat(chunks),
          originalname: filename,
          mimetype: mimeType,
        };
      });
      stream.on('limit', () => {
        reject(new Error('File too large. Maximum size is 10MB.'));
      });
    });

    busboy.on('finish', () => {
      if (!fileData) {
        reject(new Error('No file uploaded'));
      } else {
        resolve(fileData);
      }
    });

    busboy.on('error', reject);

    req.pipe(busboy);
  });
}

export default async function handler(req, res) {
  if (cors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const file = await parseMultipart(req);

    console.log(`Processing file: ${file.originalname} (${file.mimetype})`);

    const result = await parseDocument(file.buffer, file.originalname, file.mimetype);

    res.json({
      success: true,
      filename: file.originalname,
      fileType: result.type,
      content: result.content,
      contentLength: result.content.length,
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(error.message.includes('Invalid file type') || error.message.includes('too large') ? 400 : 500).json({
      error: 'Failed to process file',
      message: error.message,
    });
  }
}
