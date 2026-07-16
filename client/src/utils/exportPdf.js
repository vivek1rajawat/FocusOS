import jsPDF from 'jspdf';

// Renders KAI's markdown replies as a real structured PDF (headings, bullet/numbered lists,
// tables, code blocks, bold/italic text) using native jsPDF text drawing — not a screenshot —
// so the output has selectable text, clean pagination, and a consistent look regardless of
// how the browser happened to render the message.

const MARGIN = 42;
const PAGE_WIDTH = 595.28; // A4 pt
const PAGE_HEIGHT = 841.89;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const FOOTER_HEIGHT = 24;
const LINE_GAP = 1.35;

const FONT_SIZES = { h1: 18, h2: 14.5, h3: 12, body: 10, small: 8.5, code: 9 };

const COLORS = {
  heading: [30, 41, 59],
  body: [51, 65, 85],
  muted: [100, 116, 139],
  rule: [203, 213, 225],
  codeBg: [241, 245, 249],
  code: [190, 24, 93],
  accent: [79, 70, 229],
};

// ---------- markdown -> block parsing ----------

const parseBlocks = (markdown) => {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      i += 1;
      continue;
    }

    if (/^```/.test(line.trim())) {
      i += 1;
      const codeLines = [];
      while (i < lines.length && !/^```/.test(lines[i].trim())) {
        codeLines.push(lines[i]);
        i += 1;
      }
      i += 1;
      blocks.push({ type: 'code', lines: codeLines });
      continue;
    }

    const heading = /^(#{1,6})\s+(.+)$/.exec(line.trim());
    if (heading) {
      blocks.push({ type: 'heading', level: heading[1].length, text: heading[2].trim() });
      i += 1;
      continue;
    }

    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
      blocks.push({ type: 'hr' });
      i += 1;
      continue;
    }

    if (line.includes('|') && /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(lines[i + 1] || '')) {
      const parseRow = (row) => row.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
      const headers = parseRow(line);
      i += 2;
      const rows = [];
      while (i < lines.length && lines[i].includes('|') && lines[i].trim()) {
        rows.push(parseRow(lines[i]));
        i += 1;
      }
      blocks.push({ type: 'table', headers, rows });
      continue;
    }

    if (/^\s*[-*]\s+/.test(line) || /^\s*\d+\.\s+/.test(line)) {
      const items = [];
      while (i < lines.length) {
        const ul = /^\s*[-*]\s+(.+)$/.exec(lines[i]);
        const ol = /^\s*(\d+)\.\s+(.+)$/.exec(lines[i]);
        if (ul) {
          items.push({ ordered: false, text: ul[1].trim() });
          i += 1;
        } else if (ol) {
          items.push({ ordered: true, number: ol[1], text: ol[2].trim() });
          i += 1;
        } else {
          break;
        }
      }
      blocks.push({ type: 'list', items });
      continue;
    }

    const paraLines = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^```/.test(lines[i].trim()) &&
      !/^#{1,6}\s+/.test(lines[i].trim()) &&
      !/^\s*[-*]\s+/.test(lines[i]) &&
      !/^\s*\d+\.\s+/.test(lines[i])
    ) {
      paraLines.push(lines[i].trim());
      i += 1;
    }
    blocks.push({ type: 'paragraph', text: paraLines.join(' ') });
  }

  return blocks;
};

// ---------- inline styling (bold / italic / inline code) ----------

const tokenizeInline = (text) => {
  const tokens = [];
  const re = /\*\*(.+?)\*\*|`(.+?)`|\*(.+?)\*|_(.+?)_/g;
  let lastIndex = 0;
  let match;
  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIndex) tokens.push({ text: text.slice(lastIndex, match.index) });
    if (match[1] !== undefined) tokens.push({ text: match[1], bold: true });
    else if (match[2] !== undefined) tokens.push({ text: match[2], code: true });
    else if (match[3] !== undefined) tokens.push({ text: match[3], italic: true });
    else if (match[4] !== undefined) tokens.push({ text: match[4], italic: true });
    lastIndex = re.lastIndex;
  }
  if (lastIndex < text.length) tokens.push({ text: text.slice(lastIndex) });
  return tokens.filter((t) => t.text);
};

const tokensToWords = (tokens) => {
  const words = [];
  tokens.forEach((t) => {
    t.text.split(/(\s+)/).filter(Boolean).forEach((w) => {
      words.push({ text: w, bold: !!t.bold, italic: !!t.italic, code: !!t.code });
    });
  });
  return words;
};

const applyWordFont = (doc, word, size, colorOverride) => {
  if (word.code) {
    doc.setFont('courier', word.bold ? 'bold' : 'normal');
    doc.setFontSize(Math.max(size - 1, 7.5));
  } else {
    doc.setFont('helvetica', word.bold && word.italic ? 'bolditalic' : word.bold ? 'bold' : word.italic ? 'italic' : 'normal');
    doc.setFontSize(size);
  }
  doc.setTextColor(...(colorOverride || (word.code ? COLORS.code : COLORS.body)));
};

// ---------- page/cursor management ----------

class PdfWriter {
  constructor(doc, title) {
    this.doc = doc;
    this.title = title;
    this.page = 1;
    this.drawHeader();
  }

  drawHeader() {
    const { doc } = this;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.accent);
    doc.text('FocusOS · KAI', MARGIN, 26);
    doc.setDrawColor(...COLORS.rule);
    doc.setLineWidth(0.75);
    doc.line(MARGIN, 32, PAGE_WIDTH - MARGIN, 32);
    this.y = 32 + 20;
  }

  newPage() {
    this.doc.addPage();
    this.page += 1;
    this.drawHeader();
  }

  ensureSpace(height) {
    if (this.y + height > PAGE_HEIGHT - MARGIN - FOOTER_HEIGHT) this.newPage();
  }

  gap(amount) {
    this.y += amount;
  }
}

const writeWrappedWords = (writer, words, { x0, maxWidth, fontSize, colorOverride }) => {
  const { doc } = writer;
  const lineHeight = fontSize * LINE_GAP;
  let x = x0;
  writer.ensureSpace(lineHeight);
  words.forEach((word) => {
    applyWordFont(doc, word, fontSize, colorOverride);
    const isSpace = /^\s+$/.test(word.text);
    const w = doc.getTextWidth(word.text);
    if (!isSpace && x + w > x0 + maxWidth) {
      x = x0;
      writer.y += lineHeight;
      writer.ensureSpace(lineHeight);
    }
    if (isSpace && x === x0) return;
    doc.text(word.text, x, writer.y);
    x += w;
  });
  writer.y += lineHeight;
};

// ---------- block renderers ----------

const renderHeading = (writer, block) => {
  const size = block.level === 1 ? FONT_SIZES.h1 : block.level === 2 ? FONT_SIZES.h2 : FONT_SIZES.h3;
  writer.gap(block.level <= 2 ? 12 : 8);
  writer.ensureSpace(size * LINE_GAP + 6);
  const words = tokensToWords(tokenizeInline(block.text));
  writeWrappedWords(writer, words, { x0: MARGIN, maxWidth: CONTENT_WIDTH, fontSize: size, colorOverride: COLORS.heading });
  if (block.level <= 2) {
    writer.doc.setDrawColor(...COLORS.rule);
    writer.doc.setLineWidth(0.5);
    writer.doc.line(MARGIN, writer.y - size * LINE_GAP + size * 0.4, PAGE_WIDTH - MARGIN, writer.y - size * LINE_GAP + size * 0.4);
  }
  writer.gap(4);
};

const renderParagraph = (writer, block) => {
  const words = tokensToWords(tokenizeInline(block.text));
  writeWrappedWords(writer, words, { x0: MARGIN, maxWidth: CONTENT_WIDTH, fontSize: FONT_SIZES.body });
  writer.gap(4);
};

const renderList = (writer, block) => {
  const size = FONT_SIZES.body;
  const lineHeight = size * LINE_GAP;
  const bulletX = MARGIN + 2;
  const textX = MARGIN + 18;
  const textWidth = CONTENT_WIDTH - 18;

  block.items.forEach((item) => {
    writer.ensureSpace(lineHeight);
    const { doc } = writer;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(size);
    doc.setTextColor(...COLORS.accent);
    doc.text(item.ordered ? `${item.number}.` : '•', bulletX, writer.y);

    const words = tokensToWords(tokenizeInline(item.text));
    writeWrappedWords(writer, words, { x0: textX, maxWidth: textWidth, fontSize: size });
  });
  writer.gap(4);
};

const renderCode = (writer, block) => {
  const size = FONT_SIZES.code;
  const lineHeight = size * 1.5;
  const padding = 8;
  const { doc } = writer;
  doc.setFont('courier', 'normal');
  doc.setFontSize(size);

  const charWidth = doc.getTextWidth('M') || 5;
  const maxChars = Math.max(1, Math.floor((CONTENT_WIDTH - padding * 2) / charWidth));
  const wrapped = [];
  (block.lines.length ? block.lines : ['']).forEach((l) => {
    if (l.length <= maxChars) {
      wrapped.push(l);
    } else {
      for (let c = 0; c < l.length; c += maxChars) wrapped.push(l.slice(c, c + maxChars));
    }
  });

  writer.gap(4);
  let remaining = wrapped.slice();
  while (remaining.length) {
    const available = Math.max(1, Math.floor((PAGE_HEIGHT - MARGIN - FOOTER_HEIGHT - writer.y - padding * 2) / lineHeight));
    if (available < 1) writer.newPage();
    const fit = Math.max(1, Math.floor((PAGE_HEIGHT - MARGIN - FOOTER_HEIGHT - writer.y - padding * 2) / lineHeight));
    const chunk = remaining.slice(0, fit);
    remaining = remaining.slice(fit);
    const chunkHeight = chunk.length * lineHeight + padding * 2;

    doc.setFillColor(...COLORS.codeBg);
    doc.roundedRect(MARGIN, writer.y, CONTENT_WIDTH, chunkHeight, 3, 3, 'F');
    doc.setFont('courier', 'normal');
    doc.setFontSize(size);
    doc.setTextColor(...COLORS.heading);
    let cy = writer.y + padding + size * 0.9;
    chunk.forEach((l) => {
      doc.text(l || ' ', MARGIN + padding, cy);
      cy += lineHeight;
    });
    writer.y += chunkHeight;
    if (remaining.length) writer.newPage();
  }
  writer.gap(6);
};

const renderTable = (writer, block) => {
  const size = FONT_SIZES.small;
  const lineHeight = size * 1.5;
  const { doc } = writer;
  const cols = block.headers.length || 1;
  const colWidth = CONTENT_WIDTH / cols;

  const drawRow = (cells, isHeader) => {
    doc.setFont('helvetica', isHeader ? 'bold' : 'normal');
    doc.setFontSize(size);
    const wrapped = cells.map((c) => doc.splitTextToSize(c || '', colWidth - 10));
    const rowLines = Math.max(...wrapped.map((w) => w.length), 1);
    const rowHeight = rowLines * lineHeight + 8;
    writer.ensureSpace(rowHeight);
    const rowY = writer.y;

    if (isHeader) {
      doc.setFillColor(...COLORS.codeBg);
      doc.rect(MARGIN, rowY, CONTENT_WIDTH, rowHeight, 'F');
    }
    doc.setDrawColor(...COLORS.rule);
    doc.setLineWidth(0.5);
    doc.rect(MARGIN, rowY, CONTENT_WIDTH, rowHeight);
    for (let c = 1; c < cols; c += 1) {
      doc.line(MARGIN + colWidth * c, rowY, MARGIN + colWidth * c, rowY + rowHeight);
    }

    doc.setTextColor(...COLORS.body);
    wrapped.forEach((lines, ci) => {
      lines.forEach((line, li) => {
        doc.text(line, MARGIN + colWidth * ci + 5, rowY + 12 + li * lineHeight);
      });
    });
    writer.y += rowHeight;
  };

  writer.gap(4);
  drawRow(block.headers, true);
  block.rows.forEach((r) => drawRow(r, false));
  writer.gap(6);
};

const renderHr = (writer) => {
  writer.gap(6);
  writer.ensureSpace(10);
  writer.doc.setDrawColor(...COLORS.rule);
  writer.doc.setLineWidth(0.75);
  writer.doc.line(MARGIN, writer.y, PAGE_WIDTH - MARGIN, writer.y);
  writer.gap(10);
};

const finalize = (doc, title) => {
  const totalPages = doc.internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p += 1) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.muted);
    doc.text(title, MARGIN, PAGE_HEIGHT - 16);
    doc.text(`Page ${p} of ${totalPages}`, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 16, { align: 'right' });
  }
};

// Renders a KAI markdown reply into a structured, paginated A4 PDF and triggers a download.
export const exportMarkdownToPdf = (markdown, filename = 'FocusOS-Notes.pdf', title = 'FocusOS · KAI') => {
  const doc = new jsPDF('p', 'pt', 'a4');
  const writer = new PdfWriter(doc, title);

  parseBlocks(markdown || '').forEach((block) => {
    switch (block.type) {
      case 'heading':
        renderHeading(writer, block);
        break;
      case 'paragraph':
        renderParagraph(writer, block);
        break;
      case 'list':
        renderList(writer, block);
        break;
      case 'table':
        renderTable(writer, block);
        break;
      case 'code':
        renderCode(writer, block);
        break;
      case 'hr':
        renderHr(writer);
        break;
      default:
        break;
    }
  });

  finalize(doc, title);
  doc.save(filename);
};
