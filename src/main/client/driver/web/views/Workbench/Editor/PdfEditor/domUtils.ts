export const isTextNode = (node: Node): node is Text => node.nodeType === document.TEXT_NODE;

export const isElement = (node: Node): node is HTMLElement => node.nodeType === document.ELEMENT_NODE;

const isVisible = (node: Node) =>
  isElement(node) ? node === document.body || Boolean(node.offsetParent) : Boolean(node.parentElement?.offsetParent);

// when double click an element to select text, `endOffset` often comes with 0 and `endContainer` is not correct
// we should find the right endContainer
export const getValidEndContainer = (range: Range) => {
  const SUSPICIOUS_EMPTY_STRING_REGEX = /^\s{5,}$/;

  if (range.endOffset !== 0) {
    return range.endContainer;
  }

  const walker = document.createTreeWalker(range.commonAncestorContainer);
  let currentNode: Node | null = walker.currentNode;
  let textNode: Text | undefined | null = null;

  while (currentNode) {
    if (currentNode === range.endContainer) {
      break;
    }

    if (
      range.startContainer === currentNode ||
      range.startContainer.compareDocumentPosition(currentNode) & Node.DOCUMENT_POSITION_FOLLOWING
    ) {
      if (isElement(currentNode) && !isVisible(currentNode)) {
        currentNode = walker.nextSibling();

        if (!currentNode) {
          walker.parentNode();
          currentNode = walker.nextSibling();
        }

        continue;
      }

      if (isTextNode(currentNode) && currentNode.textContent) {
        if (SUSPICIOUS_EMPTY_STRING_REGEX.test(currentNode.textContent)) {
          break;
        }

        if (currentNode.textContent.length > 0) {
          textNode = currentNode;
        }
      }
    }

    currentNode = walker.nextNode();
  }

  return textNode || range.endContainer;
};
