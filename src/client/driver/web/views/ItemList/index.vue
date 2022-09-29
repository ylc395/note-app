<script lang="ts">
import { container } from 'tsyringe';
import { defineComponent } from 'vue';

import ItemListService from 'service/ItemListService';
import MaterialList from './MaterialList.vue';
import { KnowledgeTypes } from 'model/content/constants';

export default defineComponent({
  components: { MaterialList },
  setup() {
    const { currentListType } = container.resolve(ItemListService);

    return { currentListType, KnowledgeTypes };
  },
});
</script>
<template>
  <div>
    <MaterialList v-if="currentListType === KnowledgeTypes.Materials" />
  </div>
</template>
