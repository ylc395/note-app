import { shallowRef } from '@vue/reactivity';
import type Block from './Block';

export default class Note {
  readonly id: string;
  readonly updatedAt: number;
  readonly createdAt: number;
  readonly path: string[];
  readonly #blocks = shallowRef<Block[]>([]);
}
