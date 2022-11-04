<script lang="ts">
import { defineComponent } from 'vue';
import { NButton, NDropdown } from 'naive-ui';
import { BIconPlusSquareFill } from 'bootstrap-icons-vue';
import { container } from 'tsyringe';

import MaterialService from 'service/MaterialService';
import { useNewMaterialByFiles } from './useMenu';
import MaterialForm from './MaterialForm.vue';

export default defineComponent({
  name: 'AddMenu',
  components: {
    NButton,
    NDropdown,
    BIconPlusSquareFill,
    MaterialForm,
  },
  setup() {
    const openFileDialog = useNewMaterialByFiles();
    const { files } = container.resolve(MaterialService);
    const handleAdd = (key: string) => {
      switch (key) {
        case 'file':
          return openFileDialog();
        default:
          break;
      }
    };

    return { handleAdd, files };
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
  <MaterialForm v-if="files.length > 0" />
</template>
