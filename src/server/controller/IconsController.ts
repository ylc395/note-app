import { Controller } from '@nestjs/common';
import data from '@emoji-mart/data';
import type { EmojiMartData } from '@emoji-mart/data';

import { Get } from './decorators';

@Controller()
export default class RecyclablesController {
  @Get('/icons/data')
  async getIconData(): Promise<EmojiMartData> {
    return data as EmojiMartData;
  }
}
