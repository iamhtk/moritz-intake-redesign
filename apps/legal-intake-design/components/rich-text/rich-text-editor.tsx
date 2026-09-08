'use client';

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ChangeEvent,
} from 'react';
import { generateId } from '@/lib/utils';
import type { EditorStateConfig, Transaction } from 'prosemirror-state';
import {
  EditorState,
  Plugin,
  PluginKey,
  Selection,
  type Command,
} from 'prosemirror-state';
import { Decoration, DecorationSet, EditorView } from 'prosemirror-view';
import { keymap } from 'prosemirror-keymap';
import { history, redo, undo } from 'prosemirror-history';
import {
  baseKeymap,
  chainCommands,
  createParagraphNear,
  lift,
  liftEmptyBlock,
  setBlockType,
  splitBlock,
  toggleMark,
  wrapIn,
} from 'prosemirror-commands';
import {
  wrapInList,
  liftListItem,
  sinkListItem,
  splitListItem,
} from 'prosemirror-schema-list';
import { dropCursor } from 'prosemirror-dropcursor';
import type { Node as ProseMirrorNode, NodeType } from 'prosemirror-model';
import 'prosemirror-view/style/prosemirror.css';
import 'prosemirror-tables/style/tables.css';
import {
  addColumnAfter,
  addRowAfter,
  columnResizing,
  deleteColumn,
  deleteRow,
  deleteTable,
  isInTable,
  tableEditing,
} from 'prosemirror-tables';

import { Button } from '@/components/design/design-system/button';
import { Label } from '@repo/ui/components/label';
import { FieldLabel } from '@repo/ui/components/field';
import { cn } from '@repo/ui/lib/utils';
import { Muted } from '@/components/design/design-system/typography';
import {
  Bold,
  Code,
  Heading1,
  Heading2,
  Italic,
  List,
  ListOrdered,
  Pilcrow,
  Quote,
  Redo2,
  Table,
  TableColumnsSplit,
  TableRowsSplit,
  Trash2,
  Undo2,
  type LucideIcon,
} from '@repo/ui/icons';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/design/design-system/select';
import { Textarea } from '@/components/design/design-system/textarea';

import {
  buildInputRules,
  listItemType,
  richTextSchema,
} from '@/lib/rich-text/schema';
import { serializeSliceToMarkdown } from '@/lib/rich-text/markdown';
import { coerceRichText, type RichTextDoc } from './rich-text-utils';
import {
  TEMPLATE_SECTION_TAG_VALUES,
  type TemplateSectionTag,
} from '@/lib/rich-text/template-section-tag';

function isMarkActive(
  state: EditorState,
  markType: (typeof richTextSchema.marks)[keyof typeof richTextSchema.marks],
) {
  if (!markType) {
    return false;
  }
  const { from, $from, to, empty } = state.selection;
  if (empty) {
    return Boolean(markType.isInSet(state.storedMarks || $from.marks()));
  }
  return state.doc.rangeHasMark(from, to, markType);
}

function isNodeActive(state: EditorState, nodeType?: NodeType) {
  if (!nodeType) {
    return false;
  }
  const { from, to } = state.selection;
  let active = false;
  state.doc.nodesBetween(from, to, (node) => {
    if (node.type === nodeType) {
      active = true;
      return false;
    }
    return true;
  });
  return active;
}

function toggleListCommand(listType?: NodeType) {
  return (
    state: EditorState,
    dispatch?: (tr: Transaction) => void,
    view?: EditorView,
  ) => {
    if (!listType || !listItemType) {
      return false;
    }
    if (isNodeActive(state, listType)) {
      return liftListItem(listItemType)(state, dispatch, view);
    }
    return wrapInList(listType)(state, dispatch, view);
  };
}

const DEFAULT_TABLE_ROWS = 3;
const DEFAULT_TABLE_COLUMNS = 3;

const TEMPLATE_SECTION_TAG_LABELS: Record<TemplateSectionTag, string> = {
  NONE: 'No expectation',
  KEEP: 'Should probably not change',
  REWRITE: 'Needs rewriting',
  PROMPT: 'Agent prompt',
};

const TEMPLATE_SECTION_TAG_SET = new Set(TEMPLATE_SECTION_TAG_VALUES);

type ParagraphTemplateAttrs = {
  templateTag?: TemplateSectionTag | null;
  templatePrompt?: string | null;
  blockId?: string | null;
  [key: string]: unknown;
};

function findParagraphAtSelection(state: EditorState) {
  const paragraphType = state.schema.nodes.paragraph;
  if (!paragraphType) {
    return null;
  }
  const { $from } = state.selection;
  for (let depth = $from.depth; depth >= 0; depth -= 1) {
    const node = $from.node(depth);
    if (node.type === paragraphType) {
      return node;
    }
  }
  return null;
}

const templateMetadataPluginKey = new PluginKey<DecorationSet>(
  'template-metadata',
);
const blockIdBadgePluginKey = new PluginKey<DecorationSet>(
  'template-block-ids',
);
const blockIdPluginKey = new PluginKey('template-block-id-manager');

function createTemplateMetadataPlugin(getEnabled: () => boolean) {
  return new Plugin<DecorationSet>({
    key: templateMetadataPluginKey,
    state: {
      init(_, state) {
        if (!getEnabled()) {
          return DecorationSet.empty;
        }
        return buildTemplateMetadataDecorations(state.doc);
      },
      apply(tr, value, _oldState, newState) {
        const enabled = getEnabled();
        const toggled =
          tr.getMeta(templateMetadataPluginKey)?.type === 'toggle';
        if (!enabled) {
          return DecorationSet.empty;
        }
        if (toggled || tr.docChanged || !value) {
          return buildTemplateMetadataDecorations(newState.doc);
        }
        return value.map(tr.mapping, tr.doc);
      },
    },
    props: {
      decorations(state) {
        if (!getEnabled()) {
          return null;
        }
        return this.getState(state);
      },
    },
  });
}

function createBlockIdBadgePlugin(getEnabled: () => boolean) {
  return new Plugin<DecorationSet>({
    key: blockIdBadgePluginKey,
    state: {
      init(_, state) {
        if (!getEnabled()) {
          return DecorationSet.empty;
        }
        return buildBlockIdDecorations(state.doc);
      },
      apply(tr, value, _oldState, newState) {
        const enabled = getEnabled();
        const toggled = tr.getMeta(blockIdBadgePluginKey)?.type === 'toggle';
        if (!enabled) {
          return DecorationSet.empty;
        }
        if (toggled || tr.docChanged || !value) {
          return buildBlockIdDecorations(newState.doc);
        }
        return value.map(tr.mapping, tr.doc);
      },
    },
    props: {
      decorations(state) {
        if (!getEnabled()) {
          return null;
        }
        return this.getState(state);
      },
    },
  });
}

function buildTemplateMetadataDecorations(doc: ProseMirrorNode) {
  const decorations: Decoration[] = [];

  doc.descendants((node, pos) => {
    if (node.type.name !== 'paragraph') {
      return true;
    }
    const tag =
      typeof node.attrs?.templateTag === 'string'
        ? (node.attrs.templateTag as TemplateSectionTag)
        : null;
    const prompt =
      typeof node.attrs?.templatePrompt === 'string'
        ? node.attrs.templatePrompt
        : null;

    if (!tag && !prompt) {
      return true;
    }

    const nodeClass = getTemplateHighlightClass(tag, Boolean(prompt));
    decorations.push(
      Decoration.node(pos, pos + node.nodeSize, {
        class: nodeClass,
      }),
    );
    decorations.push(
      Decoration.widget(
        pos + 1,
        () => createTemplateMetadataBadge(tag, prompt ?? null),
        { side: -1, ignoreSelection: true },
      ),
    );
    return true;
  });

  return DecorationSet.create(doc, decorations);
}

function buildBlockIdDecorations(doc: ProseMirrorNode) {
  const decorations: Decoration[] = [];
  doc.descendants((node, pos) => {
    if (pos === 0 || !node.isBlock || node.type.name === 'doc') {
      return true;
    }
    const blockId =
      typeof node.attrs?.blockId === 'string' ? node.attrs.blockId.trim() : '';
    decorations.push(
      Decoration.widget(pos, () => createBlockIdBadge(blockId), {
        side: -1,
        ignoreSelection: true,
        key: `block-id-${pos}`,
      }),
    );
    return true;
  });
  return DecorationSet.create(doc, decorations);
}

function createBlockIdPlugin() {
  return new Plugin({
    key: blockIdPluginKey,
    appendTransaction(transactions, _oldState, newState) {
      if (!transactions.some((tr) => tr.docChanged)) {
        return null;
      }
      const tr = newState.tr;
      const changed = ensureBlockIdsInState(newState, tr);
      return changed ? tr : null;
    },
    view(view) {
      ensureBlockIdsOnView(view);
      return {
        update(updatedView) {
          ensureBlockIdsOnView(updatedView);
        },
      };
    },
  });
}

function ensureBlockIdsOnView(view: EditorView) {
  const tr = view.state.tr;
  if (ensureBlockIdsInState(view.state, tr)) {
    view.dispatch(tr);
  }
}

function ensureBlockIdsInState(state: EditorState, tr: Transaction): boolean {
  const seen = new Set<string>();
  let changed = false;
  state.doc.descendants((node, pos) => {
    if (!node.isBlock || !hasBlockIdAttr(node)) {
      return true;
    }
    const raw =
      typeof node.attrs?.blockId === 'string' ? node.attrs.blockId : '';
    const blockId = raw.trim();
    if (blockId.length > 0 && !seen.has(blockId)) {
      seen.add(blockId);
      return true;
    }
    const nextId = generateBlockId(seen);
    tr.setNodeMarkup(
      pos,
      node.type,
      { ...node.attrs, blockId: nextId },
      node.marks,
    );
    changed = true;
    return true;
  });
  return changed;
}

function hasBlockIdAttr(node: ProseMirrorNode): boolean {
  const attrs = node.type.spec.attrs;
  return Boolean(
    attrs && Object.prototype.hasOwnProperty.call(attrs, 'blockId'),
  );
}

function generateBlockId(seen: Set<string>): string {
  let candidate: string;
  do {
    candidate = generateId();
  } while (seen.has(candidate));
  seen.add(candidate);
  return candidate;
}

function getTemplateHighlightClass(
  tag: TemplateSectionTag | null,
  hasPrompt: boolean,
) {
  let base = 'pm-template-section ring-1 rounded-md ';
  if (tag === 'KEEP') {
    base += 'ring-emerald-300 bg-emerald-50';
  } else if (tag === 'REWRITE') {
    base += 'ring-amber-300 bg-amber-50';
  } else if (tag === 'PROMPT' || hasPrompt) {
    base += 'ring-indigo-300 bg-indigo-50';
  } else {
    base += 'ring-slate-200 bg-slate-50';
  }
  return base;
}

function createTemplateMetadataBadge(
  tag: TemplateSectionTag | null,
  prompt: string | null,
) {
  const container = document.createElement('span');
  container.className =
    'pm-template-badge pointer-events-none select-none inline-flex items-center gap-2 align-middle mr-2';
  container.contentEditable = 'false';
  container.setAttribute('aria-hidden', 'true');

  if (tag) {
    const label = document.createElement('span');
    const colorClasses =
      tag === 'KEEP'
        ? 'bg-emerald-100 text-emerald-900'
        : tag === 'REWRITE'
          ? 'bg-amber-100 text-amber-900'
          : tag === 'PROMPT'
            ? 'bg-indigo-100 text-indigo-900'
            : 'bg-slate-200 text-slate-800';
    label.className = `rounded-full px-2 py-[2px] text-[10px] font-semibold uppercase tracking-wide shadow-sm ${colorClasses}`;
    label.textContent = TEMPLATE_SECTION_TAG_LABELS[tag];
    container.appendChild(label);
  }

  const trimmedPrompt = prompt?.trim();
  if (trimmedPrompt) {
    const snippet = truncateSnippet(trimmedPrompt, 80);
    const promptChip = document.createElement('span');
    promptChip.className =
      'rounded bg-indigo-100 px-2 py-[2px] text-[10px] font-medium text-indigo-900 shadow-sm';
    promptChip.textContent = snippet;
    container.appendChild(promptChip);
  }

  if (!container.childNodes.length) {
    container.textContent = 'Template guidance';
    container.className +=
      ' rounded-full bg-slate-200 px-2 py-[2px] text-[10px] font-medium text-slate-700';
  }

  return container;
}

function truncateSnippet(value: string, maxLength: number) {
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }
  return `${normalized.slice(0, Math.max(0, maxLength - 3))}...`;
}

function createBlockIdBadge(blockId: string) {
  const badge = document.createElement('span');
  badge.className =
    'pm-block-id pointer-events-none select-none rounded border border-slate-300 bg-slate-100 px-1.5 py-[1px] text-[10px] font-mono text-slate-700 mr-2 align-middle';
  const normalized = blockId.trim();
  badge.textContent = normalized || '—';
  badge.contentEditable = 'false';
  badge.setAttribute('aria-hidden', 'true');
  if (normalized) {
    badge.dataset.blockId = normalized;
    badge.title = normalized;
  }
  return badge;
}

function createTableNode(
  schema: EditorState['schema'],
  rowCount = DEFAULT_TABLE_ROWS,
  columnCount = DEFAULT_TABLE_COLUMNS,
): ProseMirrorNode | null {
  const tableType = schema.nodes.table;
  const rowType = schema.nodes.table_row;
  const cellType = schema.nodes.table_cell;
  if (!tableType || !rowType || !cellType) {
    return null;
  }
  const headerCellType = schema.nodes.table_header;

  const rows: ProseMirrorNode[] = [];
  for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
    const cells: ProseMirrorNode[] = [];
    for (let columnIndex = 0; columnIndex < columnCount; columnIndex += 1) {
      const cellNodeType =
        rowIndex === 0 && headerCellType ? headerCellType : cellType;
      const cell = cellNodeType.createAndFill();
      if (!cell) {
        return null;
      }
      cells.push(cell);
    }
    rows.push(rowType.create(null, cells));
  }

  return tableType.create(null, rows);
}

function createInsertTableCommand(
  rowCount = DEFAULT_TABLE_ROWS,
  columnCount = DEFAULT_TABLE_COLUMNS,
): Command {
  return (state, dispatch) => {
    const table = createTableNode(state.schema, rowCount, columnCount);
    if (!table) {
      return false;
    }
    if (dispatch) {
      const { tr, selection } = state;
      const tableStartPos = selection.from;
      let transaction = tr.replaceSelectionWith(table);
      try {
        transaction = transaction.setSelection(
          Selection.near(transaction.doc.resolve(tableStartPos + 1)),
        );
      } catch {
        // ignore if we cannot programmatically set the selection
      }
      dispatch(transaction.scrollIntoView());
    }
    return true;
  };
}

const insertTableCommand = createInsertTableCommand();

function createEditorState(
  doc: RichTextDoc,
  plugins: EditorStateConfig['plugins'],
) {
  let parsedDoc: ProseMirrorNode | null = null;
  try {
    parsedDoc = richTextSchema.nodeFromJSON(doc);
  } catch (error) {
    console.error(
      'Failed to hydrate ProseMirror doc; falling back to empty doc',
      error,
    );
  }
  return EditorState.create({
    schema: richTextSchema,
    doc: parsedDoc ?? richTextSchema.topNodeType.createAndFill() ?? undefined,
    plugins,
  });
}

type ToolbarButton = {
  label: string;
  icon: LucideIcon;
  iconClassName?: string;
  onClick: () => void;
  isActive?: () => boolean;
  disabled?: boolean;
};

export interface RichTextEditorProps {
  id: string;
  name: string;
  label: string;
  placeholder?: string;
  defaultValue?: string | null;
  disabled?: boolean;
  required?: boolean;
  errorMessage?: string;
  onChange?: (value: string) => void;
  autoFocus?: boolean;
  hideMetadataFeatures?: boolean;
}

export function RichTextEditor({
  id,
  name,
  label,
  placeholder,
  defaultValue,
  disabled = false,
  required = false,
  errorMessage,
  onChange,
  autoFocus = false,
  hideMetadataFeatures = false,
}: RichTextEditorProps) {
  // Only compute initial value once on mount - ignore subsequent defaultValue changes
  // This makes the editor behave like an uncontrolled component with a default value
  const initialRef = useRef<{ doc: RichTextDoc; serialized: string } | null>(
    null,
  );
  if (initialRef.current === null) {
    initialRef.current = coerceRichText(defaultValue ?? null);
  }
  const initialDoc = initialRef.current.doc;
  const initialSerialized = initialRef.current.serialized;
  const labelId = useId();
  const templateTagId = useId();
  const attributeTagId = useId();
  const templatePromptId = useId();
  const highlightToggleId = useId();
  const blockIdToggleId = useId();
  const [showTemplateHints, setShowTemplateHints] = useState(false);
  const [showAttributeEditor, setshowAttributeEditor] = useState(false);
  const [showBlockIds, setShowBlockIds] = useState(false);
  const templateMetadataEnabledRef = useRef(showTemplateHints);
  const blockIdsEnabledRef = useRef(showBlockIds);
  const templateMetadataPlugin = useMemo(
    () =>
      createTemplateMetadataPlugin(() => templateMetadataEnabledRef.current),
    [],
  );
  const blockIdBadgePlugin = useMemo(
    () => createBlockIdBadgePlugin(() => blockIdsEnabledRef.current),
    [],
  );
  const blockIdPlugin = useMemo(() => createBlockIdPlugin(), []);
  const editorHostRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const toolbarRef = useRef<HTMLDivElement | null>(null);
  const hiddenFieldRef = useRef<HTMLTextAreaElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  const [, forceRender] = useReducer((value: number) => value + 1, 0);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    templateMetadataEnabledRef.current = showTemplateHints;
    const view = viewRef.current;
    if (!view) {
      return;
    }
    const tr = view.state.tr.setMeta(templateMetadataPluginKey, {
      type: 'toggle',
    });
    view.dispatch(tr);
  }, [showTemplateHints]);

  useEffect(() => {
    blockIdsEnabledRef.current = showBlockIds;
    const view = viewRef.current;
    if (!view) {
      return;
    }
    const tr = view.state.tr.setMeta(blockIdBadgePluginKey, {
      type: 'toggle',
    });
    view.dispatch(tr);
  }, [showBlockIds]);

  const plugins = useMemo(() => {
    const bulletListType = richTextSchema.nodes.bullet_list;
    const orderedListType = richTextSchema.nodes.ordered_list;
    const paragraphType = richTextSchema.nodes.paragraph;
    const headingType = richTextSchema.nodes.heading;

    const strongMark = richTextSchema.marks.strong;
    const emMark = richTextSchema.marks.em;
    const codeMark = richTextSchema.marks.code;

    const keys: Record<string, Command> = {
      'Mod-b': strongMark ? toggleMark(strongMark) : () => false,
      'Mod-i': emMark ? toggleMark(emMark) : () => false,
      'Mod-`': codeMark ? toggleMark(codeMark) : () => false,
      'Shift-Ctrl-8': toggleListCommand(bulletListType),
      'Shift-Ctrl-9': toggleListCommand(orderedListType),
      'Mod-[': listItemType ? liftListItem(listItemType) : () => false,
      'Mod-]': listItemType ? sinkListItem(listItemType) : () => false,
      'Shift-Ctrl-0': paragraphType ? setBlockType(paragraphType) : () => false,
      'Mod-z': undo,
      'Shift-Mod-z': redo,
      'Mod-y': redo,
      'Shift-Ctrl-t': insertTableCommand,
    };

    if (headingType) {
      keys['Shift-Ctrl-1'] = setBlockType(headingType, { level: 1 });
      keys['Shift-Ctrl-2'] = setBlockType(headingType, { level: 2 });
      keys['Shift-Ctrl-3'] = setBlockType(headingType, { level: 3 });
    }

    if (listItemType) {
      keys.Enter = chainCommands(
        splitListItem(listItemType),
        createParagraphNear,
        liftEmptyBlock,
        splitBlock,
      );
    }

    return [
      blockIdPlugin,
      columnResizing(),
      tableEditing(),
      history(),
      keymap(keys),
      keymap(baseKeymap),
      dropCursor(),
      buildInputRules(),
      templateMetadataPlugin,
      blockIdBadgePlugin,
    ];
  }, [blockIdBadgePlugin, blockIdPlugin, templateMetadataPlugin]);

  useEffect(() => {
    if (!editorHostRef.current) {
      return;
    }

    const state = createEditorState(initialDoc, plugins);
    const view = new EditorView(editorHostRef.current, {
      state,
      editable: () => !disabled,
      attributes: {
        role: 'textbox',
        'aria-multiline': 'true',
        'aria-labelledby': labelId,
        class: 'prose-mirror-editor focus:outline-none',
      },
      clipboardTextSerializer(slice) {
        return serializeSliceToMarkdown(slice);
      },
      dispatchTransaction(tr) {
        const editorView = viewRef.current;
        if (!editorView) {
          return;
        }
        const newState = editorView.state.apply(tr);
        editorView.updateState(newState);
        const serialized = JSON.stringify(newState.doc.toJSON());
        if (hiddenFieldRef.current) {
          hiddenFieldRef.current.value = serialized;
        }
        onChangeRef.current?.(serialized);
        forceRender();
      },
    });

    viewRef.current = view;
    const serialized = JSON.stringify(state.doc.toJSON());
    if (hiddenFieldRef.current) {
      hiddenFieldRef.current.value = serialized;
    }
    onChangeRef.current?.(serialized);

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, [disabled, initialSerialized, labelId, plugins, initialDoc]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) {
      return;
    }
    view.setProps({ editable: () => !disabled });
  }, [disabled]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view || disabled || !autoFocus) {
      return;
    }
    view.focus();
  }, [autoFocus, disabled]);

  const runCommand = useCallback(
    (command: Command, options?: { focusEditor?: boolean }) => {
      const view = viewRef.current;
      if (!view || disabled) {
        return;
      }
      const shouldFocus = options?.focusEditor ?? true;
      if (command(view.state, view.dispatch, view) && shouldFocus) {
        view.focus();
      }
      forceRender();
    },
    [disabled],
  );

  const currentState = viewRef.current?.state ?? null;

  const selectedParagraphMetadata = useMemo(() => {
    if (!currentState) {
      return null;
    }
    const paragraph = findParagraphAtSelection(currentState);
    if (!paragraph) {
      return null;
    }
    const rawTag = paragraph.attrs?.templateTag;
    let templateTag: TemplateSectionTag = 'NONE';
    if (typeof rawTag === 'string') {
      templateTag = TEMPLATE_SECTION_TAG_SET.has(rawTag as TemplateSectionTag)
        ? (rawTag as TemplateSectionTag)
        : 'NONE';
    } else if (rawTag != null) {
      templateTag = 'NONE';
    }
    const templatePrompt =
      typeof paragraph.attrs?.templatePrompt === 'string'
        ? (paragraph.attrs.templatePrompt as string)
        : '';
    return { templateTag, templatePrompt };
  }, [currentState]);

  const applyParagraphAttributes = useCallback(
    (updater: (current: ParagraphTemplateAttrs) => ParagraphTemplateAttrs) => {
      const view = viewRef.current;
      if (!view || disabled) {
        return;
      }
      const paragraphType = view.state.schema.nodes.paragraph;
      if (!paragraphType) {
        return;
      }
      const paragraph = findParagraphAtSelection(view.state);
      if (!paragraph) {
        return;
      }
      const nextAttrs = updater({
        ...(paragraph.attrs as ParagraphTemplateAttrs),
      });
      runCommand(setBlockType(paragraphType, nextAttrs), {
        focusEditor: false,
      });
    },
    [disabled, runCommand],
  );

  const handleTemplateTagChange = useCallback(
    (value: TemplateSectionTag) => {
      applyParagraphAttributes((attrs) => {
        const nextTag = value === 'NONE' ? null : value;
        return {
          ...attrs,
          templateTag: nextTag,
          templatePrompt:
            value === 'PROMPT' ? (attrs.templatePrompt ?? null) : null,
        };
      });
    },
    [applyParagraphAttributes],
  );

  const handleTemplatePromptChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      const { value } = event.target;
      const trimmed = value.trim();
      const hasPrompt = trimmed.length > 0;

      applyParagraphAttributes((attrs) => {
        const currentTag = attrs.templateTag ?? null;
        let nextTag = currentTag;
        if (hasPrompt && !nextTag) {
          nextTag = 'PROMPT';
        }
        if (!hasPrompt && nextTag === 'PROMPT') {
          nextTag = null;
        }
        return {
          ...attrs,
          templateTag: nextTag,
          templatePrompt: hasPrompt ? value : null,
        };
      });
    },
    [applyParagraphAttributes],
  );

  const paragraphTagValue = selectedParagraphMetadata?.templateTag ?? 'NONE';
  const paragraphPromptValue = selectedParagraphMetadata?.templatePrompt ?? '';
  const metadataControlsDisabled = !selectedParagraphMetadata || disabled;

  const toolbarOptions = useMemo(
    () => ({
      showTemplateHints,
      showBlockIds,
    }),
    [showTemplateHints, showBlockIds],
  );

  const toolbarGroups = useMemo(() => {
    const groups: ToolbarButton[][] = [];

    const inTable = currentState ? isInTable(currentState) : false;
    const strongMark = richTextSchema.marks.strong;
    const emMark = richTextSchema.marks.em;
    const codeMark = richTextSchema.marks.code;
    const paragraphType = richTextSchema.nodes.paragraph;
    const headingType = richTextSchema.nodes.heading;
    const bulletListType = richTextSchema.nodes.bullet_list;
    const orderedListType = richTextSchema.nodes.ordered_list;
    const blockquoteType = richTextSchema.nodes.blockquote;

    const formatButtons: ToolbarButton[] = [];
    if (strongMark) {
      formatButtons.push({
        label: 'Bold',
        icon: Bold,
        onClick: () => runCommand(toggleMark(strongMark)),
        isActive: () =>
          !!currentState && isMarkActive(currentState, strongMark),
      });
    }
    if (emMark) {
      formatButtons.push({
        label: 'Italic',
        icon: Italic,
        onClick: () => runCommand(toggleMark(emMark)),
        isActive: () => !!currentState && isMarkActive(currentState, emMark),
      });
    }
    if (codeMark) {
      formatButtons.push({
        label: 'Code',
        icon: Code,
        onClick: () => runCommand(toggleMark(codeMark)),
        isActive: () => !!currentState && isMarkActive(currentState, codeMark),
      });
    }
    if (formatButtons.length > 0) {
      groups.push(formatButtons);
    }

    const headingButtons: ToolbarButton[] = [];
    if (paragraphType) {
      headingButtons.push({
        label: 'Paragraph',
        icon: Pilcrow,
        onClick: () => runCommand(setBlockType(paragraphType)),
        isActive: () =>
          !!currentState &&
          currentState.selection.$from.parent.type === paragraphType,
      });
    }
    if (headingType) {
      const headingIsActive = (level: number) => {
        if (!currentState) {
          return false;
        }
        let active = false;
        currentState.doc.nodesBetween(
          currentState.selection.from,
          currentState.selection.to,
          (node) => {
            if (node.type === headingType && node.attrs.level === level) {
              active = true;
              return false;
            }
            return true;
          },
        );
        return active;
      };

      headingButtons.push({
        label: 'Heading 1',
        icon: Heading1,
        onClick: () => runCommand(setBlockType(headingType, { level: 1 })),
        isActive: () => headingIsActive(1),
      });
      headingButtons.push({
        label: 'Heading 2',
        icon: Heading2,
        onClick: () => runCommand(setBlockType(headingType, { level: 2 })),
        isActive: () => headingIsActive(2),
      });
    }
    if (headingButtons.length > 0) {
      groups.push(headingButtons);
    }

    const listButtons: ToolbarButton[] = [];
    if (bulletListType) {
      listButtons.push({
        label: 'Bulleted list',
        icon: List,
        onClick: () => runCommand(toggleListCommand(bulletListType)),
        isActive: () =>
          !!currentState && isNodeActive(currentState, bulletListType),
      });
    }
    if (orderedListType) {
      listButtons.push({
        label: 'Numbered list',
        icon: ListOrdered,
        onClick: () => runCommand(toggleListCommand(orderedListType)),
        isActive: () =>
          !!currentState && isNodeActive(currentState, orderedListType),
      });
    }
    if (blockquoteType) {
      const toggleBlockquote: Command = (state, dispatch, view) => {
        if (isNodeActive(state, blockquoteType)) {
          if (lift(state, dispatch)) {
            return true;
          }
          if (!paragraphType) {
            return false;
          }
          return setBlockType(paragraphType)(state, dispatch, view);
        }
        return wrapIn(blockquoteType)(state, dispatch, view);
      };

      listButtons.push({
        label: 'Quote',
        icon: Quote,
        onClick: () => runCommand(toggleBlockquote),
        isActive: () =>
          !!currentState && isNodeActive(currentState, blockquoteType),
      });
    }
    if (listButtons.length > 0) {
      groups.push(listButtons);
    }

    const tableButtons: ToolbarButton[] = [];
    if (richTextSchema.nodes.table) {
      tableButtons.push({
        label: 'Insert table',
        icon: Table,
        onClick: () => runCommand(insertTableCommand),
      });
      if (inTable) {
        tableButtons.push({
          label: 'Add row',
          icon: TableRowsSplit,
          iconClassName: 'text-success',
          onClick: () => runCommand(addRowAfter),
        });
        tableButtons.push({
          label: 'Add column',
          icon: TableColumnsSplit,
          iconClassName: 'text-success',
          onClick: () => runCommand(addColumnAfter),
        });
        tableButtons.push({
          label: 'Delete row',
          icon: TableRowsSplit,
          iconClassName: 'text-destructive',
          onClick: () => runCommand(deleteRow),
        });
        tableButtons.push({
          label: 'Delete column',
          icon: TableColumnsSplit,
          iconClassName: 'text-destructive',
          onClick: () => runCommand(deleteColumn),
        });
        tableButtons.push({
          label: 'Delete table',
          icon: Trash2,
          onClick: () => runCommand(deleteTable),
        });
      }
    }
    if (tableButtons.length > 0) {
      groups.push(tableButtons);
    }

    groups.push([
      {
        label: 'Undo',
        icon: Undo2,
        onClick: () => runCommand(undo),
      },
      {
        label: 'Redo',
        icon: Redo2,
        onClick: () => runCommand(redo),
      },
    ]);

    return groups;
  }, [currentState, runCommand]);

  useEffect(() => {
    const container = containerRef.current;
    const toolbar = toolbarRef.current;
    if (!container || !toolbar) {
      return;
    }

    const updateHeight = () => {
      const height = toolbar.getBoundingClientRect().height;
      container.style.setProperty(
        '--template-toolbar-height',
        `${Math.ceil(height)}px`,
      );
    };

    updateHeight();
    const resizeObserver = new ResizeObserver(() => updateHeight());
    resizeObserver.observe(toolbar);

    return () => {
      resizeObserver.disconnect();
    };
  }, [toolbarGroups, toolbarOptions]);

  const handleHostClick = useCallback((event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      viewRef.current?.focus();
    }
  }, []);

  return (
    <div className="space-y-2">
      <FieldLabel htmlFor={id} id={labelId}>
        {label}
      </FieldLabel>
      <div
        ref={containerRef}
        className="border-field focus-within:ring-primary data-[disabled=true]:bg-muted bg-background overflow-hidden rounded-[0.5rem] border shadow transition-[color,box-shadow] focus-within:ring-2 focus-within:ring-inset data-[disabled=true]:opacity-50"
        data-disabled={disabled ? 'true' : 'false'}
      >
        <div
          ref={toolbarRef}
          className="bg-muted/40 border-field flex flex-wrap items-center gap-1 border-b px-2 py-1.5"
        >
          {toolbarGroups.map((group, groupIndex) => (
            <div
              key={`toolbar-group-${groupIndex}`}
              className="flex items-center gap-1"
            >
              {group.map(
                ({
                  label: buttonLabel,
                  icon: Icon,
                  iconClassName,
                  onClick,
                  isActive,
                  disabled: buttonDisabled,
                }) => {
                  const active = isActive ? isActive() : false;
                  const isDisabled = disabled || buttonDisabled;
                  return (
                    <Button
                      key={buttonLabel}
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className={cn(
                        active && 'bg-foreground/10 text-foreground',
                      )}
                      onMouseDown={(event) => {
                        event.preventDefault();
                        if (!isDisabled) {
                          onClick();
                        }
                      }}
                      disabled={isDisabled}
                      aria-pressed={active}
                      aria-label={buttonLabel}
                      title={buttonLabel}
                    >
                      <Icon className={cn('h-4 w-4', iconClassName)} />
                    </Button>
                  );
                },
              )}
              {groupIndex < toolbarGroups.length - 1 ? (
                <div className="bg-border mx-1 h-4 w-px" aria-hidden="true" />
              ) : null}
            </div>
          ))}
          <div
            className="bg-border mx-1 hidden h-4 w-px md:block"
            aria-hidden
          />
          {!hideMetadataFeatures && (
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <fieldset className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={highlightToggleId}
                  className="h-4 w-4"
                  checked={showTemplateHints}
                  onChange={(event) =>
                    setShowTemplateHints(event.target.checked)
                  }
                  disabled={disabled}
                />
                <Label
                  htmlFor={highlightToggleId}
                  className="text-sm font-normal"
                >
                  Highlight metadata
                </Label>
              </fieldset>
              <fieldset className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={blockIdToggleId}
                  className="h-4 w-4"
                  checked={showBlockIds}
                  onChange={(event) => setShowBlockIds(event.target.checked)}
                  disabled={disabled}
                />
                <Label
                  htmlFor={blockIdToggleId}
                  className="text-sm font-normal"
                >
                  Show block IDs
                </Label>
              </fieldset>
              <fieldset className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  id={attributeTagId}
                  checked={showAttributeEditor}
                  onChange={(event) =>
                    setshowAttributeEditor(event.target.checked)
                  }
                  disabled={disabled}
                />
                <Label htmlFor={attributeTagId} className="text-sm font-normal">
                  Show attribute editor
                </Label>
              </fieldset>
            </div>
          )}
        </div>
        {!hideMetadataFeatures && (
          <div className="bg-muted sticky top-[var(--template-toolbar-height,0px)] z-10 space-y-3 border-b px-4 py-3 shadow-sm">
            {showAttributeEditor &&
              (selectedParagraphMetadata ? (
                <div className="grid gap-3 md:grid-cols-[220px,1fr] md:items-start">
                  <div className="space-y-2">
                    <Label htmlFor={templateTagId}>Section expectation</Label>
                    <Select
                      value={paragraphTagValue}
                      onValueChange={(value) =>
                        handleTemplateTagChange(value as TemplateSectionTag)
                      }
                      disabled={metadataControlsDisabled}
                    >
                      <SelectTrigger
                        id={templateTagId}
                        className="h-9 w-full justify-between text-sm"
                      >
                        <SelectValue placeholder="Select expectation" />
                      </SelectTrigger>
                      <SelectContent>
                        {TEMPLATE_SECTION_TAG_VALUES.map((value) => (
                          <SelectItem key={value} value={value}>
                            {TEMPLATE_SECTION_TAG_LABELS[value]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={templatePromptId}>
                      Agent prompt{' '}
                      <span className="text-muted-foreground">(optional)</span>
                    </Label>
                    <Textarea
                      id={templatePromptId}
                      value={paragraphPromptValue}
                      onChange={handleTemplatePromptChange}
                      placeholder="Guidance for the agent when using this section…"
                      disabled={metadataControlsDisabled}
                      rows={3}
                    />
                    <p className="text-muted-foreground text-xs">
                      Prompts are stored with the template and surface only to
                      AI agents.
                    </p>
                  </div>
                </div>
              ) : (
                <Muted>
                  Place the caret inside a paragraph to tag it with expectations
                  or prompts.
                </Muted>
              ))}
          </div>
        )}
        <div
          className="ProseMirror prose prose-sm dark:prose-invert text-foreground min-h-[200px] w-full max-w-none p-4 leading-6 focus:outline-none [&>:first-child]:!mt-0 [&>:last-child]:!mb-0"
          ref={editorHostRef}
          data-placeholder={placeholder ?? ''}
          onClick={handleHostClick}
        />
      </div>
      <textarea
        ref={hiddenFieldRef}
        name={name}
        id={id}
        hidden
        readOnly
        required={required}
        defaultValue={initialSerialized}
        aria-hidden="true"
        tabIndex={-1}
      />
      {errorMessage ? (
        <p className="text-destructive text-sm">{errorMessage}</p>
      ) : null}
    </div>
  );
}
