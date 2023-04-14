import { TextlintKernel } from '@textlint/kernel';
import markdownPlugin from '@textlint/textlint-plugin-markdown';
import type { EntityLocator } from 'interface/entity';

import BaseService from './BaseService';

export default class LintService extends BaseService {
  private readonly textlintKernel = new TextlintKernel();
  async lint({ id, type }: EntityLocator) {
    const text = await this.notes.findBody(id);

    if (typeof text !== 'string') {
      throw new Error('wrong id');
    }

    const problems = await this.textlintKernel.lintText(id, {
      ext: '.md',
      plugins: [{ pluginId: 'markdown', plugin: markdownPlugin }],
    });

    return problems.messages.map(({ range: [from, to], message, fix }) => ({
      from,
      to,
      message,
      fixable: Boolean(fix),
    }));
  }
}
