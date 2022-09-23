import type { NodeWithPos } from "@milkdown/prose";

enum BlockType {
  Heading1 = 'Heading1',
  Heading2 = 'Heading2',
  Heading3 = 'Heading3',
  Heading4 = 'Heading4',
  Heading5 = 'Heading5',
  Heading6 = 'Heading6',
  Paragraph = 'Paragraph',
  UnorderedList = 'UnorderedList',
  OrderedList = 'OrderedList',
  CodeBlock = 'CodeBlock',
  BlockQuote = 'BlockQuote',
  Table = 'Table',
}



export default class Block {
  readonly id: string;
  readonly type: BlockType;
  readonly node: NodeWithPos;
  readonly referrers: Block['id'][];
}