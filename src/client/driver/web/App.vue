<script lang="ts">
import { defineComponent } from 'vue';

import KnowledgeSwitcher from './views/KnowledgeSwitcher.vue';
import Material from './views/Material/index.vue';

export default defineComponent({
  components: {
    KnowledgeSwitcher,
    Material,
  },
});
</script>
<template>
  <div class="flex h-screen">
    <KnowledgeSwitcher />
    <Material class="flex-grow" />
  </div>
</template>
<style>
@tailwind base;
@tailwind components;
@tailwind utilities;
</style>
