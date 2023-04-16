import memoize from 'lodash/memoize';
import debounce from 'lodash/debounce';

import { type EntityLocator, EntityTypes, EntityId } from 'interface/entity';
import type { NoteVO } from 'interface/note';
import { RevisionTypes, RevisionVO } from 'interface/revision';

import BaseService from './BaseService';

const entityToKey = ({ id, type }: EntityLocator) => `${type}-${id}`;
const MAX_INTERVAL_MINUTES = 20;
const NEW_ENTITY_DEBOUNCE_MINUTES = 5;
const BIG_CHANGE_DEBOUNCE_MINUTES = 0.5;

export default class RevisionService extends BaseService {
  private readonly tasks = {} as Record<EntityTypes, Record<EntityId, string>>;
  private async submit(entity: EntityLocator, newContent: string, type: RevisionTypes) {
    await this.revisions.create({ entityId: entity.id, entityType: entity.type, type, diff: '{}' });

    if (this.tasks[entity.type][entity.id]) {
      delete this.tasks[entity.type][entity.id];
    }
  }

  async createRevision(entityLocator: EntityLocator, newContent: string) {
    const latestRevision = await this.revisions.findLatest(entityLocator);

    if (latestRevision) {
      const timeDiff = Date.now() - latestRevision.createdAt * 1000;

      if (timeDiff >= MAX_INTERVAL_MINUTES * 60 * 1000) {
        this.submit(entityLocator, newContent, RevisionTypes.Regular);
        const bigChangeDebounced = this.createBigChangeRevision.cache.get(entityToKey(entityLocator));

        if (bigChangeDebounced) {
          bigChangeDebounced.cancel();
        }
      } else if (this.isBigChange(newContent, latestRevision)) {
        this.createBigChangeRevision(entityLocator)(newContent);
      }

      this.createInitialRevision.cache.delete(entityToKey(entityLocator));
    } else {
      this.createInitialRevision(entityLocator)(newContent);
    }
  }

  private readonly createInitialRevision = memoize((entityLocator: EntityLocator) => {
    let timer: ReturnType<typeof setTimeout>;

    return async (content: string) => {
      clearTimeout(timer);

      let entity: NoteVO | null;

      switch (entityLocator.type) {
        case EntityTypes.Note:
          entity = await this.notes.findOneById(entityLocator.id);
          break;
        default:
          throw new Error('unsupported type');
      }

      if (!entity) {
        throw new Error('invalid entity');
      }

      if (Date.now() - entity.createdAt * 100 >= MAX_INTERVAL_MINUTES * 60 * 1000) {
        this.submit(entityLocator, content, RevisionTypes.Regular);
      } else {
        this.addTask(entityLocator, content);
        timer = setTimeout(async () => {
          const latestRevision = await this.revisions.findLatest(entityLocator);

          if (!latestRevision) {
            this.submit(entityLocator, content, RevisionTypes.Regular);
          }
        }, NEW_ENTITY_DEBOUNCE_MINUTES * 60 * 1000);
      }
    };
  }, entityToKey);

  private readonly createBigChangeRevision = memoize((entity: EntityLocator) => {
    return debounce((content: string) => {
      this.submit(entity, content, RevisionTypes.BigChange);
    }, BIG_CHANGE_DEBOUNCE_MINUTES * 60 * 1000);
  }, entityToKey);

  private isBigChange(newContent: string, latestRevision: RevisionVO) {
    return true;
  }

  private addTask({ type, id }: EntityLocator, content: string) {
    if (!this.tasks[type]) {
      this.tasks[type] = {};
    }

    this.tasks[type][id] = content;
  }
}
