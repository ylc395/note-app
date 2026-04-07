// import { createEffect, onCleanup, untrack } from 'solid-js';
// import assert from 'assert';
// import { useContext } from './context';

// export default function TextLayer(props: { page: number }) {
//   const {
//     viewer: { viewer, editor },
//   } = useContext()!;

//   createEffect(() => {
//     const textLayerEl = viewer.getPageTextLayerElement(props.page);
//     const texts = editor.texts.pageTexts.get(props.page);

//     if (!textLayerEl || !texts?.blocks || textLayerEl.dataset.ocrText) {
//       return;
//     }

//     const { width: pageWidth, height: pageHeight } = viewer.getPageInfo(props.page);
//     const lineDoms: Array<{ el: HTMLElement; baseline: number }> = [];

//     for (const { paragraphs } of texts.blocks) {
//       for (const { lines } of paragraphs) {
//         for (const { bbox, text, confidence, baseline } of lines) {
//           if (confidence < 40) {
//             continue;
//           }

//           const lineDom = document.createElement('span');
//           const baselineRatio = (bbox.y1 - (baseline.y1 + baseline.y0) / 2) / (bbox.y1 - bbox.y0);

//           lineDom.innerText = text.trim();
//           lineDom.style.left = `${(bbox.x0 / pageWidth) * 100}%`;
//           lineDom.style.top = `${(bbox.y0 / pageHeight) * 100}%`;
//           lineDom.style.height = `${((bbox.y1 - bbox.y0) / pageHeight) * 100}%`;
//           lineDom.style.width = `${((bbox.x1 - bbox.x0) / pageWidth) * 100}%`;
//           lineDom.style.textAlignLast = 'justify';

//           lineDoms.push({ el: lineDom, baseline: baselineRatio });
//         }
//       }
//     }

//     const endOfContent = textLayerEl.querySelector('.endOfContent');
//     assert(endOfContent);

//     for (const { el } of lineDoms) {
//       textLayerEl.insertBefore(el, endOfContent);
//     }

//     const resizeObserver = new ResizeObserver(() => {
//       for (const { el, baseline } of lineDoms) {
//         assert(el instanceof HTMLElement);
//         el.style.fontSize = `${el.clientHeight * (1 - baseline)}px`;
//       }
//     });

//     resizeObserver.observe(textLayerEl);
//     textLayerEl.dataset.ocrText = 'true';

//     untrack(() => {
//       viewer.eventBus.dispatch(Events.CustomTextLayerRendered, { page: props.page });
//     });

//     onCleanup(() => {
//       resizeObserver.disconnect();
//     });
//   });

//   // 复用 pdfjs 自己渲染的 textLayer 元素，我们就不渲染实际的元素了
//   return null;
// }
