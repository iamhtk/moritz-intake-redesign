'use client';

import type { ClipboardEvent } from 'react';
import {
  Fragment,
  type JSX,
  useCallback,
  useMemo,
  useRef,
  type Key,
  type CSSProperties,
  type ReactNode,
} from 'react';

import { cn } from '@repo/ui/lib/utils';

import {
  coerceRichText,
  isRichTextEmpty,
  type RichTextDoc,
  type RichTextMark,
  type RichTextNode,
} from '@/components/rich-text/rich-text-utils';
import { serializeDocToMarkdown } from '@/lib/rich-text/markdown';

interface RichTextViewerProps {
  value: string | RichTextDoc | null | undefined;
  className?: string;
  emptyState?: ReactNode;
}

export function RichTextViewer({
  value,
  className,
  emptyState,
}: RichTextViewerProps) {
  const doc = useMemo(() => coerceRichText(value ?? null).doc, [value]);
  const markdown = useMemo(() => serializeDocToMarkdown(doc), [doc]);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const handleCopy = useCallback(
    (event: ClipboardEvent<HTMLDivElement>) => {
      if (!markdown) {
        return;
      }
      const container = containerRef.current;
      const selection = window.getSelection();
      if (
        !container ||
        !selection ||
        selection.isCollapsed ||
        selection.toString().trim() !== container.textContent?.trim()
      ) {
        return;
      }

      event.preventDefault();
      event.clipboardData.setData('text/plain', markdown);
      event.clipboardData.setData('text/markdown', markdown);
    },
    [markdown],
  );

  if (isRichTextEmpty(doc)) {
    return (
      <div className={cn('text-muted-foreground text-sm', className)}>
        {emptyState ?? 'No content yet'}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'prose prose-sm dark:prose-invert text-foreground max-w-none',
        className,
      )}
      ref={containerRef}
      onCopy={handleCopy}
    >
      {doc.content.map((node, index) => renderNode(node, index))}
    </div>
  );
}

function renderNode(node: RichTextNode, key: Key): ReactNode {
  switch (node.type) {
    case 'table': {
      const headerRows: ReactNode[] = [];
      const bodyRows: ReactNode[] = [];
      const rows = Array.isArray(node.content) ? node.content : [];
      rows.forEach((row, rowIndex) => {
        const rowKey = `${String(key)}-row-${rowIndex}`;
        const renderedRow = renderNode(row, rowKey);
        if (!renderedRow) {
          return;
        }
        const containsHeaderCell = Array.isArray(row.content)
          ? row.content.some((cell) => cell.type === 'table_header')
          : false;
        if (containsHeaderCell) {
          headerRows.push(renderedRow);
        } else {
          bodyRows.push(renderedRow);
        }
      });
      const hasHeader = headerRows.length > 0;
      const effectiveBodyRows = hasHeader
        ? bodyRows
        : [...headerRows, ...bodyRows];
      return (
        <table key={key} className="w-full table-auto border-collapse">
          {hasHeader ? <thead>{headerRows}</thead> : null}
          <tbody>{effectiveBodyRows}</tbody>
        </table>
      );
    }
    case 'table_row':
      return <tr key={key}>{renderChildren(node, key)}</tr>;
    case 'table_header': {
      const cellProps = getTableCellProps(node.attrs);
      return (
        <th key={key} scope="col" {...cellProps}>
          {renderChildren(node, key)}
        </th>
      );
    }
    case 'table_cell': {
      const cellProps = getTableCellProps(node.attrs);
      return (
        <td key={key} {...cellProps}>
          {renderChildren(node, key)}
        </td>
      );
    }
    case 'paragraph': {
      const children = renderChildren(node, key);
      if (!children || children.length === 0) {
        return <p key={key}>&nbsp;</p>;
      }
      return <p key={key}>{children}</p>;
    }
    case 'heading': {
      const level = normalizeHeadingLevel(node.attrs?.level);
      const HeadingTag = `h${level}` as keyof JSX.IntrinsicElements;
      return <HeadingTag key={key}>{renderChildren(node, key)}</HeadingTag>;
    }
    case 'bullet_list':
      return <ul key={key}>{renderChildren(node, key)}</ul>;
    case 'ordered_list': {
      const start =
        typeof node.attrs?.order === 'number' ? node.attrs.order : undefined;
      return (
        <ol key={key} start={start}>
          {renderChildren(node, key)}
        </ol>
      );
    }
    case 'list_item':
      return <li key={key}>{renderChildren(node, key)}</li>;
    case 'blockquote':
      return <blockquote key={key}>{renderChildren(node, key)}</blockquote>;
    case 'code_block': {
      const textContent = extractText(node);
      return (
        <pre key={key}>
          <code>{textContent}</code>
        </pre>
      );
    }
    case 'horizontal_rule':
      return <hr key={key} />;
    case 'hard_break':
      return <br key={key} />;
    case 'image': {
      const attrs = node.attrs ?? {};
      const src = typeof attrs?.src === 'string' ? attrs.src : undefined;
      if (!src) {
        return null;
      }
      const alt = typeof attrs?.alt === 'string' ? attrs.alt : '';
      const title = typeof attrs?.title === 'string' ? attrs.title : undefined;
      return <img key={key} src={src} alt={alt} title={title} />;
    }
    case 'text':
      return <Fragment key={key}>{renderTextNode(node)}</Fragment>;
    default:
      return <div key={key}>{renderChildren(node, key)}</div>;
  }
}

function renderChildren(node: RichTextNode, parentKey: Key) {
  if (!node.content) {
    return null;
  }
  return node.content.map((child, index) =>
    renderNode(child, `${String(parentKey)}-${index}`),
  );
}

function renderTextNode(node: RichTextNode): ReactNode {
  const text = node.text ?? '';
  if (text.length === 0) {
    return null;
  }

  const marks = Array.isArray(node.marks) ? node.marks : [];
  return marks.reduceRight<ReactNode>(
    (content, mark) => wrapWithMark(mark, content),
    text,
  );
}

function wrapWithMark(mark: RichTextMark, content: ReactNode): ReactNode {
  switch (mark.type) {
    case 'strong':
      return <strong>{content}</strong>;
    case 'em':
      return <em>{content}</em>;
    case 'code':
      return <code>{content}</code>;
    case 'link': {
      const href =
        typeof mark.attrs?.href === 'string' ? mark.attrs.href : undefined;
      const title =
        typeof mark.attrs?.title === 'string' ? mark.attrs.title : undefined;
      return (
        <a href={href} title={title} className="underline">
          {content}
        </a>
      );
    }
    default:
      return content;
  }
}

function normalizeHeadingLevel(value: unknown): 1 | 2 | 3 | 4 | 5 | 6 {
  if (typeof value === 'number') {
    return clampHeadingLevel(value);
  }
  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isNaN(parsed)) {
      return clampHeadingLevel(parsed);
    }
  }
  return 1;
}

function clampHeadingLevel(level: number): 1 | 2 | 3 | 4 | 5 | 6 {
  if (level < 1) {
    return 1;
  }
  if (level > 6) {
    return 6;
  }
  return level as 1 | 2 | 3 | 4 | 5 | 6;
}

function extractText(node: RichTextNode): string {
  if (node.type === 'text') {
    return node.text ?? '';
  }

  if (!node.content) {
    return '';
  }

  return node.content.map(extractText).join('');
}

function getTableCellProps(attrs: RichTextNode['attrs']): {
  colSpan?: number;
  rowSpan?: number;
  style?: CSSProperties;
} {
  const colSpan = normalizeSpanValue(attrs?.colspan);
  const rowSpan = normalizeSpanValue(attrs?.rowspan);
  const style = normalizeColWidth(attrs?.colwidth);
  const props: { colSpan?: number; rowSpan?: number; style?: CSSProperties } =
    {};
  if (colSpan) {
    props.colSpan = colSpan;
  }
  if (rowSpan) {
    props.rowSpan = rowSpan;
  }
  if (style) {
    props.style = style;
  }
  return props;
}

function normalizeSpanValue(value: unknown): number | undefined {
  if (typeof value === 'number' && value > 1) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isNaN(parsed) && parsed > 1) {
      return parsed;
    }
  }
  return undefined;
}

function normalizeColWidth(value: unknown): CSSProperties | undefined {
  if (!Array.isArray(value) || value.length === 0) {
    return undefined;
  }
  const firstWidth = value.find(
    (entry): entry is number => typeof entry === 'number' && entry > 0,
  );
  if (!firstWidth) {
    return undefined;
  }
  return { width: `${firstWidth}px` };
}
