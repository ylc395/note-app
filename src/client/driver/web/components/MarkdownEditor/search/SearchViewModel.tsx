import { observable, action, makeObservable, reaction } from 'mobx';
import { debounce } from 'lodash-es';
import { type Root, createRoot } from 'react-dom/client';

import SearchBox from './SearchBox';
import type { SearchState, Range } from './type';

export default class SearchViewModel {
  private resources?: { react: Root; el: HTMLElement; autoEmit: ReturnType<typeof reaction> };

  @observable.shallow
  private readonly searchState: SearchState = {
    ranges: [],
    activeIndex: 0,
  };

  private keyword = '';

  constructor(
    private readonly options: {
      rootEl: HTMLElement;
      traverseText: (cb: (text: string, pos: number) => void) => void;
      onUpdate: (e: SearchState) => void;
    },
  ) {
    makeObservable(this);
  }

  readonly search = debounce(
    action(() => {
      const re = new RegExp(this.keyword, 'gui');
      const ranges: Range[] = [];

      if (this.keyword && this.resources) {
        this.options.traverseText((text, pos) => {
          const start = pos + 1;

          for (const match of text.matchAll(re)) {
            const from = start + (match.index ?? 0);
            const to = from + match[0].length;
            ranges.push({ from, to });
          }
        });
      }

      this.searchState.ranges = ranges;
      this.searchState.activeIndex = 0;
    }),
    300,
  );

  private autoEmit() {
    return reaction(
      () => ({ ...this.searchState }),
      () => this.options.onUpdate(this.searchState),
    );
  }

  private nextMatch(dir: 'up' | 'down') {
    return action(() => {
      if (
        dir === 'down'
          ? this.searchState.activeIndex + 1 === this.searchState.ranges.length
          : this.searchState.activeIndex === 0
      ) {
        return;
      }

      this.searchState.activeIndex += dir === 'down' ? 1 : -1;
    });
  }

  enable() {
    if (this.resources) {
      this.resources.el.querySelector('input')?.select();
      return;
    }

    const searchBoxRootEl = document.createElement('div');
    searchBoxRootEl.className = 'search-box';
    searchBoxRootEl.addEventListener('click', (e) => e.stopPropagation());
    this.options.rootEl.before(searchBoxRootEl);

    this.resources = {
      el: searchBoxRootEl,
      react: createRoot(searchBoxRootEl),
      autoEmit: this.autoEmit(),
    };

    this.resources.react.render(
      <SearchBox
        searchState={this.searchState}
        onPrevious={this.nextMatch('up')}
        onNext={this.nextMatch('down')}
        onClose={this.destroy}
        onChange={(v) => {
          this.keyword = v;
          this.search();
        }}
      />,
    );
  }

  @action.bound
  destroy() {
    if (!this.resources) {
      return;
    }

    this.searchState.ranges = [];
    this.searchState.activeIndex = 0;
    this.search.cancel();

    this.resources.react.unmount();
    this.resources.el.remove();
    this.resources = undefined;
  }
}
