import type { CommonInput, MaterialDomain } from 'infra/UI';

import * as common from './common';
import * as material from './material';

export const commonInput: CommonInput = { confirm: common.confirm };
export const materialDomainInput: MaterialDomain = material;

export { getContextmenuAction } from './common';
