// https://gist.github.com/hsablonniere/2581101?permalink_comment_id=4171389#gistcomment-4171389
export default function scrollIntoViewIfNeeded(dom: HTMLElement, centerIfNeeded = true) {
  if ('scrollIntoViewIfNeeded' in Element.prototype && typeof Element.prototype.scrollIntoViewIfNeeded === 'function') {
    return Element.prototype.scrollIntoViewIfNeeded.call(dom, centerIfNeeded);
  }

  new IntersectionObserver(function (this: IntersectionObserver, [entry]) {
    const ratio = entry!.intersectionRatio;
    if (ratio < 1) {
      const place = ratio <= 0 && centerIfNeeded ? 'center' : 'nearest';
      dom.scrollIntoView({
        block: place,
        inline: place,
      });
    }
    this.disconnect();
  }).observe(dom);
}
