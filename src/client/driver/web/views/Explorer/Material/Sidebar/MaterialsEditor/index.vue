<script lang="ts">
import { defineComponent } from 'vue';
import { container } from 'tsyringe';

import MaterialService from 'service/MaterialService';

export default defineComponent({
  setup() {
    const { uploadMaterials, newMaterials } = container.resolve(MaterialService);

    return { uploadMaterials, newMaterials };
  },
});
</script>
<template>
  <div class="bg-white">
    <div v-for="material of newMaterials" :key="material.fileId">
      {{ material.fileId }}
    </div>
    <button @click="uploadMaterials">确认</button>
  </div>
</template>
