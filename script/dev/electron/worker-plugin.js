import MagicString from 'magic-string';
import path from 'node:path';

const nodeWorkerAssetUrlRE = /__VITE_NODE_WORKER_ASSET__([\w$]+)__/g;
const nodeWorkerRE = /\?nodeWorker(?:&|$)/;
const nodeWorkerImporterRE = /(?:\?)nodeWorker&importer=([^&]+)(?:&|$)/;

const queryRE = /\?.*$/s;
const hashRE = /#.*$/s;

const cleanUrl = (url) => url.replace(hashRE, '').replace(queryRE, '');

function toRelativePath(filename, importer) {
  const relPath = path.posix.relative(path.dirname(importer), filename);
  return relPath.startsWith('.') ? relPath : `./${relPath}`;
}

/**
 * Resolve `?nodeWorker` import and automatically generate `Worker` wrapper.
 * 直接复制了 https://github.com/alex8088/electron-vite/blob/master/src/plugins/worker.ts
 */
export default function workerPlugin() {
  return {
    name: 'vite:node-worker',
    apply: 'build',
    enforce: 'pre',
    resolveId(id, importer) {
      if (id.endsWith('?nodeWorker')) {
        return id + `&importer=${importer}`;
      }
    },
    load(id) {
      if (nodeWorkerRE.test(id)) {
        const match = nodeWorkerImporterRE.exec(id);
        if (match) {
          const hash = this.emitFile({
            type: 'chunk',
            id: cleanUrl(id),
            importer: match[1],
          });
          const assetRefId = `__VITE_NODE_WORKER_ASSET__${hash}__`;
          return `
          import { Worker } from 'node:worker_threads';
          export default function (options) { return new Worker(new URL(${assetRefId}, import.meta.url), options); }`;
        }
      }
    },
    renderChunk(code, chunk, { sourcemap }) {
      let match;
      let s;

      nodeWorkerAssetUrlRE.lastIndex = 0;
      while ((match = nodeWorkerAssetUrlRE.exec(code))) {
        s ||= new MagicString(code);
        const [full, hash] = match;
        const filename = this.getFileName(hash);
        const outputFilepath = toRelativePath(filename, chunk.fileName);
        const replacement = JSON.stringify(outputFilepath);
        s.overwrite(match.index, match.index + full.length, replacement, {
          contentOnly: true,
        });
      }

      if (s) {
        return {
          code: s.toString(),
          map: sourcemap ? s.generateMap({ hires: 'boundary' }) : null,
        };
      }

      return null;
    },
  };
}
