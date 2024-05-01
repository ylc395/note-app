// https://gist.github.com/hsablonniere/2581101
export default function scrollIntoViewIfNeeded(dom: HTMLElement, centerIfNeeded = true) {
  if ('scrollIntoViewIfNeeded' in Element.prototype && typeof Element.prototype.scrollIntoViewIfNeeded === 'function') {
    return Element.prototype.scrollIntoViewIfNeeded.call(dom, centerIfNeeded);
  }

  const parent = dom.parentNode;

  if (!(parent instanceof HTMLElement)) {
    return;
  }

  const parentComputedStyle = window.getComputedStyle(parent, null);
  const parentBorderTopWidth = parseInt(parentComputedStyle.getPropertyValue('border-top-width'));
  const parentBorderLeftWidth = parseInt(parentComputedStyle.getPropertyValue('border-left-width'));
  const overTop = dom.offsetTop - parent.offsetTop < parent.scrollTop;
  const overBottom =
    dom.offsetTop - parent.offsetTop + dom.clientHeight - parentBorderTopWidth > parent.scrollTop + parent.clientHeight;
  const overLeft = dom.offsetLeft - parent.offsetLeft < parent.scrollLeft;
  const overRight =
    dom.offsetLeft - parent.offsetLeft + dom.clientWidth - parentBorderLeftWidth >
    parent.scrollLeft + parent.clientWidth;
  const alignWithTop = overTop && !overBottom;

  if ((overTop || overBottom) && centerIfNeeded) {
    parent.scrollTop =
      dom.offsetTop - parent.offsetTop - parent.clientHeight / 2 - parentBorderTopWidth + dom.clientHeight / 2;
  }

  if ((overLeft || overRight) && centerIfNeeded) {
    parent.scrollLeft =
      dom.offsetLeft - parent.offsetLeft - parent.clientWidth / 2 - parentBorderLeftWidth + dom.clientWidth / 2;
  }

  if ((overTop || overBottom || overLeft || overRight) && !centerIfNeeded) {
    dom.scrollIntoView(alignWithTop);
  }
}
