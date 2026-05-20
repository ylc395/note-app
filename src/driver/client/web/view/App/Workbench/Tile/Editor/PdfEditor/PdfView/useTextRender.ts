import { createEffect, createSignal } from 'solid-js';
import { sum } from 'lodash-es';

import { IS_DEV } from '#domain/shared/infra/env';
import { useContext } from '../context';

// 复用同一个 canvas context，避免反复创建
const canvasCtx = document.createElement('canvas').getContext('2d')!;

/**
 * 使用 Canvas API 测量文本，返回能放入指定宽高的最大 font-size（单位：px）。
 * 纵向以容器高度为基准估算字号，横向若溢出则按比例缩小。
 */
function calcFontSizePx(text: string, fontFamily: string, domW: number, domH: number): number {
  // 以容器高度的 85% 作为初始字号（行高通常略大于字号）
  let fontSize = domH * 0.85;

  canvasCtx.font = `${fontSize}px ${fontFamily}`;
  const textWidth = canvasCtx.measureText(text).width;

  // 若文字宽度超出容器宽度，按比例缩小字号
  if (textWidth > domW && textWidth > 0) {
    fontSize = fontSize * (domW / textWidth);
  }

  return fontSize;
}

interface Bbox {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

interface OcrSymbol {
  confidence: number;
  text: string;
  bbox: Bbox;
}

/**
 * 检测一行 symbol 序列中是否存在相邻 symbol 间的位置大跳跃。
 */
function processSymbol(symbols: OcrSymbol[], lineWidth: number) {
  if (IS_DEV) {
    console.debug(
      symbols.map((s) => s.text).join(''),
      symbols.map(({ text, bbox, confidence }, i) => ({
        text,
        bbox,
        width: bbox.x1 - bbox.x0,
        guessWidth: symbols[i + 1] ? symbols[i + 1]!.bbox.x0 - bbox.x0 : Infinity,
        confidence,
      })),
      lineWidth,
    );
  }

  const widths: number[] = [];
  const result = symbols.map((s, i) => {
    // 有的 symbol 的 bbox 宽度不准确，必须通过下一个 symbol 的 bbox.x0 - s.bbox.x0 计算
    const width = Math.min(s.bbox.x1 - s.bbox.x0, symbols[i + 1] ? symbols[i + 1]!.bbox.x0 - s.bbox.x0 : Infinity);
    widths.push(width);
    return { ...s, bbox: { ...s.bbox, x1: s.bbox.x0 + width } };
  });

  const widthSum = sum(widths);
  const midWidth = widths.sort((a, b) => a - b)[Math.floor(widths.length / 2)]!; // 字符宽度的中位数
  const avgWidth = widthSum / widths.length; // 字符宽度的平均数

  if (
    (lineWidth - widthSum) / lineWidth > 0.5 || // 字符宽度之和远小于行宽
    result.some((s) => {
      const width = s.bbox.x1 - s.bbox.x0;
      const result = width > avgWidth * 5 || width > midWidth * 10; // 单个字符的宽度显然过长
      return result;
    })
  ) {
    if (IS_DEV) {
      console.debug({ lineWidth, widthSum, midWidth, avgWidth });
    }
    return result;
  }

  return null;
}

/**
 * 将一个文本区域的样式应用到 span 上（位置、尺寸、字体）。
 * 所有尺寸均使用 cqh/%，随容器自适应缩放。
 */
function createElement(
  text: string,
  bbox: Bbox,
  pageWidth: number,
  pageHeight: number,
  layerH: number,
  fontFamily: string,
  layerW: number,
) {
  const el = document.createElement('span');
  el.innerText = text;

  const domW = ((bbox.x1 - bbox.x0) / pageWidth) * layerW;
  const domH = ((bbox.y1 - bbox.y0) / pageHeight) * layerH;
  const fontSizePx = calcFontSizePx(el.innerText, fontFamily, domW, domH);

  el.style.left = `${(bbox.x0 / pageWidth) * 100}%`;
  el.style.top = `${(bbox.y0 / pageHeight) * 100}%`;
  el.style.height = `${((bbox.y1 - bbox.y0) / pageHeight) * 100}%`;
  el.style.width = `${((bbox.x1 - bbox.x0) / pageWidth) * 100}%`;
  el.style.fontSize = `${(fontSizePx / layerH) * 100}cqh`;
  el.style.lineHeight = `${((bbox.y1 - bbox.y0) / pageHeight) * 100}cqh`;
  el.style.textAlignLast = 'justify';

  return el;
}

// 文字层就不做成组件了，一次性渲染，没有必要
export default function useTextRender() {
  const textLayers = new WeakSet<HTMLElement>();
  const [textRenderedPages, setTextRenderedPages] = createSignal<number[]>([]);

  // todo: 当前的算法没处理好文字 + 漂浮图片的排版。例子：代码整洁之道 P71
  createEffect(() => {
    const {
      viewer: { viewer, editor },
    } = useContext()!;

    const pages = viewer.visiblePages.map((page) => ({
      page,
      text: editor.texts.loadPageText(page),
    }));

    for (const { page, text } of pages) {
      const { width: pageWidth, height: pageHeight, textLayer } = viewer.getPageInfo(page);

      if (!textLayer || textLayers.has(textLayer) || !text.data) {
        continue;
      }

      const layerW = textLayer.clientWidth;
      const layerH = textLayer.clientHeight;
      const fontFamily = getComputedStyle(textLayer).fontFamily || 'sans-serif';
      const lineDoms: HTMLElement[] = [];

      for (const { paragraphs } of text.data.blocks || []) {
        for (const { lines } of paragraphs) {
          for (const { bbox, text, confidence, words } of lines) {
            const trimmed = text.trim();

            if (!trimmed) {
              continue;
            }

            const symbols = words.flatMap((w) => w.symbols);
            const processedSymbol = processSymbol(symbols, bbox.x1 - bbox.x0);

            if (processedSymbol) {
              for (const sym of processedSymbol) {
                const symTrimmed = sym.text.trim();

                if (!symTrimmed || sym.confidence < 40) {
                  continue;
                }

                const symDom = createElement(symTrimmed, sym.bbox, pageWidth, pageHeight, layerH, fontFamily, layerW);
                symDom.dataset.renderBy = 'symbol';
                lineDoms.push(symDom);
              }
            } else {
              if (confidence < 40) {
                continue;
              }
              const lineDom = createElement(trimmed, bbox, pageWidth, pageHeight, layerH, fontFamily, layerW);
              lineDom.dataset.renderBy = 'line';

              lineDoms.push(lineDom);
            }
          }
        }
      }

      const endOfContent = textLayer.querySelector('.endOfContent');

      if (!endOfContent) {
        // 理论上如果滚动太快，有时会没有 endOfContent 元素。但后来给 visiblePages 加了 debounce，应该不会有这种情况了
        return;
      }

      for (const lineEl of lineDoms) {
        textLayer.insertBefore(lineEl, endOfContent);
      }

      textLayers.add(textLayer);
    }

    setTextRenderedPages(
      pages
        .filter(({ page }) => {
          const textLayer = viewer.getPageInfo(page).textLayer;
          return textLayer && textLayers.has(textLayer);
        })
        .map(({ page }) => page),
    );
  });

  return textRenderedPages;
}
