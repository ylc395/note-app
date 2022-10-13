<script lang="ts">
import { computed, defineComponent, h } from 'vue';
import {
  BIconTriangleFill,
  BIconTag,
  BIconGrid,
  BIconCloud,
  BIconPlusLg,
} from 'bootstrap-icons-vue';
import { NDropdown } from 'naive-ui';
import { container } from 'tsyringe';

import { ViewTypes } from 'model/gui/ItemList/MaterialList';
import type { MaterialFile } from 'model/Material';
import ItemListService from 'service/ItemListService';
import { selectFiles } from 'web/utils/dom';

import BaseList from './BaseList.vue';

const VIEW_TYPES = {
  [ViewTypes.Tag]: {
    text: '标签视图',
    icon: BIconTag,
  },
  [ViewTypes.Type]: {
    text: '类别视图',
    icon: BIconGrid,
  },
  [ViewTypes.Source]: {
    text: '来源视图',
    icon: BIconCloud,
  },
} as const;

const options = Object.keys(VIEW_TYPES).map((type) => ({
  key: type,
  label: VIEW_TYPES[type as ViewTypes].text,
  icon: () => h(VIEW_TYPES[type as ViewTypes].icon),
}));

export default defineComponent({
  components: {
    NDropdown,
    BIconTriangleFill,
    BIconPlusLg,
    BaseList,
  },
  setup() {
    const {
      materialList: { viewType, changeView },
      addMaterials,
    } = container.resolve(ItemListService);

    const currentView = computed(() => VIEW_TYPES[viewType.value].text);
    const uploadMaterials = async () => {
      const files = await selectFiles();
      const materialFiles: MaterialFile[] = files.map((file) => {
        if (!file.path) {
          throw new Error('no file path');
        }

        return { path: file.path, mimeType: file.type };
      });

      addMaterials(materialFiles);
    };

    return {
      options,
      currentView,
      changeView,
      uploadMaterials,
    };
  },
});
</script>
<template>
  <BaseList>
    <template #headerOperation>
      <div class="flex justify-between pl-1">
        <button @click="uploadMaterials">
          <BIconPlusLg />
        </button>
        <NDropdown
          :options="options"
          trigger="click"
          size="small"
          :animated="false"
          placement="bottom-end"
          @select="changeView"
        >
          <button class="flex items-center text-gray-400">
            {{ currentView }}
            <BIconTriangleFill
              class="rotate-180 ml-1"
              :style="{ 'font-size': '6px' }"
            />
          </button>
        </NDropdown>
      </div>
    </template>
    <template #main>
      <div>MaterialList</div>
    </template>
  </BaseList>
</template>
