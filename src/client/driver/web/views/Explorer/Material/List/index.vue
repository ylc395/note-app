<script lang="ts">
import { defineComponent, onMounted } from 'vue';
import { container } from 'tsyringe';

import MaterialService from 'service/MaterialService';

export default defineComponent({
  name: 'List',
  setup() {
    const { materials, queryMaterials } = container.resolve(MaterialService);
    onMounted(queryMaterials);

    return { materials };
  },
});
</script>
<template>
  <div class="p-2 bg-white border-r">
    <div v-for="material of materials" :key="material.id">
      {{ material.name }}
    </div>
  </div>
</template>
