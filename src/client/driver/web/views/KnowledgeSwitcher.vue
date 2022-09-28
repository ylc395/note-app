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

import ItemListService from 'service/ItemListService';
import { KnowledgeTypes } from 'model/content/constants';

export default defineComponent({
  components: {
    BIconBoxes,
    BIconJournalBookmark,
    BIconStickies,
    BIconBarChartSteps,
    BIconPostcardHeart,
  },
  setup() {
    const { currentListType, setCurrentListType } =
      container.resolve(ItemListService);

    const types = ref([
      { id: KnowledgeTypes.Materials, icon: 'BIconBoxes' },
      { id: KnowledgeTypes.Notes, icon: 'BIconJournalBookmark' },
      { id: KnowledgeTypes.Projects, icon: 'BIconBarChartSteps' },
      { id: KnowledgeTypes.Memos, icon: 'BIconStickies' },
      { id: KnowledgeTypes.Cards, icon: 'BIconPostcardHeart' },
    ]);

    return { currentListType, setCurrentListType, types };
  },
});
</script>
<template>
  <div class="flex flex-col bg-slate-600 text-gray-300">
    <button
      v-for="{ id, icon } of types"
      :key="id"
      class="w-full mt-2 flex justify-center text-lg py-2 hover:text-white first:mt-0"
      :class="{ 'bg-slate-800': id === currentListType }"
      @click="setCurrentListType(id)"
    >
      <component :is="icon" />
    </button>
  </div>
</template>
