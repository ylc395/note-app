import { action, observable } from 'mobx';

import type { EntityPath } from '#domain/shared/model/entity';
import NewMaterialForm from './Form';

export default class NewMaterialManager {
  @observable.ref public accessor form: NewMaterialForm | undefined = undefined;

  @action
  public initForm(options?: { path?: EntityPath; onSubmit?: () => void }) {
    this.form = new NewMaterialForm({
      path: options?.path,
      onDestroy: action(() => {
        this.form = undefined;
      }),
      onSubmit: () => {
        options?.onSubmit?.();
        this.form?.destroy();
      },
    });
  }
}
