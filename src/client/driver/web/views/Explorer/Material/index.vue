<script lang="ts">
import { defineComponent } from 'vue';

import Sidebar from './Sidebar/index.vue';
import List from './List/index.vue';

export default defineComponent({
  name: 'Material',
  components: { Sidebar, List },
});
</script>
<template>
  <div class="bg-gray-100 h-full flex">
    <Sidebar />
    <List class="flex-grow" />
  </div>
</template>
