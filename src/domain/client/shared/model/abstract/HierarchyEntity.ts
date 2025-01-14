import { keyBy } from 'lodash-es';
import { action, computed, observable } from 'mobx';

export default abstract class HierarchyEntity<T extends { id: string }> {
  @observable.ref public accessor value: T | undefined;

  @action
  protected setValue(value: T | undefined) {
    this.value = value;
  }

  @computed
  public get id() {
    return this.value?.id || '__ROOT_ID__';
  }

  @observable.shallow protected accessor childrenMap: Record<string, HierarchyEntity<T>> | undefined;

  @action
  protected destroyChildren() {
    if (!this.childrenMap) {
      return;
    }

    for (const child of Object.values(this.childrenMap)) {
      child.destroy();
    }

    this.childrenMap = undefined;
  }

  public destroy() {
    this.destroyChildren();
  }

  @action
  protected setChildren(values: T[], transform: (value: T) => HierarchyEntity<T>) {
    if (!this.childrenMap) {
      this.childrenMap = keyBy(values.map(transform), ({ id }) => id) as Record<T['id'], this>;
      return;
    }

    const newValuesMap = keyBy(values, ({ id }) => id);

    for (const [id, child] of Object.entries(this.childrenMap)) {
      if (!(id in newValuesMap)) {
        child.destroy();
        delete this.childrenMap[id];
      }
    }

    for (const value of values) {
      const child = this.childrenMap[value.id];

      if (child) {
        child.setValue(value);
      } else {
        this.childrenMap[value.id] = transform(value);
      }
    }
  }
}
