import z from 'zod';
import { File, Lightbulb, MessageSquare, NotebookText, createElement } from 'lucide';
import { createQuery } from 'mobx-tanstack-query/preset';
import { when } from 'mobx';
import { Plugin, PluginKey } from '@milkdown/kit/prose/state';
import type { EditorView } from '@milkdown/kit/prose/view';
import { $prose } from '@milkdown/kit/utils';
import { linkSchema } from '@milkdown/kit/preset/commonmark';
import type { Ctx } from '@milkdown/kit/ctx';

import container from '#utils/singletonContainer';
import { token as remoteToken } from '#domain/client/shared/infra/rpc';
import { RouteTypes } from '#domain/shared/infra/url';
import { token as documentDbToken } from '#domain/client/shared/infra/documentDb';
import { remoteIconStoreName } from '#domain/client/app/model/note/editor/BaseEditor';
import type { NoteVO } from '#domain/shared/model/note';

import './style.css';

type IconData = Partial<Pick<NoteVO, 'icon' | 'mimeType'>> & { type: RouteTypes };

/**
 * 为 link DOM 设置图标：设置 data-link-icon 属性、查询并渲染图标内容（CSS 变量 --icon-content）
 */
export function setupLinkIcon(linkDom: HTMLAnchorElement, localIcon?: IconData | null) {
  linkDom.dataset.linkIcon = 'true';

  const remote = container.resolve(remoteToken);
  const db = container.resolve(documentDbToken);
  const url = linkDom.href;
  const abortController = new AbortController();

  const icon = createQuery<IconData | Blob | null>(
    async ({ signal }) => {
      if (localIcon) {
        return localIcon;
      }

      const localResult = await db.getByKey(
        remoteIconStoreName,
        url,
        z.object({ data: z.instanceof(Blob), createdAt: z.number() }),
      );

      if (localResult) {
        return localResult.data;
      }

      const result = await remote.file.queryIcon.query(url, { signal });

      if (!result) {
        return null;
      }

      const blob = new Blob([result as ArrayBuffer]);

      await db.put(remoteIconStoreName, {
        url: url,
        data: blob,
        createdAt: Date.now(),
      });

      return blob;
    },
    { queryKey: ['link-icon', { url }], abortSignal: abortController.signal },
  );

  let blobUrl: string | undefined;

  when(
    () => icon.isSuccess,
    () => {
      if (icon.data instanceof Blob) {
        blobUrl = URL.createObjectURL(icon.data);
        linkDom.style.setProperty('--icon-content', `url(${blobUrl})`);
        return;
      }

      let iconElement: ReturnType<typeof createElement> | undefined;

      if (icon.data?.type === RouteTypes.Note) {
        iconElement = createElement(NotebookText);
      }

      if (icon.data?.type === RouteTypes.Memo) {
        iconElement = createElement(Lightbulb);
      }

      if (icon.data?.type === RouteTypes.Annotation) {
        iconElement = createElement(MessageSquare);
      }

      if (icon.data?.type === RouteTypes.File) {
        iconElement = createElement(File);
      }

      if (iconElement) {
        linkDom.style.setProperty(
          '--icon-content',
          `url(data:image/svg+xml,${encodeURIComponent(iconElement.outerHTML)})`,
        );
      }
    },
    { signal: abortController.signal },
  );

  return () => {
    abortController.abort();

    if (blobUrl) {
      URL.revokeObjectURL(blobUrl);
    }
  };
}

const pluginKey = new PluginKey('LINK_ICON');

/**
 * 控制图标是否可见
 * 当相邻节点拥有相同链接时隐藏重复图标
 */
function updateLinkIconAttrs(view: EditorView, ctx: Ctx) {
  const linkType = linkSchema.type(ctx);
  const doc = view.state.doc;
  const anchors = view.dom.getElementsByTagName('a');

  for (const anchor of anchors) {
    const pos = view.posAtDOM(anchor, 0);
    const $pos = doc.resolve(pos);
    const nodeAfter = $pos.nodeAfter;
    const nodeBefore = $pos.nodeBefore;

    const currentLinkMark = nodeAfter?.marks.find((m) => m.type === linkType);
    if (!currentLinkMark) continue;

    const prevHasSameLink =
      nodeBefore && nodeBefore.marks.some((m) => m.type === linkType && m.attrs.href === currentLinkMark.attrs.href);

    if (prevHasSameLink) {
      delete anchor.dataset.linkIcon;
    } else {
      anchor.dataset.linkIcon = 'true';
    }
  }
}

export const linkIconPlugin = $prose((ctx) => {
  return new Plugin({
    key: pluginKey,
    view() {
      let updated = false;

      return {
        update(view: EditorView, prevState) {
          if (!updated || !view.state.doc.eq(prevState.doc)) {
            updateLinkIconAttrs(view, ctx);
            updated = true;
          }
        },
      };
    },
  });
});
