import { action, observable } from 'mobx';
import container from '#utils/singletonContainer';
import { token as rpcToken } from '#domain/client/shared/infra/rpc';
import {
  type DuplicatedNoteDTO,
  type NewNoteDTO,
  type NotePatchDTO,
  NoteTypes,
  type NoteVO,
} from '#domain/shared/model/note';
import TreeNode from '#domain/client/shared/model/note/TreeNode';

import Workbench from '../model/Workbench';
import DomainEventBus from '../model/note/EventBus';
import TreeView from '../model/note/TreeView';
import MaterialForm from '../model/note/MaterialForm';
import BaseEditor from '../model/note/editor/BaseEditor';

export default class NoteService {
  private readonly remote = container.resolve(rpcToken);

  public readonly workbench = container.resolve(Workbench);

  @observable.ref public accessor materialForm: MaterialForm | undefined;

  public readonly treeViews = {
    note: new TreeView(NoteTypes.Note),
    material: new TreeView(NoteTypes.Material),
  } as const;

  private readonly eventBus = container.resolve(DomainEventBus);

  public readonly duplicate = async (params: DuplicatedNoteDTO, open?: boolean) => {
    const newNote = await this.remote.note.create.mutate(params);
    this.eventBus.emit(DomainEventBus.eventNames.Created, newNote);

    if (open) {
      this.workbench.open(newNote);
    }
  };

  public readonly move = async (sourceId: NoteVO['id'], targetId: NotePatchDTO['parentId']) => {
    await this.remote.note.updateOne.mutate([sourceId, { parentId: targetId }]);
    this.eventBus.emit(DomainEventBus.eventNames.Updated, { id: sourceId, parentId: targetId });
  };

  @action
  public readonly toggleMaterialForm = (options?: { parentId?: NewNoteDTO['parentId']; onSubmit?: () => void }) => {
    if (this.materialForm) {
      this.materialForm.destroy();
      this.materialForm = undefined;
    } else {
      this.materialForm = new MaterialForm({
        parentId: options?.parentId,
        onSubmit: () => {
          options?.onSubmit?.();
          this.toggleMaterialForm();
        },
      });
    }
  };

  public static getNote(value: unknown) {
    if (value instanceof TreeNode) {
      return value.value;
    }

    if (value instanceof BaseEditor) {
      return value.value.result.data;
    }

    return undefined;
  }
}
