<script lang="ts">
import { container } from 'tsyringe';
import { defineComponent, Ref, ref } from 'vue';
import { NTooltip, PopoverInst } from 'naive-ui';
import {
  BIconBoxes,
  BIconJournalBookmark,
  BIconStickies,
  BIconBarChartSteps,
  BIconPostcardHeart,
} from 'bootstrap-icons-vue';

import ItemListService from 'service/ItemListService';
import { KnowledgeTypes } from 'model/content/constants';
import { KNOWLEDGE_TYPES_TEXTS } from './constants';

const ICONS = {
  [KnowledgeTypes.Materials]: 'BIconBoxes',
  [KnowledgeTypes.Notes]: 'BIconJournalBookmark',
  [KnowledgeTypes.Projects]: 'BIconBarChartSteps',
  [KnowledgeTypes.Memos]: 'BIconStickies',
  [KnowledgeTypes.Cards]: 'BIconPostcardHeart',
};

export default defineComponent({
  components: {
    BIconBoxes,
    BIconJournalBookmark,
    BIconStickies,
    BIconBarChartSteps,
    BIconPostcardHeart,
    NTooltip,
  },
  setup() {
    const { currentListType, setCurrentListType } =
      container.resolve(ItemListService);

    const types = Object.keys(KNOWLEDGE_TYPES_TEXTS).map((type) => ({
      id: type as KnowledgeTypes,
      icon: ICONS[type as KnowledgeTypes],
    }));

    return {
      currentListType,
      setCurrentListType,
      types,
      KNOWLEDGE_TYPES_TEXTS,
    };
  },
});
</script>
<template>
  <div class="flex flex-col bg-slate-600 text-gray-300">
    <NTooltip
      v-for="{ id, icon } of types"
      :key="id"
      :style="{ padding: '2px 6px' }"
      placement="right"
      :keep-alive-on-hover="false"
      :default-show="false"
      :disabled="id === currentListType"
    >
      <template #trigger>
        <button
          class="w-full mt-2 flex justify-center text-lg py-2 hover:text-white first:mt-0"
          :class="{ 'bg-slate-800': id === currentListType }"
          @click="setCurrentListType(id)"
        >
          <component :is="icon" />
        </button>
      </template>
      <span class="text-xs">{{ KNOWLEDGE_TYPES_TEXTS[id] }}</span>
    </NTooltip>
  </div>
</template>
