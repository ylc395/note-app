<script lang="ts">
import { container } from 'tsyringe';
import { defineComponent } from 'vue';

import Layout, { KnowledgeTypes } from 'model/gui/Layout';

export default defineComponent({
  setup() {
    const { viewType } = container.resolve(Layout);

    return { viewType, KnowledgeTypes };
  },
});
</script>
<template>
  <div class="flex flex-col">
    <button @click="viewType = KnowledgeTypes.Materials">Materials</button>
    <button @click="viewType = KnowledgeTypes.Notes">Notes</button>
    <button @click="viewType = KnowledgeTypes.Memos">Memos</button>
    <button @click="viewType = KnowledgeTypes.Projects">Projects</button>
    <button @click="viewType = KnowledgeTypes.Cards">Cards</button>
  </div>
</template>
