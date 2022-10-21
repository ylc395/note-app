<script lang="ts">
import { defineComponent } from 'vue';
import { container } from 'tsyringe';

import { KnowledgeTypes } from 'model/content/constants';
import ViewService from 'service/ViewService';

import Switcher from './Switcher.vue';
import Material from './Material/index.vue';

export default defineComponent({
  components: { Switcher, [KnowledgeTypes.Materials]: Material },
  setup() {
    const { currentView } = container.resolve(ViewService);

    return { currentView };
  },
});
</script>
<template>
  <div class="flex">
    <Switcher />
    <KeepAlive>
      <component :is="currentView" />
    </KeepAlive>
  </div>
</template>
