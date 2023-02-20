import EventEmitter from 'eventemitter2';
import { container, singleton } from 'tsyringe';
import { runInAction } from 'mobx';
import debounce from 'lodash/debounce';
import pull from 'lodash/pull';

import { EntityId, EntityTypes } from 'interface/Entity';
import type { NoteBodyVO, NoteVO, NotePath, NoteDTO, NoteBodyDTO } from 'interface/Note';

import EntityEditor, { Events as EntityEditorEvents } from 'model/editor/EntityEditor';
import NoteEditor, { Events as NoteEditorEvents, type Entity as NoteEditorEntity } from 'model/editor/NoteEditor';
import type Window from 'model/windowManager/Window';
import { token as remoteToken } from 'infra/Remote';

@singleton()
export default class EditorService extends EventEmitter {
  private remote = container.resolve(remoteToken);
  private readonly editorsMap: Record<string, EntityEditor[]> = {};

  createEditor(window: Window, entityType: EntityTypes, entityId: EntityId) {
    const editorConstructorsMap = {
      [EntityTypes.Note]: NoteEditor,
    };

    const editor = new editorConstructorsMap[entityType](window, entityId);
    const key = `${entityType}-${entityId}`;

    if (!this.editorsMap[key]) {
      this.editorsMap[key] = [editor];
    } else {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      this.editorsMap[key]!.push(editor);
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const entity = this.editorsMap[key]![0]!.entity;

    if (entity) {
      runInAction(() => (editor.entity = entity as (typeof editor)['entity']));
    }

    if (editor instanceof NoteEditor) {
      this.initNoteEditor(editor);
    }

    editor.onAny(this.emit.bind(this));
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    editor.on(EntityEditorEvents.Destroyed, () => pull(this.editorsMap[key]!, editor));

    return editor;
  }

  private async initNoteEditor(editor: NoteEditor) {
    editor.on(
      NoteEditorEvents.TitleUpdated,
      debounce(({ title }: NoteEditorEntity['metadata']) => {
        this.remote.patch<NoteDTO>(`/notes/${editor.entityId}`, { title });
      }, 1000),
    );

    editor.on(
      NoteEditorEvents.BodyUpdated,
      debounce((e: NoteEditorEntity['body']) => {
        this.remote.put<NoteBodyDTO>(`/notes/${editor.entityId}/body`, e);
      }, 1000),
    );

    editor.on(NoteEditorEvents.Activated, async () => {
      const { body: breadcrumb } = await this.remote.get<void, NotePath>(`/notes/${editor.entityId}/tree-path`);
      runInAction(() => (editor.breadcrumb = breadcrumb));
    });

    if (editor.entity) {
      return;
    }

    const [{ body: metadata }, { body }] = await Promise.all([
      this.remote.get<void, NoteVO>(`/notes/${editor.entityId}`),
      this.remote.get<void, NoteBodyVO>(`/notes/${editor.entityId}/body`),
    ]);

    runInAction(() => {
      editor.entity = { metadata, body };
    });
  }
}
