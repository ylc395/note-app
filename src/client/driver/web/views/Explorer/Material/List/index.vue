<script lang="ts">
import { defineComponent, onMounted } from 'vue';
import { container } from 'tsyringe';
import { NButton, NDropdown } from 'naive-ui';
import { BIconSortDown, BIconToggles } from 'bootstrap-icons-vue';

import MaterialService from 'service/MaterialService';
import Icon from './Icon.vue';

export default defineComponent({
  name: 'List',
  components: { Icon, NButton, NDropdown, BIconSortDown, BIconToggles },
  setup() {
    const { materials, queryMaterials } = container.resolve(MaterialService);
    onMounted(queryMaterials);

    return { materials };
  },
});
</script>
<template>
  <div class="p-2 bg-white border-r">
    <div class="flex justify-between">
      <div class="text-xs text-gray-400 mr-4">共找到 {{ materials.length }} 条，选中 2 条</div>
      <div>
        <NDropdown
          placement="bottom-start"
          trigger="click"
          :options="[
            { label: '按名称排序', key: 'byName' },
            { label: '按类型排序', key: 'byType' },
            { label: '按来源排序', key: 'bySourceUrl' },
            { label: '按创建时间排序', key: 'byCreatedAt' },
            { label: '按更新时间排序', key: 'byUpdatedAt' },
            { type: 'divider' },
            { label: '升序', key: 'up' },
            { label: '降序', key: 'down' },
          ]"
        >
          <NButton class="mr-1 text-gray-400" text><BIconSortDown /></NButton>
        </NDropdown>
        <NDropdown
          placement="bottom-start"
          trigger="click"
          :options="[
            { label: '类型图标', key: 'byName' },
            { label: '来源', key: 'byType' },
            { label: '来源图标', key: 'bySourceUrl' },
            { label: '摘要', key: 'byCreatedAt' },
            { label: '创建时间', key: 'byUpdatedAt' },
            { label: '更新时间', key: 'byUpdatedAt' },
          ]"
        >
          <NButton text class="text-gray-400"><BIconToggles /></NButton>
        </NDropdown>
      </div>
    </div>
    <div v-for="material of materials" :key="material.id" class="border-b py-4 px-2">
      <div class="flex items-center"><Icon :mime-type="material.file.mimeType" class="mr-1" />{{ material.name }}</div>
    </div>
  </div>
</template>
