import { Inject, Injectable } from '@nestjs/common';
import { fromMarkdown } from 'mdast-util-from-markdown';

import { extension, mdastExtension } from 'infra/markdown/topic';
import type { ContentUpdate } from 'model/content';

import BaseService from './BaseService';
import RevisionService from './RevisionService';

@Injectable()
export default class ContentService extends BaseService {
  @Inject() private revisionService!: RevisionService;

  private async extractTopics({ id, content }: ContentUpdate) {}

  private extractLinks({ content }: ContentUpdate) {}

  processContent(contentUpdate: ContentUpdate) {
    const mdAst = fromMarkdown(contentUpdate.content, {
      extensions: [extension],
      mdastExtensions: [mdastExtension],
    });
    this.extractTopics(contentUpdate);
    this.extractLinks(contentUpdate);
    this.revisionService.createRevision(contentUpdate);
  }
}
