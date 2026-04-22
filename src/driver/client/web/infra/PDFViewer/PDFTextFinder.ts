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
  pageMatches?: Readonly<number[][]>;
  pageMatchesLength?: Readonly<number[][]>;
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
      // 关键字不做即时响应，而是靠调用 next / prev
      if (key === 'query') {
        continue;
      }

      reaction(
        () => this.config[key as keyof PDFTextFinder['config']],
        () => this.search(actionMap[key as keyof PDFTextFinder['config']]),
        { signal: this.abortController.signal },
      );
    }
  }

  @observable public accessor result: Readonly<SearchResult> | undefined;

  @observable public accessor state:
    | { status: 'pending' | 'notFound' | 'reachedTop' | 'reachedBottom'; previous: boolean }
    | undefined;

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
  private updateState(e: { state: number; previous: boolean }) {
    let status: NonNullable<PDFTextFinder['state']>['status'];

    switch (e.state) {
      case FindState.PENDING:
        status = 'pending';
        break;
      case FindState.NOT_FOUND:
        status = 'notFound';
        break;
      case FindState.WRAPPED:
        status = e.previous ? 'reachedTop' : 'reachedBottom';
        break;
      default:
        this.state = undefined;
        return;
    }

    this.state = {
      status,
      previous: e.previous,
    };
  }

  @observable private accessor config = {
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

  public readonly next = () => {
    this.search('again');
  };

  public readonly prev = () => {
    this.search('again', true);
  };

  private search(action: Action, findPrev = false) {
    this.eventBus.dispatch('find', {
      source: this,
      type: action,
      findPrevious: findPrev,
      ...this.config,
    });
  }

  public readonly jumpTo = (index: number) => {
    if (!this.result) {
      return;
    }

    let offset = index - (this.result.current - 1) + 1;

    // 这种跳法非常愚蠢，但这是 pdfjs 提供的唯一方法。这种方法在进行大范围跳跃时会有明显卡顿
    while (offset !== 0) {
      if (offset > 0) {
        this.next();
        offset -= 1;
      } else {
        this.prev();
        offset += 1;
      }
    }
  };

  public destroy() {
    this.abortController.abort();
    this.eventBus.dispatch('findbarclose', { source: this });
  }
}
