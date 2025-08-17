<template>
  <div class="bg-n-solid-2 rounded-lg border border-n-weak">
    <div class="px-3 py-2 border-b border-n-weak font-medium">{{ title }}</div>
    <ul class="p-3 space-y-2 min-h-[120px]">
      <li v-for="c in items" :key="c.id">
        <KanbanCardMini :card="c" />
      </li>
      <li v-if="!items?.length" class="text-xs text-n-slate-11 px-1">Sem itens</li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue';
import KanbanCardMini from './KanbanCardMini.vue';

type Card = {
  id: string;
  name: string;
  email?: string;
  avatarUrl?: string;
  status: string;
  lastMessage?: string;
};

defineProps({
  title: { type: String, required: true },
  items: { type: Array as PropType<Card[]>, default: () => [] },
});
</script>
