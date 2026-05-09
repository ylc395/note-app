import z from 'zod';
import { createQuery } from 'mobx-tanstack-query/preset';
import { when } from 'mobx';
import { Decoration, DecorationSet } from '@milkdown/kit/prose/view';
import { Plugin, PluginKey } from '@milkdown/kit/prose/state';
import { $prose } from '@milkdown/kit/utils';
import { linkSchema } from '@milkdown/kit/preset/commonmark';
import { render } from 'solid-js/web';
import type { Query } from 'mobx-tanstack-query';

import container from '#utils/singletonContainer';
import { token as remoteToken } from '#domain/client/shared/infra/rpc';
import { token as documentDbToken } from '#domain/client/shared/infra/documentDb';
import { remoteIconStoreName } from '#domain/client/app/model/note/editor/BaseEditor';
import { parseAppUrl, toEntityType } from '#domain/shared/infra/url';
import entitySourceFactory from '#domain/client/app/model/entitySourceFactory';
import type { EntitySource } from '#domain/client/app/model/base/entitySource';
import IconComponent from '#web/view/components/Icon';

import './style.css';
import { GlobeIcon } from 'lucide-solid';

const pluginKey = new PluginKey<Map<string, LinkIconInfo>>('LINK_ICON');

interface LinkIconInfo {
  entitySource: EntitySource | null;
  iconQuery?: Query<Blob | null>; // entitySource 和 iconQuery 只会有一个
  abortController: AbortController;
}

/**
 * 为 link 节点渲染装饰性图标 Widget。
 */
export const linkIconPlugin = $prose((ctx) => {
  const linkType = linkSchema.type(ctx);

  return new Plugin({
    key: pluginKey,
    state: {
      init() {
        return new Map<string, LinkIconInfo>();
      },
      apply(tr, cache, _oldState, newState) {
        if (!tr.docChanged) {
          return cache;
        }

        // 收集当前文档中所有 link href
        const activeUrls = new Set<string>();
        newState.doc.descendants((node) => {
          const linkMark = node.marks.find((m) => m.type === linkType);
          if (linkMark) {
            activeUrls.add(linkMark.attrs.href as string);
          }
        });

        // 清理已不存在的 link 的缓存
        for (const href of cache.keys()) {
          if (!activeUrls.has(href)) {
            const entry = cache.get(href)!;
            entry.abortController.abort();
            cache.delete(href);
          }
        }

        return cache;
      },
    },
    props: {
      decorations(state) {
        const cache = pluginKey.getState(state)!;
        const decorations: Decoration[] = [];

        state.doc.descendants((node, pos) => {
          const linkMark = node.marks.find((m) => m.type === linkType);
          if (!linkMark) return;

          const href = linkMark.attrs.href as string;

          // 检查前一个相邻节点是否有相同链接，有则跳过（去重）
          const $pos = state.doc.resolve(pos);
          const nodeBefore = $pos.nodeBefore;
          const prevHasSameLink =
            nodeBefore && nodeBefore.marks.some((m) => m.type === linkType && m.attrs.href === href);

          if (prevHasSameLink) return;

          // 从缓存获取或创建 entitySource / iconQuery
          const entry = getOrCreateCacheEntry(cache, href);

          decorations.push(
            Decoration.widget(
              pos,
              (_view, _getPos) => {
                const wrapper = document.createElement('span');
                wrapper.className = 'link-icon-widget';
                wrapper.contentEditable = 'false';

                renderLinkIcon(wrapper, entry);
                return wrapper;
              },
              {
                side: 0,
                ignoreSelection: true,
              },
            ),
          );
        });

        return DecorationSet.create(state.doc, decorations);
      },
    },
  });
});

/**
 * 从缓存获取或创建 LinkIconCacheEntry。
 * 以 href 为 key，确保同一 URL 只创建一次 entitySource / iconQuery。
 */
function getOrCreateCacheEntry(cache: Map<string, LinkIconInfo>, href: string) {
  const existing = cache.get(href);
  if (existing) return existing;

  const appUrl = parseAppUrl(href);
  const entityType = appUrl && toEntityType(appUrl.type);
  const abortController = new AbortController();

  let entitySource: EntitySource | null = null;
  let iconQuery;

  if (entityType) {
    entitySource = entitySourceFactory(entityType, appUrl!.id, abortController.signal);
  } else {
    // 外部链接：创建 iconQuery
    const remote = container.resolve(remoteToken);
    const db = container.resolve(documentDbToken);

    iconQuery = createQuery(
      async ({ signal }) => {
        const localResult = await db.getByKey(
          remoteIconStoreName,
          href,
          z.object({ data: z.instanceof(Blob), createdAt: z.number() }),
        );

        if (localResult) {
          return localResult.data;
        }

        const result = await remote.file.queryIcon.query(href, { signal });

        if (!result) {
          return null;
        }

        const blob = new Blob([result as ArrayBuffer]);

        await db.put(remoteIconStoreName, {
          url: href,
          data: blob,
          createdAt: Date.now(),
        });

        return blob;
      },
      {
        queryKey: ['link-icon', { url: href }] as readonly unknown[],
        abortSignal: abortController.signal,
      },
    );
  }

  const entry = { entitySource, iconQuery, abortController };
  cache.set(href, entry);

  return entry;
}

/**
 * 使用 SolidJS render 将图标挂载到指定容器。
 *
 * 两条路径：
 * 1. 有 entitySource（内部链接）→ 使用 <Icon> 组件渲染 entitySource.icon/mimeType
 * 2. 无 entitySource（外部 URL）→ 使用缓存的 iconQuery，异步渲染 Blob 图标
 */
function renderLinkIcon(domContainer: HTMLElement, entry: LinkIconInfo) {
  if (entry.entitySource) {
    // 内部链接：使用 entitySource 的 icon 和 mimeType
    render(
      () => <IconComponent icon={entry.entitySource!.icon} mimeType={entry.entitySource!.mimeType} />,
      domContainer,
    );
    return;
  }

  // 外部链接：使用缓存的 iconQuery
  const iconQuery = entry.iconQuery!;
  let blobUrl: string | undefined;

  when(
    () => iconQuery.isSuccess,
    () => {
      if (iconQuery.data instanceof Blob) {
        blobUrl = URL.createObjectURL(iconQuery.data);
        domContainer.innerHTML = '';
        const img = document.createElement('img');
        img.src = blobUrl;
        img.alt = '';
        domContainer.appendChild(img);
        return;
      }

      // 无图标数据，渲染默认图标
      render(() => <GlobeIcon />, domContainer);
    },
    { signal: entry.abortController.signal },
  );

  entry.abortController.signal.addEventListener('abort', () => {
    if (blobUrl) {
      URL.revokeObjectURL(blobUrl);
    }
  });
}
