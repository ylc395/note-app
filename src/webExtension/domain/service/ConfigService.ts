import browser from 'webextension-polyfill';
import { observable, makeObservable, runInAction, action, computed } from 'mobx';
import { singleton, container } from 'tsyringe';

import { CONFIG_KEY, type Config } from 'model/config';
import { EntityTypes } from 'interface/entity';
import type Tree from 'model/Tree';

import MainAppService from './MainAppService';

const defaultConfig: Config = {
  targetEntityType: EntityTypes.Material,
  targetEntityId: {
    [EntityTypes.Material]: null,
    [EntityTypes.Note]: null,
    [EntityTypes.Memo]: null,
  },
};

@singleton()
export default class ConfigService {
  private mainApp = container.resolve(MainAppService);

  constructor() {
    makeObservable(this);
    this.init();
  }

  @observable.ref targetTree?: Tree;
  @observable private config?: Config;

  @computed
  get target() {
    const targetType = this.get('targetEntityType');
    const targetId = targetType && this.get('targetEntityId')?.[targetType];

    if (!targetId || !this.targetTree) {
      return null;
    }

    const ancestors = this.targetTree.getAncestors(targetId);
    const node = this.targetTree.getNode(targetId);

    return {
      title: node.title,
      path: [...ancestors, node].map(({ title }) => title).join(' / '),
    };
  }

  private async init() {
    browser.storage.onChanged.addListener(
      action((e) => {
        if (e[CONFIG_KEY]) {
          const { newValue } = e[CONFIG_KEY];
          this.config = newValue;
        }
      }),
    );

    const config = ((await browser.storage.local.get(CONFIG_KEY))[CONFIG_KEY] as Config | undefined) || defaultConfig;
    runInAction(() => (this.config = config));
  }

  @action
  setTargetId(id: string) {
    if (!this.config) {
      throw new Error('no config');
    }

    this.set('targetEntityId', {
      ...this.config.targetEntityId,
      [this.config.targetEntityType]: id,
    });
  }

  @action
  set<T extends keyof Config>(key: T, value: Config[T]) {
    if (!this.config) {
      throw new Error('no config');
    }

    browser.storage.local.set({ [CONFIG_KEY]: { ...this.config, [key]: value } });
  }

  get<T extends keyof Config>(key: T): Config[T] | undefined {
    return this.config?.[key];
  }

  @action
  destroyTargetTree() {
    this.targetTree?.destroy();
    this.targetTree = undefined;
  }

  async updateTargetTree() {
    const targetType = this.get('targetEntityType');
    const targetId = targetType && this.get('targetEntityId')?.[targetType];

    if (!targetType || targetType === EntityTypes.Memo || typeof targetId === 'undefined') {
      return;
    }

    const tree: Tree | null = await this.mainApp.getTree(targetType, targetId);

    if (!tree) {
      return;
    }

    if (targetId) {
      for (const node of tree.getAncestors(targetId)) {
        tree.toggleExpand(node.id);
      }

      tree.toggleSelect(targetId);
    }

    tree.on('nodeSelected', ({ id }) => {
      this.setTargetId(id);
    });

    tree.on('nodeExpanded', async ({ id }) => {
      const children = await this.mainApp.getChildren(targetType, id);

      if (children) {
        tree.updateTree(children);
      }
    });

    runInAction(() => (this.targetTree = tree));
  }
}
