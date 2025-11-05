import { createQuery } from 'mobx-tanstack-query/preset';
import { action, observable } from 'mobx';

import container from '#utils/singletonContainer';
import type { NoteVO } from '#domain/shared/model/note';
import type { Icon } from '#domain/shared/model/entity';
import { token as rpcToken } from '#domain/client/shared/infra/rpc';

import CustomIconPicker from './CustomIconPicker';
import DomainEventBus from '../EventBus';

export default class IconManager {
  constructor(private readonly options: { noteIds: () => NoteVO['id'][] }) {}

  private readonly remote = container.resolve(rpcToken);

  private readonly eventBus = container.resolve(DomainEventBus);

  @observable.ref public accessor customIconPicker: CustomIconPicker | undefined = undefined;

  public readonly customIcons = createQuery(() => this.remote.note.queryAllCustomIcons.query(), {
    queryKey: ['customIcon'],
  });

  @action
  public readonly initCustomIconPicker = () => {
    this.customIconPicker = new CustomIconPicker({
      onDestroy: action(() => {
        this.customIconPicker = undefined;
      }),

      onSubmit: async ({ isNewIcon, fileId }) => {
        await this.submit({ type: 'file', code: fileId });
        this.customIconPicker?.destroy();

        if (isNewIcon) {
          this.customIcons.invalidate();
        }
      },
    });
  };

  public readonly submit = async (icon: Icon) => {
    const noteIds = this.options.noteIds();
    await this.remote.note.batchUpdate.mutate([noteIds, { icon }]);

    for (const noteId of noteIds) {
      this.eventBus.emit(DomainEventBus.eventNames.Updated, { id: noteId, payload: { icon } });
    }
  };
}
