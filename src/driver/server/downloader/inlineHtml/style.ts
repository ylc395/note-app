import { generate, parse, walk, type ParseOptions } from 'css-tree';
import type { CheerioAPI } from 'cheerio';
import { als, isLocalUrl } from './utils';

async function transformStyleText(
  styleText: string,
  options?: { context?: ParseOptions['context']; baseUrl?: string },
) {
  const { urlToDataUrl, baseUrl: htmlBaseUrl } = als.getStore()!;
  const ast = parse(styleText, {
    context: options?.context,
    parseCustomProperty: true, // 自定义属性（CSS 变量）里，常常会有 url()，需要解析器正常解析
  });
  const urls: string[] = [];
  const baseUrl = options?.baseUrl || htmlBaseUrl;

  walk(ast, function (node) {
    if (node.type === 'Atrule' && node.name === 'import') {
      // todo: 处理 @import 语句
      return this.skip;
    }

    if (node.type === 'Url' && !isLocalUrl(node.value)) {
      urls.push(node.value);
    }
  });

  if (urls.length === 0) {
    return styleText;
  }

  const urlMap: Record<string, string> = {};

  await Promise.all(
    urls.map(async (url) => {
      urlMap[url] = await urlToDataUrl(new URL(url, baseUrl).href);
    }),
  );

  walk(ast, {
    visit: 'Url',
    leave: (node) => {
      node.value = urlMap[node.value] || node.value;
    },
  });

  const localStyleText = generate(ast);
  return localStyleText;
}

async function processHtmlStyle($: CheerioAPI) {
  const elementsWithStyle = $('[style]');

  await Promise.all(
    elementsWithStyle.map(async (_, el) => {
      const $el = $(el);
      const styleText = $el.attr('style');

      if (!styleText) {
        return;
      }

      const localStyleText = await transformStyleText(styleText, { context: 'declarationList' });
      $el.attr('style', localStyleText);
    }),
  );
}

async function processStyle($: CheerioAPI) {
  const styles = $('style');

  await Promise.all(
    styles.map(async (_, el) => {
      const $el = $(el);
      const styleText = $el.text();
      const localStyleText = await transformStyleText(styleText);

      $el.text(localStyleText);
    }),
  );
}

export async function processExternalStyle($: CheerioAPI) {
  const styles = $('link[rel="stylesheet"][href]');

  await Promise.all(
    styles.map(async (_, el) => {
      const $el = $(el);
      const href = $el.attr('href');

      if (!href || isLocalUrl(href)) {
        return;
      }

      const url = $el.prop('href');

      if (url) {
        const res = await fetch(url);

        if (res.ok) {
          const styleText = await res.text();
          const localStyleText = await transformStyleText(styleText, { baseUrl: url });
          const $styleEl = $('<style></style>').text(localStyleText).data('data-origin-href', url);

          $el.replaceWith($styleEl);
        }
      }
    }),
  );
}

export async function processStyles($: CheerioAPI) {
  await Promise.all([processStyle($), processHtmlStyle($)]);
  await processExternalStyle($); // 这个最后进行，免得 style 被重复处理
}
