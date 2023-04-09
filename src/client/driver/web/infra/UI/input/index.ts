import type { CommonInput, NoteDomain } from 'infra/UI';

import * as common from './common';
import * as note from './note';

export const commonInput: CommonInput = { confirm: common.confirm };
export const noteDomainInput: NoteDomain = note;

export { getContextmenuAction } from './common';
