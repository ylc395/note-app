import { Controller } from '@nestjs/common';
import type { EmojiMartData } from '@emoji-mart/data';
import data from '@emoji-mart/data' assert { type: 'json' };

import { Get } from './decorators.js';

@Controller()
export default class IconsController {
  @Get('/icons/data')
  async getIconData(): Promise<EmojiMartData> {
    return data as EmojiMartData;
  }
}
