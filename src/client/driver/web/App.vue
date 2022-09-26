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
  <div class="flex h-screen">
    <div
      v-for="({ width, rows }, i) of columns"
      :key="i"
      class="flex flex-col"
      :class="{ 'flex-grow': width === 'auto' }"
      :style="{
        'min-width': typeof width === 'number' ? `${width}px` : width,
      }"
    >
      <div
        v-for="{ id, height } of rows"
        :key="id"
        :data-component-id="id"
        :class="{ 'flex-grow': height === 'auto' }"
        :style="{ height: typeof height === 'number' ? `${height}px` : height }"
      >
        <component :is="id" class="only:h-full" />
      </div>
    </div>
  </div>
</template>
<style>
@tailwind base;
@tailwind components;
@tailwind utilities;
</style>
