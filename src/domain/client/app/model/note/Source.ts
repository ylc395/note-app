import { createQuery } from 'mobx-tanstack-query/preset';

import { token as rpcToken } from '#domain/client/shared/infra/rpc';
import container from '#utils/singletonContainer';
import { EntityTypes, type EntityPath } from '#domain/shared/model/entity';
import { normalizeTitle, type NoteVO } from '#domain/shared/model/note';
import type { EntitySource } from '../base/entitySource';

export default class NoteSource implements EntitySource<Required<NoteVO>> {
  constructor(
    public readonly id: NoteVO['id'],
    options: {
      signal: AbortSignal;
      value?: Required<NoteVO>;
      path?: EntityPath;
      blob?: ArrayBuffer;
      options?: () => { enabled: boolean };
    },
  ) {
    this.value = createQuery(() => this.remote.note.queryOneById.query(this.id), {
      abortSignal: options.signal,
      queryKey: ['note', this.id] as Readonly<unknown[]>,
      refetchOnWindowFocus: true,
      initialData: options.value,
      options: options.options,
    });

    this.path = createQuery(() => this.remote.note.queryPath.query(this.id), {
      abortSignal: options.signal,
      queryKey: ['note.path', this.id] as Readonly<unknown[]>,
      refetchOnWindowFocus: true,
      initialData: options.path,
      options: () => ({
        ...options.options?.(),
        enabled: this.value.isSuccess && (options.options?.().enabled ?? true),
      }),
    });

    this.blob = createQuery(() => this.remote.note.getBlob.query(this.id) as Promise<ArrayBuffer>, {
      abortSignal: options.signal,
      staleTime: Infinity,
      queryKey: ['note.blob', this.id] as Readonly<unknown[]>,
      initialData: options.blob,
      options: () => ({
        ...options.options?.(),
        enabled: Boolean(this.value.data?.mimeType) && this.value.isSuccess && (options.options?.().enabled ?? true),
      }),
    });
  }

  public readonly type = EntityTypes.Note;

  private readonly remote = container.resolve(rpcToken);

  public readonly value;

  public readonly path;

  public readonly blob;

  public get title() {
    return this.value.data?.title ? normalizeTitle(this.value.data) : '';
  }

  public get icon() {
    return this.value.data?.icon || null;
  }
}
