<script lang="ts">
import { defineComponent } from 'vue';
import { NButton, NDropdown, type DropdownOption, NCollapse, NCollapseItem } from 'naive-ui';
import { BIconThreeDots, BIconPlusSquareFill } from 'bootstrap-icons-vue';
import { container } from 'tsyringe';

import MaterialService from 'service/MaterialService';
import { selectFiles } from 'web/utils/dom';
import type { Material } from 'model/Material';

export default defineComponent({
  components: { NButton, NDropdown, NCollapse, NCollapseItem, BIconThreeDots, BIconPlusSquareFill },
  setup() {
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
            const materials: Partial<Material>[] = files.map(({ path, type }) => {
              if (!path) {
                throw new Error('no path for file');
              }
              return { sourceUrl: `file://${path}`, mimeType: type };
            });

            materialService.addMaterials(materials);
          }
          break;

        default:
          break;
      }
    };

    return { addOptions, handleAdd };
  },
});
</script>
<template>
  <div class="px-2 w-60">
    <header class="flex items-center justify-between h-10 border-b mb-2">
      <div class="flex items-center">
        <h1 class="mr-2">素材库</h1>
        <NDropdown placement="bottom-start" :options="addOptions" trigger="click" @select="handleAdd">
          <NButton text class="text-lg"><BIconPlusSquareFill /></NButton>
        </NDropdown>
      </div>
      <NDropdown placement="bottom-start">
        <NButton text class="text-lg mr-2"><BIconThreeDots /></NButton>
      </NDropdown>
    </header>
    <NCollapse>
      <NCollapseItem title="标签管理器"> aaa </NCollapseItem>
      <NCollapseItem title="标记管理器"> aaa </NCollapseItem>
      <NCollapseItem title="类型管理器"> aaa </NCollapseItem>
    </NCollapse>
  </div>
</template>
<style scoped>
:deep(.n-tabs-nav__prefix) {
  /* padding-right: 0 !important; */
}
</style>
