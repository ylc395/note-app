import browser from 'webextension-polyfill';
import { observable, makeObservable, runInAction, action, computed } from 'mobx';
import { singleton, container } from 'tsyringe';

import { CONFIG_KEY, type Config } from '@domain/model/config';
import { type EntityParentId, EntityTypes } from '@domain/model/entity';
import type Tree from '@domain/model/abstract/Tree';

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

    if (!this.targetTree) {
      return { type: targetType };
    }

    if (!targetId) {
      return { type: targetType, title: this.targetTree.root.title, path: '' };
    }

    const ancestors = this.targetTree.getAncestors(targetId);
    const node = this.targetTree.getNode(targetId);

    return {
      type: targetType,
      title: node.title,
      path: [...ancestors, node].map(({ title }) => title).join(' / '),
    };
  }

  @computed
  get isValidTarget() {
    return Boolean(this.targetTree);
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
  private readonly setTargetId = (id: EntityParentId) => {
    if (!this.config) {
      throw new Error('no config');
    }

    this.set('targetEntityId', {
      ...this.config.targetEntityId,
      [this.config.targetEntityType]: id,
    });
  };

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

  async updateTargetTree() {
    const targetType = this.get('targetEntityType');
    let targetId = (targetType && this.get('targetEntityId')?.[targetType]) || null;

    if (!targetType || targetType === EntityTypes.Memo) {
      return [];
    }

    let tree: Tree | null = await this.mainApp.getTree(targetType, targetId);

    if (!tree && targetId) {
      // retry with root children
      targetId = null;
      this.setTargetId(targetId);
      tree = await this.mainApp.getTree(targetType, targetId);
    }

    if (!tree) {
      throw new Error('can not get a tree');
    }

    runInAction(() => {
      if (!tree) {
        throw new Error('no tree');
      }

      if (targetId) {
        for (const node of tree.getAncestors(targetId)) {
          tree.toggleExpand(node.id);
        }
      }

      tree.toggleSelect(targetId);
      this.targetTree = tree;
    });

    tree.on('nodeSelected', this.setTargetId);
    tree.on('nodeExpanded', async (id) => {
      const children = await this.mainApp.getChildren(targetType, id);

      if (children) {
        tree!.setChildren(children, id);
      }
    });
  }
}
