export function isFullyVisible(dom: HTMLElement) {
  if (!dom.parentElement) {
    return false;
  }

  const parentRect = dom.parentElement.getBoundingClientRect();
  const domRect = dom.getBoundingClientRect();

  return (
    domRect.left >= parentRect.left &&
    domRect.right <= parentRect.right &&
    domRect.top >= parentRect.top &&
    domRect.bottom <= parentRect.bottom
  );
}

export function findAncestor(element: HTMLElement, until: (el: HTMLElement) => boolean) {
  let parent: HTMLElement | null = element;

  // eslint-disable-next-line no-cond-assign
  while ((parent = parent.parentElement)) {
    if (until(parent)) {
      return parent;
    }
  }

  return null;
}
