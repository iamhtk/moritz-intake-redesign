// Copied from packages/temporal-shared/src/rich-text/block-ids.ts so the
// playground stays self-contained per the original handoff plan.

import { Fragment, type Node as ProseMirrorNode } from 'prosemirror-model';

export type ProseMirrorJSONNode = {
  type: string;
  attrs?: Record<string, unknown> | null;
  content?: ProseMirrorJSONNode[];
  marks?: { type: string; attrs?: Record<string, unknown> | null }[];
  text?: string;
};

export type ProseMirrorJSONDoc = {
  type: 'doc';
  content?: ProseMirrorJSONNode[];
};

export interface EnsureBlockIdsOptions {
  generateId?: () => string;
}

export interface EnsureBlockIdsResult<T> {
  value: T;
  changed: boolean;
}

export const BLOCK_NODE_NAMES = new Set<string>([
  'doc',
  'paragraph',
  'blockquote',
  'heading',
  'code_block',
  'ordered_list',
  'bullet_list',
  'list_item',
  'table',
  'table_row',
  'table_cell',
  'table_header',
  'horizontal_rule',
]);

const BLOCK_ID_ATTR = 'blockId';

export function ensureBlockIdsInJSON(
  doc: ProseMirrorJSONDoc,
  options: EnsureBlockIdsOptions = {},
): EnsureBlockIdsResult<ProseMirrorJSONDoc> {
  const generator = options.generateId ?? defaultGenerateId;
  const seen = new Set<string>();
  const changed = ensureJsonNode(doc, seen, generator);
  return { value: doc, changed };
}

export function ensureBlockIdsInNode(
  node: ProseMirrorNode,
  options: EnsureBlockIdsOptions = {},
): EnsureBlockIdsResult<ProseMirrorNode> {
  const generator = options.generateId ?? defaultGenerateId;
  const seen = new Set<string>();
  const { updated, changed } = ensureNodeRecursive(node, seen, generator);
  return { value: updated, changed };
}

function ensureJsonNode(
  node: ProseMirrorJSONNode | ProseMirrorJSONDoc,
  seen: Set<string>,
  generator: () => string,
): boolean {
  let changed = false;
  if (isBlockJsonNode(node)) {
    const attrs = { ...(node.attrs ?? {}) };
    const nextId = normalizeBlockId(attrs[BLOCK_ID_ATTR], seen, generator);
    if (nextId !== attrs[BLOCK_ID_ATTR]) {
      attrs[BLOCK_ID_ATTR] = nextId;
      node.attrs = attrs;
      changed = true;
    }
  }

  if (Array.isArray(node.content)) {
    for (const child of node.content) {
      if (ensureJsonNode(child, seen, generator)) {
        changed = true;
      }
    }
  }

  return changed;
}

function ensureNodeRecursive(
  node: ProseMirrorNode,
  seen: Set<string>,
  generator: () => string,
): { updated: ProseMirrorNode; changed: boolean } {
  let childChanged = false;
  const content: ProseMirrorNode[] = [];
  for (let index = 0; index < node.childCount; index += 1) {
    const child = node.child(index);
    const ensured = ensureNodeRecursive(child, seen, generator);
    childChanged = childChanged || ensured.changed || ensured.updated !== child;
    content.push(ensured.updated);
  }

  const isBlock = node.isBlock && BLOCK_NODE_NAMES.has(node.type.name);
  const originalAttrs = node.attrs;
  let attrsForCreate: Record<string, unknown> | null | undefined =
    originalAttrs;
  let attrChanged = false;

  if (isBlock) {
    const mutableAttrs: Record<string, unknown> = {
      ...(originalAttrs ?? {}),
    };
    const currentId = originalAttrs?.[BLOCK_ID_ATTR];
    const nextId = normalizeBlockId(currentId, seen, generator);
    if (nextId !== currentId) {
      mutableAttrs[BLOCK_ID_ATTR] = nextId;
      attrChanged = true;
    }
    attrsForCreate = mutableAttrs;
  }

  const changed = childChanged || attrChanged;

  if (!changed) {
    return { updated: node, changed: false };
  }

  const fragment = node.type.isLeaf
    ? undefined
    : childChanged
      ? Fragment.fromArray(content)
      : node.content;

  return {
    updated: node.type.create(attrsForCreate, fragment, node.marks),
    changed,
  };
}

function normalizeBlockId(
  raw: unknown,
  seen: Set<string>,
  generator: () => string,
): string {
  let candidate =
    typeof raw === 'string' && raw.trim().length > 0 ? raw.trim() : null;
  while (!candidate || seen.has(candidate)) {
    candidate = generator();
  }
  seen.add(candidate);
  return candidate;
}

function isBlockJsonNode(
  node: ProseMirrorJSONNode | ProseMirrorJSONDoc,
): node is ProseMirrorJSONNode {
  return typeof node.type === 'string' && BLOCK_NODE_NAMES.has(node.type);
}

function defaultGenerateId(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  return `block-${Math.random().toString(36).slice(2, 11)}`;
}
