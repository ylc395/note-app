import type { PromptToken } from '@shared/domain/infra/ui';
import type { FileDTO } from '@shared/domain/model/file';
import type { NewMaterialDTO } from '@shared/domain/model/material';

export type NewMaterialForm = Pick<NewMaterialDTO, 'comment' | 'icon' | 'sourceUrl' | 'title'> & { file: FileDTO };

export const NEW_MATERIAL_MODAL: PromptToken<NewMaterialForm> = Symbol();
