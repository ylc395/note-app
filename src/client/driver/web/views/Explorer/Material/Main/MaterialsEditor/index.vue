<script lang="ts">
import { defineComponent } from 'vue';
import { container } from 'tsyringe';

import MaterialService from 'service/MaterialService';

export default defineComponent({
  setup() {
    const { uploadMaterials, materials } = container.resolve(MaterialService);

    return { uploadMaterials, materials };
  },
});
</script>
<template>
  <div class="bg-white">
    <div v-for="material of materials" :key="material.file.id">
      {{ material.file.id }}
    </div>
    <button @click="uploadMaterials">确认</button>
  </div>
</template>
