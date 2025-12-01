export default class RemoteUploader {
  private readonly destroyController = new AbortController();

  public destroy() {
    this.destroyController.abort();
  }
}
