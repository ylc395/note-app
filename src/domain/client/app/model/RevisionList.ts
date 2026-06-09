import { maxBy, memoize, minBy } from 'lodash-es';
import { createQuery } from 'mobx-tanstack-query/preset';
import { action, computed, observable } from 'mobx';
import { applyPatch, diffChars, type Change } from 'diff';
import assert from 'assert';

import type { EntityId } from '#domain/shared/model/entity';
import container from '#utils/singletonContainer';
import { token as remoteToken } from '#domain/client/shared/infra/rpc';
import type { RevisionPatchDTO, RevisionVO } from '#domain/shared/model/revision';

export default class RevisionList {
  constructor(entityId: EntityId, abortSignal?: AbortSignal) {
    this.data = createQuery(() => this.remote.revision.queryAll.query(entityId), {
      queryKey: ['revisions', entityId],
      abortSignal,
      onDone: (data) => {
        const lastOne = data.at(-1);

        if (!this.currentRevisionId && lastOne) {
          this.setCurrentRevisionId(lastOne.id);
        }
      },
    });
  }

  private readonly remote = container.resolve(remoteToken);

  public readonly data;

  public async update(id: RevisionVO['id'], patch: RevisionPatchDTO) {
    await this.remote.revision.update.mutate([id, patch]);
    this.data.invalidate();
  }

  @observable public accessor currentRevisionId: RevisionVO['id'] | undefined;

  @computed public get currentVersion() {
    return this.currentRevisionId ? this.getVersion(this.currentRevisionId) : undefined;
  }

  @action
  public setCurrentRevisionId(id: RevisionVO['id']) {
    this.currentRevisionId = id;
  }

  private readonly getVersion = memoize((id: RevisionVO['id']) => {
    assert(this.data.result.data);

    let title = '';
    let titleDiff;
    let body = '';
    let bodyDiff;

    for (const revision of this.data.result.data) {
      const oldTitle = title;
      const oldBody = body;

      if (revision.bodyDiff) {
        const newBodyText = applyPatch(oldBody, revision.bodyDiff);

        if (newBodyText) {
          body = newBodyText;
        }
      }

      if (revision.titleDiff) {
        const newTitleText = applyPatch(oldTitle, revision.titleDiff);

        if (newTitleText) {
          title = newTitleText;
        }
      }

      if (revision.id === id) {
        titleDiff = diffChars(oldTitle, title);
        bodyDiff = diffChars(oldBody, body);
        break;
      }
    }

    return {
      title: { text: title, diff: titleDiff },
      body: { text: body, diff: bodyDiff },
    };
  });

  @observable.ref
  public accessor changes: { oldRevision: RevisionVO; newRevision: RevisionVO; diffs: Change[] } | undefined =
    undefined;

  @action
  public clearChanges() {
    this.changes = undefined;
  }

  @action
  public diff(revisionId: RevisionVO['id']) {
    const targetRevision = this.data.result.data?.find((r) => r.id === revisionId);
    const currentRevision = this.data.result.data?.find((r) => r.id === this.currentRevisionId);
    assert(targetRevision && currentRevision);

    if (targetRevision === currentRevision) {
      return false;
    }

    const newRevision = maxBy([targetRevision, currentRevision], (r) => r.createdAt)!;
    const oldRevision = minBy([targetRevision, currentRevision], (r) => r.createdAt)!;

    this.changes = {
      oldRevision,
      newRevision,
      diffs: diffChars(this.getVersion(oldRevision.id).body.text, this.getVersion(newRevision.id).body.text),
    };

    return true;
  }

  @action
  public destroy() {
    this.data.destroy();
  }
}
