<script lang="ts">
import { defineComponent } from 'vue';
import { NButton, NDropdown } from 'naive-ui';
import { BIconPlusSquareFill } from 'bootstrap-icons-vue';

import { useNewMaterialByFiles } from './useMenu';
import MaterialEditor from './MaterialEditor.vue';

export default defineComponent({
  components: {
    NButton,
    NDropdown,
    BIconPlusSquareFill,
    MaterialEditor,
  },
  setup() {
    const { open: openFileDialog, dialog: fileMaterialDialog } = useNewMaterialByFiles();
    const handleAdd = (key: string) => {
      switch (key) {
        case 'file':
          return openFileDialog();
        default:
          break;
      }
    };

    return { handleAdd, fileMaterialDialog };
  },
});
</script>
<template>
  <NDropdown
    placement="bottom-end"
    :options="[
      { label: '选择文件', key: 'file' },
      { label: '选择目录', key: 'directory' },
      { label: '从 URL 导入', key: 'url' },
      { label: '全盘扫描', key: 'disk' },
    ]"
    trigger="click"
    @select="handleAdd"
  >
    <NButton text class="text-lg"><BIconPlusSquareFill /></NButton>
  </NDropdown>
  <MaterialEditor :dialog="fileMaterialDialog" />
</template>
