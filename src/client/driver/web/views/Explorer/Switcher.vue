<script lang="ts">
import { container } from 'tsyringe';
import { defineComponent } from 'vue';
import { NTooltip } from 'naive-ui';
import {
  BIconBoxes,
  BIconJournalBookmark,
  BIconStickies,
  BIconBarChartSteps,
  BIconPostcardHeart,
} from 'bootstrap-icons-vue';

import ViewService from 'service/ViewService';
import { KnowledgeTypes } from 'model/content/constants';
import Material from './Material/index.vue';

const KNOWLEDGE_TYPES_TEXTS: Readonly<Record<KnowledgeTypes, string>> = {
  [KnowledgeTypes.Materials]: '素材库',
  [KnowledgeTypes.Notes]: '笔记本',
  [KnowledgeTypes.Projects]: '项目',
  [KnowledgeTypes.Memos]: '备忘',
  [KnowledgeTypes.Cards]: '卡片',
};

const ICONS = {
  [KnowledgeTypes.Materials]: 'BIconBoxes',
  [KnowledgeTypes.Notes]: 'BIconJournalBookmark',
  [KnowledgeTypes.Projects]: 'BIconBarChartSteps',
  [KnowledgeTypes.Memos]: 'BIconStickies',
  [KnowledgeTypes.Cards]: 'BIconPostcardHeart',
};

export default defineComponent({
  components: {
    Material,
    BIconBoxes,
    BIconJournalBookmark,
    BIconStickies,
    BIconBarChartSteps,
    BIconPostcardHeart,
    NTooltip,
  },
  setup() {
    const { currentView, setCurrentView } = container.resolve(ViewService);

    const types = Object.keys(KNOWLEDGE_TYPES_TEXTS).map((type) => ({
      id: type as KnowledgeTypes,
      icon: ICONS[type as KnowledgeTypes],
    }));

    return {
      currentView,
      setCurrentView,
      types,
      KNOWLEDGE_TYPES_TEXTS,
    };
  },
});
</script>
<template>
  <div class="flex flex-col bg-slate-600 text-gray-300 w-8">
    <NTooltip
      v-for="{ id, icon } of types"
      :key="id"
      :style="{ padding: '2px 6px' }"
      placement="right"
      :keep-alive-on-hover="false"
      :default-show="false"
      :disabled="id === currentView"
    >
      <template #trigger>
        <button
          class="w-full mt-2 flex justify-center text-lg py-2 hover:text-white first:mt-0"
          :class="{ 'bg-slate-800': id === currentView }"
          @click="setCurrentView(id)"
        >
          <component :is="icon" />
        </button>
      </template>
      <span class="text-xs">{{ KNOWLEDGE_TYPES_TEXTS[id] }}</span>
    </NTooltip>
  </div>
</template>
