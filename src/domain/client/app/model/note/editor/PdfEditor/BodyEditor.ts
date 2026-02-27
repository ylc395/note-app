import { action, computed, observable } from 'mobx';
import z from 'zod';
import { expose, instanceToPlain } from '#utils/classTransformer';

export const schema = z.object({
  isEnabled: z.boolean(),
  width: z.number(),
});

export default class BodyEditor {
  @observable @expose() public accessor isEnabled = false;

  @observable @expose() public accessor width = 30;

  @action
  public toggle() {
    this.isEnabled = !this.isEnabled;
  }

  @computed
  public get uiState() {
    return instanceToPlain(this);
  }

  @action
  public init(value?: z.infer<typeof schema>) {
    Object.assign(this, value);
  }
}
