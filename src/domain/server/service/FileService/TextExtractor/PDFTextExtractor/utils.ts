import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import path from 'node:path';
export function getDoc(data: ArrayBuffer) {
  // warning: pdf.js 在 node 环境里没有多线程解析 PDF 文档的能力，一切都发生在主线程里（所谓的 fake worker）
  return pdfjs.getDocument({
    data: new Uint8Array(data.slice(0)),
    cMapUrl: path.resolve('node_modules/pdfjs-dist/cmaps') + '/',
    standardFontDataUrl: path.resolve('node_modules/pdfjs-dist/standard_fonts') + '/',
    cMapPacked: true,
  }).promise;
}
