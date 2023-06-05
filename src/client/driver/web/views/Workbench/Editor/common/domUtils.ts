export const isTextNode = (node: Node): node is Text => node.nodeType === document.TEXT_NODE;

export const isElement = (node: Node): node is HTMLElement => node.nodeType === document.ELEMENT_NODE;

export const isVisible = (node: Node) =>
  isElement(node) ? node === document.body || Boolean(node.offsetParent) : Boolean(node.parentElement?.offsetParent);
