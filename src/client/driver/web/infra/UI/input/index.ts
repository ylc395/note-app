import type { CommonInput, MaterialDomain, NoteDomain } from 'infra/UI';

import * as common from './common';
import * as note from './note';
import * as material from './material';

export const commonInput: CommonInput = { confirm: common.confirm };
export const noteDomainInput: NoteDomain = note;
export const materialDomainInput: MaterialDomain = material;

export { getContextmenuAction } from './common';
