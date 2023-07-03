import { Injectable } from '@nestjs/common';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { OnEvent } from '@nestjs/event-emitter';

import { extension, mdastExtension } from 'infra/markdown/topic';
import { type ContentUpdatedEvent, Events } from 'model/events';

import BaseService from './BaseService';

@Injectable()
export default class TopicService extends BaseService {
  @OnEvent(Events.ContentUpdated)
  async extractTopics({ id, content }: ContentUpdatedEvent) {
    const mdAst = fromMarkdown(content, {
      extensions: [extension],
      mdastExtensions: [mdastExtension],
    });
    console.log(mdAst);
  }
}
