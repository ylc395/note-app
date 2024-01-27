import { normalizeTitle } from '@shared/domain/model/material';
import Editor from '@domain/app/model/abstract/Editor';
import type EditableMaterial from '@domain/app/model/material/editable/EditableMaterial';

export default abstract class MaterialEditor<T extends EditableMaterial, S> extends Editor<T, S> {
  protected readonly normalizeTitle = normalizeTitle;
}
