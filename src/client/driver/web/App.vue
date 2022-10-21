<script lang="ts">
import { defineComponent } from 'vue';

import Workbench from './views/Workbench/index.vue';
import Explorer from './views/Explorer/index.vue';

export default defineComponent({
  components: {
    Workbench,
    Explorer,
  },
});
</script>
<template>
  <div class="flex h-screen">
    <Explorer />
    <Workbench class="flex-grow" />
  </div>
</template>
<style>
@tailwind base;
@tailwind components;
@tailwind utilities;
</style>
