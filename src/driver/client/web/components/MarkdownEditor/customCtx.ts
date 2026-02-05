import type { AppUrlParams } from '#domain/shared/infra/url';
import { createSlice } from '@milkdown/kit/ctx';

interface CustomContext {
  onJump?: (params: AppUrlParams) => void;
}

export const customCtx = createSlice<CustomContext>({}, 'customCtx');
