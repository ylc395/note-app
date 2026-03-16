/* Copyright 2017 Mozilla Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type { EventBus } from 'pdfjs-dist/types/web/event_utils';
import type { PDFLinkService } from 'pdfjs-dist/web/pdf_viewer.mjs';

interface PDFHistoryOptions {
  /** 导航/链接服务 */
  linkService: PDFLinkService;
  /** 应用事件总线 */
  eventBus: EventBus;
}

interface InitializeParameters {
  /** PDF文档的唯一指纹 */
  fingerprint: string;
  /** 重置浏览历史 */
  resetHistory?: boolean;
}

interface PushParameters {
  /** 命名目的地。如果缺失，使用 explicitDest 的字符串版本 */
  namedDest?: string | null;
  /** 显式目的地数组 */
  explicitDest: unknown[];
  /** 目的地指向的页面 */
  pageNumber: number | null;
}

interface Destination {
  dest?: unknown[] | null;
  hash?: string;
  page?: number | null;
  rotation?: number;
  temporary?: boolean;
  first?: number;
}

interface HistoryState {
  fingerprint: string;
  uid: number;
  destination: Destination | null;
}

// ============ 常量定义 ============

/** 位置更新阈值 */
const POSITION_UPDATED_THRESHOLD = 50;

/** 视图区域更新超时时间（毫秒） */
const UPDATE_VIEWAREA_TIMEOUT = 1000;

/**
 * 检查旋转角度是否有效
 */
function isValidRotation(rotation: number): boolean {
  return Number.isInteger(rotation) && rotation % 90 === 0;
}

/**
 * 比较两个目的地哈希是否相等
 */
function isDestHashesEqual(destHash: string, pushHash: string): boolean {
  if (typeof destHash !== 'string' || typeof pushHash !== 'string') {
    return false;
  }
  if (destHash === pushHash) {
    return true;
  }
  const nameddest = new URLSearchParams(destHash).get('nameddest');
  if (nameddest === pushHash) {
    return true;
  }
  return false;
}

/**
 * 比较两个目的地数组是否相等
 */
function isDestArraysEqual(firstDest: unknown[], secondDest: unknown[]): boolean {
  function isEntryEqual(first: unknown, second: unknown): boolean {
    if (typeof first !== typeof second) {
      return false;
    }
    if (Array.isArray(first) || Array.isArray(second)) {
      return false;
    }
    if (first !== null && typeof first === 'object' && second !== null) {
      const firstObj = first as Record<string, unknown>;
      const secondObj = second as Record<string, unknown>;
      if (Object.keys(firstObj).length !== Object.keys(secondObj).length) {
        return false;
      }
      for (const key in firstObj) {
        if (!isEntryEqual(firstObj[key], secondObj[key])) {
          return false;
        }
      }
      return true;
    }
    return first === second || (Number.isNaN(first) && Number.isNaN(second));
  }

  if (!(Array.isArray(firstDest) && Array.isArray(secondDest))) {
    return false;
  }
  if (firstDest.length !== secondDest.length) {
    return false;
  }
  for (let i = 0, ii = firstDest.length; i < ii; i++) {
    if (!isEntryEqual(firstDest[i], secondDest[i])) {
      return false;
    }
  }
  return true;
}

export default class PDFHistory {
  // 依赖服务
  private linkService: PDFLinkService;
  private eventBus: EventBus;

  // 初始化状态
  private _initialized = false;
  private _fingerprint = '';

  // 历史栈状态
  private _historyStack: HistoryState[] = [];
  private _currentIndex = -1;
  private _maxUid = 0;

  // 当前状态
  private _destination: Destination | null = null;
  private _position: Destination | null = null;

  // 导航状态
  private _popStateInProgress = false;
  private _numPositionUpdates = 0;
  private _isPagesLoaded = false;

  // 超时控制
  private _updateViewareaTimeout: ReturnType<typeof setTimeout> | null = null;

  // 事件控制
  private eventAbortController: AbortController | null = null;

  /**
   * @param options - 配置选项
   */
  constructor({ linkService, eventBus }: PDFHistoryOptions) {
    this.linkService = linkService;
    this.eventBus = eventBus;

    this.reset();

    // 确保不会错过 "pagesinit" 事件
    this.eventBus._on('pagesinit', () => {
      this._isPagesLoaded = false;

      this.eventBus._on(
        'pagesloaded',
        (evt: { pagesCount: number }) => {
          this._isPagesLoaded = !!evt.pagesCount;
        },
        // @ts-expect-error -- 库标注的类型不正确
        { once: true },
      );
    });
  }

  /**
   * 初始化 PDF 文档的历史记录
   * @param params - 初始化参数
   */
  initialize({ fingerprint, resetHistory = false }: InitializeParameters): void {
    if (!fingerprint || typeof fingerprint !== 'string') {
      console.error('PDFHistoryMemory.initialize: The "fingerprint" must be a non-empty string.');
      return;
    }

    // 确保任何旧状态在初始化时都被重置
    if (this._initialized) {
      this.reset();
    }

    const reInitialized = this._fingerprint !== '' && this._fingerprint !== fingerprint;
    this._fingerprint = fingerprint;

    this._initialized = true;
    this.bindEvents();

    this._popStateInProgress = false;
    this._numPositionUpdates = 0;

    this._maxUid = 0;
    this._destination = null;
    this._position = null;

    if (resetHistory || reInitialized) {
      // 重置历史栈
      this._historyStack = [];
      this._currentIndex = -1;
      this.pushOrReplaceState(null, true);
      return;
    }

    // 初始化历史栈（如果为空）
    if (this._historyStack.length === 0) {
      this.pushOrReplaceState(null, true);
    }
  }

  /**
   * 重置当前实例，防止进一步的历史更新和导航
   */
  reset(): void {
    if (this._initialized) {
      this.pageHide();

      this._initialized = false;
      this.unbindEvents();
    }

    if (this._updateViewareaTimeout) {
      clearTimeout(this._updateViewareaTimeout);
      this._updateViewareaTimeout = null;
    }

    this._historyStack = [];
    this._currentIndex = -1;
    this._fingerprint = '';
  }

  /**
   * 将内部目的地推入历史栈
   * @param params - 推送参数
   */
  push({ namedDest = null, explicitDest, pageNumber }: PushParameters): void {
    if (!this._initialized) {
      return;
    }

    if (namedDest && typeof namedDest !== 'string') {
      console.error('PDFHistoryMemory.push: ' + `"${namedDest}" is not a valid namedDest parameter.`);
      return;
    } else if (!Array.isArray(explicitDest)) {
      console.error('PDFHistoryMemory.push: ' + `"${explicitDest}" is not a valid explicitDest parameter.`);
      return;
    } else if (!this.isValidPage(pageNumber)) {
      // 允许未设置的 pageNumber 仅当历史仍为空时
      if (pageNumber !== null || this._destination) {
        console.error('PDFHistoryMemory.push: ' + `"${pageNumber}" is not a valid pageNumber parameter.`);
        return;
      }
    }

    const hash = namedDest || JSON.stringify(explicitDest);
    if (!hash) {
      return;
    }

    let forceReplace = false;
    if (
      this._destination &&
      (isDestHashesEqual(this._destination.hash || '', hash) ||
        isDestArraysEqual(this._destination.dest as unknown[], explicitDest))
    ) {
      if (this._destination.page) {
        return;
      }
      forceReplace = true;
    }

    if (this._popStateInProgress && !forceReplace) {
      return;
    }

    this.pushOrReplaceState(
      {
        dest: explicitDest,
        hash,
        page: pageNumber,
        rotation: this.linkService.rotation,
      },
      forceReplace,
    );

    if (!this._popStateInProgress) {
      this._popStateInProgress = true;
      Promise.resolve().then(() => {
        this._popStateInProgress = false;
      });
    }
  }

  /**
   * 将页面推入浏览器历史
   * @param pageNumber - 页码
   */
  pushPage(pageNumber: number): void {
    if (!this._initialized) {
      return;
    }

    if (!this.isValidPage(pageNumber)) {
      console.error(`PDFHistoryMemory.pushPage: "${pageNumber}" is not a valid page number.`);
      return;
    }

    if (this._destination?.page === pageNumber) {
      return;
    }

    if (this._popStateInProgress) {
      return;
    }

    this.pushOrReplaceState({
      dest: null,
      hash: `page=${pageNumber}`,
      page: pageNumber,
      rotation: this.linkService.rotation,
    });

    if (!this._popStateInProgress) {
      this._popStateInProgress = true;
      Promise.resolve().then(() => {
        this._popStateInProgress = false;
      });
    }
  }

  /**
   * 将当前位置推入历史栈
   */
  pushCurrentPosition(): void {
    if (!this._initialized || this._popStateInProgress) {
      return;
    }
    this.tryPushCurrentPosition();
  }

  /**
   * 在历史栈中后退一步
   */
  back(): void {
    if (!this._initialized || this._popStateInProgress) {
      return;
    }

    if (this._currentIndex > 0) {
      this._currentIndex--;
      this.popState(this._historyStack[this._currentIndex]!);
    }
  }

  /**
   * 在历史栈中前进一步
   */
  forward(): void {
    if (!this._initialized || this._popStateInProgress) {
      return;
    }

    if (this._currentIndex < this._historyStack.length - 1) {
      this._currentIndex++;
      this.popState(this._historyStack[this._currentIndex]!);
    }
  }

  /**
   * 指示用户是否正在浏览历史
   */
  get popStateInProgress(): boolean {
    return this._initialized && this._popStateInProgress;
  }

  // ============ 私有方法 ============

  /**
   * 推入或替换历史状态
   */
  private pushOrReplaceState(destination: Destination | null, forceReplace = false): void {
    const shouldReplace = forceReplace || this._currentIndex < 0;
    const uid = shouldReplace ? this._maxUid : this._maxUid + 1;

    const newState: HistoryState = {
      fingerprint: this._fingerprint,
      uid,
      destination,
    };

    this.updateInternalState(destination, uid);

    if (shouldReplace) {
      // 替换当前位置
      if (this._currentIndex >= 0) {
        this._historyStack[this._currentIndex] = newState;
      } else {
        this._historyStack.push(newState);
        this._currentIndex = 0;
      }
    } else {
      // 推入新状态
      // 如果在历史栈中间，截断后续的历史
      if (this._currentIndex < this._historyStack.length - 1) {
        this._historyStack = this._historyStack.slice(0, this._currentIndex + 1);
      }
      this._historyStack.push(newState);
      this._currentIndex++;
    }
  }

  /**
   * 尝试推入当前位置
   */
  private tryPushCurrentPosition(temporary = false): void {
    if (!this._position) {
      return;
    }

    let position = this._position;
    if (temporary) {
      position = { ...this._position };
      position.temporary = true;
    }

    if (!this._destination) {
      this.pushOrReplaceState(position);
      return;
    }

    if (this._destination.temporary) {
      this.pushOrReplaceState(position, true);
      return;
    }

    if (this._destination.hash === position.hash) {
      return;
    }

    if (
      !this._destination.page &&
      (POSITION_UPDATED_THRESHOLD <= 0 || this._numPositionUpdates <= POSITION_UPDATED_THRESHOLD)
    ) {
      return;
    }

    let forceReplace = false;
    if (
      typeof this._destination.page === 'number' &&
      this._destination.page >= (position.first || 0) &&
      this._destination.page <= (position.page || 0)
    ) {
      if (this._destination.dest !== undefined || !this._destination.first) {
        return;
      }
      forceReplace = true;
    }

    this.pushOrReplaceState(position, forceReplace);
  }

  /**
   * 检查页码是否有效
   */
  private isValidPage(val: number | null): boolean {
    if (!Number.isInteger(val)) {
      return false;
    }
    const page = val as number;
    return page > 0 && page <= this.linkService.pagesCount;
  }

  /**
   * 检查状态是否有效
   */
  private isValidState(state: HistoryState | null | undefined): boolean {
    if (!state) {
      return false;
    }
    if (state.fingerprint !== this._fingerprint) {
      return false;
    }
    if (!Number.isInteger(state.uid) || state.uid < 0) {
      return false;
    }
    if (state.destination === null || typeof state.destination !== 'object') {
      return false;
    }
    return true;
  }

  /**
   * 更新内部状态
   */
  private updateInternalState(destination: Destination | null, uid: number, removeTemporary = false): void {
    if (this._updateViewareaTimeout) {
      clearTimeout(this._updateViewareaTimeout);
      this._updateViewareaTimeout = null;
    }

    if (removeTemporary && destination?.temporary) {
      const dest = { ...destination };
      delete dest.temporary;
      this._destination = dest;
    } else {
      this._destination = destination;
    }

    // 更新 maxUid
    if (uid > this._maxUid) {
      this._maxUid = uid;
    }

    this._numPositionUpdates = 0;
  }

  /**
   * 更新视图区域
   */
  private updateViewarea({
    location,
  }: {
    location: { pdfOpenParams: string; pageNumber: number; rotation: number };
  }): void {
    if (this._updateViewareaTimeout) {
      clearTimeout(this._updateViewareaTimeout);
      this._updateViewareaTimeout = null;
    }

    this._position = {
      hash: location.pdfOpenParams.substring(1),
      page: this.linkService.page,
      first: location.pageNumber,
      rotation: location.rotation,
    };

    if (this._popStateInProgress) {
      return;
    }

    if (POSITION_UPDATED_THRESHOLD > 0 && this._isPagesLoaded && this._destination && !this._destination.page) {
      this._numPositionUpdates++;
    }

    if (UPDATE_VIEWAREA_TIMEOUT > 0) {
      this._updateViewareaTimeout = setTimeout(() => {
        if (!this._popStateInProgress) {
          this.tryPushCurrentPosition(true);
        }
        this._updateViewareaTimeout = null;
      }, UPDATE_VIEWAREA_TIMEOUT);
    }
  }

  /**
   * 处理状态弹出（导航到历史记录中的某个状态）
   */
  private popState(state: HistoryState): void {
    if (!this.isValidState(state)) {
      return;
    }

    this._popStateInProgress = true;

    const destination = state.destination;
    this.updateInternalState(destination, state.uid, true);

    if (destination) {
      if (isValidRotation(destination.rotation || 0)) {
        this.linkService.rotation = destination.rotation || 0;
      }

      if (destination.dest) {
        this.linkService.goToDestination(destination.dest);
      } else if (destination.hash) {
        this.linkService.setHash(destination.hash);
      } else if (destination.page) {
        this.linkService.page = destination.page;
      }
    }

    Promise.resolve().then(() => {
      this._popStateInProgress = false;
    });
  }

  /**
   * 页面隐藏处理
   */
  private pageHide(): void {
    if (!this._destination || this._destination.temporary) {
      this.tryPushCurrentPosition();
    }
  }

  /**
   * 绑定事件
   */
  private bindEvents(): void {
    if (this.eventAbortController) {
      return;
    }

    this.eventAbortController = new AbortController();
    const { signal } = this.eventAbortController;

    // @ts-expect-error -- 库标注的类型不正确
    this.eventBus._on('updateviewarea', this.updateViewarea.bind(this), {
      signal,
    });
  }

  /**
   * 解绑事件
   */
  private unbindEvents(): void {
    this.eventAbortController?.abort();
    this.eventAbortController = null;
  }
}
