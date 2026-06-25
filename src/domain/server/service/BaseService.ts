import container from '#utils/singletonContainer.js';
import { token as repositoriesToken } from '../repository/index.js';
import { token as runtimeToken } from '../infra/runtime.js';
import { token as kvToken } from '../infra/kvDatabase.js';
import { token as searchEngineToken } from '../infra/searchEngine.js';

export default abstract class BaseService {
  protected readonly kv = container.resolve(kvToken);

  protected readonly repo = container.resolve(repositoriesToken);

  protected readonly runtime = container.resolve(runtimeToken);

  protected readonly searchEngine = container.resolve(searchEngineToken);
}
