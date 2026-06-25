import { action, observable, reaction, runInAction } from 'mobx';
import { debounce } from 'lodash-es';

import container from '#utils/singletonContainer';
import { token as rpcToken } from '#domain/client/shared/infra/rpc';
import { EntityTypes } from '#domain/shared/model/entity';
import type { NoteVO } from '#domain/shared/model/note';
import { arrayOf, type MaybeArray } from '#utils/collection';
import { withAbortSignal } from '#utils/function';
import type { SearchResultVO } from '#domain/shared/model/search';

export default class Searcher {
  constructor() {
    reaction(() => this.keyword, this.debouncedSearch);
  }

  private readonly remote = container.resolve(rpcToken);

  @observable public accessor keyword = '';

  @observable.ref public accessor root: MaybeArray<NoteVO['id']> | undefined = undefined;

  @observable.ref public accessor result: SearchResultVO[] | undefined = undefined;

  @action
  public readonly setKeyword = (v: string) => {
    this.keyword = v;
    this.result = undefined;
  };

  @action
  public readonly setRoot = (v: MaybeArray<NoteVO['id']>) => {
    this.root = v;
  };

  private readonly debouncedSearch = debounce(
    withAbortSignal(async (signal) => {
      if (!this.keyword) {
        return;
      }

      runInAction(() => {
        this.result = undefined;
      });

      try {
        const result = await this.remote.search.search.mutate(
          {
            entityTypes: [EntityTypes.Note],
            keyword: this.keyword,
            rootId: this.root ? arrayOf(this.root) : undefined,
          },
          { signal },
        );
        runInAction(() => {
          this.result = result;
        });
      } catch (error) {
        if (signal.aborted) {
          return;
        }

        throw error;
      }
    }),
    500,
  );
}
