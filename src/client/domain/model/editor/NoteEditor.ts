import { makeObservable, computed, reaction, action, observable } from 'mobx';
import last from 'lodash/last';

import { normalizeTitle, type NoteVO, type NoteBodyVO, type NotePath } from 'interface/Note';
import type Window from 'model/windowManager/Window';

import EntityEditor from './EntityEditor';

export enum Events {
  TitleUpdated = 'noteEditor.updated.title',
  BodyUpdated = 'noteEditor.updated.body',
  Activated = 'noteEditor.activated',
}

export interface Entity {
  body: NoteBodyVO;
  metadata: NoteVO;
}

export default class NoteEditor extends EntityEditor<Entity> {
  private readonly disposeReaction: ReturnType<typeof reaction>;
  @observable breadcrumb?: NotePath;

  constructor(window: Window, noteId: NoteVO['id']) {
    super(window, noteId);
    makeObservable(this);

    this.disposeReaction = reaction(
      () => this.isActive,
      (isActive) => isActive && this.emit(Events.Activated),
      { fireImmediately: true },
    );
  }

  @computed
  get title() {
    return this.entity ? normalizeTitle(this.entity.metadata) : '';
  }

  @action
  async updateBody(body: unknown) {
    if (!this.entity) {
      throw new Error('not ready');
    }

    const jsonStr = JSON.stringify(body);
    this.entity.body = jsonStr;
    this.emit(Events.BodyUpdated, this.entity.body);
  }

  @action
  updateTitle(title: string) {
    if (!this.entity) {
      throw new Error('not ready');
    }

    this.entity.metadata.title = title;

    const breadcrumb = last(this.breadcrumb);

    if (breadcrumb) {
      breadcrumb.title = title;
    }

    this.emit(Events.TitleUpdated, this.entity.metadata);
  }

  destroy() {
    super.destroy();
    this.disposeReaction();
  }
}
