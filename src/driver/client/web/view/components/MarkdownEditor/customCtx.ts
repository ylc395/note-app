import type { AppUrlParams } from '#domain/shared/infra/url';
import { createSlice } from '@milkdown/kit/ctx';

export interface CustomContext {
  onJump?: (params: AppUrlParams & { mimeType?: string | null }) => void;
}

export const customCtx = createSlice<CustomContext>({}, 'customCtx');
