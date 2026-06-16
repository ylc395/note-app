import { createEffect, createMemo, createSignal, onMount, Show } from 'solid-js';
import { ChevronDownIcon, ChevronRightIcon, ChevronUpIcon, XIcon } from 'lucide-solid';

import Button from '#web/view/components/Button';
import 'prosemirror-search/style/search.css';
import type Editor from '../Editor';

export interface SearchChangeInfo {
  search?: string;
  replace?: string;
  caseSensitive?: boolean;
  wholeWord?: boolean;
  regexp?: boolean;
  replaceExpanded?: boolean;
  currentMatchIndex?: number;
}

export default function SearchBar(props: {
  editor: Editor;
  onClose?: () => void;
  onSearchChange?: (info: SearchChangeInfo) => void;
  onSearch?: () => void;
}) {
  const initialOptions = props.editor.searcher.options;

  const [searchText, setSearchText] = createSignal(initialOptions?.search || '');
  const [replaceText, setReplaceText] = createSignal(initialOptions?.replace || '');
  const [caseSensitive, setCaseSensitive] = createSignal(initialOptions?.caseSensitive ?? false);
  const [wholeWord, setWholeWord] = createSignal(initialOptions?.wholeWord ?? false);
  const [regexp, setRegexp] = createSignal(initialOptions?.regexp ?? false);
  const [replaceExpanded, setReplaceExpanded] = createSignal(initialOptions?.replaceExpanded ?? false);
  const [matchInfo, setMatchInfo] = createSignal<{ total: number; current: number } | null>(null);

  const hasQuery = createMemo(() => searchText().length > 0);

  let searchInputEl: HTMLInputElement | undefined;

  const queryOptions = createMemo(() => ({
    caseSensitive: caseSensitive() || undefined,
    wholeWord: wholeWord() || undefined,
    regexp: regexp() || undefined,
  }));

  const matchDisplay = createMemo(() => {
    const info = matchInfo();
    if (!info) return '';
    if (info.total === 0) return '无匹配';
    return `${info.current}/${info.total}`;
  });

  // 搜索参数变化时自动执行搜索
  createEffect(() => {
    if (!props.editor.searcher.isReady) {
      return;
    }

    const matched = props.editor.searcher.search({
      search: searchText(),
      ...queryOptions(),
    });

    setMatchInfo(matched);
  });

  onMount(() => {
    searchInputEl!.select();
  });

  // 状态变化时自动通知外部
  createEffect(() => {
    if (!props.editor.searcher.isReady) {
      return;
    }

    props.onSearchChange?.({
      ...queryOptions(),
      search: searchText(),
      replace: replaceText() || undefined,
      replaceExpanded: replaceExpanded() || undefined,
      currentMatchIndex: matchInfo()?.current || undefined,
    });
  });

  function keepFocus() {
    // 推迟到 ProseMirror 异步更新（scrollIntoView / 视图渲染）完成后归还焦点
    setTimeout(() => searchInputEl!.focus());
  }

  function next() {
    setMatchInfo(props.editor.searcher.next());
    keepFocus();
  }

  function prev() {
    setMatchInfo(props.editor.searcher.prev());
    keepFocus();
  }

  function replace() {
    props.editor.searcher.search({ search: searchText(), replace: replaceText(), ...queryOptions() });
    setMatchInfo(props.editor.searcher.replace());
  }

  function replaceAll() {
    props.editor.searcher.search({ search: searchText(), replace: replaceText(), ...queryOptions() });
    setMatchInfo(props.editor.searcher.replaceAll());
  }

  function close() {
    props.editor.searcher.clear();
    props.editor.focus();
    props.onClose?.();
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      next();
    }

    if (e.key === 'Escape') {
      close();
    }
  }

  return (
    <div class="sticky top-0 right-8 z-20 flex justify-end pointer-events-none">
      <div class="pointer-events-auto rounded-lg border border-border-primary bg-surface-raised p-2 shadow-md">
        <div class="flex items-center gap-1">
          <Button
            size="tiny"
            square
            onClick={() => setReplaceExpanded((v) => !v)}
            title={replaceExpanded() ? '隐藏替换' : '显示替换'}
          >
            {replaceExpanded() ? <ChevronDownIcon class="size-4" /> : <ChevronRightIcon class="size-4" />}
          </Button>
          <input
            ref={searchInputEl}
            class="min-w-0 flex-1 rounded border border-border-secondary bg-bg-primary px-2 py-0.5 text-sm outline-none focus:border-border-primary"
            placeholder="查找..."
            value={searchText()}
            onInput={(e) => setSearchText(e.currentTarget.value)}
            onKeyDown={handleKeyDown}
          />
          <Button
            size="tiny"
            selected={caseSensitive()}
            onClick={() => {
              setCaseSensitive((v) => !v);
            }}
            title="区分大小写"
          >
            Aa
          </Button>
          <Button
            size="tiny"
            selected={wholeWord()}
            onClick={() => {
              setWholeWord((v) => !v);
            }}
            title="全词匹配"
          >
            ab
          </Button>
          <Button
            size="tiny"
            selected={regexp()}
            onClick={() => {
              setRegexp((v) => !v);
            }}
            title="正则表达式"
          >
            .*
          </Button>
          <Button size="tiny" square disabled={!hasQuery()} onClick={prev} title="上一个">
            <ChevronUpIcon class="size-4" />
          </Button>
          <Button size="tiny" square disabled={!hasQuery()} onClick={next} title="下一个">
            <ChevronDownIcon class="size-4" />
          </Button>
          <span class="text-xs text-text-tertiary min-w-12 text-right tabular-nums select-none">{matchDisplay()}</span>
          <Button size="tiny" square onClick={close} title="关闭">
            <XIcon class="size-4" />
          </Button>
        </div>
        <Show when={replaceExpanded()}>
          <div class="mt-1 ml-6 flex gap-1">
            <input
              class="flex-1 rounded border border-border-secondary bg-bg-primary px-2 py-0.5 text-sm outline-none focus:border-border-primary"
              placeholder="替换为..."
              value={replaceText()}
              onInput={(e) => setReplaceText(e.currentTarget.value)}
            />
            <Button size="tiny" disabled={!hasQuery()} onClick={replace} title="替换">
              替换
            </Button>
            <Button size="tiny" disabled={!hasQuery()} onClick={replaceAll} title="全部替换">
              全部
            </Button>
          </div>
        </Show>
      </div>
    </div>
  );
}
