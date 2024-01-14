import type { PromptToken } from '@shared/domain/infra/ui';
import type { NoteVO } from '@shared/domain/model/note';

export const MOVE_TARGET_MODAL: PromptToken<NoteVO['parentId']> = Symbol();
