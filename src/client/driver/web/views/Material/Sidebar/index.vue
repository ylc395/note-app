<script lang="ts">
import { defineComponent } from 'vue';
import { NTabs, NTabPane, NButton, NDropdown, type DropdownOption } from 'naive-ui';
import { BIconThreeDots, BIconPlusLg } from 'bootstrap-icons-vue';
import { container } from 'tsyringe';

import MaterialService from 'service/MaterialService';
import { selectFiles } from 'web/utils/dom';

export default defineComponent({
  components: { NTabs, NTabPane, NButton, NDropdown, BIconThreeDots, BIconPlusLg },
  setup() {
    const allTabs = [
      { key: 'tags', label: '标签' },
      { key: 'types', label: '类型' },
      { key: 'labels', label: '标记' },
    ];

    const addOptions: DropdownOption[] = [
      { label: '选择文件', key: 'file' },
      { label: '选择目录', key: 'directory' },
      { label: '从 URL 导入', key: 'url' },
      { label: '全盘扫描', key: 'disk' },
    ];

    const materialService = container.resolve(MaterialService);

    const handleAdd = async (key: string) => {
      switch (key) {
        case 'file':
          {
            const files = await selectFiles();
            materialService.addMaterials(
              files.map(({ path, type }) => {
                if (!path) {
                  throw new Error('no path for file');
                }
                return { url: path, mimeType: type };
              }),
            );
          }
          break;

        default:
          break;
      }
    };

    return { allTabs, addOptions, handleAdd };
  },
});
</script>
<template>
  <aside class="px-2 w-60">
    <NTabs :default-value="allTabs[0].key" type="segment">
      <NTabPane v-for="{ key, label } of allTabs" :key="key" :name="key" :tab="label" />
      <template #prefix>
        <NDropdown placement="bottom-start" :options="addOptions" trigger="click" @select="handleAdd">
          <NButton text class="text-lg"><BIconPlusLg /></NButton>
        </NDropdown>
      </template>
      <template #suffix>
        <NDropdown placement="bottom-start">
          <NButton text class="text-lg mr-2"><BIconThreeDots /></NButton>
        </NDropdown>
      </template>
    </NTabs>
  </aside>
</template>
<style scoped>
:deep(.n-tabs-nav__prefix) {
  /* padding-right: 0 !important; */
}
</style>
