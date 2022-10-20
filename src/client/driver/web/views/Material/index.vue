<script lang="ts">
import { container } from 'tsyringe';
import { computed, defineComponent } from 'vue';

import ItemListService from 'service/MaterialService';

import ManagerTab from './Sidebar/index.vue';
import List from './List/index.vue';
import { KNOWLEDGE_TYPES_TEXTS } from '../constants';

export default defineComponent({
  components: { ManagerTab, List },
  setup() {
    const { currentListType } = container.resolve(ItemListService);
    const title = computed(() => KNOWLEDGE_TYPES_TEXTS[currentListType.value]);

    return { title };
  },
});
</script>
<template>
  <div class="bg-gray-100 h-full flex">
    <ManagerTab />
    <List class="flex-grow" />
  </div>
</template>
