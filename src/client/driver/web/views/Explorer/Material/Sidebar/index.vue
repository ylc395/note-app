<script lang="ts">
import { defineComponent } from 'vue';
import { NCollapse } from 'naive-ui';

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
    SearchInput,
    AddMenu,
  },
});
</script>
<template>
  <div class="p-2 w-60 flex flex-col">
    <header class="pb-4 border-b mb-4">
      <div class="flex justify-between mb-2">
        <h1>资料库</h1>
        <AddMenu />
      </div>
      <SearchInput />
    </header>
    <div class="overflow-auto">
      <NCollapse>
        <CustomFilter />
        <TagManager />
      </NCollapse>
    </div>
  </div>
</template>
