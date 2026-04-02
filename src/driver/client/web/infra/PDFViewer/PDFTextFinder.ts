import assert from 'assert';
import { action, observable, reaction } from 'mobx';
import { FindState, type EventBus, type PDFFindController } from 'pdfjs-dist/web/pdf_viewer.mjs';

type Action =
  | '' // 更新关键词
  | 'again' // 上下跳
  | 'highlightallchange'
  | 'casesensitivitychange'
  | 'entirewordchange'
  | 'diacriticmatchingchange';

interface MatchesCount {
  current: number;
  total: number;
}

interface SearchResult extends MatchesCount {
  pageMatches?: number[][];
  pageMatchesLength?: number[][];
}

const actionMap: Record<keyof PDFTextFinder['config'], Action> = {
  query: '',
  caseSensitive: 'casesensitivitychange',
  entireWord: 'entirewordchange',
  highlightAll: 'highlightallchange',
  matchDiacritics: 'diacriticmatchingchange',
};

export default class PDFTextFinder {
  constructor(private readonly eventBus: EventBus) {
    // 更新搜索数量时会触发
    eventBus.on('updatefindmatchescount', this.updateResult.bind(this), { signal: this.abortController.signal });

    // 切换当前选中的搜索结果时会触发
    eventBus.on('updatefindcontrolstate', this.updateState.bind(this), { signal: this.abortController.signal });
    eventBus.on('updatefindcontrolstate', this.updateResult.bind(this), { signal: this.abortController.signal });
  }

  private readonly abortController = new AbortController();

  public init() {
    for (const key of Object.keys(this.config)) {
      reaction(
        () => this.config[key as keyof PDFTextFinder['config']],
        () => this.search(actionMap[key as keyof PDFTextFinder['config']]),
        { signal: this.abortController.signal },
      );
    }
  }

  @observable public accessor result: SearchResult | undefined;

  @observable public accessor status: 'pending' | 'notFound' | 'reachedTop' | 'reachedBottom' | undefined;

  @action
  private updateResult(result: { matchesCount: MatchesCount; state?: number; source: PDFFindController }) {
    if (result.state === FindState.PENDING) {
      return;
    }

    this.result = {
      ...result.matchesCount,
      pageMatches: result.source.pageMatches,
      pageMatchesLength: result.source.pageMatchesLength,
    };
  }

  @action
  private updateState({
    state,
    previous,
  }: {
    state: number;
    previous: boolean;
    matchesCount: PDFTextFinder['result'];
  }) {
    switch (state) {
      case FindState.PENDING:
        this.status = 'pending';
        break;
      case FindState.NOT_FOUND:
        this.status = 'notFound';
        break;
      case FindState.WRAPPED:
        this.status = previous ? 'reachedTop' : 'reachedBottom';
        break;
      default:
        this.status = undefined;
        break;
    }
  }

  @observable public accessor config = {
    query: '',
    caseSensitive: false,
    entireWord: false,
    highlightAll: true,
    matchDiacritics: false,
  };

  @action
  public set<T extends keyof PDFTextFinder['config']>(key: T, value: PDFTextFinder['config'][T] | undefined) {
    if (value === undefined) {
      return;
    }

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

  public jumpTo(index: number) {
    assert(this.result);
    let offset = index - (this.result.current - 1) + 1;

    while (offset !== 0) {
      if (offset > 0) {
        this.next();
        offset -= 1;
      } else {
        this.prev();
        offset += 1;
      }
    }
  }

  public destroy() {
    this.abortController.abort();
    this.eventBus.dispatch('findbarclose', { source: this });
  }
}
