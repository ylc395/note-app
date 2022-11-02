<script lang="ts">
import { defineComponent } from 'vue';
import { NButton, NDropdown, type DropdownOption, NCollapse, NCollapseItem, NModal } from 'naive-ui';
import { BIconPlusSquareFill } from 'bootstrap-icons-vue';
import { container } from 'tsyringe';

import MaterialService, { AddingTypes } from 'service/MaterialService';
import { selectFiles } from 'web/utils/dom';

import TagManager from './TagManager/index.vue';
import CustomFilter from './CustomFilter/index.vue';
import MaterialsEditor from './MaterialsEditor/index.vue';
import SearchInput from './SearchInput.vue';

export default defineComponent({
  components: {
    NButton,
    NDropdown,
    NCollapse,
    NCollapseItem,
    NModal,
    BIconPlusSquareFill,
    TagManager,
    CustomFilter,
    MaterialsEditor,
    SearchInput,
  },
  setup() {
    const addOptions: DropdownOption[] = [
      { label: '选择文件', key: 'file' },
      { label: '选择目录', key: 'directory' },
      { label: '从 URL 导入', key: 'url' },
      { label: '全盘扫描', key: 'disk' },
    ];

    const { generateNewMaterialsByFiles: initNewMaterialsByFiles, addingType } = container.resolve(MaterialService);

    const handleAdd = async (key: string) => {
      switch (key) {
        case 'file':
          {
            const rawFiles = await selectFiles();
            const files = rawFiles.map(({ path, type }) => {
              if (!path) {
                throw new Error('no path for file');
              }
              return { sourceUrl: `file://${path}`, mimeType: type, isTemp: true };
            });
            initNewMaterialsByFiles(files);
          }
          break;

        default:
          break;
      }
    };

    return { addOptions, handleAdd, addingType, AddingTypes };
  },
});
</script>
<template>
  <div class="p-2 w-60 flex flex-col">
    <header class="pb-4 border-b mb-4">
      <div class="flex justify-between mb-2">
        <h1>资料库</h1>
        <NDropdown placement="bottom-end" :options="addOptions" trigger="click" @select="handleAdd">
          <NButton text class="text-lg"><BIconPlusSquareFill /></NButton>
        </NDropdown>
      </div>
      <SearchInput />
    </header>
    <div class="overflow-auto">
      <NCollapse>
        <NCollapseItem title="固化视图">
          <CustomFilter />
        </NCollapseItem>
        <TagManager />
      </NCollapse>
    </div>
  </div>
  <NModal to="#app" :show="addingType !== AddingTypes.None">
    <MaterialsEditor />
  </NModal>
</template>
