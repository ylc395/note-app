import type { PromptToken } from '@shared/domain/infra/ui';
import type { MaterialVO } from '@shared/domain/model/material';
import type { FileDTO } from '@shared/domain/model/file';
import type { NewMaterialDTO } from '@shared/domain/model/material';

export const MOVE_TARGET_MODAL: PromptToken<MaterialVO['parentId']> = Symbol();

type NewMaterialForm = Pick<NewMaterialDTO, 'comment' | 'icon' | 'sourceUrl' | 'title'> & { file: FileDTO };
export const NEW_MATERIAL_MODAL: PromptToken<NewMaterialForm> = Symbol();
