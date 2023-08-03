import browser from 'webextension-polyfill';
import { observable, makeObservable, runInAction, action, computed } from 'mobx';
import { singleton, container } from 'tsyringe';

import { CONFIG_KEY, type Config } from 'model/config';
import { EntityTypes } from 'interface/entity';
import { token as mainAppToken } from 'infra/MainApp';
import type NoteTree from 'model/NoteTree';
import type MaterialTree from 'model/MaterialTree';

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
  private mainApp = container.resolve(mainAppToken);

  constructor() {
    makeObservable(this);
    this.init();
  }

  @observable.ref targetTree?: NoteTree | MaterialTree;
  @observable private config?: Config;

  @computed
  get target() {
    const targetType = this.get('targetEntityType');
    const targetId = targetType && this.get('targetEntityId')?.[targetType];

    if (!targetId || !this.targetTree) {
      return '';
    }

    const ancestors = this.targetTree.getAncestors(targetId);
    const node = this.targetTree.getNode(targetId);

    return {
      title: node.title,
      path: [...ancestors, node].map(({ title }) => title).join(' / '),
    };
  }

  private async init() {
    const config = ((await browser.storage.local.get(CONFIG_KEY))[CONFIG_KEY] as Config | undefined) || defaultConfig;
    runInAction(() => (this.config = config));

    browser.storage.onChanged.addListener(
      action((e) => {
        if (e[CONFIG_KEY]) {
          const { newValue } = e[CONFIG_KEY];
          this.config = newValue;
        }
      }),
    );
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

  // readonly updateTargetTree = async () => {
  //   const targetType = this.get('targetEntityType');
  //   const targetId = targetType && this.get('targetEntityId')?.[targetType];

  //   if (!targetType || targetType === EntityTypes.Memo) {
  //     return;
  //   }

  //   this.targetTree?.destroy();
  //   runInAction(() => (this.targetTree = undefined));
  //   const tree = await this.mainApp.getTree<MaterialTree | NoteTree>(targetType, targetId);

  //   if (this.targetTree || !tree) {
  //     return;
  //   }

  //   tree.on('nodeSelected', ({ id }) => {
  //     this.setTargetId(id);
  //   });

  //   tree.on('nodeExpanded', async ({ id }) => {
  //     const children = await this.mainApp.getChildren(targetType, id);
  //     tree.updateTree(children);
  //   });

  //   runInAction(() => (this.targetTree = tree));
  // };
}
