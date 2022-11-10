<script lang="ts">
import { defineComponent } from 'vue';
import { NCollapse } from 'naive-ui';
import Resizable from 'vue-resizable';

import TagManager from './TagManager/index.vue';
import CustomFilter from './CustomFilter/index.vue';
import SearchInput from './SearchInput.vue';
import AddMenu from './AddMenu/index.vue';

export default defineComponent({
  name: 'Sidarbar',
  components: {
    NCollapse,
    TagManager,
    CustomFilter,
    Resizable,
    SearchInput,
    AddMenu,
  },
});
</script>
<template>
  <Resizable class="p-2 flex flex-col" :active="['r']" :width="240" :min-width="200">
    <header class="pb-4 border-b mb-4">
      <div class="flex justify-between mb-2">
        <h1>资料库</h1>
        <AddMenu />
      </div>
      <SearchInput />
    </header>
    <div class="overflow-auto flex-grow">
      <NCollapse class="h-full">
        <CustomFilter />
        <TagManager />
      </NCollapse>
    </div>
  </Resizable>
</template>
