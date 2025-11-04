import { createQuery } from 'mobx-tanstack-query/preset';

import container from '#utils/singletonContainer';
import { togglable } from '#domain/client/shared/model/abstract/togglable';
import type { NoteVO } from '#domain/shared/model/note';
import type { Icon } from '#domain/shared/model/entity';
import { token as rpcToken } from '#domain/client/shared/infra/rpc';

import CustomIconPicker from './CustomIconPicker';
import DomainEventBus from '../EventBus';

export default class IconManager {
  constructor(private readonly options: { noteIds: () => NoteVO['id'][] }) {}

  private readonly remote = container.resolve(rpcToken);

  private readonly eventBus = container.resolve(DomainEventBus);

  public readonly customIcons = createQuery(() => this.remote.note.queryAllCustomIcons.query(), {
    queryKey: ['customIcon'],
  });

  public readonly customIconPickerState = togglable();

  public readonly submit = async (icon: Icon) => {
    const noteIds = this.options.noteIds();
    await this.remote.note.batchUpdate.mutate([noteIds, { icon }]);

    for (const noteId of noteIds) {
      this.eventBus.emit(DomainEventBus.eventNames.Updated, { id: noteId, payload: { icon } });
    }
  };

  public readonly createCustomIconPicker = () => {
    return new CustomIconPicker({
      onSubmit: async ({ isNewIcon, fileId }) => {
        await this.submit({ type: 'file', code: fileId });

        this.customIconPickerState.toggle();

        if (isNewIcon) {
          this.customIcons.invalidate();
        }
      },
    });
  };
}
