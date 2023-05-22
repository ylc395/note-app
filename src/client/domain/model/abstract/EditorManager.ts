import type { InjectionToken } from 'tsyringe';

import type { EntityLocator } from 'interface/entity';
import type EntityEditor from './Editor';

export interface EditorManager {
  getEditorsByEntity: <T extends EntityEditor>(entity: EntityLocator, excludeId?: EntityEditor['id']) => T[];
}

export const token: InjectionToken<EditorManager> = Symbol();
