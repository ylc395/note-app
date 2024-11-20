import assert from 'assert';
import { action, computed, observable } from 'mobx';
import { zipObject } from 'lodash-es';

import { container } from '#domain/shared/infra/singletons';
import { token as rpcToken } from '#domain/client/shared/infra/rpc';
import { AnnotationVO, Selector, type AnnotationDTO } from '#domain/shared/model/annotation';
import { EntityMaterialVO } from '#domain/shared/model/material';
import { EventNames, eventBus } from './eventBus';

export default class Editor {
  private readonly remote = container.resolve(rpcToken);

  constructor(
    private readonly options: {
      annotation?: AnnotationVO;
      material?: EntityMaterialVO;
      onDestroyed?: () => void; // AnnotationEditor 的生命周期很简单，无需继承 EventBus 来获得完整的事件管理能力
    },
  ) {
    assert(!(options.annotation && options.material), 'can not specify both annotation and material');

    this.value = options.annotation || { targetId: options.material!.id, selectors: [] };
    this.selectorsMap = {};

    if (options.annotation) {
      this.selectorsMap = zipObject(
        options.annotation.selectors.map((_, i) => i),
        options.annotation.selectors,
      );
    }
  }

  @observable public accessor value: AnnotationDTO;

  @observable private accessor selectorsMap: Record<string, Selector>;

  @computed
  public get selectors() {
    return Object.entries(this.selectorsMap).map(([id, selector]) => ({ ...selector, id }));
  }

  @action
  public update(value: Pick<AnnotationDTO, 'body' | 'color'>) {
    this.value = { ...this.value, ...value };
  }

  @action
  public addSelector(value: Selector) {
    const maxId = Math.max(...this.selectors.map((id) => Number(id)));
    this.selectorsMap[maxId + 1] = value;
  }

  @action
  public removeSelector(id: string) {
    delete this.selectorsMap[id];
  }

  public async submit() {
    if (this.options.annotation) {
      await this.remote.annotation.updateOne.mutate([this.options.annotation.id, this.value]);
      eventBus.emit(EventNames.Updated, {
        id: this.options.annotation.id,
        payload: this.value,
        trigger: this,
      });
    } else {
      const newAnnotation = await this.remote.annotation.create.mutate(this.value);
      eventBus.emit(EventNames.Created, newAnnotation);
    }

    this.destroy();
  }

  public destroy() {
    this.options.onDestroyed?.();
  }
}
