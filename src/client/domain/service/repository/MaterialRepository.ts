import { singleton } from 'tsyringe';
import BaseRepository from './BaseRepository';

@singleton()
export default class MaterialRepository extends BaseRepository {
  readonly add = async (files: string[]) => {};
}
