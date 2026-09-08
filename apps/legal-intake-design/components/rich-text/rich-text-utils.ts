import {
  ensureBlockIdsInJSON,
  type ProseMirrorJSONDoc,
} from '@/lib/rich-text/block-ids';

export type RichTextMark = {
  type: string;
  attrs?: Record<string, unknown> | null;
};

export type RichTextNode = {
  type: string;
  text?: string;
  content?: RichTextNode[];
  attrs?: Record<string, unknown> | null;
  marks?: RichTextMark[];
};

export type RichTextDoc = {
  type: 'doc';
  content: RichTextNode[];
};

function isRichTextNode(value: unknown): value is RichTextNode {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const node = value as RichTextNode;
  if (typeof node.type !== 'string' || node.type.length === 0) {
    return false;
  }
  if (node.content && !Array.isArray(node.content)) {
    return false;
  }
  if (Array.isArray(node.content)) {
    return node.content.every(isRichTextNode);
  }
  if (node.text !== undefined && typeof node.text !== 'string') {
    return false;
  }
  if (
    node.marks &&
    (!Array.isArray(node.marks) || !node.marks.every(isRichTextMark))
  ) {
    return false;
  }
  return true;
}

function isRichTextMark(value: unknown): value is RichTextMark {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const mark = value as RichTextMark;
  if (typeof mark.type !== 'string' || mark.type.length === 0) {
    return false;
  }
  if (
    mark.attrs != null &&
    (typeof mark.attrs !== 'object' || Array.isArray(mark.attrs))
  ) {
    return false;
  }
  return true;
}

export function parseRichText(value: unknown): RichTextDoc | null {
  if (value == null) {
    return null;
  }

  if (typeof value === 'string') {
    if (value.trim().length === 0) {
      return null;
    }
    try {
      return parseRichText(JSON.parse(value));
    } catch {
      // Not valid JSON - return null so coerceRichText can convert plain text
      return null;
    }
  }

  if (typeof value !== 'object') {
    return null;
  }

  const doc = value as { type?: unknown; content?: unknown; attrs?: unknown };
  if (doc.type !== 'doc') {
    return null;
  }

  // ProseMirror omits content field when empty, so treat undefined as []
  const content = doc.content ?? [];
  if (!Array.isArray(content)) {
    return null;
  }

  if (!content.every(isRichTextNode)) {
    return null;
  }

  // Ensure content is set on the doc (may have been undefined)
  (doc as { content: RichTextNode[] }).content = content;
  return doc as RichTextDoc;
}

export function isRichTextEmpty(doc: RichTextDoc): boolean {
  return !doc.content.some(nodeHasContent);
}

function nodeHasContent(node: RichTextNode): boolean {
  if (node.type === 'text') {
    return Boolean(node.text && node.text.trim().length > 0);
  }

  if (!node.content) {
    return false;
  }

  return node.content.some(nodeHasContent);
}

export function richTextToPlainText(doc: RichTextDoc): string {
  const lines: string[] = [];

  const appendLine = (text: string) => {
    const trimmed = text.replace(/\s+/g, ' ').trim();
    if (trimmed.length > 0) {
      lines.push(trimmed);
    }
  };

  const traverse = (node: RichTextNode, block = false): string => {
    if (node.type === 'text') {
      return node.text ?? '';
    }

    if (!node.content || node.content.length === 0) {
      return '';
    }

    const text = node.content
      .map((child) => traverse(child, isBlockNode(node.type)))
      .join('');
    if (isBlockNode(node.type) || block) {
      appendLine(text);
    }
    return text;
  };

  doc.content.forEach((node) => {
    traverse(node, true);
  });

  return lines.join('\n');
}

function isBlockNode(type: string): boolean {
  switch (type) {
    case 'paragraph':
    case 'blockquote':
    case 'ordered_list':
    case 'bullet_list':
    case 'list_item':
    case 'heading':
    case 'code_block':
      return true;
    default:
      return false;
  }
}

export function coerceRichText(value: unknown): {
  doc: RichTextDoc;
  serialized: string;
} {
  const finalize = (doc: RichTextDoc) => {
    ensureBlockIdsInJSON(doc as unknown as ProseMirrorJSONDoc);
    return { doc, serialized: canonicalizeRichText(doc) };
  };

  const parsed = parseRichText(value);
  if (parsed) {
    return finalize(parsed);
  }

  if (!value || (typeof value === 'string' && value.trim().length === 0)) {
    const emptyDoc = emptyRichTextDoc();
    return finalize(emptyDoc);
  }

  const text = typeof value === 'string' ? value : '';
  const lines = text.split(/\r?\n/);
  const content = lines.map((line) => ({
    type: 'paragraph' as const,
    content: line.length > 0 ? [{ type: 'text' as const, text: line }] : [],
  }));

  const doc: RichTextDoc = {
    type: 'doc',
    content,
  };

  return finalize(doc);
}

export function canonicalizeRichText(doc: RichTextDoc): string {
  return JSON.stringify(doc);
}

export function emptyRichTextDoc(): RichTextDoc {
  return {
    type: 'doc',
    content: [],
  };
}
