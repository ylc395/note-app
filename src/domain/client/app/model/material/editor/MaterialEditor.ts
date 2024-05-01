import { normalizeTitle } from '@domain/shared/model/material';
import Editor from '@domain/client/app/model/abstract/Editor';
import type EditableMaterial from '@domain/client/app/model/material/editable/EditableMaterial';

export default abstract class MaterialEditor<T extends EditableMaterial, S> extends Editor<T, S> {
  protected readonly normalizeTitle = normalizeTitle;
}
