<script lang="ts">
import { container } from 'tsyringe';
import { defineComponent } from 'vue';

import Layout, { ComponentNames } from 'model/gui/Layout';

import KnowledgeSwitcher from './views/KnowledgeSwitcher.vue';
import ItemList from './views/ItemList/index.vue';
import Workbench from './views/Workbench/index.vue';
import Tabs from './views/Tabs.vue';

export default defineComponent({
  components: {
    [ComponentNames.KnowledgeSwitcher]: KnowledgeSwitcher,
    [ComponentNames.ItemList]: ItemList,
    [ComponentNames.Tabs]: Tabs,
    [ComponentNames.Workbench]: Workbench,
  },
  setup() {
    const { columns } = container.resolve(Layout);

    return { columns };
  },
});
</script>
<template>
  <div>
    <div
      v-for="({ width, rows }, i) of columns"
      :key="i"
      :style="{ width: typeof width === 'number' ? `${width}px` : width }"
    >
      <div
        v-for="{ id, height } of rows"
        :key="id"
        :style="{ height: typeof height === 'number' ? `${height}px` : height }"
      >
        <component :is="id" />
      </div>
    </div>
  </div>
</template>
