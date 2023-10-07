import { container, singleton } from 'tsyringe';
import { token } from 'infra/remote';

@singleton()
export default class RemoteService {
  private readonly remote = container.resolve(token);
}
