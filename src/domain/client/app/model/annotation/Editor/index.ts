import assert from 'assert';
import { action, computed, observable } from 'mobx';
import { zipObject } from 'lodash-es';

import { container } from '#domain/shared/infra/singletons';
import { token as rpcToken } from '#domain/client/shared/infra/rpc';
import { AnnotationVO, Selector } from '#domain/shared/model/annotation';
import { EntityMaterialVO } from '#domain/shared/model/material';

import EventBus from '../../../infra/EventBus';
import { type Events, EventNames } from './events';

export { EventNames } from './events';

export default class Editor extends EventBus<Events> {
  private readonly remote = container.resolve(rpcToken);

  constructor(private readonly options: { annotation?: AnnotationVO; material?: EntityMaterialVO }) {
    assert(!(options.annotation && options.material), 'can not specify both annotation and material');
    super(`annotation-editor-${options.annotation?.id ?? 'new'}`);

    this.content = options.annotation?.body ?? '';
    this.selectorsMap = {};

    if (options.annotation) {
      this.selectorsMap = zipObject(
        options.annotation.selectors.map((_, i) => i),
        options.annotation.selectors,
      );
    }
  }

  @observable public accessor content: string;

  @observable private accessor selectorsMap: Record<string, Selector>;

  @computed
  public get selectors() {
    return Object.entries(this.selectorsMap).map(([id, selector]) => ({ ...selector, id }));
  }

  @action
  public updateContent(value: string) {
    this.content = value;
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
      await this.remote.annotation.updateOne.mutate([this.options.annotation.id, { body: this.content }]);
    } else {
      assert(this.options.material, 'no material or annotation');

      await this.remote.annotation.create.mutate({
        body: this.content,
        targetId: this.options.material.id,
        selectors: this.selectors,
      });
    }

    this.emit(EventNames.Submitted);
    this.destroy();
  }

  public destroy() {
    this.emit(EventNames.Destroyed);
    this.clearListeners();
  }
}
