<script lang="ts">
import { container } from 'tsyringe';
import { computed, defineComponent } from 'vue';

import ItemListService from 'service/ItemListService';
import { KnowledgeTypes } from 'model/content/constants';

export default defineComponent({
  setup() {
    const { currentListType } = container.resolve(ItemListService);
    const title = computed(
      () =>
        ({
          [KnowledgeTypes.Cards]: '卡片',
          [KnowledgeTypes.Materials]: '素材库',
          [KnowledgeTypes.Memos]: '备忘',
          [KnowledgeTypes.Notes]: '笔记本',
          [KnowledgeTypes.Projects]: '项目',
        }[currentListType.value]),
    );

    return { title };
  },
});
</script>
<template>
  <div class="bg-gray-100 h-full">
    <div class="flex py-1 px-2 border-b border-solid">
      <span class="text-sm text-gray-600">{{ title }}</span>
      <div class="flex-grow">
        <slot name="headerOperation" />
      </div>
    </div>
    <div>
      <slot name="main" />
    </div>
  </div>
</template>
