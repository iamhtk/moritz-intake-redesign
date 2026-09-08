import {
  Fragment,
  type Slice,
  type Node as ProseMirrorNode,
} from 'prosemirror-model';
import {
  defaultMarkdownSerializer,
  MarkdownSerializer,
} from 'prosemirror-markdown';

import { richTextSchema } from './schema';
import type { RichTextDoc } from '@/components/rich-text/rich-text-utils';

function formatTableRow(cells: readonly string[]): string {
  const normalized = cells.map((cell) => (cell.length > 0 ? cell : ' '));
  return `| ${normalized.join(' | ')} |`;
}

const serializer = new MarkdownSerializer(
  {
    ...defaultMarkdownSerializer.nodes,
    table(state, node) {
      const rows: Array<{ cells: string[]; isHeader: boolean }> = [];
      node.forEach((rowNode) => {
        const cells: string[] = [];
        let isHeader = false;
        rowNode.forEach((cellNode) => {
          if (cellNode.type.name === 'table_header') {
            isHeader = true;
          }
          cells.push(serializeTableCellContent(cellNode, serializer));
        });
        rows.push({ cells, isHeader });
      });

      if (rows.length === 0) {
        state.ensureNewLine();
        state.closeBlock(node);
        return;
      }

      const explicitHeaderIndex = rows.findIndex((row) => row.isHeader);
      const headerIndex = explicitHeaderIndex >= 0 ? explicitHeaderIndex : 0;
      const maxColumns = rows.reduce(
        (max, row) => Math.max(max, row.cells.length),
        0,
      );

      const padCells = (cells: string[]): string[] =>
        Array.from({ length: maxColumns }, (_, index) => cells[index] ?? '');

      const headerRow = padCells(rows[headerIndex]?.cells ?? []);
      const bodyRows = rows
        .filter((_, index) => index !== headerIndex)
        .map((row) => padCells(row.cells));

      const headerLine = formatTableRow(headerRow);
      const separatorLine = formatTableRow(
        Array.from({ length: maxColumns }, () => '---'),
      );

      state.ensureNewLine();
      state.write(headerLine);
      state.ensureNewLine();
      state.write(separatorLine);

      if (bodyRows.length === 0) {
        state.ensureNewLine();
      }

      bodyRows.forEach((row) => {
        state.ensureNewLine();
        state.write(formatTableRow(row));
      });

      state.closeBlock(node);
    },
  },
  defaultMarkdownSerializer.marks,
  { strict: false },
);

function serializeTableCellContent(
  cell: ProseMirrorNode,
  markdownSerializer: MarkdownSerializer,
): string {
  const rendered = markdownSerializer
    .serialize(cell, { tightLists: true })
    .trim();
  if (rendered.length === 0) {
    return '';
  }
  return rendered.replace(/\n/g, '<br />').replace(/\|/g, '\\|');
}

function serializeNodeToMarkdown(node: ProseMirrorNode): string {
  try {
    const markdown = serializer.serialize(node);
    return markdown.trimEnd();
  } catch (error) {
    console.error('Failed to serialize ProseMirror node to Markdown', error);
    return (node.textContent ?? '').trimEnd();
  }
}

function wrapFragmentInDoc(fragment: Fragment): ProseMirrorNode | null {
  if (!fragment || fragment.size === 0) {
    return null;
  }

  const paragraphType = richTextSchema.nodes.paragraph;
  const nodes: ProseMirrorNode[] = [];
  let inlineBuffer: ProseMirrorNode[] = [];

  const flushInline = () => {
    if (inlineBuffer.length === 0) {
      return;
    }
    if (!paragraphType) {
      console.error(
        'Missing paragraph node in rich text schema; cannot wrap inline fragment for Markdown serialization',
      );
      inlineBuffer = [];
      return;
    }
    try {
      nodes.push(paragraphType.create(null, Fragment.from(inlineBuffer)));
    } catch (error) {
      console.error(
        'Failed to wrap inline fragment in paragraph for Markdown serialization',
        error,
      );
    }
    inlineBuffer = [];
  };

  fragment.forEach((node) => {
    if (node.type === richTextSchema.topNodeType) {
      flushInline();
      nodes.push(node);
      return;
    }

    if (node.type.isInline) {
      inlineBuffer.push(node);
      return;
    }

    flushInline();
    nodes.push(node);
  });

  flushInline();

  if (nodes.length === 0) {
    return null;
  }

  try {
    return richTextSchema.topNodeType.create(null, Fragment.from(nodes));
  } catch (error) {
    console.error(
      'Failed to construct doc node for Markdown serialization',
      error,
    );
    return null;
  }
}

export function serializeSliceToMarkdown(slice: Slice): string {
  if (!slice || slice.content.size === 0) {
    return '';
  }
  const docNode = wrapFragmentInDoc(slice.content);
  if (!docNode) {
    return '';
  }
  return serializeNodeToMarkdown(docNode);
}

export function serializeFragmentToMarkdown(fragment: Fragment): string {
  const docNode = wrapFragmentInDoc(fragment);
  if (!docNode) {
    return '';
  }
  return serializeNodeToMarkdown(docNode);
}

export function serializeDocToMarkdown(doc: RichTextDoc): string {
  try {
    const node = richTextSchema.nodeFromJSON(doc);
    return serializeNodeToMarkdown(node);
  } catch (error) {
    console.error('Failed to serialize rich text doc to Markdown', error);
    return '';
  }
}

export const richTextMarkdownSerializer = serializer;
