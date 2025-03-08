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
