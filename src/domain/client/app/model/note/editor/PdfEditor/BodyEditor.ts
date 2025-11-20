import { expose, instanceToPlain, plainToClassFromExist } from '#utils/classTransformer';
import { action, computed, observable } from 'mobx';

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
  public initUIState(value: unknown) {
    plainToClassFromExist(this, value);
  }
}
