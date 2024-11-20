import { action, computed, observable, runInAction } from 'mobx';
import { flow, keyBy } from 'lodash-es';

import { token as rpcToken } from '#domain/client/shared/infra/rpc';
import { container } from '#domain/shared/infra/singletons';
import type { EntityMaterialVO } from '#domain/shared/model/material';
import type { AnnotationVO } from '#domain/shared/model/annotation';

import { eventBus as annotationEventBus, EventNames as AnnotationEventNames } from '../../../annotation/eventBus';

export default class AnnotationList {
  constructor(private readonly materialId: EntityMaterialVO['id']) {
    this.loadAnnotations();

    this.dispose = flow([
      annotationEventBus.on(AnnotationEventNames.Removed, ({ id }) => this.removeById(id)),
      annotationEventBus.on(AnnotationEventNames.Created, this.add.bind(this)),
      annotationEventBus.on(AnnotationEventNames.Updated, ({ id }) => this.loadOneById(id)),
    ]);
  }

  private isDestroyed = false;

  private readonly dispose: () => void;

  private abortController?: AbortController;

  @observable.ref public accessor error: unknown;

  protected readonly remote = container.resolve(rpcToken);

  @observable private accessor annotationMap: Record<AnnotationVO['id'], AnnotationVO> = {};

  private async loadAnnotations() {
    this.abortController?.abort();

    const controller = new AbortController();
    this.abortController = controller;

    try {
      const annotations = await this.remote.annotation.queryByEntityId.query(this.materialId, {
        signal: controller.signal,
      });

      runInAction(() => {
        this.annotationMap = keyBy(annotations, ({ id }) => id);
      });
    } catch (error) {
      if (this.abortController === controller && !this.isDestroyed) {
        runInAction(() => {
          this.error = error;
        });
      }
    }

    if (this.abortController === controller) {
      this.abortController = undefined;
    }
  }

  @computed
  public get annotations() {
    return Object.values(this.annotationMap);
  }

  private removeById(id: AnnotationVO['id']) {
    delete this.annotationMap[id];
  }

  @action
  private add(annotation: AnnotationVO) {
    if (annotation.targetId === this.materialId) {
      this.annotationMap[annotation.id] = annotation;
    }
  }

  private async loadOneById(id: AnnotationVO['id']) {
    if (!this.annotationMap[id]) {
      return;
    }

    const controller = new AbortController();

    this.abortController?.abort();
    this.abortController = controller;

    try {
      const annotation = await this.remote.annotation.queryOne.query(id, { signal: this.abortController.signal });
      runInAction(() => {
        this.annotationMap[id] = annotation;
      });
    } catch (error) {
      if (this.abortController === controller && !this.isDestroyed) {
        runInAction(() => {
          this.error = error;
        });
      }
    }
  }

  public destroy() {
    this.isDestroyed = true;
    this.abortController?.abort();
    this.dispose();
  }
}
