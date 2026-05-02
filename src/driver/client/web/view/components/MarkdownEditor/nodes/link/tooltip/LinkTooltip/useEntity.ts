import { createQuery } from 'mobx-tanstack-query/preset';
import { createMemo } from 'solid-js';
import type { Ctx } from '@milkdown/kit/ctx';

import container from '#utils/singletonContainer';
import type { MemoVO } from '#domain/shared/model/memo';
import { normalizeTitle, type NoteVO } from '#domain/shared/model/note';
import { parseAppUrl, RouteTypes } from '#domain/shared/infra/url';
import { token as remoteToken } from '#domain/client/shared/infra/rpc';
import { customCtx } from '#web/view/components/MarkdownEditor/customCtx';
import assert from 'assert';

export default function useEntity(props: { url: string; ctx: Ctx }) {
  const appUrl = parseAppUrl(props.url);
  const remote = container.resolve(remoteToken);

  const isEntity = Boolean(appUrl);

  const entity = createQuery<Required<NoteVO> | Required<MemoVO> | null>(
    ({ signal }) => {
      switch (appUrl?.type) {
        case RouteTypes.Note:
          return remote.note.queryOneById.query(appUrl!.id, { signal });
        case RouteTypes.Memo:
          return remote.memo.queryOneById.query(appUrl!.id, { signal });
        default:
          return null;
      }
    },
    {
      queryKey: ['entity', appUrl?.id],
      enabled: isEntity,
    },
  );

  const file = createQuery(
    ({ signal, queryKey: [_, id] }) => {
      return remote.note.getBlob.query(id, { signal });
    },
    {
      options: () => ({
        enabled: entity.isSuccess && appUrl?.type === RouteTypes.Note,
      }),
      queryKey: ['note.blob', appUrl?.id || ''] as const,
    },
  );

  const mimeType = createMemo(() => (entity.data && 'mimeType' in entity.data ? entity.data.mimeType : null));

  const title = createMemo(() => {
    if (appUrl?.type === RouteTypes.Note && entity.data) {
      return normalizeTitle(entity.data as NoteVO);
    }
  });

  function jump() {
    assert(appUrl);
    props.ctx.get(customCtx).onJump?.({
      ...appUrl,
      mimeType: mimeType(),
    });
  }

  return {
    file,
    entity,
    mimeType,
    isEntity,
    title,
    jump,
  };
}
