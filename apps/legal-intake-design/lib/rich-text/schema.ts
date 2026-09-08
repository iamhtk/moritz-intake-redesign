import type OrderedMap from 'orderedmap';
import { Schema, type NodeSpec } from 'prosemirror-model';
import { schema as basicSchema } from 'prosemirror-schema-basic';
import { addListNodes } from 'prosemirror-schema-list';
import { tableNodes } from 'prosemirror-tables';
import {
  emDash,
  ellipsis,
  inputRules,
  smartQuotes,
  textblockTypeInputRule,
} from 'prosemirror-inputrules';
import { BLOCK_NODE_NAMES } from '@/lib/rich-text/block-ids';

const tableNodeSpecs = tableNodes({
  tableGroup: 'block',
  cellContent: 'block+',
  cellAttributes: {},
});

const baseParagraphSpec = basicSchema.spec.nodes.get('paragraph');
const paragraphNodeSpec: NodeSpec | null = baseParagraphSpec
  ? {
      ...baseParagraphSpec,
      attrs: {
        ...baseParagraphSpec.attrs,
        templateTag: { default: null },
        templatePrompt: { default: null },
        blockId: { default: null },
      },
    }
  : null;

const nodesWithListsAndTables = addListNodes(
  (paragraphNodeSpec
    ? basicSchema.spec.nodes.update('paragraph', paragraphNodeSpec)
    : basicSchema.spec.nodes
  ).append(withBlockIdAttrs(tableNodeSpecs)),
  'paragraph block*',
  'block',
);

const nodes = addBlockIdAttrs(nodesWithListsAndTables);

export const richTextSchema = new Schema({
  nodes,
  marks: basicSchema.spec.marks,
});

export const listItemType = richTextSchema.nodes.list_item;

export function buildInputRules() {
  const rules = smartQuotes.concat(ellipsis, emDash);
  const heading = richTextSchema.nodes.heading;
  if (heading) {
    rules.push(
      textblockTypeInputRule(/^(#{1,6})\s$/, heading, (match) => {
        const hashes = match[1];
        return { level: typeof hashes === 'string' ? hashes.length : 1 };
      }),
    );
  }
  return inputRules({ rules });
}

function withBlockIdAttrs(
  specs: Record<string, NodeSpec>,
): Record<string, NodeSpec> {
  return Object.fromEntries(
    Object.entries(specs).map(([name, spec]) => [
      name,
      addBlockIdAttr(spec, BLOCK_NODE_NAMES.has(name)),
    ]),
  );
}

function addBlockIdAttrs(map: OrderedMap<NodeSpec>): OrderedMap<NodeSpec> {
  let current = map;
  for (const name of BLOCK_NODE_NAMES) {
    const spec = current.get(name);
    if (spec) {
      current = current.update(name, addBlockIdAttr(spec, true));
    }
  }
  return current;
}

function addBlockIdAttr(spec: NodeSpec, shouldAdd: boolean): NodeSpec {
  if (!shouldAdd) {
    return spec;
  }
  return {
    ...spec,
    attrs: {
      ...(spec.attrs ?? {}),
      blockId: { default: null },
    },
  };
}
