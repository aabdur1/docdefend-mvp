import { XMLParser } from 'fast-xml-parser';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');

/**
 * Parse CCDA/CCD XML document and extract clinical note text
 */
export async function parseCCDA(buffer) {
  const xmlString = buffer.toString('utf-8');

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    textNodeName: '#text',
    removeNSPrefix: true, // Remove namespace prefixes for easier parsing
  });

  const doc = parser.parse(xmlString);

  // Navigate CCDA structure to find clinical notes
  // CCDA documents have a specific structure with sections
  const extractedSections = [];

  try {
    const clinicalDocument = doc.ClinicalDocument;
    if (!clinicalDocument) {
      // Try to find any text content if not standard CCDA
      return extractTextFromXML(doc);
    }

    const component = clinicalDocument.component;
    if (!component) return extractTextFromXML(doc);

    const structuredBody = component.structuredBody;
    if (!structuredBody) return extractTextFromXML(doc);

    // Get all sections from the structured body
    let sections = structuredBody.component;
    if (!Array.isArray(sections)) {
      sections = [sections];
    }

    for (const comp of sections) {
      if (!comp || !comp.section) continue;

      const section = comp.section;
      const title = extractText(section.title) || 'Untitled Section';
      const text = extractSectionText(section.text);

      if (text) {
        extractedSections.push(`${title.toUpperCase()}:\n${text}`);
      }
    }

    if (extractedSections.length === 0) {
      return extractTextFromXML(doc);
    }

    return extractedSections.join('\n\n');
  } catch (error) {
    console.error('CCDA parsing error:', error);
    // Fallback: extract any text content
    return extractTextFromXML(doc);
  }
}

/**
 * Extract text from CCDA section text element
 * Handles nested tables, lists, paragraphs, etc.
 */
function extractSectionText(textElement) {
  if (!textElement) return '';

  if (typeof textElement === 'string') {
    return cleanText(textElement);
  }

  const parts = [];

  // Handle direct text content
  if (textElement['#text']) {
    parts.push(textElement['#text']);
  }

  // Handle paragraphs
  if (textElement.paragraph) {
    const paragraphs = Array.isArray(textElement.paragraph)
      ? textElement.paragraph
      : [textElement.paragraph];
    for (const p of paragraphs) {
      parts.push(extractText(p));
    }
  }

  // Handle lists
  if (textElement.list) {
    const lists = Array.isArray(textElement.list) ? textElement.list : [textElement.list];
    for (const list of lists) {
      if (list.item) {
        const items = Array.isArray(list.item) ? list.item : [list.item];
        for (const item of items) {
          parts.push('• ' + extractText(item));
        }
      }
    }
  }

  // Handle tables
  if (textElement.table) {
    parts.push(extractTableText(textElement.table));
  }

  // Handle content elements
  if (textElement.content) {
    const contents = Array.isArray(textElement.content)
      ? textElement.content
      : [textElement.content];
    for (const content of contents) {
      parts.push(extractText(content));
    }
  }

  return cleanText(parts.join('\n'));
}

/**
 * Extract text from table elements
 */
function extractTableText(table) {
  const rows = [];

  // Handle thead
  if (table.thead && table.thead.tr) {
    const headerRows = Array.isArray(table.thead.tr) ? table.thead.tr : [table.thead.tr];
    for (const tr of headerRows) {
      const cells = tr.th || tr.td;
      if (cells) {
        const cellArray = Array.isArray(cells) ? cells : [cells];
        rows.push(cellArray.map(c => extractText(c)).join(' | '));
      }
    }
  }

  // Handle tbody
  if (table.tbody && table.tbody.tr) {
    const bodyRows = Array.isArray(table.tbody.tr) ? table.tbody.tr : [table.tbody.tr];
    for (const tr of bodyRows) {
      const cells = tr.td || tr.th;
      if (cells) {
        const cellArray = Array.isArray(cells) ? cells : [cells];
        rows.push(cellArray.map(c => extractText(c)).join(' | '));
      }
    }
  }

  // Handle direct tr elements
  if (table.tr) {
    const trs = Array.isArray(table.tr) ? table.tr : [table.tr];
    for (const tr of trs) {
      const cells = tr.td || tr.th;
      if (cells) {
        const cellArray = Array.isArray(cells) ? cells : [cells];
        rows.push(cellArray.map(c => extractText(c)).join(' | '));
      }
    }
  }

  return rows.join('\n');
}

/**
 * Extract text from any element (handles strings and objects)
 */
function extractText(element) {
  if (!element) return '';
  if (typeof element === 'string') return element;
  if (typeof element === 'number') return String(element);
  if (element['#text']) return element['#text'];

  // Recursively extract from nested elements
  const parts = [];
  for (const key of Object.keys(element)) {
    if (key.startsWith('@_')) continue; // Skip attributes
    const value = element[key];
    if (Array.isArray(value)) {
      parts.push(value.map(v => extractText(v)).join(' '));
    } else {
      parts.push(extractText(value));
    }
  }
  return parts.join(' ');
}

/**
 * Fallback: extract all text content from any XML structure
 */
function extractTextFromXML(obj, depth = 0) {
  if (depth > 20) return ''; // Prevent infinite recursion

  if (!obj) return '';
  if (typeof obj === 'string') return obj;
  if (typeof obj === 'number') return String(obj);

  const parts = [];

  for (const key of Object.keys(obj)) {
    if (key.startsWith('@_')) continue; // Skip attributes

    const value = obj[key];
    if (Array.isArray(value)) {
      for (const item of value) {
        const text = extractTextFromXML(item, depth + 1);
        if (text) parts.push(text);
      }
    } else if (typeof value === 'object') {
      const text = extractTextFromXML(value, depth + 1);
      if (text) parts.push(text);
    } else if (value) {
      parts.push(String(value));
    }
  }

  return parts.join('\n');
}

/**
 * Clean up extracted text
 */
function cleanText(text) {
  if (!text) return '';
  return text
    .replace(/\s+/g, ' ')      // Normalize whitespace
    .replace(/\n\s*\n/g, '\n') // Remove empty lines
    .trim();
}

/**
 * Parse PDF document and extract text
 */
export async function parsePDF(buffer) {
  try {
    const data = await pdf(buffer);

    // Clean up the extracted text
    let text = data.text;

    // Remove excessive whitespace while preserving structure
    text = text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('\n');

    // Try to identify common clinical note sections and format them
    const sectionPatterns = [
      /^(CHIEF COMPLAINT|CC)[:.]?/im,
      /^(HISTORY OF PRESENT ILLNESS|HPI)[:.]?/im,
      /^(PAST MEDICAL HISTORY|PMH)[:.]?/im,
      /^(MEDICATIONS|CURRENT MEDICATIONS|MEDS)[:.]?/im,
      /^(ALLERGIES)[:.]?/im,
      /^(PHYSICAL EXAM|PHYSICAL EXAMINATION|PE)[:.]?/im,
      /^(ASSESSMENT|IMPRESSION)[:.]?/im,
      /^(PLAN|TREATMENT PLAN)[:.]?/im,
      /^(REVIEW OF SYSTEMS|ROS)[:.]?/im,
      /^(VITAL SIGNS|VITALS)[:.]?/im,
      /^(SOCIAL HISTORY|SH)[:.]?/im,
      /^(FAMILY HISTORY|FH)[:.]?/im,
    ];

    // Add line breaks before section headers for better readability
    for (const pattern of sectionPatterns) {
      text = text.replace(pattern, '\n\n$1:');
    }

    return text.trim();
  } catch (error) {
    console.error('PDF parsing error:', error);
    throw new Error('Failed to extract text from PDF. The file may be scanned/image-based or corrupted.');
  }
}

/**
 * Parse plain text file
 */
export async function parseText(buffer) {
  return buffer.toString('utf-8').trim();
}

/**
 * Detect file type and parse accordingly
 */
export async function parseDocument(buffer, filename, mimetype) {
  const lowerFilename = filename.toLowerCase();

  // Determine parser based on file extension and mimetype
  if (lowerFilename.endsWith('.pdf') || mimetype === 'application/pdf') {
    return {
      type: 'PDF',
      content: await parsePDF(buffer),
    };
  }

  if (lowerFilename.endsWith('.xml') ||
      lowerFilename.endsWith('.ccd') ||
      lowerFilename.endsWith('.ccda') ||
      mimetype === 'application/xml' ||
      mimetype === 'text/xml') {
    return {
      type: 'CCDA/XML',
      content: await parseCCDA(buffer),
    };
  }

  if (lowerFilename.endsWith('.txt') ||
      mimetype === 'text/plain') {
    return {
      type: 'Text',
      content: await parseText(buffer),
    };
  }

  // Try to detect based on content
  const contentStart = buffer.toString('utf-8', 0, 100);
  if (contentStart.includes('<?xml') || contentStart.includes('<ClinicalDocument')) {
    return {
      type: 'CCDA/XML',
      content: await parseCCDA(buffer),
    };
  }

  // Default to plain text
  return {
    type: 'Text',
    content: await parseText(buffer),
  };
}
