import type { Node as UnistNode } from 'mdast';

import type { EntityId } from '#domain/shared/model/entity.js';
import { container } from '#domain/shared/infra/singletons.js';
import { token as repositoriesToken } from '../../repository/index.js';

export default abstract class Extractor {
  constructor(protected readonly entityId: EntityId) {}
  protected readonly repo = container.resolve(repositoriesToken);
  public abstract visit(node: UnistNode): void;
  public abstract done(): Promise<void>;
}
