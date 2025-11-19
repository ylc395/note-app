import Odm from '#domain/client/shared/model/abstract/Odm';

export const storeName = 'editor_UI_state';

export default class EditorUIState extends Odm {
  constructor(id: string) {
    super(storeName, id);
  }
}
