<script lang="ts">
import { container } from 'tsyringe';
import { defineComponent, ref } from 'vue';
import {
  BIconBoxes,
  BIconJournalBookmark,
  BIconStickies,
  BIconBarChartSteps,
  BIconPostcardHeart,
} from 'bootstrap-icons-vue';

import Layout, { KnowledgeTypes } from 'model/gui/Layout';

export default defineComponent({
  components: {
    BIconBoxes,
    BIconJournalBookmark,
    BIconStickies,
    BIconBarChartSteps,
    BIconPostcardHeart,
  },
  setup() {
    const { viewType } = container.resolve(Layout);
    const types = ref([
      { id: KnowledgeTypes.Materials, icon: 'BIconBoxes' },
      { id: KnowledgeTypes.Notes, icon: 'BIconJournalBookmark' },
      { id: KnowledgeTypes.Projects, icon: 'BIconBarChartSteps' },
      { id: KnowledgeTypes.Memos, icon: 'BIconStickies' },
      { id: KnowledgeTypes.Cards, icon: 'BIconPostcardHeart' },
    ]);

    return { viewType, types };
  },
});
</script>
<template>
  <div class="flex flex-col bg-slate-600 text-gray-300">
    <button
      v-for="{ id, icon } of types"
      :key="id"
      class="w-full mt-2 flex justify-center text-lg py-2 hover:text-white first:mt-0"
      :class="{ 'bg-slate-800': id === viewType }"
      @click="viewType = id"
    >
      <component :is="icon" />
    </button>
  </div>
</template>
