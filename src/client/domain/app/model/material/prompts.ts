import type { PromptToken } from '@shared/domain/infra/ui';
import type { MaterialVO } from '@shared/domain/model/material';

export const MOVE_TARGET_MODAL: PromptToken<MaterialVO['parentId']> = Symbol();
