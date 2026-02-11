import { action, observable, reaction } from 'mobx';
import type { EventBus } from 'pdfjs-dist/web/pdf_viewer.mjs';

type Action =
  | '' // 更新关键词
  | 'again' // 上下跳
  | 'highlightallchange'
  | 'casesensitivitychange'
  | 'entirewordchange'
  | 'diacriticmatchingchange';

const actionMap: Record<keyof PDFTextFinder['config'], Action> = {
  query: '',
  caseSensitive: 'casesensitivitychange',
  entireWord: 'entirewordchange',
  highlightAll: 'highlightallchange',
  matchDiacritics: 'diacriticmatchingchange',
};

export default class PDFTextFinder {
  constructor(private readonly eventBus: EventBus) {
    eventBus.on('updatefindmatchescount', this.updateResultsCount.bind(this), { signal: this.abortController.signal });
    eventBus.on('updatefindcontrolstate', this.updateState.bind(this), { signal: this.abortController.signal });

    for (const key of Object.keys(this.config)) {
      reaction(
        () => this.config[key as keyof PDFTextFinder['config']],
        () => this.search(actionMap[key as keyof PDFTextFinder['config']]),
        { signal: this.abortController.signal },
      );
    }
  }

  private readonly abortController = new AbortController();

  @observable public accessor result: { current: number; total: number } | undefined;

  @observable public accessor status: 'pending' | 'notFound' | 'reachedTop' | 'reachedBottom' | undefined;

  @action
  private updateResultsCount(result: PDFTextFinder['result']) {
    this.result = result;
  }

  @action
  private updateState({
    matchesCount,
    state,
    previous,
  }: {
    state: number;
    previous: boolean;
    matchesCount: PDFTextFinder['result'];
  }) {
    switch (state) {
      case 3:
        this.status = 'pending';
        break;
      case 1:
        this.status = 'notFound';
        break;
      case 2:
        this.status = previous ? 'reachedTop' : 'reachedBottom';
        break;
      default:
        this.status = undefined;
        break;
    }

    this.updateResultsCount(matchesCount);
  }

  @observable public accessor config = {
    query: '',
    caseSensitive: false,
    entireWord: false,
    highlightAll: true,
    matchDiacritics: false,
  };

  @action
  public set<T extends keyof PDFTextFinder['config']>(key: T, value: PDFTextFinder['config'][T]) {
    this.config[key] = value;
  }

  public next() {
    this.search('again');
  }

  public prev() {
    this.search('again', true);
  }

  private search(action: Action, findPrev = false) {
    this.eventBus.dispatch('find', {
      source: this,
      type: action,
      findPrevious: findPrev,
      ...this.config,
    });
  }

  public destroy() {
    this.abortController.abort();
    this.eventBus.dispatch('findbarclose', { source: this });
  }
}
