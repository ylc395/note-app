import type { EntityLocator } from 'interface/entity';
import BaseService from './BaseService';

export default class LintService extends BaseService {
  lint({ id, type }: EntityLocator) {
    return [];
  }
}
